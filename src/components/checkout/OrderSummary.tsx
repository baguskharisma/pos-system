"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart";
import Image from "next/image";

interface OrderSummaryProps {
  deliveryFee?: number;
  serviceCharge?: number;
}

export function OrderSummary({
  deliveryFee = 0,
  serviceCharge = 0,
}: OrderSummaryProps) {
  const { items, getItemCount, getSubtotal, getTax } = useCartStore();

  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  // const tax = getTax(0.1); // 10% tax - DISABLED FOR CUSTOMER INTERFACE
  const tax = 0; // Tax disabled for customer interface
  const total = subtotal + tax + deliveryFee + serviceCharge;

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Ringkasan Pesanan</h3>

      {/* Order Items */}
      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.product.id} className="flex gap-3">
            {/* Product Image */}
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
              {item.product.imageUrl ? (
                <Image
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  No Image
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">
                {item.product.name}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {item.quantity} x Rp {Number(item.product.price).toLocaleString("id-ID")}
              </p>
              {item.note && (
                <p className="text-xs text-slate-600 mt-1 italic">
                  Catatan: {item.note}
                </p>
              )}
            </div>

            {/* Item Total */}
            <div className="text-right flex-shrink-0">
              <p className="font-medium text-sm">
                Rp{" "}
                {(Number(item.product.price) * item.quantity).toLocaleString(
                  "id-ID"
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      {/* Price Breakdown */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Subtotal ({itemCount} item)</span>
          <span>Rp {subtotal.toLocaleString("id-ID")}</span>
        </div>

        {/* Tax disabled for customer interface */}
        {/* <div className="flex justify-between text-sm">
          <span className="text-slate-600">Pajak (10%)</span>
          <span>Rp {tax.toLocaleString("id-ID")}</span>
        </div> */}

        {serviceCharge > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Biaya Layanan</span>
            <span>Rp {serviceCharge.toLocaleString("id-ID")}</span>
          </div>
        )}

        {deliveryFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Biaya Pengiriman</span>
            <span>Rp {deliveryFee.toLocaleString("id-ID")}</span>
          </div>
        )}

        <Separator className="my-3" />

        <div className="flex justify-between">
          <span className="font-semibold text-lg">Total</span>
          <span className="font-bold text-lg">
            Rp {total.toLocaleString("id-ID")}
          </span>
        </div>
      </div>
    </Card>
  );
}
