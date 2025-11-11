import { z } from "zod";

// ==================== ENUMS ====================
export const InventoryActionType = z.enum([
  "IN",
  "OUT",
  "ADJUSTMENT",
  "DAMAGE",
  "RETURN",
  "TRANSFER",
  "STOCK_TAKE",
]);

export const InventoryReferenceType = z.enum([
  "ORDER",
  "MANUAL",
  "RETURN",
  "TRANSFER",
  "STOCK_TAKE",
  "SUPPLIER",
]);

export const StockStatus = z.enum([
  "IN_STOCK",
  "LOW_STOCK",
  "OUT_OF_STOCK",
  "OVERSTOCK",
]);

export const AlertSeverity = z.enum(["critical", "warning", "info"]);

// ==================== INVENTORY LOG SCHEMAS ====================

/**
 * Schema for creating a single inventory log entry
 */
export const createInventoryLogSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  type: InventoryActionType,
  quantity: z.number().int().positive("Quantity must be positive"),
  reason: z.string().min(1).max(500).optional(),
  referenceType: InventoryReferenceType.optional(),
  referenceId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Schema for inventory adjustment (manual stock update)
 */
export const inventoryAdjustmentSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  type: InventoryActionType,
  quantity: z.number().int().positive("Quantity must be positive"),
  reason: z.string().min(3, "Reason is required (minimum 3 characters)").max(500),
  notes: z.string().max(1000).optional(),
});

/**
 * Schema for bulk inventory adjustment
 */
export const bulkInventoryAdjustmentSchema = z.object({
  adjustments: z
    .array(
      z.object({
        productId: z.string().uuid(),
        type: InventoryActionType,
        quantity: z.number().int().positive(),
        reason: z.string().min(3).max(500),
        notes: z.string().max(1000).optional(),
      })
    )
    .min(1, "At least one adjustment is required")
    .max(100, "Maximum 100 adjustments per request"),
  batchReason: z.string().max(500).optional(),
});

/**
 * Schema for stock transfer between locations
 */
export const stockTransferSchema = z.object({
  productId: z.string().uuid(),
  fromLocation: z.string().max(100),
  toLocation: z.string().max(100),
  quantity: z.number().int().positive(),
  reason: z.string().min(3).max(500),
  notes: z.string().max(1000).optional(),
});

/**
 * Schema for stock take (physical inventory count)
 */
export const stockTakeSchema = z.object({
  productId: z.string().uuid(),
  countedQuantity: z.number().int().min(0, "Counted quantity cannot be negative"),
  expectedQuantity: z.number().int().optional(),
  notes: z.string().max(1000).optional(),
  countedBy: z.string().max(255).optional(),
});

/**
 * Schema for bulk stock take
 */
export const bulkStockTakeSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        countedQuantity: z.number().int().min(0),
        notes: z.string().max(500).optional(),
      })
    )
    .min(1)
    .max(500),
  sessionId: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

// ==================== QUERY SCHEMAS ====================

/**
 * Schema for inventory tracking query parameters
 */
export const inventoryTrackingQuerySchema = z.object({
  productId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  lowStock: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  outOfStock: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  overStock: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  search: z.string().max(255).optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .optional()
    .default("1"),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100))
    .optional()
    .default("20"),
  sortBy: z
    .enum(["name", "quantity", "sku", "createdAt", "updatedAt"])
    .optional()
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

/**
 * Schema for inventory logs query parameters
 */
export const inventoryLogsQuerySchema = z.object({
  productId: z.string().uuid().optional(),
  type: InventoryActionType.optional(),
  referenceType: InventoryReferenceType.optional(),
  referenceId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .optional()
    .default("1"),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100))
    .optional()
    .default("50"),
});

/**
 * Schema for inventory alerts query parameters
 */
export const inventoryAlertsQuerySchema = z.object({
  severity: AlertSeverity.optional(),
  categoryId: z.string().uuid().optional(),
  includeRecommendations: z
    .string()
    .transform((val) => val === "true")
    .optional()
    .default("true"),
});

