"use client";

import { CreditCard, Percent, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/product-utils";
import type { POSCart } from "@/types/pos";

interface OrderSummaryProps {
  cart: POSCart;
  onUpdateDiscount: (amount: number, type: "PERCENTAGE" | "FIXED_AMOUNT") => void;
  onCheckout: () => void;
  isProcessing?: boolean;
  className?: string;
}

export function OrderSummary({
  cart,
  onUpdateDiscount,
  onCheckout,
  isProcessing = false,
  className = "",
}: OrderSummaryProps) {
  const handleDiscountChange = (value: string, type: "PERCENTAGE" | "FIXED_AMOUNT") => {
    const amount = parseFloat(value) || 0;
    onUpdateDiscount(amount, type);
  };

  const isCartEmpty = cart.items.length === 0;

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-4 ${className}`}>
      {/* Order Summary Title */}
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Order Summary
      </h3>

      {/* Summary Details */}
      <div className="space-y-3 mb-4">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-medium text-slate-900">
            {formatCurrency(cart.subtotal)}
          </span>
        </div>

        {/* Discount Input */}
        <div className="space-y-2">
          <Label htmlFor="discount" className="text-xs text-slate-600">
            Discount
          </Label>
          <div className="flex gap-2">
            <Select
              value={cart.discountType || "PERCENTAGE"}
              onValueChange={(value) => {
                const type = value as "PERCENTAGE" | "FIXED_AMOUNT";
                onUpdateDiscount(
                  cart.discountType === type
                    ? cart.discountPercentage || cart.discountAmount
                    : 0,
                  type
                );
              }}
            >
              <SelectTrigger className="w-24 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">
                  <div className="flex items-center gap-1">
                    <Percent className="h-3 w-3" />%
                  </div>
                </SelectItem>
                <SelectItem value="FIXED_AMOUNT">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    IDR
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              id="discount"
              type="number"
              min="0"
              max={cart.discountType === "PERCENTAGE" ? 100 : undefined}
              step={cart.discountType === "PERCENTAGE" ? 1 : 1000}
              value={
                cart.discountType === "PERCENTAGE"
                  ? cart.discountPercentage || 0
                  : cart.discountAmount || 0
              }
              onChange={(e) =>
                handleDiscountChange(
                  e.target.value,
                  cart.discountType || "PERCENTAGE"
                )
              }
              className="flex-1 h-9"
              placeholder="0"
            />
          </div>
          {cart.discountAmount > 0 && (
            <p className="text-xs text-green-600">
              -{formatCurrency(cart.discountAmount)} discount applied
            </p>
          )}
        </div>

        {/* Tax */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">
            Tax ({(cart.taxRate * 100).toFixed(0)}%)
          </span>
          <span className="font-medium text-slate-900">
            {formatCurrency(cart.taxAmount)}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 pt-3 mt-3">
          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-slate-900">Total</span>
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(cart.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <Button
        onClick={onCheckout}
        disabled={isCartEmpty || isProcessing}
        className="w-full h-12 text-base font-semibold gap-2"
        size="lg"
      >
        <CreditCard className="h-5 w-5" />
        {isProcessing ? "Processing..." : "Proceed to Payment"}
      </Button>

      {/* Item Count */}
      {cart.items.length > 0 && (
        <p className="text-xs text-center text-slate-500 mt-3">
          {cart.items.length} item{cart.items.length !== 1 ? "s" : ""} in cart
        </p>
      )}
    </div>
  );
}
