/**
 * POS (Point of Sale) type definitions
 */

export interface POSCartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  maxQuantity?: number; // For inventory tracking
  notes?: string;
}

export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

export interface CustomerInfo {
  name?: string;
  phone?: string;
  address?: string;
  tableNumber?: string;
}

export interface POSCart {
  items: POSCartItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  taxEnabled: boolean;
  discountAmount: number;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
  discountPercentage?: number;
  total: number;
  orderType: OrderType;
  customerInfo: CustomerInfo;
}

export interface HeldOrder {
  id: string;
  cart: POSCart;
  heldAt: string;
  orderNumber: number;
}

export interface POSProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  imageUrl: string | null;
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  isAvailable: boolean;
  trackInventory: boolean;
  quantity: number;
  taxRate: number | null;
}

export interface POSCategory {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  productCount: number;
}
