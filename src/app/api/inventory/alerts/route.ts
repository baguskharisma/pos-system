import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";

/**
 * GET /api/inventory/alerts
 * Get low stock alerts and out of stock notifications
 * Requires: INVENTORY_READ permission
 */
export const GET = withRBAC(
  async (request, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const severity = searchParams.get("severity"); // "critical", "warning", "all"

      // Get products with low stock or out of stock
      const products = await prisma.product.findMany({
        where: {
          deletedAt: null,
          trackInventory: true,
          OR: [
            { quantity: 0 }, // Out of stock
            {
              AND: [
                { quantity: { gt: 0 } },
                { quantity: { lte: prisma.raw(`COALESCE("lowStockAlert", 0)`) } },
              ],
            },
          ],
        },
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
            take: 1,
            orderBy: { createdAt: "desc" },
            select: {
              type: true,
              createdAt: true,
            },
          },
          orderItems: {
            where: {
              order: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                },
                status: {
                  in: ["PAID", "COMPLETED"],
                },
              },
            },
            select: {
              quantity: true,
            },
          },
        },
        orderBy: { quantity: "asc" },
      });

      // Calculate alerts with severity and recommendations
      const alerts = products.map((product) => {
        const isOutOfStock = product.quantity === 0;
        const isLowStock =
          !isOutOfStock &&
          product.lowStockAlert &&
          product.quantity <= product.lowStockAlert;

        // Calculate severity
        let alertSeverity: "critical" | "warning" | "info";
        if (isOutOfStock) {
          alertSeverity = "critical";
        } else if (product.lowStockAlert && product.quantity <= product.lowStockAlert / 2) {
          alertSeverity = "critical";
        } else if (isLowStock) {
          alertSeverity = "warning";
        } else {
          alertSeverity = "info";
        }

        // Calculate 30-day sales velocity
        const totalSold = product.orderItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const dailyVelocity = totalSold / 30;

        // Calculate days until out of stock
        const daysUntilOutOfStock =
          dailyVelocity > 0 ? Math.floor(product.quantity / dailyVelocity) : Infinity;

        // Calculate recommended reorder quantity (30 days worth)
        const recommendedReorder = Math.ceil(dailyVelocity * 30);

        // Get last movement date
        const lastMovementDate = product.inventoryLogs[0]?.createdAt || null;

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          currentStock: product.quantity,
          lowStockThreshold: product.lowStockAlert,
          severity: alertSeverity,
          isOutOfStock,
          isLowStock,
          price: Number(product.price),
          costPrice: Number(product.costPrice || 0),
          salesVelocity: {
            last30Days: totalSold,
            dailyAverage: dailyVelocity,
            daysUntilOutOfStock:
              daysUntilOutOfStock === Infinity ? null : daysUntilOutOfStock,
          },
          recommendation: {
            action: isOutOfStock ? "URGENT_REORDER" : "REORDER_SOON",
            suggestedQuantity: recommendedReorder,
            estimatedCost: recommendedReorder * Number(product.costPrice || 0),
            priority: alertSeverity === "critical" ? "HIGH" : "MEDIUM",
          },
          lastMovement: lastMovementDate,
        };
      });

      // Filter by severity if specified
      const filteredAlerts =
        severity && severity !== "all"
          ? alerts.filter((alert) => alert.severity === severity)
          : alerts;

      // Calculate summary
      const summary = {
        totalAlerts: filteredAlerts.length,
        critical: alerts.filter((a) => a.severity === "critical").length,
        warning: alerts.filter((a) => a.severity === "warning").length,
        outOfStock: alerts.filter((a) => a.isOutOfStock).length,
        lowStock: alerts.filter((a) => a.isLowStock && !a.isOutOfStock).length,
        totalReorderCost: filteredAlerts.reduce(
          (sum, a) => sum + a.recommendation.estimatedCost,
          0
        ),
        urgentReorders: filteredAlerts.filter(
          (a) => a.recommendation.action === "URGENT_REORDER"
        ).length,
      };

      return NextResponse.json({
        summary,
        alerts: filteredAlerts,
      });
    } catch (error) {
      console.error("Failed to get inventory alerts:", error);
      return NextResponse.json(
        { error: "Failed to get inventory alerts" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.INVENTORY_READ],
  }
);
