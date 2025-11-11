import { NextRequest, NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { RBACContext } from "@/types";

/**
 * GET /api/orders/[id]
 * Get order by ID
 * Accessible by: CASHIER, ADMIN, SUPER_ADMIN
 */
export const GET = withRBAC(
  async (request: NextRequest, context: RBACContext & { params: Promise<{ id: string }> }) => {
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

      // Fetch order with all relations
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

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      return NextResponse.json({ data: order });
    } catch (error) {
      console.error("Error fetching order:", error);
      return NextResponse.json(
        { error: "Failed to fetch order" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.ORDER_VIEW],
  }
);

/**
 * PATCH /api/orders/[id]
 * Update order status
 * Accessible by: CASHIER, ADMIN, SUPER_ADMIN
 */
export const PATCH = withRBAC(
  async (request: NextRequest, context: RBACContext & { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;
      const body = await request.json();

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return NextResponse.json(
          { error: "Invalid order ID format" },
          { status: 400 }
        );
      }

      // Validate request body
      const updateSchema = z.object({
        status: z.enum([
          "PENDING_PAYMENT",
          "PAID",
          "PREPARING",
          "READY",
          "COMPLETED",
          "CANCELLED",
        ]),
        cancellationReason: z.string().optional(),
      });

      const validationResult = updateSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationResult.error.errors,
          },
          { status: 400 }
        );
      }

      const { status, cancellationReason } = validationResult.data;

      // Check if order exists
      const existingOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  imageUrl: true,
                  trackInventory: true,
                  quantity: true,
                },
              },
            },
          },
        },
      });

      if (!existingOrder) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Prepare update data
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      // Set timestamp based on status
      const now = new Date();
      switch (status) {
        case "PAID":
          if (!existingOrder.paidAt) {
            updateData.paidAt = now;
          }
          break;
        case "PREPARING":
          if (!existingOrder.preparingAt) {
            updateData.preparingAt = now;
          }
          break;
        case "READY":
          if (!existingOrder.readyAt) {
            updateData.readyAt = now;
          }
          break;
        case "COMPLETED":
          if (!existingOrder.completedAt) {
            updateData.completedAt = now;
          }
          break;
        case "CANCELLED":
          if (!existingOrder.cancelledAt) {
            updateData.cancelledAt = now;
            updateData.cancellationReason = cancellationReason || null;
          }
          break;
      }

      // Handle inventory restoration when order is cancelled
      let updatedOrder;
      if (status === "CANCELLED" && existingOrder.status !== "CANCELLED") {
        // Use transaction to restore inventory and update order
        updatedOrder = await prisma.$transaction(async (tx) => {
          // Restore inventory for each item
          for (const item of existingOrder.items) {
            if (item.product.trackInventory) {
              const previousStock = item.product.quantity;
              const newStock = previousStock + item.quantity;

              // Update product inventory
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  quantity: {
                    increment: item.quantity,
                  },
                },
              });

              // Create inventory log
              await tx.inventoryLog.create({
                data: {
                  productId: item.productId,
                  type: "IN",
                  quantity: item.quantity,
                  previousStock,
                  currentStock: newStock,
                  reason: `Order ${existingOrder.orderNumber} cancelled`,
                  referenceType: "ORDER",
                  referenceId: existingOrder.id,
                },
              });

              console.log(`✓ Restored ${item.quantity} units of ${item.product.name} (SKU: ${item.product.sku})`);
            }
          }

          // Update order status
          const updated = await tx.order.update({
            where: { id },
            data: updateData,
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

          return updated;
        });

        console.log(`✓ Order ${existingOrder.orderNumber} cancelled - inventory restored`);
      } else {
        // Normal status update without inventory changes
        updatedOrder = await prisma.order.update({
          where: { id },
          data: updateData,
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
      }
// Emit WebSocket event for status change      try {        const io = (global as any).io;        if (io) {          const payload = {            orderId: updatedOrder.id,            orderNumber: updatedOrder.orderNumber,            oldStatus: existingOrder.status,            newStatus: updatedOrder.status,            changedBy: context.userName || "System",            changedAt: new Date().toISOString(),          };          console.log("📡 Emitting order:status_changed event:", payload);          io.emit("order:status_changed", payload);          console.log("✓ Status change event emitted");        }      } catch (wsError) {        console.error("❌ WebSocket emit error:", wsError);      }

      return NextResponse.json({
        data: updatedOrder,
        message: "Order status updated successfully",
      });
    } catch (error) {
      console.error("Error updating order:", error);
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.ORDER_UPDATE],
  }
);
