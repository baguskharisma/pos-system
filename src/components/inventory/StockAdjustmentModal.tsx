"use client";

import { useState } from "react";
import { X, Plus, Minus, Package, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    lowStockThreshold?: number | null;
  } | null;
  onSubmit: (data: {
    productId: string;
    type: string;
    quantity: number;
    reason: string;
    notes?: string;
  }) => Promise<void>;
}

export function StockAdjustmentModal({
  isOpen,
  onClose,
  product,
  onSubmit,
}: StockAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<
    "IN" | "OUT" | "ADJUSTMENT" | "DAMAGE" | "RETURN" | "STOCK_TAKE"
  >("IN");
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (quantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    if (!reason.trim()) {
      setError("Reason is required");
      return;
    }

    if (adjustmentType === "OUT" && quantity > product.currentStock) {
      setError(`Cannot remove more than current stock (${product.currentStock})`);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        productId: product.id,
        type: adjustmentType,
        quantity,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });

      // Reset form
      setAdjustmentType("IN");
      setQuantity(0);
      setReason("");
      setNotes("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to adjust stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNewStock = () => {
    switch (adjustmentType) {
      case "IN":
      case "RETURN":
        return product.currentStock + quantity;
      case "OUT":
      case "DAMAGE":
        return Math.max(0, product.currentStock - quantity);
      case "ADJUSTMENT":
      case "STOCK_TAKE":
        return quantity;
      default:
        return product.currentStock;
    }
  };

  const newStock = getNewStock();
  const willBeLowStock =
    product.lowStockThreshold && newStock <= product.lowStockThreshold;
  const willBeOutOfStock = newStock === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Adjust Stock
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {product.name} • SKU: {product.sku}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Stock Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Stock</p>
                <p className="text-3xl font-bold text-gray-900">
                  {product.currentStock}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">New Stock</p>
                <p className={`text-3xl font-bold ${
                  willBeOutOfStock
                    ? "text-red-600"
                    : willBeLowStock
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}>
                  {newStock}
                </p>
              </div>
            </div>
            {product.lowStockThreshold && (
              <p className="text-xs text-gray-500 mt-2">
                Low stock threshold: {product.lowStockThreshold}
              </p>
            )}
          </div>

          {/* Warning */}
          {(willBeOutOfStock || willBeLowStock) && (
            <div className={`rounded-lg p-3 mb-6 flex items-start ${
              willBeOutOfStock ? "bg-red-50" : "bg-yellow-50"
            }`}>
              <AlertTriangle className={`w-5 h-5 mt-0.5 mr-2 ${
                willBeOutOfStock ? "text-red-600" : "text-yellow-600"
              }`} />
              <div>
                <p className={`font-semibold ${
                  willBeOutOfStock ? "text-red-900" : "text-yellow-900"
                }`}>
                  {willBeOutOfStock ? "Out of Stock Warning" : "Low Stock Warning"}
                </p>
                <p className={`text-sm mt-1 ${
                  willBeOutOfStock ? "text-red-700" : "text-yellow-700"
                }`}>
                  {willBeOutOfStock
                    ? "This adjustment will result in zero stock."
                    : "This adjustment will result in low stock levels."}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Adjustment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjustment Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { value: "IN", label: "Stock In", icon: Plus, color: "green" },
                  { value: "OUT", label: "Stock Out", icon: Minus, color: "red" },
                  { value: "RETURN", label: "Return", icon: Package, color: "blue" },
                  { value: "DAMAGE", label: "Damage", icon: AlertTriangle, color: "orange" },
                  { value: "ADJUSTMENT", label: "Adjustment", icon: Package, color: "purple" },
                  { value: "STOCK_TAKE", label: "Stock Take", icon: Package, color: "gray" },
                ].map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setAdjustmentType(type.value as any)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        adjustmentType === type.value
                          ? `border-${type.color}-500 bg-${type.color}-50`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${
                        adjustmentType === type.value
                          ? `text-${type.color}-600`
                          : "text-gray-600"
                      }`} />
                      <p className="text-xs font-medium">{type.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {adjustmentType === "ADJUSTMENT" || adjustmentType === "STOCK_TAKE"
                  ? "New Quantity"
                  : "Quantity"}
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                required
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Received from supplier, Damaged goods, Physical count"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adjusting..." : "Adjust Stock"}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
