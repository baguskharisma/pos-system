import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";

/**
 * GET /api/inventory/tracking
 * Get inventory tracking data with stock levels and movements
 * Requires: INVENTORY_READ permission
 */
export const GET = withRBAC(
  async (request, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const productId = searchParams.get("productId");
      const categoryId = searchParams.get("categoryId");
      const lowStock = searchParams.get("lowStock") === "true";
      const outOfStock = searchParams.get("outOfStock") === "true";

      // Build where clause
      const where: any = {
        deletedAt: null,
        trackInventory: true,
      };

      if (productId) {
        where.id = productId;
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (lowStock) {
        where.AND = [
          { quantity: { gt: 0 } },
          { quantity: { lte: prisma.raw(`"lowStockAlert"`) } },
        ];
      }

      if (outOfStock) {
        where.quantity = 0;
      }

      // Get products with inventory data
      const products = await prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          sku: true,
          quantity: true,
          lowStockAlert: true,
          price: true,
          costPrice: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          inventoryLogs: {
            take: 10,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              type: true,
              quantity: true,
              previousStock: true,
              currentStock: true,
              reason: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      // Calculate inventory metrics
      const inventoryData = products.map((product) => {
        const isLowStock = product.lowStockAlert
          ? product.quantity <= product.lowStockAlert
          : false;
        const isOutOfStock = product.quantity === 0;

        // Calculate stock status
        let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
        if (isOutOfStock) {
          stockStatus = "OUT_OF_STOCK";
        } else if (isLowStock) {
          stockStatus = "LOW_STOCK";
        } else {
          stockStatus = "IN_STOCK";
        }

        // Calculate inventory value
        const inventoryValue = product.quantity * Number(product.costPrice || 0);

        // Calculate potential revenue
        const potentialRevenue = product.quantity * Number(product.price);

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          currentStock: product.quantity,
          lowStockThreshold: product.lowStockAlert,
          stockStatus,
          isLowStock,
          isOutOfStock,
          price: Number(product.price),
          costPrice: Number(product.costPrice || 0),
          inventoryValue,
          potentialRevenue,
          totalSales: product._count.orderItems,
          recentMovements: product.inventoryLogs,
        };
      });

      // Calculate summary statistics
      const summary = {
        totalProducts: inventoryData.length,
        inStock: inventoryData.filter((p) => p.stockStatus === "IN_STOCK").length,
        lowStock: inventoryData.filter((p) => p.stockStatus === "LOW_STOCK").length,
        outOfStock: inventoryData.filter((p) => p.stockStatus === "OUT_OF_STOCK")
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
      };

      return NextResponse.json({
        summary,
        products: inventoryData,
      });
    } catch (error) {
      console.error("Failed to get inventory tracking data:", error);
      return NextResponse.json(
        { error: "Failed to get inventory tracking data" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.INVENTORY_READ],
  }
);

/**
 * POST /api/inventory/tracking
 * Update inventory (add/remove stock)
 * Requires: INVENTORY_UPDATE permission
 */
export const POST = withRBAC(
  async (request, context) => {
    try {
      const body = await request.json();
      const { productId, type, quantity, reason } = body;

      if (!productId || !type || !quantity) {
        return NextResponse.json(
          { error: "Product ID, type, and quantity are required" },
          { status: 400 }
        );
      }

      // Get current product
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { quantity: true, trackInventory: true },
      });

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      if (!product.trackInventory) {
        return NextResponse.json(
          { error: "Product does not track inventory" },
          { status: 400 }
        );
      }

      // Calculate new quantity
      let newQuantity = product.quantity;
      if (type === "IN" || type === "ADJUSTMENT") {
        newQuantity += quantity;
      } else if (type === "OUT" || type === "DAMAGE") {
        newQuantity = Math.max(0, product.quantity - quantity);
      }

      // Update product quantity and create log in transaction
      const result = await prisma.$transaction([
        prisma.product.update({
          where: { id: productId },
          data: { quantity: newQuantity },
        }),
        prisma.inventoryLog.create({
          data: {
            productId,
            type,
            quantity,
            previousStock: product.quantity,
            currentStock: newQuantity,
            reason: reason || `${type} - Manual adjustment`,
            referenceType: "MANUAL",
            userId: context.userId,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        product: result[0],
        log: result[1],
      });
    } catch (error) {
      console.error("Failed to update inventory:", error);
      return NextResponse.json(
        { error: "Failed to update inventory" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.INVENTORY_UPDATE],
  }
);
