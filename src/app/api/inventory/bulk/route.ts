import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import {
  bulkInventoryAdjustmentSchema,
  bulkStockTakeSchema,
} from "@/lib/validations/inventory";
import type { RBACContext } from "@/types";

/**
 * POST /api/inventory/bulk
 * Bulk inventory adjustments
 * Requires: INVENTORY_UPDATE permission
 */
export const POST = withRBAC(
  async (request: NextRequest, context: RBACContext) => {
    try {
      const body = await request.json();
      const { action } = body;

      if (action === "stock-take") {
        return handleBulkStockTake(body, context);
      } else {
        return handleBulkAdjustment(body, context);
      }
    } catch (error) {
      console.error("Failed to process bulk inventory operation:", error);
      return NextResponse.json(
        { error: "Failed to process bulk inventory operation" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.INVENTORY_UPDATE],
  }
);

/**
 * Handle bulk inventory adjustments
 */
async function handleBulkAdjustment(
  body: any,
  context: RBACContext
): Promise<NextResponse> {
  // Validate request body
  const validationResult = bulkInventoryAdjustmentSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: validationResult.error.errors,
      },
      { status: 400 }
    );
  }

  const { adjustments, batchReason } = validationResult.data;

  // Get all products to validate and check current quantities
  const productIds = adjustments.map((adj) => adj.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      trackInventory: true,
      lowStockAlert: true,
    },
  });

  // Validate all products exist and track inventory
  const errors: string[] = [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  adjustments.forEach((adj, index) => {
    const product = productMap.get(adj.productId);
    if (!product) {
      errors.push(`Adjustment ${index + 1}: Product not found`);
    } else if (!product.trackInventory) {
      errors.push(
        `Adjustment ${index + 1}: Product "${product.name}" does not track inventory`
      );
    }
  });

  if (errors.length > 0) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: errors,
      },
      { status: 400 }
    );
  }

  // Process adjustments in transaction
  const results = await prisma.$transaction(async (tx) => {
    const adjustmentResults = [];
    const logs = [];

    for (const adjustment of adjustments) {
      const product = productMap.get(adjustment.productId)!;
      const { type, quantity, reason, notes } = adjustment;

      // Calculate new quantity
      let newQuantity = product.quantity;
      let actualQuantityChange = quantity;

      switch (type) {
        case "IN":
        case "RETURN":
          newQuantity = product.quantity + quantity;
          break;
        case "OUT":
        case "DAMAGE":
          newQuantity = Math.max(0, product.quantity - quantity);
          actualQuantityChange = product.quantity - newQuantity;
          break;
        case "ADJUSTMENT":
          newQuantity = quantity;
          actualQuantityChange = newQuantity - product.quantity;
          break;
        default:
          continue; // Skip invalid types
      }

      // Update product
      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: { quantity: newQuantity },
        select: {
          id: true,
          name: true,
          sku: true,
          quantity: true,
          lowStockAlert: true,
        },
      });

      // Create log
      const log = await tx.inventoryLog.create({
        data: {
          productId: product.id,
          type,
          quantity: Math.abs(actualQuantityChange),
          previousStock: product.quantity,
          currentStock: newQuantity,
          reason: batchReason
            ? `${batchReason} - ${reason}`
            : reason || `${type} - Bulk adjustment`,
          referenceType: "MANUAL",
          userId: context.userId,
        },
      });

      adjustmentResults.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        previousQuantity: product.quantity,
        newQuantity,
        quantityChange: actualQuantityChange,
        success: true,
      });

      logs.push(log);
    }

    return { adjustmentResults, logs };
  });

  // Calculate summary
  const summary = {
    totalAdjustments: adjustments.length,
    successful: results.adjustmentResults.filter((r) => r.success).length,
    failed: results.adjustmentResults.filter((r) => !r.success).length,
    totalQuantityChanged: results.adjustmentResults.reduce(
      (sum, r) => sum + Math.abs(r.quantityChange),
      0
    ),
  };

  return NextResponse.json({
    success: true,
    summary,
    results: results.adjustmentResults,
    message: `Successfully processed ${summary.successful} adjustments`,
  });
}

/**
 * Handle bulk stock take (physical inventory count)
 */
async function handleBulkStockTake(
  body: any,
  context: RBACContext
): Promise<NextResponse> {
  // Validate request body
  const validationResult = bulkStockTakeSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: validationResult.error.errors,
      },
      { status: 400 }
    );
  }

  const { items, sessionId, notes } = validationResult.data;

  // Get all products
  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      trackInventory: true,
      lowStockAlert: true,
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate products
  const errors: string[] = [];
  items.forEach((item, index) => {
    const product = productMap.get(item.productId);
    if (!product) {
      errors.push(`Item ${index + 1}: Product not found`);
    } else if (!product.trackInventory) {
      errors.push(
        `Item ${index + 1}: Product "${product.name}" does not track inventory`
      );
    }
  });

  if (errors.length > 0) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: errors,
      },
      { status: 400 }
    );
  }

  // Process stock take in transaction
  const results = await prisma.$transaction(async (tx) => {
    const stockTakeResults = [];
    const discrepancies = [];

    for (const item of items) {
      const product = productMap.get(item.productId)!;
      const { countedQuantity, notes: itemNotes } = item;

      const expectedQuantity = product.quantity;
      const difference = countedQuantity - expectedQuantity;

      // Update product quantity
      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: { quantity: countedQuantity },
        select: {
          id: true,
          name: true,
          sku: true,
          quantity: true,
          lowStockAlert: true,
        },
      });

      // Create inventory log
      const log = await tx.inventoryLog.create({
        data: {
          productId: product.id,
          type: "STOCK_TAKE",
          quantity: Math.abs(difference),
          previousStock: expectedQuantity,
          currentStock: countedQuantity,
          reason: `Stock take${sessionId ? ` - Session: ${sessionId}` : ""}${
            notes ? ` - ${notes}` : ""
          }${itemNotes ? ` - ${itemNotes}` : ""}`,
          referenceType: "STOCK_TAKE",
          userId: context.userId,
        },
      });

      const result = {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        expectedQuantity,
        countedQuantity,
        difference,
        differencePercentage:
          expectedQuantity > 0
            ? Math.round((difference / expectedQuantity) * 10000) / 100
            : 0,
        hasDiscrepancy: difference !== 0,
        success: true,
      };

      stockTakeResults.push(result);

      if (difference !== 0) {
        discrepancies.push(result);
      }
    }

    return { stockTakeResults, discrepancies };
  });

  // Calculate summary
  const summary = {
    totalItems: items.length,
    itemsWithDiscrepancies: results.discrepancies.length,
    itemsMatched: items.length - results.discrepancies.length,
    totalDifference: results.discrepancies.reduce(
      (sum, d) => sum + Math.abs(d.difference),
      0
    ),
    averageAccuracy:
      items.length > 0
        ? Math.round(
            ((items.length - results.discrepancies.length) / items.length) * 10000
          ) / 100
        : 100,
  };

  return NextResponse.json({
    success: true,
    summary,
    results: results.stockTakeResults,
    discrepancies: results.discrepancies,
    message: `Stock take completed: ${summary.itemsMatched} matched, ${summary.itemsWithDiscrepancies} with discrepancies`,
  });
}
