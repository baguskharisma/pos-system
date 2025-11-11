"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatus } from "@/components/order/OrderStatus";
import { OrderDetails } from "@/components/order/OrderDetails";
import { ReceiptPreview } from "@/components/order/ReceiptPreview";
import { useWebSocketEvent } from "@/hooks/useWebSocketEvent";
import { WebSocketEvent } from "@/lib/websocket/types";

interface Order {
  id: string;
  orderNumber: string;
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  status: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  tableNumber?: string | null;
  paymentMethod: string;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string | null;
  createdAt: string;
  paidAt?: string | null;
  preparingAt?: string | null;
  readyAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  estimatedReadyTime?: string | null;
  items: Array<{
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
  }>;
}

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params); // Unwrap params Promise
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch order details
  const fetchOrder = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true);

      const response = await fetch(`/api/public/orders/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil data pesanan");
      }

      setOrder(data.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat mengambil data"
      );
    } finally {
      setIsLoading(false);
      if (showRefreshing) setIsRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrder();
  }, [id]);
// Listen to WebSocket events for real-time updates  useWebSocketEvent(    WebSocketEvent.ORDER_STATUS_CHANGED,    (payload) => {      // Only update if it's the current order      if (payload.orderId === id) {        console.log("📡 Order status changed via WebSocket:", payload);        fetchOrder(false); // Silent refresh      }    },    [id]  );  useWebSocketEvent(    WebSocketEvent.ORDER_UPDATED,    (payload) => {      if (payload.orderId === id) {        console.log("📡 Order updated via WebSocket:", payload);        fetchOrder(false);      }    },    [id]  );

  // Auto-refresh every 30 seconds if order is not completed/cancelled
  useEffect(() => {
    if (
      !order ||
      order.status === "COMPLETED" ||
      order.status === "CANCELLED" ||
      order.status === "REFUNDED"
    ) {
      return;
    }

    const interval = setInterval(() => {
      fetchOrder(false); // Silent refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [order?.status]);

  // Manual refresh
  const handleRefresh = () => {
    fetchOrder(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2">Pesanan Tidak Ditemukan</h1>
          <p className="text-slate-600 mb-6">
            {error || "Pesanan yang Anda cari tidak dapat ditemukan"}
          </p>
          <Button onClick={() => router.push("/")}>Kembali ke Beranda</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/")}
                className="flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Lacak Pesanan</h1>
                <p className="text-sm text-slate-500">#{order.orderNumber}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Status & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Timeline */}
            <OrderStatus
              status={order.status as any}
              orderType={order.orderType}
              createdAt={new Date(order.createdAt)}
              paidAt={order.paidAt ? new Date(order.paidAt) : null}
              preparingAt={order.preparingAt ? new Date(order.preparingAt) : null}
              readyAt={order.readyAt ? new Date(order.readyAt) : null}
              completedAt={order.completedAt ? new Date(order.completedAt) : null}
              cancelledAt={order.cancelledAt ? new Date(order.cancelledAt) : null}
              estimatedReadyTime={
                order.estimatedReadyTime
                  ? new Date(order.estimatedReadyTime)
                  : null
              }
            />

            {/* Order Details */}
            <OrderDetails
              orderNumber={order.orderNumber}
              orderType={order.orderType}
              customerName={order.customerName}
              customerPhone={order.customerPhone}
              customerEmail={order.customerEmail}
              customerAddress={order.customerAddress}
              tableNumber={order.tableNumber}
              paymentMethod={order.paymentMethod}
              items={order.items}
              subtotal={Number(order.subtotal)}
              taxAmount={Number(order.taxAmount)}
              serviceCharge={Number(order.serviceCharge)}
              deliveryFee={Number(order.deliveryFee)}
              discountAmount={Number(order.discountAmount)}
              totalAmount={Number(order.totalAmount)}
              notes={order.notes}
            />
          </div>

          {/* Right Column - Receipt */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <ReceiptPreview
                orderNumber={order.orderNumber}
                orderType={order.orderType}
                createdAt={new Date(order.createdAt)}
                items={order.items}
                subtotal={Number(order.subtotal)}
                taxAmount={Number(order.taxAmount)}
                serviceCharge={Number(order.serviceCharge)}
                deliveryFee={Number(order.deliveryFee)}
                discountAmount={Number(order.discountAmount)}
                totalAmount={Number(order.totalAmount)}
                customerName={order.customerName}
                tableNumber={order.tableNumber}
                paymentMethod={order.paymentMethod}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
