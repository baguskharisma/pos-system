import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, format, getMonth, getYear } from "date-fns";

/**
 * GET /api/reports/monthly
 * Get monthly sales report
 * Requires: REPORT_SALES permission
 *
 * Query params:
 * - months: Number of months to include (default: 12)
 * - cashierId: Filter by specific cashier (admin only)
 */
export const GET = withRBAC(
  async (request, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const monthsParam = searchParams.get("months");
      const cashierId = searchParams.get("cashierId");

      const months = monthsParam ? parseInt(monthsParam) : 12;

      // Calculate date range
      const now = new Date();
      const end = endOfMonth(now);
      const start = startOfMonth(subMonths(now, months - 1));

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
          orderSource: true,
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

      // Group orders by month
      const monthlyData: { [key: string]: {
        month: number;
        year: number;
        monthLabel: string;
        startDate: string;
        endDate: string;
        totalOrders: number;
        totalSales: number;
        totalItems: number;
        totalDiscount: number;
        totalTax: number;
        netSales: number;
        averageOrderValue: number;
        ordersByType: { [key: string]: number };
        ordersBySource: { [key: string]: number };
        paymentMethods: { [key: string]: { count: number; amount: number } };
        topProducts: { [key: string]: { quantity: number; revenue: number } };
        dailyAverage: number;
      }} = {};

      orders.forEach((order) => {
        const orderDate = new Date(order.createdAt);
        const monthNum = getMonth(orderDate) + 1; // 1-based month
        const yearNum = getYear(orderDate);
        const monthKey = `${yearNum}-${monthNum.toString().padStart(2, '0')}`;

        if (!monthlyData[monthKey]) {
          const monthStart = startOfMonth(orderDate);
          const monthEnd = endOfMonth(orderDate);

          monthlyData[monthKey] = {
            month: monthNum,
            year: yearNum,
            monthLabel: format(orderDate, "MMMM yyyy"),
            startDate: format(monthStart, "yyyy-MM-dd"),
            endDate: format(monthEnd, "yyyy-MM-dd"),
            totalOrders: 0,
            totalSales: 0,
            totalItems: 0,
            totalDiscount: 0,
            totalTax: 0,
            netSales: 0,
            averageOrderValue: 0,
            ordersByType: {},
            ordersBySource: {},
            paymentMethods: {},
            topProducts: {},
            dailyAverage: 0,
          };
        }

        const month = monthlyData[monthKey];
        month.totalOrders += 1;
        month.totalSales += Number(order.totalAmount);
        month.totalDiscount += Number(order.discountAmount);
        month.totalTax += Number(order.taxAmount);
        month.totalItems += order.items.reduce((sum, item) => sum + item.quantity, 0);

        // Count by order type
        month.ordersByType[order.orderType] = (month.ordersByType[order.orderType] || 0) + 1;

        // Count by order source
        month.ordersBySource[order.orderSource] = (month.ordersBySource[order.orderSource] || 0) + 1;

        // Count by payment method
        order.payments.forEach((payment) => {
          const method = payment.paymentMethod;
          if (!month.paymentMethods[method]) {
            month.paymentMethods[method] = { count: 0, amount: 0 };
          }
          month.paymentMethods[method].count += 1;
          month.paymentMethods[method].amount += Number(payment.amount);
        });

        // Track top products
        order.items.forEach((item) => {
          if (!month.topProducts[item.productName]) {
            month.topProducts[item.productName] = { quantity: 0, revenue: 0 };
          }
          month.topProducts[item.productName].quantity += item.quantity;
          month.topProducts[item.productName].revenue += Number(item.totalAmount);
        });
      });

      // Calculate derived metrics and format data
      const monthlyReport = Object.values(monthlyData).map((month) => {
        month.netSales = month.totalSales - month.totalDiscount;
        month.averageOrderValue = month.totalOrders > 0 ? month.totalSales / month.totalOrders : 0;

        // Calculate daily average (assuming current month might not be complete)
        const monthStart = new Date(`${month.year}-${month.month.toString().padStart(2, '0')}-01`);
        const monthEnd = endOfMonth(monthStart);
        const daysInMonth = monthEnd.getDate();
        const currentDate = new Date();

        // If it's the current month, only count days passed so far
        const daysToCount = month.year === currentDate.getFullYear() && month.month === (currentDate.getMonth() + 1)
          ? currentDate.getDate()
          : daysInMonth;

        month.dailyAverage = daysToCount > 0 ? month.totalSales / daysToCount : 0;

        // Get top 10 products for the month
        const topProductsList = Object.entries(month.topProducts)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);

        return {
          ...month,
          topProducts: topProductsList,
        };
      }).sort((a, b) => {
        const aKey = `${a.year}-${a.month.toString().padStart(2, '0')}`;
        const bKey = `${b.year}-${b.month.toString().padStart(2, '0')}`;
        return aKey.localeCompare(bKey);
      });

      // Calculate overall summary
      const summary = {
        totalMonths: monthlyReport.length,
        totalOrders: monthlyReport.reduce((sum, month) => sum + month.totalOrders, 0),
        totalSales: monthlyReport.reduce((sum, month) => sum + month.totalSales, 0),
        totalItems: monthlyReport.reduce((sum, month) => sum + month.totalItems, 0),
        totalDiscount: monthlyReport.reduce((sum, month) => sum + month.totalDiscount, 0),
        totalTax: monthlyReport.reduce((sum, month) => sum + month.totalTax, 0),
        netSales: 0,
        averageMonthlySales: 0,
        averageOrderValue: 0,
        growthRate: 0,
      };

      summary.netSales = summary.totalSales - summary.totalDiscount;
      summary.averageMonthlySales = summary.totalMonths > 0
        ? summary.totalSales / summary.totalMonths
        : 0;
      summary.averageOrderValue = summary.totalOrders > 0
        ? summary.totalSales / summary.totalOrders
        : 0;

      // Calculate growth rate (comparing latest month vs previous month)
      if (monthlyReport.length >= 2) {
        const latestMonth = monthlyReport[monthlyReport.length - 1];
        const previousMonth = monthlyReport[monthlyReport.length - 2];
        if (previousMonth.totalSales > 0) {
          summary.growthRate = ((latestMonth.totalSales - previousMonth.totalSales) / previousMonth.totalSales) * 100;
        }
      }

      return NextResponse.json({
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        summary,
        monthlyReport,
      });
    } catch (error) {
      console.error("Failed to generate monthly report:", error);
      return NextResponse.json(
        { error: "Failed to generate monthly report" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.REPORT_SALES],
  }
);
