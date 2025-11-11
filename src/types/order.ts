/**
 * Order Status Types
 */
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED"
  | "PENDING" // Legacy status for backwards compatibility
  | "REFUNDED";

/**
 * Order Type
 */
export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

/**
 * Payment Method
 */
export type PaymentMethod =
  | "CASH"
  | "DIGITAL_PAYMENT";

/**
 * Order Item
 */
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string | null;
}

/**
 * Customer Info
 */
export interface CustomerInfo {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  tableNumber?: string | null;
}

/**
 * Payment Info
 */
export interface PaymentInfo {
  method: PaymentMethod;
  amountPaid: number;
  amountTendered: number;
  change: number;
  tipAmount: number;
}

/**
 * Timeline Entry
 */
export interface TimelineEntry {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

/**
 * Order
 */
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;

  // Items
  items: OrderItem[];
  itemCount: number;

  // Financial
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  tipAmount: number;
  total: number;

  // Customer
  customer: CustomerInfo;

  // Payment
  payment: PaymentInfo;

  // Timeline
  timeline: TimelineEntry[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cashierName?: string | null;
}

/**
 * Completed Order (from POS localStorage)
 */
export interface CompletedOrder {
  id: string;
  orderNumber: number;
  cart: any; // POS cart structure
  payment: any; // POS payment structure
  completedAt: string;
  cashierName?: string;
}
