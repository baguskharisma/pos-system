import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import type { RBACContext } from "@/types";

/**
 * GET /api/inventory/analytics
 * Get comprehensive inventory analytics
 * Requires: INVENTORY_READ permission
 */
export const GET = withRBAC(
  async (request: NextRequest, _context: RBACContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const categoryId = searchParams.get("categoryId");
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

      // Default to last 30 days if no date range specified
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate
        ? new Date(startDate)
        : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get all products with inventory tracking
      const whereProduct: any = {
        deletedAt: null,
        trackInventory: true,
      };

      if (categoryId) {
        whereProduct.categoryId = categoryId;
      }

      const products = await prisma.product.findMany({
        where: whereProduct,
        select: {
          id: true,
          name: true,
          sku: true,
          quantity: true,
          lowStockAlert: true,
          costPrice: true,
          price: true,
          categoryId: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          inventoryLogs: {
            where: {
              createdAt: {
                gte: start,
                lte: end,
              },
            },
            select: {
              type: true,
              quantity: true,
              previousStock: true,
              currentStock: true,
              createdAt: true,
            },
          },
          orderItems: {
            where: {
              order: {
                status: {
                  in: ["PAID", "COMPLETED"],
                },
                deletedAt: null,
                createdAt: {
                  gte: start,
                  lte: end,
                },
              },
            },
            select: {
              quantity: true,
              totalAmount: true,
              costPrice: true,
              createdAt: true,
            },
          },
        },
      });

      // Calculate comprehensive analytics
      const analytics = products.map((product) => {
        // Sales metrics
        const totalSold = product.orderItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const totalRevenue = product.orderItems.reduce(
          (sum, item) => sum + Number(item.totalAmount),
          0
        );
        const avgSellingPrice =
          totalSold > 0 ? totalRevenue / totalSold : Number(product.price);

        // Cost metrics
        const totalCost = product.orderItems.reduce(
          (sum, item) => sum + item.quantity * Number(item.costPrice || 0),
          0
        );
        const grossProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        // Inventory value
        const inventoryValue = product.quantity * Number(product.costPrice || 0);
        const potentialRevenue = product.quantity * Number(product.price);

        // Stock movements
        const stockIn = product.inventoryLogs
          .filter((log) => ["IN", "RETURN"].includes(log.type))
          .reduce((sum, log) => sum + log.quantity, 0);

        const stockOut = product.inventoryLogs
          .filter((log) => ["OUT", "DAMAGE"].includes(log.type))
          .reduce((sum, log) => sum + log.quantity, 0);

        const adjustments = product.inventoryLogs
          .filter((log) => log.type === "ADJUSTMENT")
          .reduce(
            (sum, log) => sum + Math.abs(log.currentStock - log.previousStock),
            0
          );

        // Turnover metrics
        const daysInPeriod = Math.max(
          1,
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        const dailySalesRate = totalSold / daysInPeriod;
        const daysUntilOutOfStock =
          dailySalesRate > 0 && product.quantity > 0
            ? Math.floor(product.quantity / dailySalesRate)
            : null;

        // Turnover rate (annual projection)
        const avgInventory = product.quantity + totalSold / 2; // Simple average
        const turnoverRate =
          avgInventory > 0 ? (totalSold * (365 / daysInPeriod)) / avgInventory : 0;

        // Stock status
        const isOutOfStock = product.quantity === 0;
        const isLowStock =
          !isOutOfStock &&
          product.lowStockAlert !== null &&
          product.quantity <= product.lowStockAlert;

        // Dead stock indicator (no sales in period and high inventory)
        const isDeadStock =
          totalSold === 0 && product.quantity > (product.lowStockAlert || 0) * 2;

        // Overstock indicator
        const isOverstock =
          product.lowStockAlert !== null &&
          product.quantity > product.lowStockAlert * 3 &&
          dailySalesRate > 0 &&
          product.quantity / dailySalesRate > 90; // More than 90 days of inventory

        return {
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            currentStock: product.quantity,
            lowStockThreshold: product.lowStockAlert,
          },
          sales: {
            unitsSold: totalSold,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            avgSellingPrice: Math.round(avgSellingPrice * 100) / 100,
            dailySalesRate: Math.round(dailySalesRate * 100) / 100,
          },
          profitability: {
            totalCost: Math.round(totalCost * 100) / 100,
            grossProfit: Math.round(grossProfit * 100) / 100,
            profitMargin: Math.round(profitMargin * 100) / 100,
          },
          inventory: {
            currentValue: Math.round(inventoryValue * 100) / 100,
            potentialRevenue: Math.round(potentialRevenue * 100) / 100,
            daysUntilOutOfStock,
            turnoverRate: Math.round(turnoverRate * 100) / 100,
          },
          movements: {
            stockIn,
            stockOut,
            adjustments,
            netChange: stockIn - stockOut,
            totalMovements: product.inventoryLogs.length,
          },
          status: {
            isOutOfStock,
            isLowStock,
            isDeadStock,
            isOverstock,
          },
        };
      });

      // Calculate overall summary
      const summary = {
        totalProducts: analytics.length,
        periodDays: Math.round(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        ),
        overview: {
          totalInventoryValue: analytics.reduce(
            (sum, a) => sum + a.inventory.currentValue,
            0
          ),
          totalPotentialRevenue: analytics.reduce(
            (sum, a) => sum + a.inventory.potentialRevenue,
            0
          ),
          totalRevenue: analytics.reduce((sum, a) => sum + a.sales.totalRevenue, 0),
          totalGrossProfit: analytics.reduce(
            (sum, a) => sum + a.profitability.grossProfit,
            0
          ),
          avgProfitMargin:
            analytics.length > 0
              ? analytics.reduce(
                  (sum, a) => sum + a.profitability.profitMargin,
                  0
                ) / analytics.length
              : 0,
          avgTurnoverRate:
            analytics.length > 0
              ? analytics.reduce((sum, a) => sum + a.inventory.turnoverRate, 0) /
                analytics.length
              : 0,
        },
        stockStatus: {
          inStock: analytics.filter(
            (a) => !a.status.isOutOfStock && !a.status.isLowStock
          ).length,
          lowStock: analytics.filter((a) => a.status.isLowStock).length,
          outOfStock: analytics.filter((a) => a.status.isOutOfStock).length,
          deadStock: analytics.filter((a) => a.status.isDeadStock).length,
          overstock: analytics.filter((a) => a.status.isOverstock).length,
        },
        movements: {
          totalStockIn: analytics.reduce((sum, a) => sum + a.movements.stockIn, 0),
          totalStockOut: analytics.reduce((sum, a) => sum + a.movements.stockOut, 0),
          totalAdjustments: analytics.reduce(
            (sum, a) => sum + a.movements.adjustments,
            0
          ),
          totalMovements: analytics.reduce(
            (sum, a) => sum + a.movements.totalMovements,
            0
          ),
        },
      };

      // Round summary numbers
      summary.overview.totalInventoryValue =
        Math.round(summary.overview.totalInventoryValue * 100) / 100;
      summary.overview.totalPotentialRevenue =
        Math.round(summary.overview.totalPotentialRevenue * 100) / 100;
      summary.overview.totalRevenue =
        Math.round(summary.overview.totalRevenue * 100) / 100;
      summary.overview.totalGrossProfit =
        Math.round(summary.overview.totalGrossProfit * 100) / 100;
      summary.overview.avgProfitMargin =
        Math.round(summary.overview.avgProfitMargin * 100) / 100;
      summary.overview.avgTurnoverRate =
        Math.round(summary.overview.avgTurnoverRate * 100) / 100;

      // Sort products by different metrics for insights
      const insights = {
        topSellers: analytics
          .sort((a, b) => b.sales.unitsSold - a.sales.unitsSold)
          .slice(0, 10)
          .map((a) => ({
            product: a.product,
            unitsSold: a.sales.unitsSold,
            revenue: a.sales.totalRevenue,
          })),
        mostProfitable: analytics
          .sort((a, b) => b.profitability.grossProfit - a.profitability.grossProfit)
          .slice(0, 10)
          .map((a) => ({
            product: a.product,
            grossProfit: a.profitability.grossProfit,
            profitMargin: a.profitability.profitMargin,
          })),
        fastestTurnover: analytics
          .filter((a) => a.inventory.turnoverRate > 0)
          .sort((a, b) => b.inventory.turnoverRate - a.inventory.turnoverRate)
          .slice(0, 10)
          .map((a) => ({
            product: a.product,
            turnoverRate: a.inventory.turnoverRate,
            dailySalesRate: a.sales.dailySalesRate,
          })),
        deadStock: analytics
          .filter((a) => a.status.isDeadStock)
          .sort((a, b) => b.inventory.currentValue - a.inventory.currentValue)
          .slice(0, 10)
          .map((a) => ({
            product: a.product,
            inventoryValue: a.inventory.currentValue,
            currentStock: a.product.currentStock,
          })),
        overstock: analytics
          .filter((a) => a.status.isOverstock)
          .sort((a, b) => b.product.currentStock - a.product.currentStock)
          .slice(0, 10)
          .map((a) => ({
            product: a.product,
            currentStock: a.product.currentStock,
            daysUntilOutOfStock: a.inventory.daysUntilOutOfStock,
          })),
        criticalStock: analytics
          .filter((a) => a.status.isOutOfStock || a.status.isLowStock)
          .sort((a, b) => {
            // Out of stock first, then by how low the stock is
            if (a.status.isOutOfStock && !b.status.isOutOfStock) return -1;
            if (!a.status.isOutOfStock && b.status.isOutOfStock) return 1;
            return a.product.currentStock - b.product.currentStock;
          })
          .slice(0, 10)
          .map((a) => ({
            product: a.product,
            currentStock: a.product.currentStock,
            dailySalesRate: a.sales.dailySalesRate,
            daysUntilOutOfStock: a.inventory.daysUntilOutOfStock,
          })),
      };

      return NextResponse.json({
        summary,
        insights,
        analytics: analytics.slice(0, 100), // Limit detailed analytics to 100 products
        metadata: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          categoryId: categoryId || null,
        },
      });
    } catch (error) {
      console.error("Failed to get inventory analytics:", error);
      return NextResponse.json(
        { error: "Failed to get inventory analytics" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.INVENTORY_READ],
  }
);
