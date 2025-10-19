import { z } from "zod";

/**
 * Schema for creating a new product
 */
export const createProductSchema = z.object({
  // Basic Info
  categoryId: z
    .string()
    .uuid("Category ID must be a valid UUID")
    .min(1, "Category ID is required"),
  sku: z
    .string()
    .min(1, "SKU is required")
    .max(100, "SKU must be at most 100 characters")
    .regex(
      /^[A-Za-z0-9-_]+$/,
      "SKU must contain only letters, numbers, hyphens, and underscores"
    )
    .trim(),
  barcode: z
    .string()
    .max(100, "Barcode must be at most 100 characters")
    .optional()
    .nullable(),
  name: z
    .string()
    .min(1, "Product name is required")
    .max(255, "Product name must be at most 255 characters")
    .trim(),
  description: z
    .string()
    .max(5000, "Description must be at most 5000 characters")
    .optional()
    .nullable(),

  // Pricing
  price: z
    .number()
    .positive("Price must be a positive number")
    .max(99999999.99, "Price is too large")
    .multipleOf(0.01, "Price must have at most 2 decimal places"),
  costPrice: z
    .number()
    .nonnegative("Cost price must be non-negative")
    .max(99999999.99, "Cost price is too large")
    .multipleOf(0.01, "Cost price must have at most 2 decimal places")
    .optional()
    .nullable(),
  compareAtPrice: z
    .number()
    .positive("Compare at price must be a positive number")
    .max(99999999.99, "Compare at price is too large")
    .multipleOf(0.01, "Compare at price must have at most 2 decimal places")
    .optional()
    .nullable(),

  // Tax
  taxable: z.boolean().optional().default(true),
  taxRate: z
    .number()
    .min(0, "Tax rate must be non-negative")
    .max(100, "Tax rate cannot exceed 100%")
    .multipleOf(0.01, "Tax rate must have at most 2 decimal places")
    .optional()
    .nullable(),

  // Images
  imageUrl: z
    .string()
    .url("Image URL must be a valid URL")
    .max(500, "Image URL must be at most 500 characters")
    .optional()
    .nullable(),
  images: z
    .array(
      z.object({
        url: z.string().url("Image URL must be a valid URL"),
        alt: z.string().optional(),
        position: z.number().int().min(0).optional(),
      })
    )
    .max(10, "Maximum 10 images allowed")
    .optional()
    .nullable(),

  // Inventory
  trackInventory: z.boolean().optional().default(false),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(0, "Quantity cannot be negative")
    .optional()
    .default(0),
  lowStockAlert: z
    .number()
    .int("Low stock alert must be an integer")
    .min(0, "Low stock alert cannot be negative")
    .optional()
    .nullable(),

  // Status
  isAvailable: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),

  // SEO
  metaTitle: z
    .string()
    .max(255, "Meta title must be at most 255 characters")
    .optional()
    .nullable(),
  metaDescription: z
    .string()
    .max(1000, "Meta description must be at most 1000 characters")
    .optional()
    .nullable(),

  // Additional data
  tags: z
    .array(z.string().max(50, "Tag must be at most 50 characters"))
    .max(20, "Maximum 20 tags allowed")
    .optional()
    .default([]),
  variants: z
    .record(z.string(), z.unknown())
    .optional()
    .nullable(),
  customFields: z
    .record(z.string(), z.unknown())
    .optional()
    .nullable(),
});

/**
 * Schema for updating an existing product
 * All fields are optional for partial updates
 */
