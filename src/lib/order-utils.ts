/**
 * Order utility functions
 * src/lib/order-utils.ts
 */

import type { Order, OrderStatus } from "@/types/order";

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// Format date short
export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

// Format time
export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// Get status color
export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
    AWAITING_CONFIRMATION: "bg-orange-100 text-orange-800",
    PAID: "bg-green-100 text-green-800",
    PREPARING: "bg-blue-100 text-blue-800",
    READY: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-red-100 text-red-800",
    REFUNDED: "bg-pink-100 text-pink-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

// Get status label
export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    DRAFT: "Draft",
    PENDING_PAYMENT: "Pending Payment",
    AWAITING_CONFIRMATION: "Awaiting Confirmation",
    PAID: "Paid",
    PREPARING: "Preparing",
    READY: "Ready",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded",
  };
  return labels[status] || status;
}

// Get order type label
export function getOrderTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    DINE_IN: "Dine In",
    TAKEAWAY: "Takeaway",
    DELIVERY: "Delivery",
  };
  return labels[type] || type;
}

// Get order source label
export function getOrderSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    CUSTOMER: "Customer",
    CASHIER: "Cashier",
    ONLINE: "Online",
    PHONE: "Phone",
  };
  return labels[source] || source;
}

// Get payment method label
export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    CASH: "Cash",
    BANK_TRANSFER: "Bank Transfer",
    QRIS: "QRIS",
    CREDIT_CARD: "Credit Card",
    DEBIT_CARD: "Debit Card",
    E_WALLET: "E-Wallet",
    OTHER: "Other",
  };
  return labels[method] || method;
}

// Get available status transitions
export function getAvailableStatusTransitions(
  currentStatus: OrderStatus
): OrderStatus[] {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    DRAFT: ["PENDING_PAYMENT", "CANCELLED"],
    PENDING_PAYMENT: ["AWAITING_CONFIRMATION", "PAID", "CANCELLED"],
    AWAITING_CONFIRMATION: ["PAID", "CANCELLED"],
    PAID: ["PREPARING", "CANCELLED"],
    PREPARING: ["READY", "CANCELLED"],
    READY: ["COMPLETED", "CANCELLED"],
    COMPLETED: ["REFUNDED"],
    CANCELLED: [],
    REFUNDED: [],
  };
  return transitions[currentStatus] || [];
}

// Export orders to CSV
export function exportOrdersToCSV(orders: Order[], filename?: string) {
  const headers = [
    "Order Number",
    "Invoice Number",
    "Date",
    "Customer Name",
    "Customer Phone",
    "Order Type",
    "Status",
    "Items",
    "Subtotal",
    "Discount",
    "Tax",
    "Total",
    "Payment Method",
    "Cashier",
  ];

  const rows = orders.map((order) => [
    order.orderNumber,
    order.invoiceNumber || "-",
    formatDate(order.createdAt),
    order.customerName || "-",
    order.customerPhone || "-",
    getOrderTypeLabel(order.orderType),
    getStatusLabel(order.status),
    order.items?.length || 0,
    order.subtotal,
    order.discountAmount,
    order.taxAmount,
    order.totalAmount,
    order.paymentMethod ? getPaymentMethodLabel(order.paymentMethod) : "-",
    order.cashier?.name || "-",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const value = String(cell);
          // Escape quotes and wrap in quotes if contains comma
          return value.includes(",") || value.includes('"')
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    filename || `orders_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Calculate order duration
export function calculateOrderDuration(order: Order): string | null {
  if (!order.completedAt) return null;

  const start = new Date(order.createdAt);
  const end = new Date(order.completedAt);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) {
    return `${diffMins} min`;
  }

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m`;
}

// Get order timeline events
export function getOrderTimeline(order: Order) {
  const events = [];

  events.push({
    status: "CREATED",
    label: "Order Created",
    timestamp: order.createdAt,
    icon: "ShoppingCart",
  });

  if (order.paidAt) {
    events.push({
      status: "PAID",
      label: "Payment Received",
      timestamp: order.paidAt,
      icon: "CreditCard",
    });
  }

  if (order.preparingAt) {
    events.push({
      status: "PREPARING",
      label: "Preparation Started",
      timestamp: order.preparingAt,
      icon: "ChefHat",
    });
  }

  if (order.readyAt) {
    events.push({
      status: "READY",
      label: "Order Ready",
      timestamp: order.readyAt,
      icon: "Check",
    });
  }

  if (order.completedAt) {
    events.push({
      status: "COMPLETED",
      label: "Order Completed",
      timestamp: order.completedAt,
      icon: "CheckCircle",
    });
  }

  if (order.cancelledAt) {
    events.push({
      status: "CANCELLED",
      label: "Order Cancelled",
      timestamp: order.cancelledAt,
      icon: "XCircle",
    });
  }

  return events.sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}