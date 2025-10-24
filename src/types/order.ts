/**
 * Order type definitions
 */

export type OrderStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "AWAITING_CONFIRMATION"
  | "PAID"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

export type OrderSource = "CUSTOMER" | "CASHIER" | "ONLINE" | "PHONE";

export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "QRIS"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "E_WALLET"
  | "OTHER";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  costPrice: number | null;
  discountAmount: number;
  discountPercent: number | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  variants: Record<string, unknown> | null;
  customFields: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transactionType: "PAYMENT" | "REFUND" | "PARTIAL_REFUND";
  gatewayName: string | null;
  gatewayTransactionId: string | null;
  gatewayStatus: string | null;
  referenceNumber: string | null;
  paymentProofUrl: string | null;
  qrCodeUrl: string | null;
  vaNumber: string | null;
  cardType: string | null;
  cardLastFour: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  verificationNotes: string | null;
  paidAt: string | null;
  failedAt: string | null;
  expiredAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
  verifier?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  invoiceNumber: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  tableNumber: string | null;
  orderType: OrderType;
  orderSource: OrderSource;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | null;
  discountPercentage: number | null;
  taxAmount: number;
  taxRate: number | null;
  taxType: "INCLUSIVE" | "EXCLUSIVE";
  serviceCharge: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod | null;
  paidAmount: number | null;
  changeAmount: number | null;
  notes: string | null;
  internalNotes: string | null;
  cancellationReason: string | null;
  paidAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  estimatedReadyTime: string | null;
  cashierId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  cashier?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  items: OrderItem[];
  payments: Payment[];
  _count?: {
    items: number;
    payments: number;
  };
}

export interface OrderListResponse {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  summary?: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    completedOrders: number;
    cancelledOrders: number;
  };
}

export interface OrderResponse {
  data: Order;
  message?: string;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  orderType?: OrderType;
  orderSource?: OrderSource;
  paymentMethod?: PaymentMethod;
  cashierId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?:
    | "orderNumber"
    | "totalAmount"
    | "status"
    | "createdAt"
    | "paidAt"
    | "completedAt";
  sortOrder?: "asc" | "desc";
}

export interface UpdateOrderStatusData {
  status: OrderStatus;
  notes?: string;
}

export interface BulkUpdateOrdersData {
  orderIds: string[];
  status: OrderStatus;
  notes?: string;
}

export interface OrderStats {
  period: "today" | "week" | "month" | "year";
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
}