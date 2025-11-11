import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { inventoryLogsQuerySchema } from "@/lib/validations/inventory";
import type { RBACContext } from "@/types";
import { Prisma } from "@prisma/client";

/**
 * GET /api/inventory/logs
 * Get inventory history/logs with filtering and pagination
 * Requires: INVENTORY_READ permission
 */
export const GET = withRBAC(
  async (request: NextRequest, _context: RBACContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const params = Object.fromEntries(searchParams.entries());

      // Validate query parameters
      const validationResult = inventoryLogsQuerySchema.safeParse(params);
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
        type,
        referenceType,
        referenceId,
        userId,
        startDate,
        endDate,
        page,
        limit,
      } = validationResult.data;

      // Build where clause
      const where: Prisma.InventoryLogWhereInput = {};

      if (productId) {
        where.productId = productId;
      }

      if (type) {
        where.type = type;
      }

      if (referenceType) {
        where.referenceType = referenceType;
      }

      if (referenceId) {
        where.referenceId = referenceId;
      }

      if (userId) {
        where.userId = userId;
      }

      // Date range filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      // Get total count
      const total = await prisma.inventoryLog.count({ where });

      // Get logs with related data
      const logs = await prisma.inventoryLog.findMany({
        where,
        select: {
          id: true,
          productId: true,
          type: true,
          quantity: true,
          previousStock: true,
          currentStock: true,
          reason: true,
          referenceType: true,
          referenceId: true,
          userId: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              imageUrl: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });

      // Calculate summary statistics for the filtered logs
      const allLogs = await prisma.inventoryLog.findMany({
        where,
        select: {
          type: true,
          quantity: true,
          currentStock: true,
          previousStock: true,
        },
      });

      const summary = {
        totalLogs: total,
        byType: {
          IN: allLogs.filter((l) => l.type === "IN").length,
          OUT: allLogs.filter((l) => l.type === "OUT").length,
          ADJUSTMENT: allLogs.filter((l) => l.type === "ADJUSTMENT").length,
          DAMAGE: allLogs.filter((l) => l.type === "DAMAGE").length,
          RETURN: allLogs.filter((l) => l.type === "RETURN").length,
          TRANSFER: allLogs.filter((l) => l.type === "TRANSFER").length,
          STOCK_TAKE: allLogs.filter((l) => l.type === "STOCK_TAKE").length,
        },
        totalQuantityIn: allLogs
          .filter((l) => ["IN", "RETURN"].includes(l.type))
          .reduce((sum, l) => sum + l.quantity, 0),
        totalQuantityOut: allLogs
          .filter((l) => ["OUT", "DAMAGE"].includes(l.type))
          .reduce((sum, l) => sum + l.quantity, 0),
        totalAdjustments: allLogs
          .filter((l) => l.type === "ADJUSTMENT")
          .reduce(
            (sum, l) => sum + Math.abs(l.currentStock - l.previousStock),
            0
          ),
        netChange: allLogs.reduce(
          (sum, l) => sum + (l.currentStock - l.previousStock),
          0
        ),
      };

      return NextResponse.json({
        summary,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page < Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Failed to get inventory logs:", error);
      return NextResponse.json(
        { error: "Failed to get inventory logs" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.INVENTORY_READ],
  }
);

/**
 * GET /api/inventory/logs/[productId]
 * Get inventory logs for a specific product
 */
export async function GET_BY_PRODUCT(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        sku: true,
        quantity: true,
        trackInventory: true,
      },
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

    // Get logs for this product
    const where = { productId };
    const total = await prisma.inventoryLog.count({ where });

    const logs = await prisma.inventoryLog.findMany({
      where,
      select: {
        id: true,
        type: true,
        quantity: true,
        previousStock: true,
        currentStock: true,
        reason: true,
        referenceType: true,
        referenceId: true,
        userId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate movement summary
    const allLogs = await prisma.inventoryLog.findMany({
      where,
      select: {
        type: true,
        quantity: true,
        currentStock: true,
        previousStock: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const summary = {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      currentStock: product.quantity,
      totalMovements: total,
      totalQuantityIn: allLogs
        .filter((l) => ["IN", "RETURN"].includes(l.type))
        .reduce((sum, l) => sum + l.quantity, 0),
      totalQuantityOut: allLogs
        .filter((l) => ["OUT", "DAMAGE"].includes(l.type))
        .reduce((sum, l) => sum + l.quantity, 0),
      firstLog: allLogs[0] || null,
      lastLog: allLogs[allLogs.length - 1] || null,
      byType: {
        IN: allLogs.filter((l) => l.type === "IN").length,
        OUT: allLogs.filter((l) => l.type === "OUT").length,
        ADJUSTMENT: allLogs.filter((l) => l.type === "ADJUSTMENT").length,
        DAMAGE: allLogs.filter((l) => l.type === "DAMAGE").length,
        RETURN: allLogs.filter((l) => l.type === "RETURN").length,
        TRANSFER: allLogs.filter((l) => l.type === "TRANSFER").length,
        STOCK_TAKE: allLogs.filter((l) => l.type === "STOCK_TAKE").length,
      },
    };

    return NextResponse.json({
      summary,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to get product inventory logs:", error);
    return NextResponse.json(
      { error: "Failed to get product inventory logs" },
      { status: 500 }
    );
  }
}
