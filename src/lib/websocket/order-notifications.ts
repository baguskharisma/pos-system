/**
 * Order-specific WebSocket notification helpers
 * Import and use these in your order API routes
 */

import {
  emitOrderCreated,
  emitInventoryUpdated,
  emitInventoryLow,
  emitInventoryOut,
  emitPaymentReceived,
} from "./emitter";
import { WebSocketRoom } from "./types";
import type { Order, OrderItem, Product } from "@prisma/client";

/**
 * Notify when a new order is created
 */
export async function notifyOrderCreated(
  order: Order & {
    items: (OrderItem & { product: { name: string; sku: string } })[];
    cashier: { name: string } | null;
  }
) {
  emitOrderCreated(
    {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderType: order.orderType as any,
      totalAmount: order.totalAmount,
      itemCount: order.items.length,
      cashierName: order.cashier?.name || "Unknown",
      createdAt: order.createdAt.toISOString(),
    },
    WebSocketRoom.ALL
  );
}

/**
 * Notify when inventory is updated
 */
export async function notifyInventoryUpdate(
  product: Product,
  oldQuantity: number,
  newQuantity: number
) {
  const change = newQuantity - oldQuantity;

  // Emit inventory updated event
  emitInventoryUpdated(
    {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      oldQuantity,
      newQuantity,
      change,
      updatedAt: new Date().toISOString(),
    },
    WebSocketRoom.ALL
  );

  // Check for low inventory alerts
  if (product.trackInventory) {
    if (newQuantity === 0) {
      emitInventoryOut(
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          currentQuantity: 0,
          minQuantity: product.minQuantity || undefined,
          alertType: "OUT",
        },
        WebSocketRoom.ALL
      );
    } else if (
      product.minQuantity &&
      newQuantity <= product.minQuantity &&
      oldQuantity > product.minQuantity
    ) {
      emitInventoryLow(
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          currentQuantity: newQuantity,
          minQuantity: product.minQuantity,
          alertType: "LOW",
        },
        WebSocketRoom.ADMINS
      );
    }
  }
}

/**
 * Notify when payment is received
 */
export async function notifyPaymentReceived(order: Order) {
  emitPaymentReceived(
    {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentMethod: order.paymentMethod as any,
      amount: order.totalAmount,
      receivedAt: order.paidAt?.toISOString() || new Date().toISOString(),
    },
    WebSocketRoom.ALL
  );
}

/**
 * Handle all notifications for order creation
 * This is a convenience function that calls all relevant notification functions
 */
export async function handleOrderCreatedNotifications(
  order: Order & {
    items: (OrderItem & { product: Product })[];
    cashier: { name: string } | null;
  }
) {
  // Notify order created
  await notifyOrderCreated({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      product: {
        name: item.product.name,
        sku: item.product.sku,
      },
    })),
  });

  // Notify payment received
  await notifyPaymentReceived(order);

  // Notify inventory updates for each item
  for (const item of order.items) {
    if (item.product.trackInventory) {
      const oldQuantity = item.product.quantity + item.quantity;
      await notifyInventoryUpdate(item.product, oldQuantity, item.product.quantity);
    }
  }
}
