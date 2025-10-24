/**
 * Orders Management Page
 * src/app/admin/orders/page.tsx
 */

"use client";

import { useState } from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { OrderDetailsModal } from "@/components/orders/OrderDetailsModal";
import { UpdateStatusModal } from "@/components/orders/UpdateStatusModal";
import { CancelOrderDialog } from "@/components/orders/CancelOrderDialog";
import { BulkActionsBar } from "@/components/orders/BulkActionsBar";
import { OrderStats } from "@/components/orders/OrderStats";
import { useOrders } from "@/hooks/useOrders";
import { exportOrdersToCSV } from "@/lib/order-utils";
import type { Order, OrderQueryParams } from "@/types/order";

function OrdersPageContent() {
  // State for filters
  const [filters, setFilters] = useState<OrderQueryParams>({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // State for modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // State for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch orders
  const { data, isLoading } = useOrders(filters);

  // Handlers
  const handleFiltersChange = (newFilters: OrderQueryParams) => {
    setFilters(newFilters);
    setSelectedIds([]); // Clear selection when filters change
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = (order: Order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const handleCancelOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowCancelDialog(true);
  };

  const handleExportCSV = () => {
    if (data?.data) {
      exportOrdersToCSV(data.data);
    }
  };

  const handleCloseModals = () => {
    setShowDetailsModal(false);
    setShowStatusModal(false);
    setShowCancelDialog(false);
    setSelectedOrder(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-600 mt-1">
            Manage and track all your orders
          </p>
        </div>

        {/* Stats */}
        <OrderStats summary={data?.summary} />

        {/* Filters */}
        <OrderFilters filters={filters} onFiltersChange={handleFiltersChange} />

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <BulkActionsBar
            selectedCount={selectedIds.length}
            onClearSelection={() => setSelectedIds([])}
            onExport={() => {
              const selectedOrders = data?.data.filter((o) =>
                selectedIds.includes(o.id)
              );
              if (selectedOrders) {
                exportOrdersToCSV(selectedOrders, "selected-orders.csv");
              }
            }}
          />
        )}

        {/* Orders Table */}
        <OrdersTable
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onViewDetails={handleViewDetails}
          onUpdateStatus={handleUpdateStatus}
          onCancelOrder={handleCancelOrder}
          onExportCSV={handleExportCSV}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />

        {/* Modals */}
        <OrderDetailsModal
          open={showDetailsModal}
          onClose={handleCloseModals}
          order={selectedOrder}
          onUpdateStatus={(order) => {
            handleCloseModals();
            handleUpdateStatus(order);
          }}
        />

        <UpdateStatusModal
          open={showStatusModal}
          onClose={handleCloseModals}
          order={selectedOrder}
        />

        <CancelOrderDialog
          open={showCancelDialog}
          onClose={handleCloseModals}
          order={selectedOrder}
        />
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <QueryProvider>
      <OrdersPageContent />
    </QueryProvider>
  );
}