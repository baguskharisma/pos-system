"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  Eye,
  MoreVertical,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { DateRangePicker } from "./DateRangePicker";
import { formatCurrency } from "@/lib/product-utils";
import {
  getOrderTypeLabel,
  getOrderTypeIcon,
  getPaymentMethodLabel,
  formatTimeAgo,
  getStatusLabel,
} from "@/lib/order-utils";
import type { Order, OrderStatus, OrderType, PaymentMethod } from "@/types/order";

interface OrdersTableProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onStatusUpdate?: (orderId: string, newStatus: OrderStatus) => void;
  onRefresh?: () => void;
}

export function OrdersTable({
  orders,
  onOrderClick,
  onStatusUpdate,
  onRefresh,
}: OrdersTableProps) {
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
  const [selectedOrderTypes, setSelectedOrderTypes] = useState<OrderType[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<PaymentMethod[]>(
    []
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesOrderNumber = order.orderNumber.toString().includes(searchLower);
      const matchesCustomer =
        order.customer.name?.toLowerCase().includes(searchLower) ||
        order.customer.phone?.toLowerCase().includes(searchLower);
      if (!matchesOrderNumber && !matchesCustomer) return false;
    }

    // Status filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(order.status)) {
      return false;
    }

    // Order type filter
    if (
      selectedOrderTypes.length > 0 &&
      !selectedOrderTypes.includes(order.orderType)
    ) {
      return false;
    }

    // Payment method filter
    if (
      selectedPaymentMethods.length > 0 &&
      !selectedPaymentMethods.includes(order.payment.method)
    ) {
      return false;
    }

    // Date range filter
    if (dateFrom) {
      const orderDate = new Date(order.createdAt);
      const fromDate = new Date(dateFrom);
      if (orderDate < fromDate) return false;
    }

    if (dateTo) {
      const orderDate = new Date(order.createdAt);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (orderDate > toDate) return false;
    }

    return true;
  });

  const allStatuses: OrderStatus[] = [
    "PENDING",
    "PREPARING",
    "READY",
    "COMPLETED",
    "CANCELLED",
  ];
  const allOrderTypes: OrderType[] = ["DINE_IN", "TAKEAWAY", "DELIVERY"];
  const allPaymentMethods: PaymentMethod[] = [
    "CASH",
    "CARD",
    "E_WALLET",
    "BANK_TRANSFER",
  ];

  const toggleStatus = (status: OrderStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const toggleOrderType = (type: OrderType) => {
    setSelectedOrderTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedStatuses([]);
    setSelectedOrderTypes([]);
    setSelectedPaymentMethods([]);
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters =
    search ||
    selectedStatuses.length > 0 ||
    selectedOrderTypes.length > 0 ||
    selectedPaymentMethods.length > 0 ||
    dateFrom ||
    dateTo;

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleBulkStatusUpdate = (newStatus: OrderStatus) => {
    if (!onStatusUpdate) return;

    selectedOrders.forEach((orderId) => {
      onStatusUpdate(orderId, newStatus);
    });

    setSelectedOrders(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by order number, customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? "border-blue-500 text-blue-600" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {[
                  selectedStatuses.length,
                  selectedOrderTypes.length,
                  selectedPaymentMethods.length,
                  dateFrom ? 1 : 0,
                  dateTo ? 1 : 0,
                ].reduce((a, b) => a + b, 0)}
              </span>
            )}
          </Button>

          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Status
              </label>
              <div className="space-y-2">
                {allStatuses.map((status) => (
                  <label
                    key={status}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedStatuses.includes(status)}
                      onCheckedChange={() => toggleStatus(status)}
                    />
                    <span className="flex-1">{getStatusLabel(status)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Order Type Filter */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Order Type
              </label>
              <div className="space-y-2">
                {allOrderTypes.map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedOrderTypes.includes(type)}
                      onCheckedChange={() => toggleOrderType(type)}
                    />
                    <span className="flex-1">
                      {getOrderTypeIcon(type)} {getOrderTypeLabel(type)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Method Filter */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Payment Method
              </label>
              <div className="space-y-2">
                {allPaymentMethods.map((method) => (
                  <label
                    key={method}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedPaymentMethods.includes(method)}
                      onCheckedChange={() => togglePaymentMethod(method)}
                    />
                    <span className="flex-1">{getPaymentMethodLabel(method)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Date Range
            </label>
            <DateRangePicker
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              onClear={() => {
                setDateFrom("");
                setDateTo("");
              }}
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex justify-end pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      {selectedOrders.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedOrders.size} order{selectedOrders.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allStatuses.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleBulkStatusUpdate(status)}
                  >
                    Move to {getStatusLabel(status)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedOrders(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Showing {filteredOrders.length} of {orders.length} orders
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Checkbox
                    checked={
                      filteredOrders.length > 0 &&
                      selectedOrders.size === filteredOrders.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => onOrderClick(order)}
                  >
                    <td
                      className="px-4 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedOrders.has(order.id)}
                        onCheckedChange={() => toggleSelectOrder(order.id)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          #{order.orderNumber}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          {getOrderTypeIcon(order.orderType)}{" "}
                          {getOrderTypeLabel(order.orderType)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm text-slate-900">
                          {order.customer.name || "-"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.customer.phone || "-"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-900">
                        {order.itemCount} items
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {getPaymentMethodLabel(order.payment.method)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-slate-600">
                        {formatTimeAgo(order.createdAt)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </td>
                    <td
                      className="px-4 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onOrderClick(order)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {onStatusUpdate &&
                            order.status !== "COMPLETED" &&
                            order.status !== "CANCELLED" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                {order.status === "PENDING" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onStatusUpdate(order.id, "PREPARING")
                                      }
                                    >
                                      Move to Preparing
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onStatusUpdate(order.id, "CANCELLED")
                                      }
                                      className="text-red-600"
                                    >
                                      Cancel Order
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {order.status === "PREPARING" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => onStatusUpdate(order.id, "READY")}
                                    >
                                      Move to Ready
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onStatusUpdate(order.id, "CANCELLED")
                                      }
                                      className="text-red-600"
                                    >
                                      Cancel Order
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {order.status === "READY" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onStatusUpdate(order.id, "COMPLETED")
                                      }
                                    >
                                      Mark as Completed
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onStatusUpdate(order.id, "CANCELLED")
                                      }
                                      className="text-red-600"
                                    >
                                      Cancel Order
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
