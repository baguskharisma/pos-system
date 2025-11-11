/**
 * WebSocket Payment Events
 * Helper functions untuk broadcast payment-related events
 */

// Payment event types
export type PaymentEventType =
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_FAILED'
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED';

export interface PaymentEvent {
  type: PaymentEventType;
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  totalAmount?: number;
  paidAmount?: number;
  changeAmount?: number;
  paymentMethod?: string;
  confirmedBy?: string;
  timestamp: string;
  data?: Record<string, any>;
}

/**
 * Broadcast payment confirmation event
 * This will be sent when admin/cashier confirms cash payment
 */
export function broadcastPaymentConfirmed(event: Omit<PaymentEvent, 'type' | 'timestamp'>) {
  const payload: PaymentEvent = {
    ...event,
    type: 'PAYMENT_CONFIRMED',
    timestamp: new Date().toISOString(),
  };

  // Log for now (WebSocket implementation will use this)
  console.log('📡 [WebSocket] Broadcasting PAYMENT_CONFIRMED:', payload);

  // In production, this would broadcast via WebSocket server
  // Example: io.to('admin').emit('payment:confirmed', payload);

  return payload;
}

/**
 * Broadcast order created event
 * Notifies admin when new order is created
 */
export function broadcastOrderCreated(event: Omit<PaymentEvent, 'type' | 'timestamp'>) {
  const payload: PaymentEvent = {
    ...event,
    type: 'ORDER_CREATED',
    timestamp: new Date().toISOString(),
  };

  console.log('📡 [WebSocket] Broadcasting ORDER_CREATED:', payload);

  return payload;
}

/**
 * Broadcast order updated event
 */
export function broadcastOrderUpdated(event: Omit<PaymentEvent, 'type' | 'timestamp'>) {
  const payload: PaymentEvent = {
    ...event,
    type: 'ORDER_UPDATED',
    timestamp: new Date().toISOString(),
  };

  console.log('📡 [WebSocket] Broadcasting ORDER_UPDATED:', payload);

  return payload;
}

/**
 * Get WebSocket room name for admin notifications
 */
export function getAdminRoom(): string {
  return 'admin-notifications';
}

/**
 * Get WebSocket room name for specific order
 */
export function getOrderRoom(orderId: string): string {
  return `order-${orderId}`;
}

/**
 * Get WebSocket room name for cashier
 */
export function getCashierRoom(cashierId: string): string {
  return `cashier-${cashierId}`;
}
