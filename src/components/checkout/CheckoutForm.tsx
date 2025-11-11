"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCartStore } from "@/store/cart";
import {
  CreditCard,
  Wallet,
  Banknote,
  QrCode,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";
type PaymentMethod = "CASH" | "DIGITAL_PAYMENT";

interface CheckoutFormProps {
  onSuccess: (orderId: string, orderNumber: string) => void;
}

export function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const router = useRouter();
  const { items, getSubtotal, getTax, clearCart } = useCartStore();

  // Form state
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle order type change
  const handleOrderTypeChange = (newOrderType: OrderType) => {
    setOrderType(newOrderType);
    // If switching to delivery and payment method is CASH, change to DIGITAL_PAYMENT
    if (newOrderType === "DELIVERY" && paymentMethod === "CASH") {
      setPaymentMethod("DIGITAL_PAYMENT");
    }
  };

  // Order types configuration
  const orderTypes = [
    {
      value: "DINE_IN" as OrderType,
      label: "Dine In",
      icon: UtensilsCrossed,
      description: "Makan di tempat",
    },
    {
      value: "TAKEAWAY" as OrderType,
      label: "Take Away",
      icon: ShoppingBag,
      description: "Dibungkus",
    },
    {
      value: "DELIVERY" as OrderType,
      label: "Delivery",
      icon: Truck,
      description: "Diantar",
    },
  ];

  // Payment methods configuration - Simplified to 2 options
  const paymentMethods = [
    {
      value: "CASH" as PaymentMethod,
      label: "Tunai",
      icon: Banknote,
      description: "Bayar saat menerima pesanan",
    },
    {
      value: "DIGITAL_PAYMENT" as PaymentMethod,
      label: "Pembayaran Digital",
      icon: Wallet,
      description: "QRIS, GoPay, ShopeePay, Transfer Bank",
    },
  ];

  // Filter available payment methods based on order type
  const availablePaymentMethods = paymentMethods.filter((method) => {
    // Disable CASH for delivery
    if (orderType === "DELIVERY" && method.value === "CASH") {
      return false;
    }
    return true;
  });

  // Calculate totals
  const subtotal = getSubtotal();
  // const tax = getTax(0.1); // DISABLED FOR CUSTOMER INTERFACE
  const tax = 0; // Tax disabled for customer interface
  const deliveryFee = orderType === "DELIVERY" ? 15000 : 0;
  // const serviceCharge = orderType === "DINE_IN" ? subtotal * 0.05 : 0; // DISABLED FOR CUSTOMER INTERFACE
  const serviceCharge = 0; // Service charge disabled for customer interface
  const total = subtotal + tax + deliveryFee + serviceCharge;

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate for delivery
    if (orderType === "DELIVERY") {
      if (!customerName.trim()) {
        newErrors.customerName = "Nama wajib diisi untuk pengiriman";
      }
      if (!customerPhone.trim()) {
        newErrors.customerPhone = "Nomor telepon wajib diisi untuk pengiriman";
      } else if (!/^[0-9]{10,15}$/.test(customerPhone)) {
        newErrors.customerPhone = "Nomor telepon tidak valid (10-15 digit)";
      }
      if (!customerAddress.trim()) {
        newErrors.customerAddress = "Alamat wajib diisi untuk pengiriman";
      }
    }

    // Validate for dine-in
    if (orderType === "DINE_IN" && !tableNumber.trim()) {
      newErrors.tableNumber = "Nomor meja wajib diisi untuk dine-in";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare order items
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.id, // Using id as SKU if not available
        quantity: item.quantity,
        unitPrice: Number(item.product.price),
        costPrice: 0,
        discountAmount: 0,
        subtotal: Number(item.product.price) * item.quantity,
        // taxAmount: Number(item.product.price) * item.quantity * 0.1, // DISABLED FOR CUSTOMER INTERFACE
        taxAmount: 0, // Tax disabled for customer interface
        totalAmount:
          Number(item.product.price) * item.quantity,
          // + Number(item.product.price) * item.quantity * 0.1, // DISABLED FOR CUSTOMER INTERFACE
        notes: item.note,
      }));

      // Prepare request body
      const requestBody = {
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        customerAddress: customerAddress || undefined,
        tableNumber: tableNumber || undefined,
        orderType,
        paymentMethod,
        items: orderItems,
        subtotal,
        taxAmount: tax, // Will be 0 (tax disabled for customer interface)
        // taxRate: 10, // DISABLED FOR CUSTOMER INTERFACE
        taxRate: 0, // Tax rate disabled for customer interface
        discountAmount: 0,
        serviceCharge,
        deliveryFee,
        totalAmount: total,
        notes: notes || undefined,
      };

      // Submit order
      const response = await fetch("/api/public/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal membuat pesanan");
      }

      // Clear cart
      clearCart();

      // Check if payment requires Midtrans redirect
      if (data.data.requiresPayment && data.data.paymentRedirectUrl) {
        // For non-cash payments, redirect to Midtrans
        console.log('🔄 Redirecting to Midtrans payment page:', data.data.paymentRedirectUrl);
        window.location.href = data.data.paymentRedirectUrl;
      } else {
        // For cash payments, redirect to order tracking page
        onSuccess(data.data.id, data.data.orderNumber);
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuat pesanan"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Type Selection */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Tipe Pesanan</h3>
        <div className="grid grid-cols-3 gap-3">
          {orderTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => handleOrderTypeChange(type.value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  orderType === type.value
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <Icon className="w-6 h-6" />
                <div className="text-center">
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-slate-500">{type.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Customer Information */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Informasi Pelanggan</h3>
        <div className="space-y-4">
          {/* Table Number (for dine-in) */}
          {orderType === "DINE_IN" && (
            <div>
              <Label htmlFor="tableNumber">
                Nomor Meja <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tableNumber"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Contoh: 5"
                className={errors.tableNumber ? "border-red-500" : ""}
              />
              {errors.tableNumber && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.tableNumber}
                </p>
              )}
            </div>
          )}

          {/* Customer Name */}
          <div>
            <Label htmlFor="customerName">
              Nama {orderType === "DELIVERY" && <span className="text-red-500">*</span>}
              {orderType !== "DELIVERY" && "(Opsional)"}
            </Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Masukkan nama Anda"
              className={errors.customerName ? "border-red-500" : ""}
            />
            {errors.customerName && (
              <p className="text-sm text-red-500 mt-1">
                {errors.customerName}
              </p>
            )}
          </div>

          {/* Customer Phone (for delivery only) */}
          {orderType === "DELIVERY" && (
            <div>
              <Label htmlFor="customerPhone">
                Nomor Telepon <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerPhone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="08123456789"
                className={errors.customerPhone ? "border-red-500" : ""}
              />
              {errors.customerPhone && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.customerPhone}
                </p>
              )}
            </div>
          )}

          {/* Delivery Address (for delivery) */}
          {orderType === "DELIVERY" && (
            <div>
              <Label htmlFor="customerAddress">
                Alamat Pengiriman <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="customerAddress"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Masukkan alamat lengkap untuk pengiriman"
                rows={3}
                className={errors.customerAddress ? "border-red-500" : ""}
              />
              {errors.customerAddress && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.customerAddress}
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Payment Method Selection */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Metode Pembayaran</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availablePaymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.value}
                type="button"
                onClick={() => setPaymentMethod(method.value)}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left",
                  paymentMethod === method.value
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <Icon className="w-6 h-6 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base mb-1">{method.label}</p>
                  <p className="text-sm text-slate-600">
                    {method.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Order Notes */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Catatan Pesanan</h3>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tambahkan catatan untuk pesanan Anda (opsional)"
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-slate-500 mt-2">
          {notes.length}/500 karakter
        </p>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
          disabled={isSubmitting}
        >
          Kembali
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting
            ? "Memproses..."
            : paymentMethod === "CASH"
            ? `Pesan Sekarang - Rp ${total.toLocaleString("id-ID")}`
            : `Lanjut ke Pembayaran - Rp ${total.toLocaleString("id-ID")}`
          }
        </Button>
      </div>
    </form>
  );
}
