import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { startOfDay, endOfDay, subDays, format, getHours } from "date-fns";

/**
 * GET /api/reports/hourly
 * Get hourly sales analysis
 * Requires: REPORT_SALES permission
 *
 * Query params:
 * - startDate: ISO date string (default: 7 days ago)
 * - endDate: ISO date string (default: today)
 * - dayOfWeek: Filter by specific day of week (0-6, Sunday-Saturday)
 */
export const GET = withRBAC(
  async (request, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      const dayOfWeekParam = searchParams.get("dayOfWeek");

      const dayOfWeek = dayOfWeekParam ? parseInt(dayOfWeekParam) : null;

      // Date range (default to last 7 days)
      const start = startDate
        ? startOfDay(new Date(startDate))
        : startOfDay(subDays(new Date(), 7));
      const end = endDate
        ? endOfDay(new Date(endDate))
        : endOfDay(new Date());

      // Get all orders in the date range
      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
          deletedAt: null,
          status: {
            in: ["PAID", "COMPLETED"],
            notIn: ["CANCELLED"], // Exclude cancelled orders from revenue
          },
        },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          createdAt: true,
          orderType: true,
          items: {
            select: {
              quantity: true,
            },
          },
        },
      });

      // Filter by day of week if specified
      const filteredOrders = dayOfWeek !== null
        ? orders.filter(order => new Date(order.createdAt).getDay() === dayOfWeek)
        : orders;

      // Aggregate by hour (0-23)
      const hourlyStats: {
        [key: number]: {
          hour: number;
          hourLabel: string;
          orderCount: number;
          totalSales: number;
          totalItems: number;
          averageOrderValue: number;
          peakDay: string | null;
          ordersByType: { [key: string]: number };
        };
      } = {};

      // Initialize all 24 hours
      for (let i = 0; i < 24; i++) {
        hourlyStats[i] = {
          hour: i,
          hourLabel: `${i.toString().padStart(2, '0')}:00`,
          orderCount: 0,
          totalSales: 0,
          totalItems: 0,
          averageOrderValue: 0,
          peakDay: null,
          ordersByType: {},
        };
      }

      // Track daily breakdown for each hour to find peak day
      const hourlyDailyBreakdown: {
        [hour: number]: {
          [date: string]: { orderCount: number; totalSales: number };
        };
      } = {};

      filteredOrders.forEach((order) => {
        const orderDate = new Date(order.createdAt);
        const hour = getHours(orderDate);
        const dateKey = format(orderDate, "yyyy-MM-dd");

        const stats = hourlyStats[hour];
        stats.orderCount += 1;
        stats.totalSales += Number(order.totalAmount);
        stats.totalItems += order.items.reduce((sum, item) => sum + item.quantity, 0);

        // Track by order type
        const orderType = order.orderType;
        stats.ordersByType[orderType] = (stats.ordersByType[orderType] || 0) + 1;

        // Track daily breakdown
        if (!hourlyDailyBreakdown[hour]) {
          hourlyDailyBreakdown[hour] = {};
        }
        if (!hourlyDailyBreakdown[hour][dateKey]) {
          hourlyDailyBreakdown[hour][dateKey] = { orderCount: 0, totalSales: 0 };
        }
        hourlyDailyBreakdown[hour][dateKey].orderCount += 1;
        hourlyDailyBreakdown[hour][dateKey].totalSales += Number(order.totalAmount);
      });

      // Calculate derived metrics and find peak day for each hour
      Object.entries(hourlyStats).forEach(([hourKey, stats]) => {
        const hour = parseInt(hourKey);
        stats.averageOrderValue = stats.orderCount > 0
          ? stats.totalSales / stats.orderCount
          : 0;

        // Find peak day for this hour
        if (hourlyDailyBreakdown[hour]) {
          const days = Object.entries(hourlyDailyBreakdown[hour]);
          if (days.length > 0) {
            const peakDay = days.reduce((max, [date, data]) =>
              data.totalSales > (hourlyDailyBreakdown[hour][max[0]]?.totalSales || 0)
                ? [date, data]
                : max
            );
            stats.peakDay = peakDay[0];
          }
        }
      });

      const hourlyAnalysis = Object.values(hourlyStats);

      // Calculate summary
      const summary = {
        totalOrders: filteredOrders.length,
        totalSales: filteredOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
        totalItems: filteredOrders.reduce(
          (sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0),
          0
        ),
        averageOrderValue: 0,
        peakHour: null as { hour: number; hourLabel: string; orderCount: number; totalSales: number } | null,
        slowestHour: null as { hour: number; hourLabel: string; orderCount: number; totalSales: number } | null,
        busyHours: [] as number[], // Hours with above-average sales
        quietHours: [] as number[], // Hours with below-average sales
      };

      summary.averageOrderValue = summary.totalOrders > 0
        ? summary.totalSales / summary.totalOrders
        : 0;

      // Find peak and slowest hours
      const hoursWithSales = hourlyAnalysis.filter(h => h.orderCount > 0);
      if (hoursWithSales.length > 0) {
        const peakHourData = hoursWithSales.reduce((max, hour) =>
          hour.totalSales > max.totalSales ? hour : max
        );
        summary.peakHour = {
          hour: peakHourData.hour,
          hourLabel: peakHourData.hourLabel,
          orderCount: peakHourData.orderCount,
          totalSales: peakHourData.totalSales,
        };

        const slowestHourData = hoursWithSales.reduce((min, hour) =>
          hour.totalSales < min.totalSales ? hour : min
        );
        summary.slowestHour = {
          hour: slowestHourData.hour,
          hourLabel: slowestHourData.hourLabel,
          orderCount: slowestHourData.orderCount,
          totalSales: slowestHourData.totalSales,
        };

        // Calculate average sales per hour (only for hours with sales)
        const averageSalesPerHour = hoursWithSales.reduce((sum, h) => sum + h.totalSales, 0) / hoursWithSales.length;

        // Identify busy and quiet hours
        summary.busyHours = hoursWithSales
          .filter(h => h.totalSales > averageSalesPerHour)
          .map(h => h.hour)
          .sort((a, b) => a - b);

        summary.quietHours = hoursWithSales
          .filter(h => h.totalSales <= averageSalesPerHour)
          .map(h => h.hour)
          .sort((a, b) => a - b);
      }

      // Day of week breakdown
      const dayOfWeekBreakdown: {
        [key: number]: {
          dayOfWeek: number;
          dayName: string;
          orderCount: number;
          totalSales: number;
          averageOrderValue: number;
        };
      } = {};

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      // Initialize all days
      for (let i = 0; i < 7; i++) {
        dayOfWeekBreakdown[i] = {
          dayOfWeek: i,
          dayName: dayNames[i],
          orderCount: 0,
          totalSales: 0,
          averageOrderValue: 0,
        };
      }

      orders.forEach((order) => {
        const day = new Date(order.createdAt).getDay();
        dayOfWeekBreakdown[day].orderCount += 1;
        dayOfWeekBreakdown[day].totalSales += Number(order.totalAmount);
      });

      Object.values(dayOfWeekBreakdown).forEach((day) => {
        day.averageOrderValue = day.orderCount > 0
          ? day.totalSales / day.orderCount
          : 0;
      });

      return NextResponse.json({
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        ...(dayOfWeek !== null && {
          filterByDayOfWeek: {
            dayOfWeek,
            dayName: dayNames[dayOfWeek],
          },
        }),
        summary,
        hourlyAnalysis,
        dayOfWeekBreakdown: Object.values(dayOfWeekBreakdown),
      });
    } catch (error) {
      console.error("Failed to generate hourly sales report:", error);
      return NextResponse.json(
        { error: "Failed to generate hourly sales report" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.REPORT_SALES],
  }
);
