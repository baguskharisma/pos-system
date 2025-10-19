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

export interface POSCart {
  items: POSCartItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
  discountPercentage?: number;
  total: number;
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
