"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Phone,
  User,
  Mail,
  UtensilsCrossed,
  Package,
  CreditCard,
  StickyNote,
} from "lucide-react";
import Image from "next/image";

interface OrderItem {
  id: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string | null;
  product: {
    imageUrl: string | null;
    category: {
      name: string;
      color: string | null;
    };
  };
}

interface OrderDetailsProps {
  orderNumber: string;
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  tableNumber?: string | null;
  paymentMethod: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string | null;
}

export function OrderDetails({
  orderNumber,
  orderType,
  customerName,
  customerPhone,
  customerEmail,
  customerAddress,
  tableNumber,
  paymentMethod,
  items,
  subtotal,
  taxAmount,
  serviceCharge,
  deliveryFee,
  discountAmount,
  totalAmount,
  notes,
}: OrderDetailsProps) {
  // Get order type label
  const getOrderTypeLabel = () => {
    switch (orderType) {
      case "DINE_IN":
        return "Dine In";
      case "TAKEAWAY":
        return "Take Away";
      case "DELIVERY":
        return "Delivery";
    }
  };

  // Get payment method label
  const getPaymentMethodLabel = () => {
    switch (paymentMethod) {
      case "CASH":
        return "Tunai";
      case "QRIS":
        return "QRIS";
      case "BANK_TRANSFER":
        return "Transfer Bank";
      case "CREDIT_CARD":
        return "Kartu Kredit";
      case "DEBIT_CARD":
        return "Kartu Debit";
      case "E_WALLET":
        return "E-Wallet";
      default:
        return paymentMethod;
    }
  };

  return (
    <div className="space-y-6">
      {/* Order Information */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Informasi Pesanan</h3>

        <div className="space-y-4">
          {/* Order Number */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Nomor Pesanan</span>
            <span className="font-medium">{orderNumber}</span>
          </div>

          {/* Order Type */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Tipe Pesanan</span>
            <Badge variant="outline">{getOrderTypeLabel()}</Badge>
          </div>

          {/* Table Number (for dine-in) */}
          {orderType === "DINE_IN" && tableNumber && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                Nomor Meja
              </span>
              <span className="font-medium">{tableNumber}</span>
            </div>
          )}

          {/* Payment Method */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Metode Pembayaran
            </span>
            <span className="font-medium">{getPaymentMethodLabel()}</span>
          </div>

          {/* Customer Info */}
          {(customerName || customerPhone || customerEmail || customerAddress) && (
            <>
              <Separator />

              {customerName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nama
                  </span>
                  <span className="font-medium">{customerName}</span>
                </div>
              )}

              {customerPhone && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telepon
                  </span>
                  <span className="font-medium">{customerPhone}</span>
                </div>
              )}

              {customerEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </span>
                  <span className="font-medium">{customerEmail}</span>
                </div>
              )}

              {customerAddress && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    Alamat
                  </span>
                  <span className="font-medium text-right flex-1">
                    {customerAddress}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Order Notes */}
          {notes && (
            <>
              <Separator />
              <div className="flex items-start gap-2">
                <StickyNote className="w-4 h-4 text-slate-600 mt-1" />
                <div>
                  <p className="text-sm text-slate-600 mb-1">Catatan</p>
                  <p className="text-sm font-medium">{notes}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Order Items */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Detail Pesanan</h3>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              {/* Product Image */}
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                {item.product.imageUrl ? (
                  <Image
                    src={item.product.imageUrl}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-slate-400" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{item.productName}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {item.quantity} x Rp{" "}
                  {Number(item.unitPrice).toLocaleString("id-ID")}
                </p>
                {item.notes && (
                  <p className="text-xs text-slate-600 mt-1 italic">
                    Catatan: {item.notes}
                  </p>
                )}
              </div>

              {/* Item Total */}
              <div className="text-right flex-shrink-0">
                <p className="font-medium text-sm">
                  Rp {Number(item.totalAmount).toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Price Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span>Rp {Number(subtotal).toLocaleString("id-ID")}</span>
          </div>

          {Number(discountAmount) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Diskon</span>
              <span>- Rp {Number(discountAmount).toLocaleString("id-ID")}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Pajak</span>
            <span>Rp {Number(taxAmount).toLocaleString("id-ID")}</span>
          </div>

          {Number(serviceCharge) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Biaya Layanan</span>
              <span>Rp {Number(serviceCharge).toLocaleString("id-ID")}</span>
            </div>
          )}

          {Number(deliveryFee) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Biaya Pengiriman</span>
              <span>Rp {Number(deliveryFee).toLocaleString("id-ID")}</span>
            </div>
          )}

          <Separator className="my-3" />

          <div className="flex justify-between">
            <span className="font-semibold text-lg">Total</span>
            <span className="font-bold text-lg">
              Rp {Number(totalAmount).toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
