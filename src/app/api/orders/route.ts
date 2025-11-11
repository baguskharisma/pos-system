import { NextRequest, NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validations/orders";
import type { RBACContext } from "@/types";
import { handleOrderCreatedNotifications } from "@/lib/websocket/order-notifications";
import { checkAndEmitInventoryAlerts } from "@/lib/websocket/inventory-notifications";

/**
 * GET /api/orders
 * Get all orders with pagination and filtering
 * Accessible by: CASHIER, ADMIN, SUPER_ADMIN
 */
export const GET = withRBAC(
  async (
    request: NextRequest,
    context: RBACContext
  ) => {
    try {
      const { searchParams } = new URL(request.url);

      // Pagination
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "50");
      const skip = (page - 1) * limit;

      // Filtering
      const status = searchParams.get("status");
      const orderType = searchParams.get("orderType");
      const orderSource = searchParams.get("orderSource");
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

      // Build where clause
      const where: any = {
        deletedAt: null, // Exclude soft-deleted orders
      };

      if (status) where.status = status;
      if (orderType) where.orderType = orderType;
      if (orderSource) where.orderSource = orderSource;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      // Fetch orders
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    sku: true,
                    imageUrl: true,
                  },
                },
              },
            },
            cashier: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
        prisma.order.count({ where }),
      ]);

      return NextResponse.json({
        data: orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.ORDER_VIEW],
  }
);

/**
 * POST /api/orders
 * Create a new order (from POS or other sources)
 * Accessible by: CASHIER, ADMIN, SUPER_ADMIN
 */
