/**
 * Update Status Modal Component
 * src/components/orders/UpdateStatusModal.tsx
 */

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import {
  getStatusLabel,
  getAvailableStatusTransitions,
} from "@/lib/order-utils";
import type { Order, OrderStatus } from "@/types/order";

interface UpdateStatusModalProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
}

export function UpdateStatusModal({
  open,
  onClose,
  order,
}: UpdateStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
  const [notes, setNotes] = useState("");

  const updateStatus = useUpdateOrderStatus();

  if (!open || !order) return null;

  const availableStatuses = getAvailableStatusTransitions(order.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStatus) {
      return;
    }

    try {
      await updateStatus.mutateAsync({
        id: order.id,
        data: {
          status: selectedStatus,
          notes: notes || undefined,
        },
      });
      onClose();
      setSelectedStatus("");
      setNotes("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              Update Order Status
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Current Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current Status
              </label>
              <div className="px-4 py-2 bg-slate-100 rounded-md text-slate-900">
                {getStatusLabel(order.status)}
              </div>
            </div>

            {/* New Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Status <span className="text-red-500">*</span>
              </label>
              {availableStatuses.length > 0 ? (
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select status...</option>
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-slate-600">
                  No status transitions available for this order.
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this status change..."
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Order Info */}
            <div className="bg-slate-50 rounded-lg p-4 text-sm">
              <p className="text-slate-600">Order Number</p>
              <p className="font-medium text-slate-900">{order.orderNumber}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateStatus.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedStatus || updateStatus.isPending}
              >
                {updateStatus.isPending ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}