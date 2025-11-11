/**
 * WebSocket notifications for inventory alerts
 * This module handles real-time notifications for inventory-related events
 */

export interface InventoryAlertNotification {
  type: "LOW_STOCK" | "OUT_OF_STOCK" | "OVERSTOCK" | "STOCK_UPDATED";
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  lowStockThreshold?: number | null;
  message: string;
  severity: "critical" | "warning" | "info";
  timestamp: string;
}

export interface StockUpdateNotification {
  type: "STOCK_UPDATED";
  productId: string;
  productName: string;
  sku: string;
  previousStock: number;
  newStock: number;
  change: number;
  reason?: string;
  timestamp: string;
}

/**
 * Emit low stock alert via WebSocket
 */
export function emitLowStockAlert(data: {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  lowStockThreshold: number;
}) {
  try {
    const io = (global as any).io;

    if (!io) {
      console.error("WebSocket server not initialized");
      return;
    }

    const notification: InventoryAlertNotification = {
      type: "LOW_STOCK",
      productId: data.productId,
      productName: data.productName,
      sku: data.sku,
      currentStock: data.currentStock,
      lowStockThreshold: data.lowStockThreshold,
      message: `${data.productName} is running low on stock (${data.currentStock} units left)`,
      severity: data.currentStock <= data.lowStockThreshold / 2 ? "critical" : "warning",
      timestamp: new Date().toISOString(),
    };

    console.log("📦 Emitting low stock alert:", notification);

    // Emit to admin room
    io.to("admin").emit("inventory:alert", notification);

    // Also emit to general inventory listeners
    io.emit("inventory:low-stock", notification);

    console.log("✓ Low stock alert emitted successfully");
  } catch (error) {
    console.error("Failed to emit low stock alert:", error);
  }
}

/**
 * Emit out of stock alert via WebSocket
 */
export function emitOutOfStockAlert(data: {
  productId: string;
  productName: string;
  sku: string;
}) {
  try {
    const io = (global as any).io;

    if (!io) {
      console.error("WebSocket server not initialized");
      return;
    }

    const notification: InventoryAlertNotification = {
      type: "OUT_OF_STOCK",
      productId: data.productId,
      productName: data.productName,
      sku: data.sku,
      currentStock: 0,
      message: `${data.productName} is now out of stock!`,
      severity: "critical",
      timestamp: new Date().toISOString(),
    };

    console.log("📦 Emitting out of stock alert:", notification);

    // Emit to admin room
    io.to("admin").emit("inventory:alert", notification);

    // Also emit to general inventory listeners
    io.emit("inventory:out-of-stock", notification);

    console.log("✓ Out of stock alert emitted successfully");
  } catch (error) {
    console.error("Failed to emit out of stock alert:", error);
  }
}

/**
 * Emit stock update notification via WebSocket
 */
export function emitStockUpdate(data: {
  productId: string;
  productName: string;
  sku: string;
  previousStock: number;
  newStock: number;
  reason?: string;
}) {
  try {
    const io = (global as any).io;

    if (!io) {
      console.error("WebSocket server not initialized");
      return;
    }

    const change = data.newStock - data.previousStock;

    const notification: StockUpdateNotification = {
      type: "STOCK_UPDATED",
      productId: data.productId,
      productName: data.productName,
      sku: data.sku,
      previousStock: data.previousStock,
      newStock: data.newStock,
      change,
      reason: data.reason,
      timestamp: new Date().toISOString(),
    };

    console.log("📦 Emitting stock update:", notification);

    // Emit to admin room
    io.to("admin").emit("inventory:updated", notification);

    // Emit to product-specific room if anyone is watching
    io.to(`product:${data.productId}`).emit("inventory:updated", notification);

    console.log("✓ Stock update emitted successfully");
  } catch (error) {
    console.error("Failed to emit stock update:", error);
  }
}

/**
 * Emit overstock alert via WebSocket
 */
export function emitOverstockAlert(data: {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  recommendedStock?: number;
}) {
  try {
    const io = (global as any).io;

    if (!io) {
      console.error("WebSocket server not initialized");
      return;
    }

    const notification: InventoryAlertNotification = {
      type: "OVERSTOCK",
      productId: data.productId,
      productName: data.productName,
      sku: data.sku,
      currentStock: data.currentStock,
      message: `${data.productName} may be overstocked (${data.currentStock} units)`,
      severity: "info",
      timestamp: new Date().toISOString(),
    };

    console.log("📦 Emitting overstock alert:", notification);

    // Emit to admin room
    io.to("admin").emit("inventory:alert", notification);

    console.log("✓ Overstock alert emitted successfully");
  } catch (error) {
    console.error("Failed to emit overstock alert:", error);
  }
}

/**
 * Helper function to check and emit alerts after stock update
 */
export function checkAndEmitInventoryAlerts(data: {
  productId: string;
  productName: string;
  sku: string;
  previousStock: number;
  newStock: number;
  lowStockThreshold?: number | null;
  reason?: string;
}) {
  // Always emit stock update
  emitStockUpdate({
    productId: data.productId,
    productName: data.productName,
    sku: data.sku,
    previousStock: data.previousStock,
    newStock: data.newStock,
    reason: data.reason,
  });

  // Check for out of stock
  if (data.newStock === 0 && data.previousStock > 0) {
    emitOutOfStockAlert({
      productId: data.productId,
      productName: data.productName,
      sku: data.sku,
    });
  }

  // Check for low stock
  if (
    data.lowStockThreshold &&
    data.newStock > 0 &&
    data.newStock <= data.lowStockThreshold &&
    data.previousStock > data.lowStockThreshold
  ) {
    emitLowStockAlert({
      productId: data.productId,
      productName: data.productName,
      sku: data.sku,
      currentStock: data.newStock,
      lowStockThreshold: data.lowStockThreshold,
    });
  }

  // Check for overstock (e.g., 3x the low stock threshold)
  if (
    data.lowStockThreshold &&
    data.newStock > data.lowStockThreshold * 3 &&
    data.previousStock <= data.lowStockThreshold * 3
  ) {
    emitOverstockAlert({
      productId: data.productId,
      productName: data.productName,
      sku: data.sku,
      currentStock: data.newStock,
      recommendedStock: data.lowStockThreshold * 2,
    });
  }
}
