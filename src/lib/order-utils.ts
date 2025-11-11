import type { Order, OrderStatus, OrderType, PaymentMethod } from "@/types/order";

/**
 * Get status color for badges
 */
export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "PREPARING":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "READY":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
}

/**
 * Get status label
 */
export function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "PREPARING":
      return "Preparing";
    case "READY":
      return "Ready";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

/**
 * Get order type label
 */
export function getOrderTypeLabel(type: OrderType): string {
  switch (type) {
    case "DINE_IN":
      return "Dine In";
    case "TAKEAWAY":
      return "Takeaway";
    case "DELIVERY":
      return "Delivery";
    default:
      return type;
  }
}

/**
 * Get payment method label
 */
export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case "CASH":
      return "Cash";
    case "DIGITAL_PAYMENT":
      return "Digital Payment";
    default:
      return method;
  }
}

/**
 * Get order type icon
 */
export function getOrderTypeIcon(type: OrderType): string {
  switch (type) {
    case "DINE_IN":
      return "🍽️";
    case "TAKEAWAY":
      return "🛍️";
    case "DELIVERY":
      return "🚚";
    default:
      return "📦";
  }
}

/**
 * Format time ago (e.g., "5 minutes ago")
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}

/**
 * Export orders to CSV
 */
export function exportOrdersToCSV(orders: Order[], filename = "orders.csv"): void {
  const headers = [
    "Order Number",
    "Status",
    "Order Type",
    "Customer Name",
    "Customer Phone",
    "Items",
    "Subtotal",
    "Discount",
    "Tax",
    "Tip",
    "Total",
    "Payment Method",
    "Created At",
    "Completed At",
  ];

  const rows = orders.map((order) => [
    order.orderNumber,
    getStatusLabel(order.status),
    getOrderTypeLabel(order.orderType),
    order.customer.name || "-",
    order.customer.phone || "-",
    order.itemCount,
    order.subtotal,
    order.discountAmount,
    order.taxAmount,
    order.tipAmount,
    order.total,
    getPaymentMethodLabel(order.payment.method),
    new Date(order.createdAt).toLocaleString(),
    order.completedAt ? new Date(order.completedAt).toLocaleString() : "-",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Filter orders based on filters
 */
export function filterOrders(
  orders: Order[],
  filters: {
    status?: OrderStatus[];
    orderType?: OrderType[];
    paymentMethod?: PaymentMethod[];
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }
): Order[] {
  return orders.filter((order) => {
    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(order.status)) return false;
    }

    // Order type filter
    if (filters.orderType && filters.orderType.length > 0) {
      if (!filters.orderType.includes(order.orderType)) return false;
    }

    // Payment method filter
    if (filters.paymentMethod && filters.paymentMethod.length > 0) {
      if (!filters.paymentMethod.includes(order.payment.method)) return false;
    }

    // Date range filter
    if (filters.dateFrom) {
      const orderDate = new Date(order.createdAt);
      const fromDate = new Date(filters.dateFrom);
      if (orderDate < fromDate) return false;
    }

    if (filters.dateTo) {
      const orderDate = new Date(order.createdAt);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (orderDate > toDate) return false;
    }

    // Search filter (order number, customer name, phone)
    if (filters.search && filters.search.trim() !== "") {
      const searchLower = filters.search.toLowerCase();
      const matchesOrderNumber = order.orderNumber
        .toString()
        .includes(searchLower);
      const matchesCustomerName =
        order.customer.name?.toLowerCase().includes(searchLower) || false;
      const matchesCustomerPhone =
        order.customer.phone?.toLowerCase().includes(searchLower) || false;

      if (!matchesOrderNumber && !matchesCustomerName && !matchesCustomerPhone) {
        return false;
      }
    }

    return true;
  });
}
