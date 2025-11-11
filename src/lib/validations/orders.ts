import { z } from "zod";

// Order type enum
export const orderTypeSchema = z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]);

// Payment method enum
export const paymentMethodSchema = z.enum([
  "CASH",
  "DIGITAL_PAYMENT",
]);

// Order item schema
export const orderItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  productSku: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  costPrice: z.number().nonnegative().optional().nullable(),
  discountAmount: z.number().nonnegative().default(0),
  discountPercent: z.number().nonnegative().max(100).optional().nullable(),
  subtotal: z.number().nonnegative(),
  taxAmount: z.number().nonnegative().default(0),
  totalAmount: z.number().nonnegative(),
  notes: z.string().optional().nullable(),
});

// Customer checkout schema
export const customerCheckoutSchema = z
  .object({
    // Customer info (required for delivery)
    customerName: z.string().min(1, "Nama wajib diisi").max(255).optional(),
    customerPhone: z
      .string()
      .regex(/^[0-9]{10,15}$/, "Nomor telepon tidak valid")
      .optional(),
    customerEmail: z.string().email("Email tidak valid").optional(),
    customerAddress: z.string().max(500).optional(),

    // Order info
    tableNumber: z.string().max(20).optional(),
    orderType: orderTypeSchema,

    // Payment
    paymentMethod: paymentMethodSchema,

    // Items
    items: z.array(orderItemSchema).min(1, "Minimal 1 produk harus dipilih"),

    // Amounts
    subtotal: z.number().nonnegative(),
    taxAmount: z.number().nonnegative().default(0),
    taxRate: z.number().nonnegative().max(100).default(10),
    discountAmount: z.number().nonnegative().default(0),
    serviceCharge: z.number().nonnegative().default(0),
    deliveryFee: z.number().nonnegative().default(0),
    totalAmount: z.number().nonnegative(),

    // Notes
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      // Require customer name and phone for delivery
      if (data.orderType === "DELIVERY") {
        return !!data.customerName && !!data.customerPhone;
      }
      return true;
    },
    {
      message: "Nama dan nomor telepon wajib diisi untuk pengiriman",
      path: ["customerName"],
    }
  )
  .refine(
    (data) => {
      // Require table number for dine-in
      if (data.orderType === "DINE_IN") {
        return !!data.tableNumber;
      }
      return true;
    },
    {
      message: "Nomor meja wajib diisi untuk dine-in",
      path: ["tableNumber"],
    }
  );

export type CustomerCheckoutInput = z.infer<typeof customerCheckoutSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;

/**
 * Schema for creating orders from POS
 */
export const createOrderSchema = z.object({
  // Order Info
  orderNumber: z.string().min(1).max(50),
  orderType: orderTypeSchema,
  orderSource: z
    .enum(["CUSTOMER", "CASHIER", "ONLINE", "PHONE"])
    .default("CASHIER"),

  // Customer Info
  customerName: z.string().max(255).optional().nullable(),
  customerPhone: z.string().max(20).optional().nullable(),
  customerEmail: z.union([
    z.string().email("Invalid email format").max(255),
    z.null(),
  ]).optional(),
  customerAddress: z.string().optional().nullable(),
  tableNumber: z.string().max(20).optional().nullable(),

  // Order Items
  items: z.array(orderItemSchema).min(1),

  // Amounts
  subtotal: z.number().nonnegative(),
  discountAmount: z.number().nonnegative().default(0),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional().nullable(),
  discountPercentage: z.number().min(0).max(100).optional().nullable(),
  taxAmount: z.number().nonnegative().default(0),
  taxRate: z.number().min(0).max(100).optional().nullable(),
  taxType: z.enum(["INCLUSIVE", "EXCLUSIVE"]).default("INCLUSIVE"),
  serviceCharge: z.number().nonnegative().default(0),
  deliveryFee: z.number().nonnegative().default(0),
  totalAmount: z.number().positive(),

  // Payment Info
  paymentMethod: paymentMethodSchema,
  paidAmount: z.number().positive(),
  changeAmount: z.number().nonnegative().default(0),
  tipAmount: z.number().nonnegative().optional().default(0),

  // Notes
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
