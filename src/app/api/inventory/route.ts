import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import {
  inventoryTrackingQuerySchema,
  inventoryAdjustmentSchema,
  type StockStatusValue,
} from "@/lib/validations/inventory";
import type { RBACContext } from "@/types";
import { Prisma } from "@prisma/client";
import { checkAndEmitInventoryAlerts } from "@/lib/websocket/inventory-notifications";

/**
 * GET /api/inventory
 * Get comprehensive inventory data with filtering and pagination
 * Requires: INVENTORY_READ permission
 */
export const GET = withRBAC(
  async (request: NextRequest, _context: RBACContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const params = Object.fromEntries(searchParams.entries());

      // Validate query parameters
      const validationResult = inventoryTrackingQuerySchema.safeParse(params);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Invalid query parameters",
            details: validationResult.error.errors,
          },
          { status: 400 }
        );
      }

      const {
        productId,
        categoryId,
        lowStock,
        outOfStock,
        overStock,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      } = validationResult.data;

      // Build where clause
      const where: Prisma.ProductWhereInput = {
        deletedAt: null,
        trackInventory: true,
      };

      if (productId) {
        where.id = productId;
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      // Search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { barcode: { contains: search, mode: "insensitive" } },
        ];
      }

      // Get total count
      const total = await prisma.product.count({ where });

      // Get products with inventory data
      let products = await prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          sku: true,
          barcode: true,
          quantity: true,
          lowStockAlert: true,
          price: true,
          costPrice: true,
          imageUrl: true,
          isAvailable: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
              icon: true,
            },
          },
          inventoryLogs: {
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              type: true,
              quantity: true,
              previousStock: true,
              currentStock: true,
              reason: true,
              createdAt: true,
              referenceType: true,
              referenceId: true,
            },
          },
          orderItems: {
            where: {
              order: {
                status: {
                  in: ["PAID", "COMPLETED"],
                },
                deletedAt: null,
              },
            },
            select: {
              quantity: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit * 2, // Fetch more for post-filtering
      });

      // Calculate inventory metrics and apply stock status filters
      const inventoryData = products
        .map((product) => {
          const isOutOfStock = product.quantity === 0;
          const isLowStock =
            !isOutOfStock &&
            product.lowStockAlert !== null &&
            product.quantity <= product.lowStockAlert;
          const isOverStock =
            product.lowStockAlert !== null &&
            product.quantity > product.lowStockAlert * 3;

          // Calculate stock status
          let stockStatus: StockStatusValue;
          if (isOutOfStock) {
            stockStatus = "OUT_OF_STOCK";
          } else if (isLowStock) {
            stockStatus = "LOW_STOCK";
          } else if (isOverStock) {
            stockStatus = "OVERSTOCK";
          } else {
            stockStatus = "IN_STOCK";
          }

          // Calculate inventory value
          const inventoryValue =
            product.quantity * Number(product.costPrice || 0);

          // Calculate potential revenue
          const potentialRevenue = product.quantity * Number(product.price);

          // Calculate sales velocity (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const recentSales = product.orderItems.filter(
            (item) => new Date(item.createdAt) >= thirtyDaysAgo
          );
          const totalSold = recentSales.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          const dailyVelocity = totalSold / 30;

          // Calculate days until out of stock
          const daysUntilOutOfStock =
            dailyVelocity > 0 && product.quantity > 0
              ? Math.floor(product.quantity / dailyVelocity)
              : null;

          // Calculate turnover rate (annual)
          const annualSales = totalSold * 12; // Extrapolate from 30 days
          const turnoverRate =
            product.quantity > 0 ? annualSales / product.quantity : 0;

          return {
            id: product.id,
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            category: product.category,
            currentStock: product.quantity,
            lowStockThreshold: product.lowStockAlert,
            stockStatus,
            isLowStock,
            isOutOfStock,
            isOverStock,
            price: Number(product.price),
            costPrice: Number(product.costPrice || 0),
            inventoryValue,
            potentialRevenue,
            imageUrl: product.imageUrl,
            isAvailable: product.isAvailable,
            salesMetrics: {
              last30Days: totalSold,
              dailyVelocity: Math.round(dailyVelocity * 100) / 100,
              daysUntilOutOfStock,
              turnoverRate: Math.round(turnoverRate * 100) / 100,
            },
            recentMovements: product.inventoryLogs,
            totalOrderItems: product.orderItems.length,
          };
        })
        .filter((product) => {
          // Apply stock status filters
          if (outOfStock && !product.isOutOfStock) return false;
          if (lowStock && !product.isLowStock) return false;
          if (overStock && !product.isOverStock) return false;
          return true;
        })
        .slice(0, limit); // Apply pagination after filtering

      // Calculate summary statistics
      const summary = {
        totalProducts: inventoryData.length,
        inStock: inventoryData.filter((p) => p.stockStatus === "IN_STOCK")
          .length,
        lowStock: inventoryData.filter((p) => p.stockStatus === "LOW_STOCK")
          .length,
        outOfStock: inventoryData.filter(
          (p) => p.stockStatus === "OUT_OF_STOCK"
        ).length,
        overStock: inventoryData.filter((p) => p.stockStatus === "OVERSTOCK")
          .length,
        totalInventoryValue: inventoryData.reduce(
          (sum, p) => sum + p.inventoryValue,
          0
        ),
        totalPotentialRevenue: inventoryData.reduce(
          (sum, p) => sum + p.potentialRevenue,
          0
        ),
        totalUnits: inventoryData.reduce((sum, p) => sum + p.currentStock, 0),
        avgTurnoverRate:
          inventoryData.length > 0
            ? inventoryData.reduce(
                (sum, p) => sum + p.salesMetrics.turnoverRate,
                0
              ) / inventoryData.length
            : 0,
      };

      return NextResponse.json({
        summary: {
          ...summary,
          totalInventoryValue: Math.round(summary.totalInventoryValue * 100) / 100,
          totalPotentialRevenue: Math.round(summary.totalPotentialRevenue * 100) / 100,
          avgTurnoverRate: Math.round(summary.avgTurnoverRate * 100) / 100,
        },
        data: inventoryData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page < Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Failed to get inventory data:", error);
      return NextResponse.json(
        { error: "Failed to get inventory data" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.INVENTORY_READ],
  }
);

/**
 * POST /api/inventory
 * Create inventory adjustment (add/remove stock)
 * Requires: INVENTORY_UPDATE permission
 */
export const POST = withRBAC(
  async (request: NextRequest, context: RBACContext) => {
    try {
      const body = await request.json();

      // Validate request body
      const validationResult = inventoryAdjustmentSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationResult.error.errors,
          },
          { status: 400 }
        );
      }

      const { productId, type, quantity, reason, notes } = validationResult.data;

      // Get current product
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          sku: true,
          quantity: true,
          trackInventory: true,
          lowStockAlert: true,
        },
      });

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      if (!product.trackInventory) {
        return NextResponse.json(
          { error: "Product does not track inventory" },
          { status: 400 }
        );
      }

      // Calculate new quantity based on action type
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
          actualQuantityChange = product.quantity - newQuantity; // Actual amount removed
          break;
        case "ADJUSTMENT":
          // For adjustments, quantity represents the new total
          newQuantity = quantity;
          actualQuantityChange = newQuantity - product.quantity;
          break;
        case "STOCK_TAKE":
          // Stock take: set to counted quantity
          newQuantity = quantity;
          actualQuantityChange = newQuantity - product.quantity;
          break;
        default:
          return NextResponse.json(
            { error: "Invalid inventory action type" },
            { status: 400 }
          );
      }

      // Update product quantity and create log in transaction
      const [updatedProduct, inventoryLog] = await prisma.$transaction([
        prisma.product.update({
          where: { id: productId },
          data: { quantity: newQuantity },
          select: {
            id: true,
            name: true,
            sku: true,
            quantity: true,
            lowStockAlert: true,
            price: true,
            costPrice: true,
          },
        }),
        prisma.inventoryLog.create({
          data: {
            productId,
            type,
            quantity: Math.abs(actualQuantityChange),
            previousStock: product.quantity,
            currentStock: newQuantity,
            reason: reason || `${type} - Manual adjustment`,
            referenceType: "MANUAL",
            userId: context.userId,
          },
        }),
      ]);

      // Emit inventory alerts via WebSocket
      checkAndEmitInventoryAlerts({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        previousStock: product.quantity,
        newStock: newQuantity,
        lowStockThreshold: product.lowStockAlert,
        reason: reason || `${type} - Manual adjustment`,
      });

      // Determine if alert should be triggered
      const shouldAlert =
        (newQuantity === 0 ||
          (product.lowStockAlert &&
            newQuantity <= product.lowStockAlert &&
            product.quantity > product.lowStockAlert)) &&
        type !== "IN";

      return NextResponse.json(
        {
          success: true,
          data: {
            product: updatedProduct,
            log: inventoryLog,
            quantityChange: actualQuantityChange,
            previousQuantity: product.quantity,
            newQuantity,
            alert: shouldAlert
              ? {
                  type: newQuantity === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
                  message:
                    newQuantity === 0
                      ? `${product.name} is now out of stock`
                      : `${product.name} stock is now low (${newQuantity} units)`,
                }
              : null,
          },
          message: "Inventory adjusted successfully",
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Failed to adjust inventory:", error);
      return NextResponse.json(
        { error: "Failed to adjust inventory" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.INVENTORY_UPDATE],
  }
);
