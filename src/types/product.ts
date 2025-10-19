/**
 * Product type definitions
 */

export interface ProductImage {
  url: string;
  alt?: string;
  position?: number;
}

export interface Product {
  id: string;
  categoryId: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  price: number;
  costPrice: number | null;
  compareAtPrice: number | null;
  taxable: boolean;
  taxRate: number | null;
  imageUrl: string | null;
  images: ProductImage[] | null;
  trackInventory: boolean;
  quantity: number;
  lowStockAlert: number | null;
  isAvailable: boolean;
  isFeatured: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  tags: string[];
  variants: Record<string, unknown> | null;
  customFields: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
    icon: string | null;
  };
  _count?: {
    orderItems: number;
  };
}

export interface ProductListResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ProductResponse {
  data: Product;
  message?: string;
}

export interface CreateProductData {
  categoryId: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  price: number;
  costPrice?: number | null;
  compareAtPrice?: number | null;
  taxable?: boolean;
  taxRate?: number | null;
  imageUrl?: string | null;
  images?: ProductImage[] | null;
  trackInventory?: boolean;
  quantity?: number;
  lowStockAlert?: number | null;
  isAvailable?: boolean;
  isFeatured?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  tags?: string[];
  variants?: Record<string, unknown> | null;
  customFields?: Record<string, unknown> | null;
}

export interface UpdateProductData {
  categoryId?: string;
  sku?: string;
  barcode?: string | null;
  name?: string;
  description?: string | null;
  price?: number;
  costPrice?: number | null;
  compareAtPrice?: number | null;
  taxable?: boolean;
  taxRate?: number | null;
  imageUrl?: string | null;
  images?: ProductImage[] | null;
  trackInventory?: boolean;
  quantity?: number;
  lowStockAlert?: number | null;
  isAvailable?: boolean;
  isFeatured?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  tags?: string[];
  variants?: Record<string, unknown> | null;
  customFields?: Record<string, unknown> | null;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  trackInventory?: boolean;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  lowStock?: boolean;
  sortBy?: "name" | "price" | "sku" | "quantity" | "createdAt" | "updatedAt" | "isFeatured";
  sortOrder?: "asc" | "desc";
}

export interface ToggleAvailabilityData {
  isAvailable: boolean;
}

export interface BulkUpdateData {
  productIds: string[];
  isAvailable: boolean;
}
