import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Utility functions for inventory management
 */

export interface InventoryUpdateResult {
  success: boolean;
  productId: string;
  previousStock: number;
  newStock: number;
  message?: string;
  error?: string;
}

/**
 * Update inventory when an order is created/updated
 * This function handles stock deduction for order items
 */
export async function updateInventoryForOrder(
  orderId: string,
  orderItems: Array<{
    productId: string;
    quantity: number;
  }>,
  userId?: string
): Promise<InventoryUpdateResult[]> {
  const results: InventoryUpdateResult[] = [];

  for (const item of orderItems) {
    try {
      const result = await deductInventory(
        item.productId,
        item.quantity,
        {
          referenceType: "ORDER",
          referenceId: orderId,
          reason: `Order #${orderId} - Stock deduction`,
          userId,
        }
      );
      results.push(result);
    } catch (error: any) {
      results.push({
        success: false,
        productId: item.productId,
        previousStock: 0,
        newStock: 0,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Restore inventory when an order is cancelled
 */
export async function restoreInventoryForOrder(
  orderId: string,
  orderItems: Array<{
    productId: string;
    quantity: number;
  }>,
  userId?: string
): Promise<InventoryUpdateResult[]> {
  const results: InventoryUpdateResult[] = [];

  for (const item of orderItems) {
    try {
      const result = await addInventory(
        item.productId,
        item.quantity,
        {
          referenceType: "RETURN",
          referenceId: orderId,
          reason: `Order #${orderId} - Cancelled/Refunded`,
          userId,
        }
      );
      results.push(result);
    } catch (error: any) {
      results.push({
        success: false,
        productId: item.productId,
        previousStock: 0,
        newStock: 0,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Deduct inventory (stock out)
 */
export async function deductInventory(
  productId: string,
  quantity: number,
  options: {
    referenceType?: string;
    referenceId?: string;
    reason?: string;
    userId?: string;
    allowNegative?: boolean;
  } = {}
): Promise<InventoryUpdateResult> {
  const {
    referenceType = "MANUAL",
    referenceId,
    reason = "Stock deduction",
    userId,
    allowNegative = false,
  } = options;

  // Get current product
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      trackInventory: true,
      lowStockAlert: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  if (!product.trackInventory) {
    // If not tracking inventory, just return success without updating
    return {
      success: true,
      productId: product.id,
      previousStock: product.quantity,
      newStock: product.quantity,
      message: "Product does not track inventory",
    };
  }

  // Check if we have enough stock
  if (!allowNegative && product.quantity < quantity) {
    throw new Error(
      `Insufficient stock for ${product.name}. Available: ${product.quantity}, Required: ${quantity}`
    );
  }

  const newQuantity = allowNegative
    ? product.quantity - quantity
    : Math.max(0, product.quantity - quantity);

  // Update stock in transaction
  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { quantity: newQuantity },
    }),
    prisma.inventoryLog.create({
      data: {
        productId,
        type: "OUT",
        quantity,
        previousStock: product.quantity,
        currentStock: newQuantity,
        reason,
        referenceType,
        referenceId,
        userId,
      },
    }),
  ]);

  return {
    success: true,
    productId: product.id,
    previousStock: product.quantity,
    newStock: newQuantity,
    message:
      newQuantity === 0
        ? `${product.name} is now out of stock`
        : product.lowStockAlert && newQuantity <= product.lowStockAlert
        ? `${product.name} is now low stock (${newQuantity} units)`
        : undefined,
  };
}

/**
 * Add inventory (stock in)
 */
export async function addInventory(
  productId: string,
  quantity: number,
  options: {
    referenceType?: string;
    referenceId?: string;
    reason?: string;
    userId?: string;
  } = {}
): Promise<InventoryUpdateResult> {
  const {
    referenceType = "MANUAL",
    referenceId,
    reason = "Stock addition",
    userId,
  } = options;

  // Get current product
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      trackInventory: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  if (!product.trackInventory) {
    return {
      success: true,
      productId: product.id,
      previousStock: product.quantity,
      newStock: product.quantity,
      message: "Product does not track inventory",
    };
  }

  const newQuantity = product.quantity + quantity;

  // Update stock in transaction
  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { quantity: newQuantity },
    }),
    prisma.inventoryLog.create({
      data: {
        productId,
        type: referenceType === "RETURN" ? "RETURN" : "IN",
        quantity,
        previousStock: product.quantity,
        currentStock: newQuantity,
        reason,
        referenceType,
        referenceId,
        userId,
      },
    }),
  ]);

  return {
    success: true,
    productId: product.id,
    previousStock: product.quantity,
    newStock: newQuantity,
  };
}

/**
 * Check if product has sufficient stock
 */
export async function checkStockAvailability(
  productId: string,
  quantity: number
): Promise<{
  available: boolean;
  currentStock: number;
  requested: number;
  shortage: number;
}> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      quantity: true,
      trackInventory: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  if (!product.trackInventory) {
    return {
      available: true,
      currentStock: product.quantity,
      requested: quantity,
      shortage: 0,
    };
  }

  const shortage = Math.max(0, quantity - product.quantity);

  return {
    available: product.quantity >= quantity,
    currentStock: product.quantity,
    requested: quantity,
    shortage,
  };
}

/**
 * Check stock availability for multiple products
 */
export async function checkBulkStockAvailability(
  items: Array<{ productId: string; quantity: number }>
): Promise<
  Array<{
    productId: string;
    productName: string;
    available: boolean;
    currentStock: number;
    requested: number;
    shortage: number;
  }>
> {
  const productIds = items.map((item) => item.productId);

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
    select: {
      id: true,
      name: true,
      quantity: true,
      trackInventory: true,
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  return items.map((item) => {
    const product = productMap.get(item.productId);

    if (!product) {
      return {
        productId: item.productId,
        productName: "Unknown",
        available: false,
        currentStock: 0,
        requested: item.quantity,
        shortage: item.quantity,
      };
    }

    if (!product.trackInventory) {
      return {
        productId: product.id,
        productName: product.name,
        available: true,
        currentStock: product.quantity,
        requested: item.quantity,
        shortage: 0,
      };
    }

    const shortage = Math.max(0, item.quantity - product.quantity);

    return {
      productId: product.id,
      productName: product.name,
      available: product.quantity >= item.quantity,
      currentStock: product.quantity,
      requested: item.quantity,
      shortage,
    };
  });
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(categoryId?: string) {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    trackInventory: true,
    lowStockAlert: { not: null },
    OR: [
      { quantity: 0 },
      {
        AND: [
          { quantity: { gt: 0 } },
          { quantity: { lte: prisma.raw(`"lowStockAlert"`) } },
        ],
      },
    ],
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  return prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      lowStockAlert: true,
      price: true,
      costPrice: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { quantity: "asc" },
  });
}

/**
 * Get inventory value summary
 */
export async function getInventoryValueSummary(categoryId?: string) {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    trackInventory: true,
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  const products = await prisma.product.findMany({
    where,
    select: {
      quantity: true,
      costPrice: true,
      price: true,
    },
  });

  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.quantity * Number(p.costPrice || 0),
    0
  );

  const totalPotentialRevenue = products.reduce(
    (sum, p) => sum + p.quantity * Number(p.price),
    0
  );

  const totalUnits = products.reduce((sum, p) => sum + p.quantity, 0);

  return {
    totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
    totalPotentialRevenue: Math.round(totalPotentialRevenue * 100) / 100,
    totalUnits,
    potentialProfit: Math.round((totalPotentialRevenue - totalInventoryValue) * 100) / 100,
    profitMargin:
      totalInventoryValue > 0
        ? Math.round(
            ((totalPotentialRevenue - totalInventoryValue) / totalInventoryValue) *
              10000
          ) / 100
        : 0,
  };
}
