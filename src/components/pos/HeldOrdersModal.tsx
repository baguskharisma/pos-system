"use client";

import { Clock, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/product-utils";
import type { HeldOrder } from "@/types/pos";

interface HeldOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldOrders: HeldOrder[];
  onRecallOrder: (order: HeldOrder) => void;
  onDeleteHeldOrder: (orderId: string) => void;
}

export function HeldOrdersModal({
  isOpen,
  onClose,
  heldOrders,
  onRecallOrder,
  onDeleteHeldOrder,
}: HeldOrdersModalProps) {
  const formatHeldTime = (heldAt: string) => {
    const date = new Date(heldAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const getOrderTypeLabel = (type: string) => {
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Held Orders ({heldOrders.length})
          </DialogTitle>
        </DialogHeader>

        {heldOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Clock className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              No held orders
            </h3>
            <p className="text-sm text-slate-500">
              Hold an order to save it for later
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {heldOrders.map((order) => (
              <div
                key={order.id}
                className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-slate-900">
                        Order #{order.orderNumber}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {getOrderTypeLabel(order.cart.orderType)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      {formatHeldTime(order.heldAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteHeldOrder(order.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                    title="Delete held order"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Customer Info */}
                {order.cart.customerInfo.name && (
                  <div className="text-sm text-slate-600 mb-2">
                    Customer: {order.cart.customerInfo.name}
                    {order.cart.customerInfo.phone && (
                      <span className="ml-2">• {order.cart.customerInfo.phone}</span>
                    )}
                  </div>
                )}

                {/* Order Items */}
                <div className="bg-slate-50 rounded-md p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {order.cart.items.length} item{order.cart.items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {order.cart.items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="text-xs text-slate-600 flex justify-between"
                      >
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    {order.cart.items.length > 3 && (
                      <p className="text-xs text-slate-500 italic">
                        +{order.cart.items.length - 3} more item{order.cart.items.length - 3 !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-slate-600">
                    <div>Subtotal: {formatCurrency(order.cart.subtotal)}</div>
                    {order.cart.discountAmount > 0 && (
                      <div className="text-green-600">
                        Discount: -{formatCurrency(order.cart.discountAmount)}
                      </div>
                    )}
                    {order.cart.taxEnabled && (
                      <div>Tax: {formatCurrency(order.cart.taxAmount)}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 mb-1">Total</div>
                    <div className="text-xl font-bold text-slate-900">
                      {formatCurrency(order.cart.total)}
                    </div>
                  </div>
                </div>

                {/* Recall Button */}
                <Button
                  onClick={() => {
                    onRecallOrder(order);
                    onClose();
                  }}
                  className="w-full"
                  variant="default"
                >
                  Recall Order
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