/**
 * Schema for inventory analytics query parameters
 */
export const inventoryAnalyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  categoryId: z.string().uuid().optional(),
  productIds: z
    .string()
    .transform((val) => val.split(",").filter(Boolean))
    .optional(),
  metrics: z
    .string()
    .transform((val) => val.split(",").filter(Boolean))
    .optional(),
  groupBy: z.enum(["day", "week", "month", "category", "product"]).optional(),
});

// ==================== UPDATE SCHEMAS ====================

/**
 * Schema for updating product inventory settings
 */
export const updateInventorySettingsSchema = z.object({
  trackInventory: z.boolean().optional(),
  lowStockAlert: z.number().int().min(0).nullable().optional(),
  reorderPoint: z.number().int().min(0).nullable().optional(),
  reorderQuantity: z.number().int().min(0).nullable().optional(),
  maxStockLevel: z.number().int().min(0).nullable().optional(),
});

// ==================== RESPONSE TYPES ====================

/**
 * Type for inventory tracking response
 */
export const inventoryTrackingResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sku: z.string(),
  category: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
  currentStock: z.number().int(),
  lowStockThreshold: z.number().int().nullable(),
  stockStatus: StockStatus,
  isLowStock: z.boolean(),
  isOutOfStock: z.boolean(),
  price: z.number(),
  costPrice: z.number(),
  inventoryValue: z.number(),
  potentialRevenue: z.number(),
  totalSales: z.number(),
  recentMovements: z.array(
    z.object({
      id: z.string().uuid(),
      type: z.string(),
      quantity: z.number(),
      previousStock: z.number(),
      currentStock: z.number(),
      reason: z.string().nullable(),
      createdAt: z.date(),
    })
  ),
});

/**
 * Type for inventory alert response
 */
export const inventoryAlertResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sku: z.string(),
  category: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
  currentStock: z.number().int(),
  lowStockThreshold: z.number().int().nullable(),
  severity: AlertSeverity,
  isOutOfStock: z.boolean(),
  isLowStock: z.boolean(),
  price: z.number(),
  costPrice: z.number(),
  salesVelocity: z.object({
    last30Days: z.number(),
    dailyAverage: z.number(),
    daysUntilOutOfStock: z.number().nullable(),
  }),
  recommendation: z.object({
    action: z.enum(["URGENT_REORDER", "REORDER_SOON", "MONITOR"]),
    suggestedQuantity: z.number(),
    estimatedCost: z.number(),
    priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  }),
  lastMovement: z.date().nullable(),
});

// ==================== TYPE EXPORTS ====================

export type InventoryActionTypeValue = z.infer<typeof InventoryActionType>;
export type InventoryReferenceTypeValue = z.infer<typeof InventoryReferenceType>;
export type StockStatusValue = z.infer<typeof StockStatus>;
export type AlertSeverityValue = z.infer<typeof AlertSeverity>;

export type CreateInventoryLog = z.infer<typeof createInventoryLogSchema>;
export type InventoryAdjustment = z.infer<typeof inventoryAdjustmentSchema>;
export type BulkInventoryAdjustment = z.infer<typeof bulkInventoryAdjustmentSchema>;
export type StockTransfer = z.infer<typeof stockTransferSchema>;
export type StockTake = z.infer<typeof stockTakeSchema>;
export type BulkStockTake = z.infer<typeof bulkStockTakeSchema>;

export type InventoryTrackingQuery = z.infer<typeof inventoryTrackingQuerySchema>;
export type InventoryLogsQuery = z.infer<typeof inventoryLogsQuerySchema>;
export type InventoryAlertsQuery = z.infer<typeof inventoryAlertsQuerySchema>;
export type InventoryAnalyticsQuery = z.infer<typeof inventoryAnalyticsQuerySchema>;

export type UpdateInventorySettings = z.infer<typeof updateInventorySettingsSchema>;

export type InventoryTrackingResponse = z.infer<typeof inventoryTrackingResponseSchema>;
export type InventoryAlertResponse = z.infer<typeof inventoryAlertResponseSchema>;
