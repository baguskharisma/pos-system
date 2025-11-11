import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/public/orders/[id]
 * Get order details by ID (for customer order tracking)
 * No authentication required - customers should be able to track their orders
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 }
      );
    }

    // Fetch order with items and product details
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                imageUrl: true,
                category: {
                  select: {
                    name: true,
                    color: true,
                  },
                },
              },
            },
          },
        },
        cashier: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Transform order data for frontend
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      status: order.status,

      // Customer info
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      customerAddress: order.customerAddress,
      tableNumber: order.tableNumber,

      // Payment
      paymentMethod: order.paymentMethod,

      // Amounts
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      serviceCharge: Number(order.serviceCharge),
      deliveryFee: Number(order.deliveryFee),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),

      // Items
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discountAmount: Number(item.discountAmount),
        totalAmount: Number(item.totalAmount),
        notes: item.notes,
        product: item.product,
      })),

      // Notes
      notes: order.notes,

      // Timestamps
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() || null,
      preparingAt: order.preparingAt?.toISOString() || null,
      readyAt: order.readyAt?.toISOString() || null,
      completedAt: order.completedAt?.toISOString() || null,
      cancelledAt: order.cancelledAt?.toISOString() || null,
      estimatedReadyTime: order.estimatedReadyTime?.toISOString() || null,

      // Staff info (optional)
      cashier: order.cashier
        ? {
            name: order.cashier.name,
            email: order.cashier.email,
          }
        : null,
    };

    return NextResponse.json({
      data: transformedOrder,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}
