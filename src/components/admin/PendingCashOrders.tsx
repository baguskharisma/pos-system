'use client';

import { useState, useEffect } from 'react';
import { Clock, DollarSign, User, Calendar, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { ConfirmPaymentModal } from './ConfirmPaymentModal';
import { toast } from 'sonner';

interface PendingOrder {
  id: string;
  orderNumber: string;
  customerName?: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  cashier?: {
    name: string;
  };
  items?: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
  }>;
}

interface PendingCashOrdersProps {
  initialOrders?: PendingOrder[];
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

/**
 * PendingCashOrders Component
 * Display dan manage pending cash payment orders
 */
export function PendingCashOrders({
  initialOrders = [],
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: PendingCashOrdersProps) {
  const [orders, setOrders] = useState<PendingOrder[]>(initialOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch pending orders
  const fetchPendingOrders = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);

    try {
      const response = await fetch('/api/orders/pending-cash');
      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      setOrders(data.orders || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      if (showLoading) {
        toast.error('Gagal memuat data order');
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Auto refresh
  useEffect(() => {
    fetchPendingOrders(false);

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchPendingOrders(false);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const handleConfirmOrder = (order: PendingOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleOrderConfirmed = () => {
    fetchPendingOrders(false);
    toast.success('Order berhasil dikonfirmasi!');
  };

  // Calculate time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari yang lalu`;
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <CheckCircle2 className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Tidak Ada Pembayaran Pending
        </h3>
        <p className="text-gray-600">
          Semua pembayaran cash sudah dikonfirmasi
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Pembayaran Cash Pending ({orders.length})
          </h3>
          <p className="text-sm text-gray-600">
            Update terakhir: {lastUpdate.toLocaleTimeString('id-ID')}
          </p>
        </div>
        <button
          onClick={() => fetchPendingOrders(true)}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white border-2 border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900">
                    Order #{order.orderNumber}
                  </span>
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                    Menunggu Konfirmasi
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {order.customerName && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4" />
                      <span>{order.customerName}</span>
                    </div>
                  )}

                  {order.cashier && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4" />
                      <span>Kasir: {order.cashier.name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{getTimeAgo(order.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(order.createdAt).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Total</div>
                <div className="text-2xl font-bold text-gray-900">
                  Rp {order.totalAmount.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Items preview */}
            {order.items && order.items.length > 0 && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-medium text-gray-700 mb-2">Item Order:</div>
                <div className="space-y-1">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex justify-between text-xs text-gray-600">
                      <span>{item.quantity}x {item.productName}</span>
                      <span className="font-medium">
                        Rp {item.totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{order.items.length - 3} item lainnya
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleConfirmOrder(order)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
              >
                <DollarSign className="h-4 w-4" />
                Konfirmasi Pembayaran
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {selectedOrder && (
        <ConfirmPaymentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          onConfirm={handleOrderConfirmed}
        />
      )}
    </div>
  );
}

/**
 * PendingCashOrdersWidget Component
 * Compact widget for dashboard
 */
export function PendingCashOrdersWidget() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/orders/pending-cash');
        if (response.ok) {
          const data = await response.json();
          setCount(data.orders?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching pending count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border-2 border-yellow-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600 mb-1">Pembayaran Pending</div>
          <div className="text-3xl font-bold text-gray-900">{count}</div>
        </div>
        <div className="p-3 bg-yellow-100 rounded-lg">
          <AlertCircle className="h-6 w-6 text-yellow-600" />
        </div>
      </div>
      {count > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <a
            href="/admin/orders?status=pending"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Lihat Semua →
          </a>
        </div>
      )}
    </div>
  );
}
