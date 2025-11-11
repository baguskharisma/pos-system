import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { startOfDay, endOfDay, subDays } from "date-fns";

/**
 * GET /api/reports/top-products
 * Get top selling products report
 * Requires: REPORT_SALES permission
 *
 * Query params:
 * - startDate: ISO date string (default: 30 days ago)
 * - endDate: ISO date string (default: today)
 * - limit: Number of products to return (default: 20)
 * - sortBy: 'revenue' | 'quantity' (default: 'revenue')
 * - categoryId: Filter by specific category
 */
export const GET = withRBAC(
  async (request, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      const limitParam = searchParams.get("limit");
      const sortBy = searchParams.get("sortBy") || "revenue";
      const categoryId = searchParams.get("categoryId");

      const limit = limitParam ? parseInt(limitParam) : 20;

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

      // Get order items with product details
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: orderWhere,
          ...(categoryId && {
            product: {
              categoryId: categoryId,
            },
          }),
        },
        select: {
          productId: true,
          productName: true,
          productSku: true,
          quantity: true,
          totalAmount: true,
          unitPrice: true,
          costPrice: true,
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              imageUrl: true,
              price: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          order: {
            select: {
              createdAt: true,
            },
          },
        },
      });

      // Aggregate product statistics
      const productStats: {
        [key: string]: {
          productId: string;
          productName: string;
          productSku: string;
          imageUrl: string | null;
          currentPrice: number;
          category: {
            id: string;
            name: string;
            slug: string;
          } | null;
          totalQuantitySold: number;
          totalRevenue: number;
          totalCost: number;
          totalProfit: number;
          profitMargin: number;
          averagePrice: number;
          orderCount: number;
          firstSaleDate: Date;
          lastSaleDate: Date;
        };
      } = {};

      orderItems.forEach((item) => {
        const productId = item.productId;

        if (!productStats[productId]) {
          productStats[productId] = {
            productId: item.productId,
            productName: item.product.name,
            productSku: item.product.sku,
            imageUrl: item.product.imageUrl,
            currentPrice: Number(item.product.price),
            category: item.product.category,
            totalQuantitySold: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            profitMargin: 0,
            averagePrice: 0,
            orderCount: 0,
            firstSaleDate: item.order.createdAt,
            lastSaleDate: item.order.createdAt,
          };
        }

        const stats = productStats[productId];
        stats.totalQuantitySold += item.quantity;
        stats.totalRevenue += Number(item.totalAmount);
        stats.totalCost += item.costPrice ? Number(item.costPrice) * item.quantity : 0;
        stats.orderCount += 1;

        // Track first and last sale dates
        if (item.order.createdAt < stats.firstSaleDate) {
          stats.firstSaleDate = item.order.createdAt;
        }
        if (item.order.createdAt > stats.lastSaleDate) {
          stats.lastSaleDate = item.order.createdAt;
        }
      });

      // Calculate derived metrics
      Object.values(productStats).forEach((stats) => {
        stats.totalProfit = stats.totalRevenue - stats.totalCost;
        stats.profitMargin = stats.totalRevenue > 0
          ? (stats.totalProfit / stats.totalRevenue) * 100
          : 0;
        stats.averagePrice = stats.totalQuantitySold > 0
          ? stats.totalRevenue / stats.totalQuantitySold
          : 0;
      });

      // Sort products
      const sortedProducts = Object.values(productStats).sort((a, b) => {
        if (sortBy === "quantity") {
          return b.totalQuantitySold - a.totalQuantitySold;
        }
        return b.totalRevenue - a.totalRevenue;
      });

      // Apply limit
      const topProducts = sortedProducts.slice(0, limit);

      // Calculate summary statistics
      const summary = {
        totalProducts: Object.keys(productStats).length,
        totalQuantitySold: sortedProducts.reduce((sum, p) => sum + p.totalQuantitySold, 0),
        totalRevenue: sortedProducts.reduce((sum, p) => sum + p.totalRevenue, 0),
        totalProfit: sortedProducts.reduce((sum, p) => sum + p.totalProfit, 0),
        averageProfitMargin: 0,
      };

      summary.averageProfitMargin = summary.totalRevenue > 0
        ? (summary.totalProfit / summary.totalRevenue) * 100
        : 0;

      // Get category breakdown
      const categoryBreakdown: {
        [key: string]: {
          categoryId: string;
          categoryName: string;
          productCount: number;
          totalQuantity: number;
          totalRevenue: number;
        };
      } = {};

      topProducts.forEach((product) => {
        if (product.category) {
          const catId = product.category.id;
          if (!categoryBreakdown[catId]) {
            categoryBreakdown[catId] = {
              categoryId: catId,
              categoryName: product.category.name,
              productCount: 0,
              totalQuantity: 0,
              totalRevenue: 0,
            };
          }
          categoryBreakdown[catId].productCount += 1;
          categoryBreakdown[catId].totalQuantity += product.totalQuantitySold;
          categoryBreakdown[catId].totalRevenue += product.totalRevenue;
        }
      });

      return NextResponse.json({
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        summary,
        topProducts,
        categoryBreakdown: Object.values(categoryBreakdown).sort(
          (a, b) => b.totalRevenue - a.totalRevenue
        ),
      });
    } catch (error) {
      console.error("Failed to generate top products report:", error);
      return NextResponse.json(
        { error: "Failed to generate top products report" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.REPORT_SALES],
  }
);
