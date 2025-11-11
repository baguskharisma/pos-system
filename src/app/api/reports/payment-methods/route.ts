import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

/**
 * GET /api/reports/payment-methods
 * Get payment method breakdown and analysis
 * Requires: REPORT_SALES permission
 *
 * Query params:
 * - startDate: ISO date string (default: 30 days ago)
 * - endDate: ISO date string (default: today)
 * - groupBy: 'day' | 'week' | 'month' (optional, for trend analysis)
 */
export const GET = withRBAC(
  async (request, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      const groupBy = searchParams.get("groupBy") as 'day' | 'week' | 'month' | null;

      // Date range (default to last 30 days)
      const start = startDate
        ? startOfDay(new Date(startDate))
        : startOfDay(subDays(new Date(), 30));
      const end = endDate
        ? endOfDay(new Date(endDate))
        : endOfDay(new Date());

      // Get all payments in the date range
      const payments = await prisma.payment.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
          status: "COMPLETED",
          order: {
            deletedAt: null,
            status: {
              in: ["PAID", "COMPLETED"],
              notIn: ["CANCELLED"], // Exclude cancelled orders from revenue
            },
          },
        },
        select: {
          id: true,
          paymentMethod: true,
          amount: true,
          createdAt: true,
          transactionType: true,
          order: {
            select: {
              id: true,
              orderType: true,
              totalAmount: true,
            },
          },
        },
      });

      // Aggregate by payment method
      const methodStats: {
        [key: string]: {
          paymentMethod: string;
          transactionCount: number;
          totalAmount: number;
          averageTransactionValue: number;
          percentageOfTotal: number;
          orderCount: number;
          refundCount: number;
          refundAmount: number;
          netAmount: number;
          orderTypes: { [key: string]: number };
        };
      } = {};

      let totalAmount = 0;
      const uniqueOrders: { [key: string]: Set<string> } = {};

      payments.forEach((payment) => {
        const method = payment.paymentMethod;

        if (!methodStats[method]) {
          methodStats[method] = {
            paymentMethod: method,
            transactionCount: 0,
            totalAmount: 0,
            averageTransactionValue: 0,
            percentageOfTotal: 0,
            orderCount: 0,
            refundCount: 0,
            refundAmount: 0,
            netAmount: 0,
            orderTypes: {},
          };
        }

        if (!uniqueOrders[method]) {
          uniqueOrders[method] = new Set();
        }

        const stats = methodStats[method];
        stats.transactionCount += 1;

        if (payment.transactionType === "REFUND" || payment.transactionType === "PARTIAL_REFUND") {
          stats.refundCount += 1;
          stats.refundAmount += Number(payment.amount);
        } else {
          stats.totalAmount += Number(payment.amount);
          totalAmount += Number(payment.amount);
        }

        // Track unique orders
        uniqueOrders[method].add(payment.order.id);

        // Track order types
        const orderType = payment.order.orderType;
        stats.orderTypes[orderType] = (stats.orderTypes[orderType] || 0) + 1;
      });

      // Calculate derived metrics
      Object.entries(methodStats).forEach(([method, stats]) => {
        stats.orderCount = uniqueOrders[method]?.size || 0;
        stats.netAmount = stats.totalAmount - stats.refundAmount;
        stats.averageTransactionValue = stats.transactionCount > 0
          ? stats.totalAmount / stats.transactionCount
          : 0;
        stats.percentageOfTotal = totalAmount > 0
          ? (stats.totalAmount / totalAmount) * 100
          : 0;
      });

      // Sort by total amount (descending)
      const paymentMethodBreakdown = Object.values(methodStats).sort(
        (a, b) => b.totalAmount - a.totalAmount
      );

      // Calculate summary
      const summary = {
        totalPaymentMethods: paymentMethodBreakdown.length,
        totalTransactions: payments.length,
        totalAmount,
        totalRefunds: paymentMethodBreakdown.reduce((sum, m) => sum + m.refundAmount, 0),
        totalRefundCount: paymentMethodBreakdown.reduce((sum, m) => sum + m.refundCount, 0),
        netAmount: 0,
        mostPopularMethod: paymentMethodBreakdown.length > 0 ? {
          method: paymentMethodBreakdown[0].paymentMethod,
          amount: paymentMethodBreakdown[0].totalAmount,
          percentage: paymentMethodBreakdown[0].percentageOfTotal,
          transactionCount: paymentMethodBreakdown[0].transactionCount,
        } : null,
      };

      summary.netAmount = summary.totalAmount - summary.totalRefunds;

      // Trend analysis (if groupBy is specified)
      let trendData = null;
      if (groupBy) {
        const trends: {
          [key: string]: {
            period: string;
            paymentMethods: { [key: string]: { count: number; amount: number } };
          };
        } = {};

        payments.forEach((payment) => {
          if (payment.transactionType === "REFUND" || payment.transactionType === "PARTIAL_REFUND") {
            return; // Skip refunds in trend analysis
          }

          let periodKey: string;
          const paymentDate = new Date(payment.createdAt);

          switch (groupBy) {
            case 'day':
              periodKey = format(paymentDate, "yyyy-MM-dd");
              break;
            case 'week':
              periodKey = format(paymentDate, "yyyy-'W'II");
              break;
            case 'month':
              periodKey = format(paymentDate, "yyyy-MM");
              break;
            default:
              periodKey = format(paymentDate, "yyyy-MM-dd");
          }

          if (!trends[periodKey]) {
            trends[periodKey] = {
              period: periodKey,
              paymentMethods: {},
            };
          }

          const method = payment.paymentMethod;
          if (!trends[periodKey].paymentMethods[method]) {
            trends[periodKey].paymentMethods[method] = { count: 0, amount: 0 };
          }

          trends[periodKey].paymentMethods[method].count += 1;
          trends[periodKey].paymentMethods[method].amount += Number(payment.amount);
        });

        trendData = Object.values(trends).sort((a, b) => a.period.localeCompare(b.period));
      }

      // Calculate comparison with previous period
      const periodDuration = end.getTime() - start.getTime();
      const previousStart = new Date(start.getTime() - periodDuration);
      const previousEnd = new Date(start.getTime());

      const previousPayments = await prisma.payment.findMany({
        where: {
          createdAt: {
            gte: previousStart,
            lte: previousEnd,
          },
          status: "COMPLETED",
          transactionType: "PAYMENT",
          order: {
            deletedAt: null,
            status: {
              in: ["PAID", "COMPLETED"],
            },
          },
        },
        select: {
          paymentMethod: true,
          amount: true,
        },
      });

      const previousMethodTotals: { [key: string]: number } = {};
      previousPayments.forEach((payment) => {
        const method = payment.paymentMethod;
        previousMethodTotals[method] = (previousMethodTotals[method] || 0) + Number(payment.amount);
      });

      // Add growth rate to each payment method
      const paymentMethodBreakdownWithGrowth = paymentMethodBreakdown.map((method) => {
        const previousAmount = previousMethodTotals[method.paymentMethod] || 0;
        const growthRate = previousAmount > 0
          ? ((method.totalAmount - previousAmount) / previousAmount) * 100
          : method.totalAmount > 0 ? 100 : 0;

        return {
          ...method,
          previousPeriodAmount: previousAmount,
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
        paymentMethodBreakdown: paymentMethodBreakdownWithGrowth,
        ...(trendData && { trends: trendData }),
      });
    } catch (error) {
      console.error("Failed to generate payment methods report:", error);
      return NextResponse.json(
        { error: "Failed to generate payment methods report" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.REPORT_SALES],
  }
);
