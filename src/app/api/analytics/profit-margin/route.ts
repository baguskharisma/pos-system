import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

/**
 * GET /api/analytics/profit-margin
 * Get detailed profit margin analysis
 * Requires: REPORT_SALES permission
 */
export const GET = withRBAC(
  async (request, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      const groupBy = searchParams.get("groupBy") || "product"; // product, category, day
      const sortBy = searchParams.get("sortBy") || "margin"; // margin, revenue, profit

      // Date range (default to last 30 days)
      const start = startDate
        ? startOfDay(new Date(startDate))
        : startOfDay(subDays(new Date(), 30));
      const end = endDate
        ? endOfDay(new Date(endDate))
        : endOfDay(new Date());

      // Get order items with product details
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: {
              gte: start,
              lte: end,
            },
            deletedAt: null,
            status: {
              in: ["PAID", "COMPLETED"],
            },
          },
        },
        select: {
          id: true,
          productId: true,
          productName: true,
          quantity: true,
          unitPrice: true,
          costPrice: true,
          totalAmount: true,
          order: {
            select: {
              createdAt: true,
              discountAmount: true,
              taxAmount: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              categoryId: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (groupBy === "product") {
        // Group by product
        const productMap = new Map<
          string,
          {
            productId: string;
            productName: string;
            sku: string;
            category: { id: string; name: string } | null;
            totalRevenue: number;
            totalCost: number;
            totalProfit: number;
            profitMargin: number;
            unitsSold: number;
            averagePrice: number;
            averageCost: number;
          }
        >();

        orderItems.forEach((item) => {
          const productId = item.productId;

          if (!productMap.has(productId)) {
            productMap.set(productId, {
              productId: item.productId,
              productName: item.product.name,
              sku: item.product.sku,
              category: item.product.category,
              totalRevenue: 0,
              totalCost: 0,
              totalProfit: 0,
              profitMargin: 0,
              unitsSold: 0,
              averagePrice: 0,
              averageCost: 0,
            });
          }

          const product = productMap.get(productId)!;
          const revenue = Number(item.totalAmount);
          const cost = item.costPrice
            ? Number(item.costPrice) * item.quantity
            : 0;

          product.totalRevenue += revenue;
          product.totalCost += cost;
          product.totalProfit += revenue - cost;
          product.unitsSold += item.quantity;
        });

        // Calculate averages and margins
        const products = Array.from(productMap.values()).map((product) => {
          product.averagePrice =
            product.unitsSold > 0 ? product.totalRevenue / product.unitsSold : 0;
          product.averageCost =
            product.unitsSold > 0 ? product.totalCost / product.unitsSold : 0;
          product.profitMargin =
            product.totalRevenue > 0
              ? (product.totalProfit / product.totalRevenue) * 100
              : 0;
          return product;
        });

        // Sort products
        products.sort((a, b) => {
          switch (sortBy) {
            case "revenue":
              return b.totalRevenue - a.totalRevenue;
            case "profit":
              return b.totalProfit - a.totalProfit;
            default:
              return b.profitMargin - a.profitMargin;
          }
        });

        // Calculate summary
        const summary = {
          totalRevenue: products.reduce((sum, p) => sum + p.totalRevenue, 0),
          totalCost: products.reduce((sum, p) => sum + p.totalCost, 0),
          totalProfit: products.reduce((sum, p) => sum + p.totalProfit, 0),
          overallMargin: 0,
          totalProducts: products.length,
          profitableProducts: products.filter((p) => p.profitMargin > 0).length,
          highMarginProducts: products.filter((p) => p.profitMargin > 30).length,
          lowMarginProducts: products.filter(
            (p) => p.profitMargin > 0 && p.profitMargin < 10
          ).length,
          losingProducts: products.filter((p) => p.profitMargin <= 0).length,
        };

        summary.overallMargin =
          summary.totalRevenue > 0
            ? (summary.totalProfit / summary.totalRevenue) * 100
            : 0;

        return NextResponse.json({
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString(),
          },
          summary,
          data: products,
        });
      } else if (groupBy === "category") {
        // Group by category
        const categoryMap = new Map<
          string,
          {
            categoryId: string;
            categoryName: string;
            totalRevenue: number;
            totalCost: number;
            totalProfit: number;
            profitMargin: number;
            productCount: number;
            unitsSold: number;
          }
        >();

        orderItems.forEach((item) => {
          const categoryId = item.product.category?.id || "uncategorized";
          const categoryName = item.product.category?.name || "Uncategorized";

          if (!categoryMap.has(categoryId)) {
            categoryMap.set(categoryId, {
              categoryId,
              categoryName,
              totalRevenue: 0,
              totalCost: 0,
              totalProfit: 0,
              profitMargin: 0,
              productCount: 0,
              unitsSold: 0,
            });
          }

          const category = categoryMap.get(categoryId)!;
          const revenue = Number(item.totalAmount);
          const cost = item.costPrice
            ? Number(item.costPrice) * item.quantity
            : 0;

          category.totalRevenue += revenue;
          category.totalCost += cost;
          category.totalProfit += revenue - cost;
          category.unitsSold += item.quantity;
        });

        // Count unique products per category
        const productsByCategory = new Map<string, Set<string>>();
        orderItems.forEach((item) => {
          const categoryId = item.product.category?.id || "uncategorized";
          if (!productsByCategory.has(categoryId)) {
            productsByCategory.set(categoryId, new Set());
          }
          productsByCategory.get(categoryId)!.add(item.productId);
        });

        // Calculate margins and product counts
        const categories = Array.from(categoryMap.values()).map((category) => {
          category.profitMargin =
            category.totalRevenue > 0
              ? (category.totalProfit / category.totalRevenue) * 100
              : 0;
          category.productCount =
            productsByCategory.get(category.categoryId)?.size || 0;
          return category;
        });

        // Sort categories
        categories.sort((a, b) => {
          switch (sortBy) {
            case "revenue":
              return b.totalRevenue - a.totalRevenue;
            case "profit":
              return b.totalProfit - a.totalProfit;
            default:
              return b.profitMargin - a.profitMargin;
          }
        });

        // Calculate summary
        const summary = {
          totalRevenue: categories.reduce((sum, c) => sum + c.totalRevenue, 0),
          totalCost: categories.reduce((sum, c) => sum + c.totalCost, 0),
          totalProfit: categories.reduce((sum, c) => sum + c.totalProfit, 0),
          overallMargin: 0,
          totalCategories: categories.length,
        };

        summary.overallMargin =
          summary.totalRevenue > 0
            ? (summary.totalProfit / summary.totalRevenue) * 100
            : 0;

        return NextResponse.json({
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString(),
          },
          summary,
          data: categories,
        });
      } else if (groupBy === "day") {
        // Group by day
        const dayMap = new Map<
          string,
          {
            date: string;
            totalRevenue: number;
            totalCost: number;
            totalProfit: number;
            profitMargin: number;
            orderCount: number;
            unitsSold: number;
          }
        >();

        orderItems.forEach((item) => {
          const dateKey = format(new Date(item.order.createdAt), "yyyy-MM-dd");

          if (!dayMap.has(dateKey)) {
            dayMap.set(dateKey, {
              date: dateKey,
              totalRevenue: 0,
              totalCost: 0,
              totalProfit: 0,
              profitMargin: 0,
              orderCount: 0,
              unitsSold: 0,
            });
          }

          const day = dayMap.get(dateKey)!;
          const revenue = Number(item.totalAmount);
          const cost = item.costPrice
            ? Number(item.costPrice) * item.quantity
            : 0;

          day.totalRevenue += revenue;
          day.totalCost += cost;
          day.totalProfit += revenue - cost;
          day.unitsSold += item.quantity;
        });

        // Calculate margins
        const days = Array.from(dayMap.values())
          .map((day) => {
            day.profitMargin =
              day.totalRevenue > 0
                ? (day.totalProfit / day.totalRevenue) * 100
                : 0;
            return day;
          })
          .sort((a, b) => a.date.localeCompare(b.date));

        // Calculate summary
        const summary = {
          totalRevenue: days.reduce((sum, d) => sum + d.totalRevenue, 0),
          totalCost: days.reduce((sum, d) => sum + d.totalCost, 0),
          totalProfit: days.reduce((sum, d) => sum + d.totalProfit, 0),
          overallMargin: 0,
          totalDays: days.length,
          averageDailyProfit: 0,
          bestDay: days.reduce((best, day) =>
            day.totalProfit > best.totalProfit ? day : best
          ),
          worstDay: days.reduce((worst, day) =>
            day.totalProfit < worst.totalProfit ? day : worst
          ),
        };

        summary.overallMargin =
          summary.totalRevenue > 0
            ? (summary.totalProfit / summary.totalRevenue) * 100
            : 0;
        summary.averageDailyProfit =
          days.length > 0 ? summary.totalProfit / days.length : 0;

        return NextResponse.json({
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString(),
          },
          summary,
          data: days,
        });
      }

      return NextResponse.json(
        { error: "Invalid groupBy parameter" },
        { status: 400 }
      );
    } catch (error) {
      console.error("Failed to get profit margin analysis:", error);
      return NextResponse.json(
        { error: "Failed to get profit margin analysis" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.REPORT_SALES],
  }
);
