import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { startOfDay, endOfDay, subDays } from "date-fns";

/**
 * GET /api/analytics/customers
 * Get customer analytics including RFM analysis, lifetime value, segmentation
 * Requires: REPORT_SALES permission
 */
export const GET = withRBAC(
  async (request, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      const segment = searchParams.get("segment"); // "vip", "regular", "at-risk", "new"

      // Date range (default to last 90 days for better customer insights)
      const start = startDate
        ? startOfDay(new Date(startDate))
        : startOfDay(subDays(new Date(), 90));
      const end = endDate
        ? endOfDay(new Date(endDate))
        : endOfDay(new Date());

      // Get all orders with customer info
      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
          deletedAt: null,
          status: {
            in: ["PAID", "COMPLETED"],
          },
          OR: [
            { customerPhone: { not: null } },
            { customerEmail: { not: null } },
          ],
        },
        select: {
          id: true,
          customerName: true,
          customerPhone: true,
          customerEmail: true,
          totalAmount: true,
          createdAt: true,
          items: {
            select: {
              quantity: true,
              totalAmount: true,
              productName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Group orders by customer (using phone as unique identifier)
      const customerMap = new Map<
        string,
        {
          customerId: string;
          name: string;
          phone: string;
          email: string | null;
          orders: typeof orders;
          totalSpent: number;
          orderCount: number;
          lastOrderDate: Date;
          firstOrderDate: Date;
          averageOrderValue: number;
          totalItems: number;
        }
      >();

      orders.forEach((order) => {
        const customerId = order.customerPhone || order.customerEmail || "guest";
        if (customerId === "guest") return;

        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            customerId,
            name: order.customerName || "Unknown",
            phone: order.customerPhone || "",
            email: order.customerEmail || null,
            orders: [],
            totalSpent: 0,
            orderCount: 0,
            lastOrderDate: order.createdAt,
            firstOrderDate: order.createdAt,
            averageOrderValue: 0,
            totalItems: 0,
          });
        }

        const customer = customerMap.get(customerId)!;
        customer.orders.push(order);
        customer.totalSpent += Number(order.totalAmount);
        customer.orderCount += 1;
        customer.totalItems += order.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        if (order.createdAt > customer.lastOrderDate) {
          customer.lastOrderDate = order.createdAt;
        }
        if (order.createdAt < customer.firstOrderDate) {
          customer.firstOrderDate = order.createdAt;
        }
      });

      // Calculate RFM scores and segments for each customer
      const now = new Date();
      const customers = Array.from(customerMap.values()).map((customer) => {
        customer.averageOrderValue =
          customer.orderCount > 0 ? customer.totalSpent / customer.orderCount : 0;

        // Calculate Recency (days since last purchase)
        const recencyDays = Math.floor(
          (now.getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Calculate Frequency (order count)
        const frequency = customer.orderCount;

        // Calculate Monetary (total spent)
        const monetary = customer.totalSpent;

        // Calculate customer lifetime (days)
        const lifetimeDays = Math.floor(
          (customer.lastOrderDate.getTime() - customer.firstOrderDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        // Simple RFM scoring (1-5 scale)
        const recencyScore =
          recencyDays <= 7 ? 5 : recencyDays <= 14 ? 4 : recencyDays <= 30 ? 3 : recencyDays <= 60 ? 2 : 1;
        const frequencyScore =
          frequency >= 10 ? 5 : frequency >= 7 ? 4 : frequency >= 5 ? 3 : frequency >= 3 ? 2 : 1;
        const monetaryScore =
          monetary >= 1000000
            ? 5
            : monetary >= 500000
            ? 4
            : monetary >= 200000
            ? 3
            : monetary >= 100000
            ? 2
            : 1;

        const rfmScore = recencyScore + frequencyScore + monetaryScore;

        // Segment customers based on RFM
        let customerSegment:
          | "vip"
          | "loyal"
          | "potential"
          | "at-risk"
          | "new"
          | "lost";

        if (rfmScore >= 13) {
          customerSegment = "vip"; // High R, F, M
        } else if (frequencyScore >= 4 && monetaryScore >= 4) {
          customerSegment = "loyal"; // High F, M but lower R
        } else if (recencyScore >= 4 && frequencyScore <= 2) {
          customerSegment = "new"; // Recent but few orders
        } else if (recencyScore <= 2 && frequencyScore >= 3) {
          customerSegment = "at-risk"; // Haven't ordered recently but used to
        } else if (recencyScore <= 2 && frequencyScore <= 2) {
          customerSegment = "lost"; // Haven't ordered recently and low frequency
        } else {
          customerSegment = "potential"; // Middle ground
        }

        // Calculate favorite products
        const productFrequency = new Map<string, number>();
        customer.orders.forEach((order) => {
          order.items.forEach((item) => {
            productFrequency.set(
              item.productName,
              (productFrequency.get(item.productName) || 0) + item.quantity
            );
          });
        });

        const favoriteProducts = Array.from(productFrequency.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

        return {
          customerId: customer.customerId,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          metrics: {
            totalOrders: customer.orderCount,
            totalSpent: customer.totalSpent,
            averageOrderValue: customer.averageOrderValue,
            totalItems: customer.totalItems,
            lifetimeValue: customer.totalSpent,
            lifetimeDays,
          },
          rfm: {
            recency: {
              days: recencyDays,
              score: recencyScore,
            },
            frequency: {
              orders: frequency,
              score: frequencyScore,
            },
            monetary: {
              value: monetary,
              score: monetaryScore,
            },
            totalScore: rfmScore,
          },
          segment: customerSegment,
          firstOrderDate: customer.firstOrderDate,
          lastOrderDate: customer.lastOrderDate,
          favoriteProducts,
        };
      });

      // Filter by segment if specified
      const filteredCustomers = segment
        ? customers.filter((c) => c.segment === segment)
        : customers;

      // Sort by lifetime value (descending)
      filteredCustomers.sort(
        (a, b) => b.metrics.lifetimeValue - a.metrics.lifetimeValue
      );

      // Calculate summary statistics
      const summary = {
        totalCustomers: customers.length,
        segments: {
          vip: customers.filter((c) => c.segment === "vip").length,
          loyal: customers.filter((c) => c.segment === "loyal").length,
          potential: customers.filter((c) => c.segment === "potential").length,
          atRisk: customers.filter((c) => c.segment === "at-risk").length,
          new: customers.filter((c) => c.segment === "new").length,
          lost: customers.filter((c) => c.segment === "lost").length,
        },
        metrics: {
          totalRevenue: customers.reduce((sum, c) => sum + c.metrics.totalSpent, 0),
          averageLifetimeValue:
            customers.length > 0
              ? customers.reduce((sum, c) => sum + c.metrics.lifetimeValue, 0) /
                customers.length
              : 0,
          averageOrderValue:
            customers.length > 0
              ? customers.reduce((sum, c) => sum + c.metrics.averageOrderValue, 0) /
                customers.length
              : 0,
          averageOrdersPerCustomer:
            customers.length > 0
              ? customers.reduce((sum, c) => sum + c.metrics.totalOrders, 0) /
                customers.length
              : 0,
        },
        topCustomers: customers.slice(0, 10).map((c) => ({
          name: c.name,
          phone: c.phone,
          lifetimeValue: c.metrics.lifetimeValue,
          totalOrders: c.metrics.totalOrders,
          segment: c.segment,
        })),
      };

      return NextResponse.json({
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        summary,
        customers: filteredCustomers,
      });
    } catch (error) {
      console.error("Failed to get customer analytics:", error);
      return NextResponse.json(
        { error: "Failed to get customer analytics" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.REPORT_SALES],
  }
);