export const updateProductSchema = z.object({
  // Basic Info
  categoryId: z
    .string()
    .uuid("Category ID must be a valid UUID")
    .optional(),
  sku: z
    .string()
    .min(1, "SKU cannot be empty")
    .max(100, "SKU must be at most 100 characters")
    .regex(
      /^[A-Za-z0-9-_]+$/,
      "SKU must contain only letters, numbers, hyphens, and underscores"
    )
    .trim()
    .optional(),
  barcode: z
    .string()
    .max(100, "Barcode must be at most 100 characters")
    .optional()
    .nullable(),
  name: z
    .string()
    .min(1, "Product name cannot be empty")
    .max(255, "Product name must be at most 255 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(5000, "Description must be at most 5000 characters")
    .optional()
    .nullable(),

  // Pricing
  price: z
    .number()
    .positive("Price must be a positive number")
    .max(99999999.99, "Price is too large")
    .multipleOf(0.01, "Price must have at most 2 decimal places")
    .optional(),
  costPrice: z
    .number()
    .nonnegative("Cost price must be non-negative")
    .max(99999999.99, "Cost price is too large")
    .multipleOf(0.01, "Cost price must have at most 2 decimal places")
    .optional()
    .nullable(),
  compareAtPrice: z
    .number()
    .positive("Compare at price must be a positive number")
    .max(99999999.99, "Compare at price is too large")
    .multipleOf(0.01, "Compare at price must have at most 2 decimal places")
    .optional()
    .nullable(),

  // Tax
  taxable: z.boolean().optional(),
  taxRate: z
    .number()
    .min(0, "Tax rate must be non-negative")
    .max(100, "Tax rate cannot exceed 100%")
    .multipleOf(0.01, "Tax rate must have at most 2 decimal places")
    .optional()
    .nullable(),

  // Images
  imageUrl: z
    .string()
    .url("Image URL must be a valid URL")
    .max(500, "Image URL must be at most 500 characters")
    .optional()
    .nullable(),
  images: z
    .array(
      z.object({
        url: z.string().url("Image URL must be a valid URL"),
        alt: z.string().optional(),
        position: z.number().int().min(0).optional(),
      })
    )
    .max(10, "Maximum 10 images allowed")
    .optional()
    .nullable(),

  // Inventory
  trackInventory: z.boolean().optional(),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(0, "Quantity cannot be negative")
    .optional(),
  lowStockAlert: z
    .number()
    .int("Low stock alert must be an integer")
    .min(0, "Low stock alert cannot be negative")
    .optional()
    .nullable(),

  // Status
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),

  // SEO
  metaTitle: z
    .string()
    .max(255, "Meta title must be at most 255 characters")
    .optional()
    .nullable(),
  metaDescription: z
    .string()
    .max(1000, "Meta description must be at most 1000 characters")
    .optional()
    .nullable(),

  // Additional data
  tags: z
    .array(z.string().max(50, "Tag must be at most 50 characters"))
    .max(20, "Maximum 20 tags allowed")
    .optional(),
  variants: z
    .record(z.string(), z.unknown())
    .optional()
    .nullable(),
  customFields: z
    .record(z.string(), z.unknown())
    .optional()
    .nullable(),
});

/**
 * Schema for product list query parameters (pagination, filtering, sorting)
 */
export const productQuerySchema = z.object({
  // Pagination
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),

  // Filtering
  search: z
    .string()
    .max(200, "Search query must be at most 200 characters")
    .optional(),
  categoryId: z
    .string()
    .uuid("Category ID must be a valid UUID")
    .optional(),
  isAvailable: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    })
    .pipe(z.boolean().optional()),
  isFeatured: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    })
    .pipe(z.boolean().optional()),
  trackInventory: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    })
    .pipe(z.boolean().optional()),
  minPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(0).optional()),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(0).optional()),
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",") : undefined))
    .pipe(z.array(z.string()).optional()),
  lowStock: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    })
    .pipe(z.boolean().optional()),

  // Sorting
  sortBy: z
    .enum([
      "name",
      "price",
      "sku",
      "quantity",
      "createdAt",
      "updatedAt",
      "isFeatured",
    ])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

/**
 * Schema for availability toggle
 */
export const toggleAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

/**
 * TypeScript types inferred from schemas
 */
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryParams = z.infer<typeof productQuerySchema>;
export type ToggleAvailabilityInput = z.infer<typeof toggleAvailabilitySchema>;
