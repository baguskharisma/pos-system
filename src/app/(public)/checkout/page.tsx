"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { OrderSuccessModal } from "@/components/checkout/OrderSuccessModal";
import { useCartStore } from "@/store/cart";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getItemCount } = useCartStore();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [orderData, setOrderData] = useState<{
    orderId: string;
    orderNumber: string;
  } | null>(null);

  // Redirect if cart is empty
  useEffect(() => {
    if (getItemCount() === 0) {
      router.push("/");
    }
  }, [getItemCount, router]);

  const handleOrderSuccess = (orderId: string, orderNumber: string) => {
    // Redirect to order tracking page instead of showing modal
    router.push(`/order/${orderId}`);
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setOrderData(null);
  };

  // Don't render if cart is empty
  if (getItemCount() === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Checkout</h1>
              <p className="text-sm text-slate-500">
                Lengkapi informasi untuk menyelesaikan pesanan
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Checkout Form */}
          <div className="lg:col-span-2">
            <CheckoutForm onSuccess={handleOrderSuccess} />
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <OrderSummary />
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {orderData && (
        <OrderSuccessModal
          isOpen={isSuccessModalOpen}
          orderId={orderData.orderId}
          orderNumber={orderData.orderNumber}
          onClose={handleCloseSuccessModal}
        />
      )}
    </div>
  );
}
