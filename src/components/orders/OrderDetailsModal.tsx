"use client";

import { User, Phone, MapPin, Hash, Clock, DollarSign, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatCurrency } from "@/lib/product-utils";
import {
  getOrderTypeLabel,
  getOrderTypeIcon,
  getPaymentMethodLabel,
  formatTimeAgo,
  getStatusLabel,
} from "@/lib/order-utils";
import type { Order, OrderStatus } from "@/types/order";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onStatusUpdate?: (orderId: string, newStatus: OrderStatus) => void;
}

export function OrderDetailsModal({
  isOpen,
  onClose,
  order,
  onStatusUpdate,
}: OrderDetailsModalProps) {
  if (!order) return null;

  const canUpdateStatus =
    order.status !== "COMPLETED" && order.status !== "CANCELLED";

  const availableStatuses: OrderStatus[] = (() => {
    switch (order.status) {
      case "PENDING_PAYMENT":
        return ["PAID", "CANCELLED"];
      case "PAID":
        return ["PREPARING", "CANCELLED"];
      case "PREPARING":
        return ["READY", "CANCELLED"];
      case "READY":
        return ["COMPLETED", "CANCELLED"];
      default:
        return [];
    }
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                Order #{order.orderNumber}
                <span className="text-2xl">{getOrderTypeIcon(order.orderType)}</span>
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-1">
                {getOrderTypeLabel(order.orderType)} •{" "}
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Customer Information */}
            {(order.customer.name || order.customer.phone) && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Information
                </h3>
                <div className="space-y-2 text-sm">
                  {order.customer.name && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="h-4 w-4 text-slate-400" />
                      {order.customer.name}
                    </div>
                  )}
                  {order.customer.phone && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="h-4 w-4 text-slate-400" />
                      {order.customer.phone}
                    </div>
                  )}
                  {order.customer.tableNumber && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Hash className="h-4 w-4 text-slate-400" />
                      Table {order.customer.tableNumber}
                    </div>
                  )}
                  {order.customer.address && (
                    <div className="flex items-start gap-2 text-slate-700">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                      <span className="flex-1">{order.customer.address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">
                Order Items ({order.itemCount})
              </h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-lg p-3"
                  >
                    <div className="flex justify-between mb-1">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          {item.quantity}x {item.productName}
                        </p>
                        <p className="text-xs text-slate-500">{item.sku}</p>
                      </div>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded mt-2">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="text-slate-900">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                {order.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tax:</span>
                    <span className="text-slate-900">{formatCurrency(order.taxAmount)}</span>
                  </div>
                )}
                {order.tipAmount > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Tip:</span>
                    <span>{formatCurrency(order.tipAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-300">
                  <span className="text-slate-900">Total:</span>
                  <span className="text-slate-900">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Method:</span>
                  <span className="font-medium text-slate-900">
                    {getPaymentMethodLabel(order.payment.method)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount Paid:</span>
                  <span className="text-slate-900">
                    {formatCurrency(order.payment.amountPaid)}
                  </span>
                </div>
                {order.payment.amountTendered && order.payment.method === "CASH" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Amount Tendered:</span>
                      <span className="text-slate-900">
                        {formatCurrency(order.payment.amountTendered)}
                      </span>
                    </div>
                    {order.payment.change !== undefined && (
                      <div className="flex justify-between text-green-600">
                        <span>Change:</span>
                        <span>{formatCurrency(order.payment.change)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Timeline */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Order Timeline
              </h3>
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200" />

                {/* Timeline Items */}
                <div className="space-y-4">
                  {order.timeline.map((event, index) => {
                    const isLast = index === order.timeline.length - 1;
                    const isActive = event.status === order.status;

                    return (
                      <div key={index} className="relative pl-10">
                        {/* Timeline Dot */}
                        <div
                          className={`absolute left-2 top-1 w-4 h-4 rounded-full border-2 ${
                            isActive
                              ? "bg-blue-500 border-blue-500"
                              : "bg-white border-slate-300"
                          }`}
                        />

                        <div
                          className={`bg-white border rounded-lg p-3 ${
                            isActive ? "border-blue-300 bg-blue-50" : "border-slate-200"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <p
                              className={`font-medium text-sm ${
                                isActive ? "text-blue-900" : "text-slate-900"
                              }`}
                            >
                              {getStatusLabel(event.status)}
                            </p>
                            {isLast && (
                              <span className="text-xs text-slate-500">
                                {formatTimeAgo(event.timestamp)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                          {event.note && (
                            <p className="text-xs text-slate-600 mt-1 italic">
                              {event.note}
                            </p>
                          )}
                          {event.updatedBy && (
                            <p className="text-xs text-slate-500 mt-1">
                              by {event.updatedBy}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Status Update Actions */}
            {canUpdateStatus && onStatusUpdate && availableStatuses.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Update Status</h3>
                <div className="space-y-2">
                  {availableStatuses.map((status) => (
                    <Button
                      key={status}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        onStatusUpdate(order.id, status);
                        onClose();
                      }}
                    >
                      Move to {getStatusLabel(status)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-2">Order Notes</h3>
                <p className="text-sm text-amber-800">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