export const POST = withRBAC(
  async (
    request: NextRequest,
    context: RBACContext
  ) => {
    try {
      const body = await request.json();

      // Validate request body
      const validationResult = createOrderSchema.safeParse(body);
      if (!validationResult.success) {
        console.error("Order validation failed:");
        console.error(JSON.stringify(validationResult.error.format(), null, 2));
        console.error("Received body:", JSON.stringify(body, null, 2));
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationResult.error.errors,
          },
          { status: 400 }
        );
      }

      const data = validationResult.data;

      // Check if order number already exists
      const existingOrder = await prisma.order.findUnique({
        where: { orderNumber: data.orderNumber },
      });

      if (existingOrder) {
        return NextResponse.json(
          { error: "Order number already exists" },
          { status: 409 }
        );
      }

      // Verify all products exist and have enough stock
      const productIds = data.items.map((item) => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          costPrice: true,
          trackInventory: true,
          quantity: true,
          isAvailable: true,
        },
      });

      // Create a map for quick lookup
      const productMap = new Map(products.map((p) => [p.id, p]));

      // Validate each item
      for (const item of data.items) {
        const product = productMap.get(item.productId);

        if (!product) {
          return NextResponse.json(
            { error: `Product not found: ${item.productName}` },
            { status: 404 }
          );
        }

        if (!product.isAvailable) {
          return NextResponse.json(
            { error: `Product not available: ${product.name}` },
            { status: 400 }
          );
        }

        if (product.trackInventory && product.quantity < item.quantity) {
          return NextResponse.json(
            {
              error: `Insufficient stock for ${product.name}`,
              details: [`Available: ${product.quantity}, Requested: ${item.quantity}`],
            },
            { status: 400 }
          );
        }
      }

      // Payment method is already mapped from frontend, use as-is
      const mappedPaymentMethod = data.paymentMethod;

      // Create order with items in a transaction
      const order = await prisma.$transaction(async (tx) => {
        // Create the order
        const newOrder = await tx.order.create({
          data: {
            orderNumber: data.orderNumber,
            orderType: data.orderType,
            orderSource: data.orderSource || "CASHIER",
            status: "PAID", // POS orders are immediately paid

            // Customer info
            customerName: data.customerName || null,
            customerPhone: data.customerPhone || null,
            customerEmail: data.customerEmail || null,
            customerAddress: data.customerAddress || null,
            tableNumber: data.tableNumber || null,

            // Amounts
            subtotal: data.subtotal,
            discountAmount: data.discountAmount || 0,
            discountType: data.discountType || null,
            discountPercentage: data.discountPercentage || null,
            taxAmount: data.taxAmount || 0,
            taxRate: data.taxRate || null,
            taxType: data.taxType || "INCLUSIVE",
            serviceCharge: data.serviceCharge || 0,
            deliveryFee: data.deliveryFee || 0,
            totalAmount: data.totalAmount,

            // Payment info
            paymentMethod: mappedPaymentMethod as any,
            paidAmount: data.paidAmount,
            changeAmount: data.changeAmount || 0,
            paidAt: new Date(),

            // Notes
            notes: data.notes || null,
            internalNotes: data.internalNotes || null,

            // Cashier
            cashierId: context.userId,

            // Timestamps
            completedAt: new Date(),
          },
        });

        // Create order items
        const orderItems = data.items.map((item) => {
          const product = productMap.get(item.productId)!;
          return {
            orderId: newOrder.id,
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice || product.costPrice || null,
            discountAmount: item.discountAmount || 0,
            discountPercent: item.discountPercent || null,
            subtotal: item.subtotal,
            taxAmount: item.taxAmount || 0,
            totalAmount: item.totalAmount,
            notes: item.notes || null,
          };
        });

        await tx.orderItem.createMany({
          data: orderItems,
        });

        // Update product inventory and create logs
        for (const item of data.items) {
          const product = productMap.get(item.productId)!;

          if (product.trackInventory) {
            const previousStock = product.quantity;
            const newStock = Math.max(0, product.quantity - item.quantity);

            // Update product quantity
            await tx.product.update({
              where: { id: item.productId },
              data: {
                quantity: newStock,
              },
            });

            // Create inventory log
            await tx.inventoryLog.create({
              data: {
                productId: item.productId,
                type: "OUT",
                quantity: item.quantity,
                previousStock: previousStock,
                currentStock: newStock,
                reason: `Order #${newOrder.orderNumber} - Sold`,
                referenceType: "ORDER",
                referenceId: newOrder.id,
                userId: context.userId,
              },
            });

            // Check and emit inventory alerts (after transaction)
            // We'll do this after the transaction completes
          }
        }

        // Create payment record
        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            paymentMethod: mappedPaymentMethod as any,
            amount: data.totalAmount + (data.tipAmount || 0),
            status: "COMPLETED",
            paidAt: new Date(),
            referenceNumber: `TXN-${newOrder.orderNumber}`,
          },
        });

        return newOrder;
      });

      // Emit inventory alerts for stock changes
      for (const item of data.items) {
        const product = productMap.get(item.productId)!;
        if (product.trackInventory) {
          const newStock = Math.max(0, product.quantity - item.quantity);
          checkAndEmitInventoryAlerts({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            previousStock: product.quantity,
            newStock,
            lowStockThreshold: product.lowStockAlert,
            reason: `Order #${order.orderNumber} - Sold`,
          });
        }
      }

      // Fetch the created order with relations
      const createdOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  imageUrl: true,
                },
              },
            },
          },
          cashier: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      // Send WebSocket notifications
      console.log("🔍 Checking if createdOrder exists:", !!createdOrder);

      if (createdOrder) {
        console.log("✅ Created order found, attempting WebSocket emit...");
        console.log("Order details:", {
          id: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          itemCount: createdOrder.items?.length
        });

        try {
          // Use direct function call instead of dynamic import
          const io = (global as any).io;

          if (!io) {
            console.error("❌ Global io not found - WebSocket server not initialized");
          } else {
            console.log("✅ Global io found, emitting event...");

            const payload = {
              orderId: createdOrder.id,
              orderNumber: createdOrder.orderNumber,
              orderType: createdOrder.orderType,
              totalAmount: Number(createdOrder.totalAmount),
              itemCount: createdOrder.items?.length || 0,
              cashierName: createdOrder.cashier?.name || "Unknown",
              createdAt: createdOrder.createdAt.toISOString(),
            };

            console.log("📡 Emitting order:created event with payload:", payload);

            io.emit("order:created", payload);

            console.log("✓ Event emitted successfully to ALL clients");
          }
        } catch (wsError) {
          console.error("❌ WebSocket notification error:", wsError);
          console.error("Error details:", {
            message: (wsError as Error).message,
            stack: (wsError as Error).stack
          });
        }
      } else {
        console.error("❌ createdOrder is null or undefined!");
      }


      return NextResponse.json(
        {
          data: createdOrder,
          message: "Order created successfully",
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error creating order:", error);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.ORDER_CREATE],
  }
);
