import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

/**
 * GET /api/reports/daily
 * Get daily sales report
 * Requires: REPORT_SALES permission
 *
 * Query params:
 * - startDate: ISO date string (default: 7 days ago)
 * - endDate: ISO date string (default: today)
 * - cashierId: Filter by specific cashier (admin only)
 */
export const GET = withRBAC(
  async (request, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      const cashierId = searchParams.get("cashierId");

      // Date range (default to last 7 days)
      const start = startDate
        ? startOfDay(new Date(startDate))
        : startOfDay(subDays(new Date(), 7));
      const end = endDate
        ? endOfDay(new Date(endDate))
        : endOfDay(new Date());

      // Build base where clause
      const baseWhere: any = {
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

      // Group orders by day
      const dailyData: { [key: string]: {
        date: string;
        totalOrders: number;
        totalSales: number;
        totalItems: number;
        totalDiscount: number;
        totalTax: number;
        averageOrderValue: number;
        ordersByType: { [key: string]: number };
        paymentMethods: { [key: string]: number };
      }} = {};

      orders.forEach((order) => {
        const dateKey = format(new Date(order.createdAt), "yyyy-MM-dd");

        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            date: dateKey,
            totalOrders: 0,
            totalSales: 0,
            totalItems: 0,
            totalDiscount: 0,
            totalTax: 0,
            averageOrderValue: 0,
            ordersByType: {},
            paymentMethods: {},
          };
        }

        const day = dailyData[dateKey];
        day.totalOrders += 1;
        day.totalSales += Number(order.totalAmount);
        day.totalDiscount += Number(order.discountAmount);
        day.totalTax += Number(order.taxAmount);
        day.totalItems += order.items.reduce((sum, item) => sum + item.quantity, 0);

        // Count by order type
        day.ordersByType[order.orderType] = (day.ordersByType[order.orderType] || 0) + 1;

        // Count by payment method
        order.payments.forEach((payment) => {
          const method = payment.paymentMethod;
          day.paymentMethods[method] = (day.paymentMethods[method] || 0) + Number(payment.amount);
        });
      });

      // Calculate averages
      Object.values(dailyData).forEach((day) => {
        day.averageOrderValue = day.totalOrders > 0 ? day.totalSales / day.totalOrders : 0;
      });

      // Sort by date
      const dailyReport = Object.values(dailyData).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      // Calculate overall summary
      const summary = {
        totalDays: dailyReport.length,
        totalOrders: dailyReport.reduce((sum, day) => sum + day.totalOrders, 0),
        totalSales: dailyReport.reduce((sum, day) => sum + day.totalSales, 0),
        totalItems: dailyReport.reduce((sum, day) => sum + day.totalItems, 0),
        totalDiscount: dailyReport.reduce((sum, day) => sum + day.totalDiscount, 0),
        totalTax: dailyReport.reduce((sum, day) => sum + day.totalTax, 0),
        averageDailySales: 0,
        averageOrderValue: 0,
      };

      summary.averageDailySales = summary.totalDays > 0
        ? summary.totalSales / summary.totalDays
        : 0;
      summary.averageOrderValue = summary.totalOrders > 0
        ? summary.totalSales / summary.totalOrders
        : 0;

      return NextResponse.json({
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        summary,
        dailyReport,
      });
    } catch (error) {
      console.error("Failed to generate daily report:", error);
      return NextResponse.json(
        { error: "Failed to generate daily report" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.REPORT_SALES],
  }
);
