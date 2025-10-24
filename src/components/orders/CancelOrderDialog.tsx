/**
 * Cancel Order Dialog Component
 * src/components/orders/CancelOrderDialog.tsx
 */

"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCancelOrder } from "@/hooks/useOrders";
import { formatCurrency } from "@/lib/order-utils";
import type { Order } from "@/types/order";

interface CancelOrderDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
}

const CANCELLATION_REASONS = [
  "Customer requested cancellation",
  "Payment failed",
  "Out of stock items",
  "Wrong order details",
  "Duplicate order",
  "Restaurant too busy",
  "Other",
];

export function CancelOrderDialog({
  open,
  onClose,
  order,
}: CancelOrderDialogProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const cancelOrder = useCancelOrder();

  if (!open || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const reason =
      selectedReason === "Other" ? customReason : selectedReason;

    if (!reason) {
      return;
    }

    try {
      await cancelOrder.mutateAsync({
        id: order.id,
        reason,
      });
      onClose();
      setSelectedReason("");
      setCustomReason("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    if (!cancelOrder.isPending) {
      onClose();
      setSelectedReason("");
      setCustomReason("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Cancel Order
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              disabled={cancelOrder.isPending}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Warning */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. The
                order will be marked as cancelled and removed from the active
                orders list.
              </p>
            </div>

            {/* Order Info */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Order Number</span>
                <span className="font-medium text-slate-900">
                  {order.orderNumber}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Amount</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
              {order.customerName && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Customer</span>
                  <span className="font-medium text-slate-900">
                    {order.customerName}
                  </span>
                </div>
              )}
            </div>

            {/* Cancellation Reason */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Reason for Cancellation <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="">Select a reason...</option>
                {CANCELLATION_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Reason */}
            {selectedReason === "Other" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Please specify <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter cancellation reason..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={cancelOrder.isPending}
              >
                Keep Order
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={
                  !selectedReason ||
                  (selectedReason === "Other" && !customReason) ||
                  cancelOrder.isPending
                }
              >
                {cancelOrder.isPending ? "Cancelling..." : "Cancel Order"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}