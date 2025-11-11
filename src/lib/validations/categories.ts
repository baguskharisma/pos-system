import { z } from "zod";

/**
 * Schema for creating a new category
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name must be at most 100 characters")
    .trim(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be at most 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens only"
    )
    .trim(),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .max(500, "Image URL must be at most 500 characters")
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val))
    .refine(
      (val) => !val || /^https?:\/\/.+/.test(val),
      "Image URL must be a valid URL"
    ),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color (e.g., #FF5733)")
    .optional()
    .nullable(),
  icon: z
    .string()
    .max(50, "Icon must be at most 50 characters")
    .optional()
    .nullable(),
  sortOrder: z
    .number()
    .int("Sort order must be an integer")
    .min(0, "Sort order must be non-negative")
    .optional()
    .default(0),
  isActive: z.boolean().optional().default(true),
});

/**
 * Schema for updating an existing category
 * All fields are optional for partial updates
 */
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name cannot be empty")
    .max(100, "Category name must be at most 100 characters")
    .trim()
    .optional(),
  slug: z
    .string()
    .min(1, "Slug cannot be empty")
    .max(100, "Slug must be at most 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens only"
    )
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .max(500, "Image URL must be at most 500 characters")
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val))
    .refine(
      (val) => !val || /^https?:\/\/.+/.test(val),
      "Image URL must be a valid URL"
    ),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color (e.g., #FF5733)")
    .optional()
    .nullable(),
  icon: z
    .string()
    .max(50, "Icon must be at most 50 characters")
    .optional()
    .nullable(),
  sortOrder: z
    .number()
    .int("Sort order must be an integer")
    .min(0, "Sort order must be non-negative")
    .optional(),
  isActive: z.boolean().optional(),
});

/**
 * Schema for category list query parameters (pagination, filtering, sorting)
 */
export const categoryQuerySchema = z.object({
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
  isActive: z
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
    .enum(["name", "slug", "sortOrder", "createdAt", "updatedAt"])
    .optional()
    .default("sortOrder"),
  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .default("asc"),
});

/**
 * TypeScript types inferred from schemas
 */
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQueryParams = z.infer<typeof categoryQuerySchema>;
