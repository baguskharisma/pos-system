/**
 * Order Details Modal Component
 * src/components/orders/OrderDetailsModal.tsx
 */

"use client";

import { X, Clock, User, MapPin, Phone, Mail, CreditCard, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  getOrderTypeLabel,
  getPaymentMethodLabel,
  calculateOrderDuration,
} from "@/lib/order-utils";
import type { Order } from "@/types/order";

interface OrderDetailsModalProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  onUpdateStatus?: (order: Order) => void;
}

export function OrderDetailsModal({
  open,
  onClose,
  order,
  onUpdateStatus,
}: OrderDetailsModalProps) {
  if (!open || !order) return null;

  const duration = calculateOrderDuration(order);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Order #{order.orderNumber}
              </h2>
              {order.invoiceNumber && (
                <p className="text-sm text-slate-600 mt-1">
                  Invoice: {order.invoiceNumber}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {order.status !== "COMPLETED" &&
                order.status !== "CANCELLED" &&
                order.status !== "REFUNDED" &&
                onUpdateStatus && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateStatus(order)}
                  >
                    Update Status
                  </Button>
                )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Status and Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-2">Status</p>
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-2">Order Type</p>
                  <p className="font-medium text-slate-900">
                    {getOrderTypeLabel(order.orderType)}
                  </p>
                  {order.tableNumber && (
                    <p className="text-sm text-slate-600">
                      Table {order.tableNumber}
                    </p>
                  )}
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-2">Created</p>
                  <p className="font-medium text-slate-900">
                    {formatDate(order.createdAt)}
                  </p>
                  {duration && (
                    <p className="text-sm text-slate-600">Duration: {duration}</p>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              {(order.customerName ||
                order.customerPhone ||
                order.customerEmail ||
                order.customerAddress) && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </h3>
                  <div className="space-y-2">
                    {order.customerName && (
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-600">Name</p>
                          <p className="font-medium text-slate-900">
                            {order.customerName}
                          </p>
                        </div>
                      </div>
                    )}
                    {order.customerPhone && (
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-600">Phone</p>
                          <p className="font-medium text-slate-900">
                            {order.customerPhone}
                          </p>
                        </div>
                      </div>
                    )}
                    {order.customerEmail && (
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-600">Email</p>
                          <p className="font-medium text-slate-900">
                            {order.customerEmail}
                          </p>
                        </div>
                      </div>
                    )}
                    {order.customerAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-600">Address</p>
                          <p className="font-medium text-slate-900">
                            {order.customerAddress}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </h3>
                <div className="bg-slate-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                          Product
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-700 uppercase">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">
                          Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-slate-900">
                                {item.productName}
                              </p>
                              <p className="text-sm text-slate-500">
                                SKU: {item.productSku}
                              </p>
                              {item.notes && (
                                <p className="text-sm text-slate-600 italic mt-1">
                                  Note: {item.notes}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-900">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            {formatCurrency(item.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Order Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(order.subtotal)}
                    </span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        Discount
                        {order.discountPercentage &&
                          ` (${order.discountPercentage}%)`}
                      </span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(order.discountAmount)}
                      </span>
                    </div>
                  )}
                  {order.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        Tax {order.taxRate && `(${order.taxRate}%)`}
                      </span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(order.taxAmount)}
                      </span>
                    </div>
                  )}
                  {order.serviceCharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Service Charge</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(order.serviceCharge)}
                      </span>
                    </div>
                  )}
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Delivery Fee</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(order.deliveryFee)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                    <span className="text-slate-900">Total</span>
                    <span className="text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              {order.paymentMethod && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Payment Method</span>
                      <span className="font-medium text-slate-900">
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </span>
                    </div>
                    {order.paidAmount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Amount Paid</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(order.paidAmount)}
                        </span>
                      </div>
                    )}
                    {order.changeAmount && order.changeAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Change</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(order.changeAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Order Timeline
                </h3>
                <OrderTimeline order={order} />
              </div>

              {/* Notes */}
              {(order.notes || order.internalNotes || order.cancellationReason) && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Notes</h3>
                  <div className="space-y-2">
                    {order.notes && (
                      <div>
                        <p className="text-sm text-slate-600">Customer Note</p>
                        <p className="text-slate-900">{order.notes}</p>
                      </div>
                    )}
                    {order.internalNotes && (
                      <div>
                        <p className="text-sm text-slate-600">Internal Note</p>
                        <p className="text-slate-900">{order.internalNotes}</p>
                      </div>
                    )}
                    {order.cancellationReason && (
                      <div>
                        <p className="text-sm text-slate-600">
                          Cancellation Reason
                        </p>
                        <p className="text-red-900">{order.cancellationReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cashier Info */}
              {order.cashier && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">
                    Processed By
                  </h3>
                  <p className="text-slate-900">{order.cashier.name}</p>
                  <p className="text-sm text-slate-600">{order.cashier.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}