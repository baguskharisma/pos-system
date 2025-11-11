/**
 * WebSocket Event Emitter Utilities
 * Use these functions to emit events from API routes or server-side code
 */

import {
  WebSocketEvent,
  WebSocketRoom,
  type OrderCreatedPayload,
  type OrderUpdatedPayload,
  type OrderStatusChangedPayload,
  type OrderCancelledPayload,
  type InventoryUpdatedPayload,
  type InventoryAlertPayload,
  type ProductAvailabilityChangedPayload,
  type PaymentReceivedPayload,
  type PaymentFailedPayload,
  type SystemNotificationPayload,
} from "./types";

/**
 * Get the global io instance
 */
function getIO() {
  if (typeof global !== "undefined" && (global as any).io) {
    return (global as any).io;
  }
  return null;
}

/**
 * Base emit function with error handling
 */
function emit<T>(event: WebSocketEvent, payload: T, room?: WebSocketRoom) {
  try {
    const io = getIO();

    if (!io) {
      console.warn("WebSocket server not initialized, skipping event:", event);
      return;
    }

    if (room && room !== WebSocketRoom.ALL) {
      io.to(room).emit(event as any, payload);
      console.log(`Emitted ${event} to room ${room}`);
    } else {
      io.emit(event as any, payload);
      console.log(`Emitted ${event} to all clients`);
    }
  } catch (error) {
    console.error(`Error emitting WebSocket event ${event}:`, error);
  }
}

// Order events
export function emitOrderCreated(
  payload: OrderCreatedPayload,
  room: WebSocketRoom = WebSocketRoom.ALL
) {
  emit(WebSocketEvent.ORDER_CREATED, payload, room);
}

export function emitOrderUpdated(
  payload: OrderUpdatedPayload,
  room: WebSocketRoom = WebSocketRoom.ALL
) {
  emit(WebSocketEvent.ORDER_UPDATED, payload, room);
}

export function emitOrderStatusChanged(
  payload: OrderStatusChangedPayload,
  room: WebSocketRoom = WebSocketRoom.ALL
) {
  emit(WebSocketEvent.ORDER_STATUS_CHANGED, payload, room);
}

export function emitOrderCancelled(
  payload: OrderCancelledPayload,
  room: WebSocketRoom = WebSocketRoom.ALL
) {
  emit(WebSocketEvent.ORDER_CANCELLED, payload, room);
}

// Inventory events
export function emitInventoryUpdated(
  payload: InventoryUpdatedPayload,
  room: WebSocketRoom = WebSocketRoom.ALL
) {
  emit(WebSocketEvent.INVENTORY_UPDATED, payload, room);
}

export function emitInventoryLow(
  payload: InventoryAlertPayload,
  room: WebSocketRoom = WebSocketRoom.ADMINS
) {
  emit(WebSocketEvent.INVENTORY_LOW, payload, room);
}

export function emitInventoryOut(
  payload: InventoryAlertPayload,
  room: WebSocketRoom = WebSocketRoom.ALL
) {
  emit(WebSocketEvent.INVENTORY_OUT, payload, room);
}

// Product events
export function emitProductAvailabilityChanged(
  payload: ProductAvailabilityChangedPayload,
  room: WebSocketRoom = WebSocketRoom.ALL
) {
  emit(WebSocketEvent.PRODUCT_AVAILABILITY_CHANGED, payload, room);
}

// Payment events
export function emitPaymentReceived(
  payload: PaymentReceivedPayload,
  room: WebSocketRoom = WebSocketRoom.ALL
) {
  emit(WebSocketEvent.PAYMENT_RECEIVED, payload, room);
}

export function emitPaymentFailed(
  payload: PaymentFailedPayload,
  room: WebSocketRoom = WebSocketRoom.ADMINS
) {
  emit(WebSocketEvent.PAYMENT_FAILED, payload, room);
}

// System events
export function emitSystemNotification(
  payload: SystemNotificationPayload,
  room: WebSocketRoom = WebSocketRoom.ALL
) {
  emit(WebSocketEvent.SYSTEM_NOTIFICATION, payload, room);
}

// Helper to emit multiple events in sequence
export function emitBatch(
  events: Array<{ event: WebSocketEvent; payload: any; room?: WebSocketRoom }>
) {
  events.forEach(({ event, payload, room }) => {
    emit(event, payload, room);
  });
}
