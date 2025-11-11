import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { startOfWeek, endOfWeek, startOfDay, endOfDay, subWeeks, format, getISOWeek, getYear } from "date-fns";

/**
 * GET /api/reports/weekly
 * Get weekly sales report
 * Requires: REPORT_SALES permission
 *
 * Query params:
 * - weeks: Number of weeks to include (default: 8)
 * - cashierId: Filter by specific cashier (admin only)
 */
export const GET = withRBAC(
  async (request, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const weeksParam = searchParams.get("weeks");
      const cashierId = searchParams.get("cashierId");

      const weeks = weeksParam ? parseInt(weeksParam) : 8;

      // Calculate date range
      const end = endOfDay(new Date());
      const start = startOfDay(subWeeks(end, weeks - 1));
      const startWeek = startOfWeek(start, { weekStartsOn: 1 }); // Monday

      // Build base where clause
      const baseWhere: any = {
        createdAt: {
          gte: startWeek,
          lte: end,
        },
        deletedAt: null,
        status: {
          in: ["PAID", "COMPLETED"],
          notIn: ["CANCELLED"], // Exclude cancelled orders from revenue
        },
      };

      // Role-based filtering
      if (context.role === "CASHIER") {
        baseWhere.cashierId = context.userId;
      } else if (cashierId) {
        baseWhere.cashierId = cashierId;
      }

      // Get all orders in the date range
      const orders = await prisma.order.findMany({
        where: baseWhere,
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          subtotal: true,
          taxAmount: true,
          discountAmount: true,
          createdAt: true,
          orderType: true,
          status: true,
          items: {
            select: {
              quantity: true,
              totalAmount: true,
              productName: true,
            },
          },
          payments: {
            select: {
              paymentMethod: true,
              amount: true,
            },
          },
        },
      });

      // Group orders by week
      const weeklyData: { [key: string]: {
        week: number;
        year: number;
        weekLabel: string;
        startDate: string;
        endDate: string;
        totalOrders: number;
        totalSales: number;
        totalItems: number;
        totalDiscount: number;
        totalTax: number;
        averageOrderValue: number;
        ordersByType: { [key: string]: number };
        topProducts: { [key: string]: { quantity: number; revenue: number } };
      }} = {};

      orders.forEach((order) => {
        const orderDate = new Date(order.createdAt);
        const weekNum = getISOWeek(orderDate);
        const yearNum = getYear(orderDate);
        const weekKey = `${yearNum}-W${weekNum.toString().padStart(2, '0')}`;

        if (!weeklyData[weekKey]) {
          const weekStart = startOfWeek(orderDate, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(orderDate, { weekStartsOn: 1 });

          weeklyData[weekKey] = {
            week: weekNum,
            year: yearNum,
            weekLabel: weekKey,
            startDate: format(weekStart, "yyyy-MM-dd"),
            endDate: format(weekEnd, "yyyy-MM-dd"),
            totalOrders: 0,
            totalSales: 0,
            totalItems: 0,
            totalDiscount: 0,
            totalTax: 0,
            averageOrderValue: 0,
            ordersByType: {},
            topProducts: {},
          };
        }

        const week = weeklyData[weekKey];
        week.totalOrders += 1;
        week.totalSales += Number(order.totalAmount);
        week.totalDiscount += Number(order.discountAmount);
        week.totalTax += Number(order.taxAmount);
        week.totalItems += order.items.reduce((sum, item) => sum + item.quantity, 0);

        // Count by order type
        week.ordersByType[order.orderType] = (week.ordersByType[order.orderType] || 0) + 1;

        // Track top products
        order.items.forEach((item) => {
          if (!week.topProducts[item.productName]) {
            week.topProducts[item.productName] = { quantity: 0, revenue: 0 };
          }
          week.topProducts[item.productName].quantity += item.quantity;
          week.topProducts[item.productName].revenue += Number(item.totalAmount);
        });
      });

      // Calculate averages and format top products
      const weeklyReport = Object.values(weeklyData).map((week) => {
        week.averageOrderValue = week.totalOrders > 0 ? week.totalSales / week.totalOrders : 0;

        // Get top 5 products for the week
        const topProductsList = Object.entries(week.topProducts)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        return {
          ...week,
          topProducts: topProductsList,
        };
      }).sort((a, b) => a.weekLabel.localeCompare(b.weekLabel));

      // Calculate overall summary
      const summary = {
        totalWeeks: weeklyReport.length,
        totalOrders: weeklyReport.reduce((sum, week) => sum + week.totalOrders, 0),
        totalSales: weeklyReport.reduce((sum, week) => sum + week.totalSales, 0),
        totalItems: weeklyReport.reduce((sum, week) => sum + week.totalItems, 0),
        totalDiscount: weeklyReport.reduce((sum, week) => sum + week.totalDiscount, 0),
        totalTax: weeklyReport.reduce((sum, week) => sum + week.totalTax, 0),
        averageWeeklySales: 0,
        averageOrderValue: 0,
      };

      summary.averageWeeklySales = summary.totalWeeks > 0
        ? summary.totalSales / summary.totalWeeks
        : 0;
      summary.averageOrderValue = summary.totalOrders > 0
        ? summary.totalSales / summary.totalOrders
        : 0;

      return NextResponse.json({
        dateRange: {
          start: startWeek.toISOString(),
          end: end.toISOString(),
        },
        summary,
        weeklyReport,
      });
    } catch (error) {
      console.error("Failed to generate weekly report:", error);
      return NextResponse.json(
        { error: "Failed to generate weekly report" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.REPORT_SALES],
  }
);
