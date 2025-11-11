/**
 * WebSocket Event Types
 */

import type { OrderStatus, OrderType, PaymentMethod } from "@/types/order";

// Event names
export enum WebSocketEvent {
  // Connection events
  CONNECTION = "connection",
  DISCONNECT = "disconnect",
  ERROR = "error",

  // Order events
  ORDER_CREATED = "order:created",
  ORDER_UPDATED = "order:updated",
  ORDER_STATUS_CHANGED = "order:status_changed",
  ORDER_CANCELLED = "order:cancelled",

  // Inventory events
  INVENTORY_UPDATED = "inventory:updated",
  INVENTORY_LOW = "inventory:low",
  INVENTORY_OUT = "inventory:out",

  // Product events
  PRODUCT_AVAILABILITY_CHANGED = "product:availability_changed",

  // Payment events
  PAYMENT_RECEIVED = "payment:received",
  PAYMENT_COMPLETED = "payment:completed",
  PAYMENT_FAILED = "payment:failed",

  // System events
  SYSTEM_NOTIFICATION = "system:notification",
}

// Room types for targeted broadcasting
export enum WebSocketRoom {
  ALL = "all",
  CASHIERS = "cashiers",
  ADMINS = "admins",
  KITCHEN = "kitchen",
  WAREHOUSE = "warehouse",
}

// Event payloads
export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  orderType: OrderType;
  totalAmount: number;
  itemCount: number;
  cashierName: string;
  createdAt: string;
}

export interface OrderUpdatedPayload {
  orderId: string;
  orderNumber: string;
  changes: Record<string, any>;
  updatedAt: string;
}

export interface OrderStatusChangedPayload {
  orderId: string;
  orderNumber: string;
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
  changedBy: string;
  changedAt: string;
}

export interface OrderCancelledPayload {
  orderId: string;
  orderNumber: string;
  reason?: string;
  cancelledBy: string;
  cancelledAt: string;
}

export interface InventoryUpdatedPayload {
  productId: string;
  productName: string;
  sku: string;
  oldQuantity: number;
  newQuantity: number;
  change: number;
  updatedAt: string;
}

export interface InventoryAlertPayload {
  productId: string;
  productName: string;
  sku: string;
  currentQuantity: number;
  minQuantity?: number;
  alertType: "LOW" | "OUT";
}

export interface ProductAvailabilityChangedPayload {
  productId: string;
  productName: string;
  sku: string;
  isAvailable: boolean;
  reason?: string;
  changedAt: string;
}

export interface PaymentReceivedPayload {
  orderId: string;
  orderNumber: string;
  paymentMethod: PaymentMethod;
  amount: number;
  receivedAt: string;
}

export interface PaymentCompletedPayload {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: PaymentMethod;
  paymentType: string;
  amount: number;
  paidAt: string;
}

export interface PaymentFailedPayload {
  orderId: string;
  orderNumber: string;
  paymentMethod: PaymentMethod;
  amount: number;
  error: string;
  failedAt: string;
}

export interface SystemNotificationPayload {
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  action?: {
    label: string;
    url: string;
  };
  timestamp: string;
}

// Union type for all event payloads
export type WebSocketEventPayload =
  | OrderCreatedPayload
  | OrderUpdatedPayload
  | OrderStatusChangedPayload
  | OrderCancelledPayload
  | InventoryUpdatedPayload
  | InventoryAlertPayload
  | ProductAvailabilityChangedPayload
  | PaymentReceivedPayload
  | PaymentCompletedPayload
  | PaymentFailedPayload
  | SystemNotificationPayload;

// Client-to-server events
export interface ClientToServerEvents {
  "join:room": (room: WebSocketRoom) => void;
  "leave:room": (room: WebSocketRoom) => void;
  ping: (callback: (response: string) => void) => void;
}

// Server-to-client events
export interface ServerToClientEvents {
  [WebSocketEvent.ORDER_CREATED]: (payload: OrderCreatedPayload) => void;
  [WebSocketEvent.ORDER_UPDATED]: (payload: OrderUpdatedPayload) => void;
  [WebSocketEvent.ORDER_STATUS_CHANGED]: (
    payload: OrderStatusChangedPayload
  ) => void;
  [WebSocketEvent.ORDER_CANCELLED]: (payload: OrderCancelledPayload) => void;
  [WebSocketEvent.INVENTORY_UPDATED]: (payload: InventoryUpdatedPayload) => void;
  [WebSocketEvent.INVENTORY_LOW]: (payload: InventoryAlertPayload) => void;
  [WebSocketEvent.INVENTORY_OUT]: (payload: InventoryAlertPayload) => void;
  [WebSocketEvent.PRODUCT_AVAILABILITY_CHANGED]: (
    payload: ProductAvailabilityChangedPayload
  ) => void;
  [WebSocketEvent.PAYMENT_RECEIVED]: (payload: PaymentReceivedPayload) => void;
  [WebSocketEvent.PAYMENT_COMPLETED]: (payload: PaymentCompletedPayload) => void;
  [WebSocketEvent.PAYMENT_FAILED]: (payload: PaymentFailedPayload) => void;
  [WebSocketEvent.SYSTEM_NOTIFICATION]: (
    payload: SystemNotificationPayload
  ) => void;
}

// Inter-server events (for scaling)
export interface InterServerEvents {
  ping: () => void;
}

// Socket data (stored per connection)
export interface SocketData {
  userId?: string;
  userName?: string;
  userRole?: string;
  rooms: WebSocketRoom[];
}
