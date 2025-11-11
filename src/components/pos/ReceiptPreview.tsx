"use client";

import { Receipt, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/product-utils";
import type { POSCart, PaymentInfo } from "@/types/pos";

interface ReceiptPreviewProps {
  orderNumber: number;
  cart: POSCart;
  payment: PaymentInfo;
  onPrint?: () => void;
  onShare?: () => void;
  className?: string;
}

export function ReceiptPreview({
  orderNumber,
  cart,
  payment,
  onPrint,
  onShare,
  className = "",
}: ReceiptPreviewProps) {
  const currentDate = new Date();

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH":
        return "Cash";
      case "DIGITAL_PAYMENT":
        return "Digital Payment";
      default:
        return method;
    }
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
    <div className={`bg-white ${className}`}>
      {/* Receipt Header */}
      <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
        <Receipt className="h-12 w-12 mx-auto text-slate-600 mb-2" />
        <h2 className="text-2xl font-bold text-slate-900">POS System</h2>
        <p className="text-sm text-slate-600">Payment Receipt</p>
      </div>

      {/* Order Info */}
      <div className="space-y-2 mb-4 pb-4 border-b border-slate-200">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Order Number:</span>
          <span className="font-bold text-slate-900">#{orderNumber}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Date:</span>
          <span className="text-slate-900">
            {currentDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Time:</span>
          <span className="text-slate-900">
            {currentDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Order Type:</span>
          <span className="text-slate-900">{getOrderTypeLabel(cart.orderType)}</span>
        </div>
      </div>

      {/* Customer Info */}
      {(cart.customerInfo.name || cart.customerInfo.phone) && (
        <div className="space-y-2 mb-4 pb-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700">Customer Information</h3>
          {cart.customerInfo.name && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Name:</span>
              <span className="text-slate-900">{cart.customerInfo.name}</span>
            </div>
          )}
          {cart.customerInfo.phone && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Phone:</span>
              <span className="text-slate-900">{cart.customerInfo.phone}</span>
            </div>
          )}
          {cart.customerInfo.tableNumber && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Table:</span>
              <span className="text-slate-900">{cart.customerInfo.tableNumber}</span>
            </div>
          )}
          {cart.customerInfo.address && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Address:</span>
              <span className="text-slate-900 text-right max-w-[200px]">
                {cart.customerInfo.address}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="mb-4 pb-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Order Items</h3>
        <div className="space-y-2">
          {cart.items.map((item) => (
            <div key={item.id}>
              <div className="flex justify-between text-sm">
                <div className="flex-1">
                  <span className="text-slate-900">
                    {item.quantity}x {item.name}
                  </span>
                  {item.notes && (
                    <p className="text-xs text-slate-500 italic mt-0.5">
                      Note: {item.notes}
                    </p>
                  )}
                </div>
                <span className="text-slate-900 ml-2">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-2 mb-4 pb-4 border-b-2 border-dashed border-slate-300">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Subtotal:</span>
          <span className="text-slate-900">{formatCurrency(cart.subtotal)}</span>
        </div>

        {cart.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount:</span>
            <span>-{formatCurrency(cart.discountAmount)}</span>
          </div>
        )}

        {cart.taxEnabled && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">
              Tax ({(cart.taxRate * 100).toFixed(0)}%):
            </span>
            <span className="text-slate-900">{formatCurrency(cart.taxAmount)}</span>
          </div>
        )}

        {payment.tipAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Tip:</span>
            <span className="text-slate-900">{formatCurrency(payment.tipAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-300">
          <span className="text-slate-900">Total:</span>
          <span className="text-slate-900">
            {formatCurrency(cart.total + payment.tipAmount)}
          </span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Payment Method:</span>
          <span className="font-semibold text-slate-900">
            {getPaymentMethodLabel(payment.method)}
          </span>
        </div>

        {payment.method === "CASH" && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Amount Tendered:</span>
              <span className="text-slate-900">{formatCurrency(payment.amountTendered)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Change:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(payment.change)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pt-4 border-t-2 border-dashed border-slate-300 space-y-2">
        <p className="text-xs text-slate-600">Thank you for your purchase!</p>
        <p className="text-xs text-slate-500">
          {currentDate.toLocaleString()}
        </p>
      </div>

      {/* Action Buttons */}
      {(onPrint || onShare) && (
        <div className="flex gap-2 mt-6 pt-4 border-t border-slate-200">
          {onPrint && (
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={onPrint}
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
          )}
          {onShare && (
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={onShare}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
