import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { startOfDay, subDays, format } from "date-fns";
import {
  forecastSales,
  analyzeTrend,
  detectSeasonality,
} from "@/lib/forecasting";

/**
 * GET /api/analytics/forecast
 * Get sales forecasting with trend analysis
 * Requires: REPORT_SALES permission
 */
export const GET = withRBAC(
  async (request, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const historicalDays = parseInt(searchParams.get("historicalDays") || "30");
      const forecastDays = parseInt(searchParams.get("forecastDays") || "7");
      const productId = searchParams.get("productId");

      // Get historical sales data
      const startDate = startOfDay(subDays(new Date(), historicalDays));
      const endDate = new Date();

      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          deletedAt: null,
          status: {
            in: ["PAID", "COMPLETED"],
          },
        },
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
          items: productId
            ? {
                where: { productId },
                select: {
                  quantity: true,
                  totalAmount: true,
                },
              }
            : {
                select: {
                  quantity: true,
                  totalAmount: true,
                },
              },
        },
      });

      // Group sales by date
      const salesByDate = new Map<
        string,
        { sales: number; orders: number; items: number }
      >();

      orders.forEach((order) => {
        const dateKey = format(new Date(order.createdAt), "yyyy-MM-dd");

        if (!salesByDate.has(dateKey)) {
          salesByDate.set(dateKey, { sales: 0, orders: 0, items: 0 });
        }

        const dayData = salesByDate.get(dateKey)!;

        if (productId) {
          // Product-specific sales
          const productSales = order.items.reduce(
            (sum, item) => sum + Number(item.totalAmount),
            0
          );
          const productItems = order.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          dayData.sales += productSales;
          dayData.items += productItems;
          if (productItems > 0) {
            dayData.orders += 1;
          }
        } else {
          // Overall sales
          dayData.sales += Number(order.totalAmount);
          dayData.orders += 1;
          dayData.items += order.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
        }
      });

      // Create complete time series (fill missing dates with 0)
      const historicalData: Array<{
        date: string;
        sales: number;
        orders: number;
        items: number;
      }> = [];

      for (let i = 0; i < historicalDays; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = format(date, "yyyy-MM-dd");

        const dayData = salesByDate.get(dateKey) || {
          sales: 0,
          orders: 0,
          items: 0,
        };

        historicalData.push({
          date: dateKey,
          ...dayData,
        });
      }

      // Analyze trends
      const salesValues = historicalData.map((d) => d.sales);
      const ordersValues = historicalData.map((d) => d.orders);

      const salesTrend = analyzeTrend(salesValues);
      const ordersTrend = analyzeTrend(ordersValues);

      // Detect seasonality
      const seasonality = detectSeasonality(historicalData, 7); // Weekly pattern

      // Generate forecast
      let forecast;
      try {
        forecast = forecastSales(historicalData, forecastDays);
      } catch (error) {
        // Fallback to simple average if not enough data
        const recentAverage =
          salesValues.slice(-7).reduce((a, b) => a + b, 0) / 7;
        forecast = Array.from({ length: forecastDays }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + i + 1);
          return {
            date: format(date, "yyyy-MM-dd"),
            predicted: recentAverage,
            lower: recentAverage * 0.8,
            upper: recentAverage * 1.2,
            confidence: 0.7,
          };
        });
      }

      // Calculate summary metrics
      const totalSales = salesValues.reduce((a, b) => a + b, 0);
      const totalOrders = ordersValues.reduce((a, b) => a + b, 0);
      const averageDailySales = totalSales / historicalDays;
      const averageDailyOrders = totalOrders / historicalDays;

      const forecastedTotal = forecast.reduce((sum, f) => sum + f.predicted, 0);
      const projectedGrowth =
        averageDailySales > 0
          ? ((forecastedTotal / forecastDays - averageDailySales) /
              averageDailySales) *
            100
          : 0;

      // Calculate confidence level
      const avgConfidence =
        forecast.reduce((sum, f) => sum + f.confidence, 0) / forecast.length;

      const summary = {
        historical: {
          days: historicalDays,
          totalSales,
          totalOrders,
          averageDailySales,
          averageDailyOrders,
        },
        forecast: {
          days: forecastDays,
          totalPredicted: forecastedTotal,
          averageDailyPredicted: forecastedTotal / forecastDays,
          confidence: avgConfidence,
          projectedGrowth,
        },
        trends: {
          sales: salesTrend,
          orders: ordersTrend,
        },
        seasonality: {
          detected: seasonality.hasSeasonality,
          strength: seasonality.strength,
          pattern: seasonality.pattern,
        },
      };

      // Get product info if forecasting for specific product
      let productInfo = null;
      if (productId) {
        productInfo = await prisma.product.findUnique({
          where: { id: productId },
          select: {
            id: true,
            name: true,
            sku: true,
            quantity: true,
            lowStockAlert: true,
          },
        });
      }

      return NextResponse.json({
        summary,
        historicalData,
        forecast,
        ...(productInfo && { product: productInfo }),
      });
    } catch (error) {
      console.error("Failed to generate forecast:", error);
      return NextResponse.json(
        { error: "Failed to generate forecast" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.REPORT_SALES],
  }
);
