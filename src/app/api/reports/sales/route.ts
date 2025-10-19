import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { startOfDay, endOfDay, subDays } from "date-fns";

/**
 * GET /api/reports/sales
 * Get sales report
 * Requires: REPORT_SALES permission
 *
 * Access levels:
 * - CASHIER: Can only see their own sales
 * - ADMIN/SUPER_ADMIN: Can see all sales
 */
export const GET = withRBAC(
  async (request, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      const cashierId = searchParams.get("cashierId");

      // Date range (default to last 30 days)
      const start = startDate
        ? new Date(startDate)
        : startOfDay(subDays(new Date(), 30));
      const end = endDate ? new Date(endDate) : endOfDay(new Date());

      // Build where clause
      const where: any = {
        createdAt: {
          gte: start,
          lte: end,
        },
        deletedAt: null,
        status: {
          in: ["PAID", "COMPLETED"],
        },
      };

      // Role-based filtering
      // Cashiers can only see their own sales
      if (context.role === "CASHIER") {
        where.cashierId = context.userId;
      }
      // Admins can filter by specific cashier if provided
      else if (cashierId) {
        where.cashierId = cashierId;
      }

      // Get orders
      const orders = await prisma.order.findMany({
        where,
        include: {
          cashier: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            select: {
              id: true,
              productName: true,
              quantity: true,
              unitPrice: true,
              totalAmount: true,
            },
          },
          payments: {
            select: {
              id: true,
              paymentMethod: true,
              amount: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Calculate statistics
      const totalSales = orders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0
      );

      const totalOrders = orders.length;

      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Sales by payment method
      const salesByPaymentMethod = orders.reduce((acc: any, order) => {
        order.payments.forEach((payment) => {
          const method = payment.paymentMethod;
          if (!acc[method]) {
            acc[method] = { count: 0, total: 0 };
          }
          acc[method].count += 1;
          acc[method].total += Number(payment.amount);
        });
        return acc;
      }, {});

      // Sales by order type
      const salesByOrderType = orders.reduce((acc: any, order) => {
        const type = order.orderType;
        if (!acc[type]) {
          acc[type] = { count: 0, total: 0 };
        }
        acc[type].count += 1;
        acc[type].total += Number(order.totalAmount);
        return acc;
      }, {});

      // Top selling products
      const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};

      orders.forEach((order) => {
        order.items.forEach((item) => {
          if (!productSales[item.productName]) {
            productSales[item.productName] = {
              name: item.productName,
              quantity: 0,
              revenue: 0,
            };
          }
          productSales[item.productName].quantity += item.quantity;
          productSales[item.productName].revenue += Number(item.totalAmount);
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Sales by cashier (only for admins)
      let salesByCashier = null;
      if (context.role !== "CASHIER") {
        salesByCashier = orders.reduce((acc: any, order) => {
          const cashier = order.cashier;
          if (cashier) {
            if (!acc[cashier.id]) {
              acc[cashier.id] = {
                id: cashier.id,
                name: cashier.name,
                email: cashier.email,
                orderCount: 0,
                totalSales: 0,
              };
            }
            acc[cashier.id].orderCount += 1;
            acc[cashier.id].totalSales += Number(order.totalAmount);
          }
          return acc;
        }, {});

        salesByCashier = Object.values(salesByCashier);
      }

      return NextResponse.json({
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        summary: {
          totalSales,
          totalOrders,
          averageOrderValue,
        },
        salesByPaymentMethod,
        salesByOrderType,
        topProducts,
        ...(salesByCashier && { salesByCashier }),
        orders: orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          orderType: order.orderType,
          createdAt: order.createdAt,
          cashier: order.cashier,
          itemCount: order.items.length,
        })),
      });
    } catch (error) {
      console.error("Failed to generate sales report:", error);
      return NextResponse.json(
        { error: "Failed to generate sales report" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.REPORT_SALES],
  }
);
