/**
 * Orders Table Component
 * src/components/orders/OrdersTable.tsx
 */

"use client";

import { useState } from "react";
import {
  Eye,
  Edit,
  XCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/useOrders";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  getOrderTypeLabel,
} from "@/lib/order-utils";
import type { Order, OrderQueryParams } from "@/types/order";

interface OrdersTableProps {
  filters: OrderQueryParams;
  onFiltersChange: (filters: OrderQueryParams) => void;
  onViewDetails: (order: Order) => void;
  onUpdateStatus: (order: Order) => void;
  onCancelOrder: (order: Order) => void;
  onExportCSV: () => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function OrdersTable({
  filters,
  onFiltersChange,
  onViewDetails,
  onUpdateStatus,
  onCancelOrder,
  onExportCSV,
  selectedIds,
  onSelectionChange,
}: OrdersTableProps) {
  const { data, isLoading } = useOrders(filters);

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.data) {
      onSelectionChange(data.data.map((order) => order.id));
    } else {
      onSelectionChange([]);
    }
  };

  // Handle select single
  const handleSelect = (orderId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, orderId]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== orderId));
    }
  };

  // Handle pagination
  const goToPage = (page: number) => {
    onFiltersChange({ ...filters, page });
  };

  // Handle sort
  const handleSort = (
    sortBy: OrderQueryParams["sortBy"],
    sortOrder: "asc" | "desc"
  ) => {
    onFiltersChange({ ...filters, sortBy, sortOrder, page: 1 });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.data.length) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-600">No orders found</p>
      </div>
    );
  }

  const allSelected =
    data.data.length > 0 && selectedIds.length === data.data.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      {/* Table Header Actions */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <p className="text-sm text-slate-600">
          {data.pagination.total} order(s) found
        </p>
        <Button variant="outline" size="sm" className="gap-2" onClick={onExportCSV}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.data.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(order.id)}
                    onChange={(e) => handleSelect(order.id, e.target.checked)}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => onViewDetails(order)}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {order.orderNumber}
                  </button>
                  {order.invoiceNumber && (
                    <p className="text-xs text-slate-500">
                      {order.invoiceNumber}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-slate-900">
                    {formatDate(order.createdAt)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm">
                    {order.customerName ? (
                      <>
                        <div className="font-medium text-slate-900">
                          {order.customerName}
                        </div>
                        {order.customerPhone && (
                          <div className="text-slate-500">
                            {order.customerPhone}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400">Guest</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-slate-900">
                    {getOrderTypeLabel(order.orderType)}
                  </span>
                  {order.tableNumber && (
                    <div className="text-xs text-slate-500">
                      Table {order.tableNumber}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="font-semibold text-slate-900">
                    {formatCurrency(order.totalAmount)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {order.items?.length || 0} item(s)
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onViewDetails(order)}
                      className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {order.status !== "COMPLETED" &&
                      order.status !== "CANCELLED" &&
                      order.status !== "REFUNDED" && (
                        <>
                          <button
                            onClick={() => onUpdateStatus(order)}
                            className="p-1 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded"
                            title="Update Status"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onCancelOrder(order)}
                            className="p-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Cancel Order"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={data.pagination.page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(data.pagination.page - 1)}
              disabled={data.pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(data.pagination.page + 1)}
              disabled={!data.pagination.hasMore}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(data.pagination.totalPages)}
              disabled={
                data.pagination.page === data.pagination.totalPages
              }
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}