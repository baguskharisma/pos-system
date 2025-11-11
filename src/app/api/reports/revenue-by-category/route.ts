import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { startOfDay, endOfDay, subDays } from "date-fns";

/**
 * GET /api/reports/revenue-by-category
 * Get revenue breakdown by product category
 * Requires: REPORT_SALES permission
 *
 * Query params:
 * - startDate: ISO date string (default: 30 days ago)
 * - endDate: ISO date string (default: today)
 * - includeInactive: Include inactive categories (default: false)
 */
export const GET = withRBAC(
  async (request, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      const includeInactive = searchParams.get("includeInactive") === "true";

      // Date range (default to last 30 days)
      const start = startDate
        ? startOfDay(new Date(startDate))
        : startOfDay(subDays(new Date(), 30));
      const end = endDate
        ? endOfDay(new Date(endDate))
        : endOfDay(new Date());

      // Build where clause for orders
      const orderWhere: any = {
        createdAt: {
          gte: start,
          lte: end,
        },
        deletedAt: null,
        status: {
          in: ["PAID", "COMPLETED"],
          notIn: ["CANCELLED"], // Exclude cancelled orders from revenue
        },
      };

      // Get order items with product and category details
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: orderWhere,
        },
        select: {
          quantity: true,
          totalAmount: true,
          costPrice: true,
          product: {
            select: {
              categoryId: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  color: true,
                  icon: true,
                  isActive: true,
                },
              },
            },
          },
          order: {
            select: {
              id: true,
              createdAt: true,
            },
          },
        },
      });

      // Aggregate by category
      const categoryStats: {
        [key: string]: {
          categoryId: string;
          categoryName: string;
          categorySlug: string;
          color: string | null;
          icon: string | null;
          isActive: boolean;
          totalRevenue: number;
          totalCost: number;
          totalProfit: number;
          profitMargin: number;
          totalItemsSold: number;
          orderCount: number;
          averageOrderValue: number;
          percentageOfTotal: number;
        };
      } = {};

      const uniqueOrders = new Set<string>();
      let totalRevenue = 0;

      orderItems.forEach((item) => {
        const category = item.product.category;

        if (!category) return;

        // Skip inactive categories if not requested
        if (!includeInactive && !category.isActive) return;

        const categoryId = category.id;

        if (!categoryStats[categoryId]) {
          categoryStats[categoryId] = {
            categoryId: category.id,
            categoryName: category.name,
            categorySlug: category.slug,
            color: category.color,
            icon: category.icon,
            isActive: category.isActive,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            profitMargin: 0,
            totalItemsSold: 0,
            orderCount: 0,
            averageOrderValue: 0,
            percentageOfTotal: 0,
          };
        }

        const stats = categoryStats[categoryId];
        stats.totalRevenue += Number(item.totalAmount);
        stats.totalCost += item.costPrice ? Number(item.costPrice) * item.quantity : 0;
        stats.totalItemsSold += item.quantity;

        // Track unique orders
        uniqueOrders.add(item.order.id);

        totalRevenue += Number(item.totalAmount);
      });

      // Count unique orders per category (need another pass)
      const categoryOrders: { [key: string]: Set<string> } = {};
      orderItems.forEach((item) => {
        const category = item.product.category;
        if (!category || (!includeInactive && !category.isActive)) return;

        const categoryId = category.id;
        if (!categoryOrders[categoryId]) {
          categoryOrders[categoryId] = new Set();
        }
        categoryOrders[categoryId].add(item.order.id);
      });

      // Calculate derived metrics
      Object.entries(categoryStats).forEach(([categoryId, stats]) => {
        stats.totalProfit = stats.totalRevenue - stats.totalCost;
        stats.profitMargin = stats.totalRevenue > 0
          ? (stats.totalProfit / stats.totalRevenue) * 100
          : 0;
        stats.orderCount = categoryOrders[categoryId]?.size || 0;
        stats.averageOrderValue = stats.orderCount > 0
          ? stats.totalRevenue / stats.orderCount
          : 0;
        stats.percentageOfTotal = totalRevenue > 0
          ? (stats.totalRevenue / totalRevenue) * 100
          : 0;
      });

      // Sort by revenue (descending)
      const categoryBreakdown = Object.values(categoryStats).sort(
        (a, b) => b.totalRevenue - a.totalRevenue
      );

      // Calculate summary
      const summary = {
        totalCategories: categoryBreakdown.length,
        totalRevenue,
        totalProfit: categoryBreakdown.reduce((sum, cat) => sum + cat.totalProfit, 0),
        totalItemsSold: categoryBreakdown.reduce((sum, cat) => sum + cat.totalItemsSold, 0),
        totalOrders: uniqueOrders.size,
        averageProfitMargin: 0,
        topCategory: categoryBreakdown.length > 0 ? {
          name: categoryBreakdown[0].categoryName,
          revenue: categoryBreakdown[0].totalRevenue,
          percentage: categoryBreakdown[0].percentageOfTotal,
        } : null,
      };

      summary.averageProfitMargin = summary.totalRevenue > 0
        ? (summary.totalProfit / summary.totalRevenue) * 100
        : 0;

      // Get trend data (compare with previous period)
      const periodDuration = end.getTime() - start.getTime();
      const previousStart = new Date(start.getTime() - periodDuration);
      const previousEnd = new Date(start.getTime());

      const previousOrderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: {
              gte: previousStart,
              lte: previousEnd,
            },
            deletedAt: null,
            status: {
              in: ["PAID", "COMPLETED"],
            },
          },
        },
        select: {
          totalAmount: true,
          product: {
            select: {
              categoryId: true,
            },
          },
        },
      });

      const previousRevenue: { [key: string]: number } = {};
      previousOrderItems.forEach((item) => {
        const categoryId = item.product.categoryId;
        previousRevenue[categoryId] = (previousRevenue[categoryId] || 0) + Number(item.totalAmount);
      });

      // Add growth rate to each category
      const categoryBreakdownWithGrowth = categoryBreakdown.map((cat) => {
        const previousRev = previousRevenue[cat.categoryId] || 0;
        const growthRate = previousRev > 0
          ? ((cat.totalRevenue - previousRev) / previousRev) * 100
          : cat.totalRevenue > 0 ? 100 : 0;

        return {
          ...cat,
          previousPeriodRevenue: previousRev,
          growthRate,
        };
      });

      return NextResponse.json({
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        previousPeriod: {
          start: previousStart.toISOString(),
          end: previousEnd.toISOString(),
        },
        summary,
        categoryBreakdown: categoryBreakdownWithGrowth,
      });
    } catch (error) {
      console.error("Failed to generate revenue by category report:", error);
      return NextResponse.json(
        { error: "Failed to generate revenue by category report" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.REPORT_SALES],
  }
);
