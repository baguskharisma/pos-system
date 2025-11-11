'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PaymentStatusCard } from '@/components/payment/PaymentStatus';
import { PaymentMethodIcon } from '@/components/payment/PaymentMethodIcons';
import { Loader2, Home, FileText, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

type PaymentResult = 'success' | 'pending' | 'error' | null;

function PaymentConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult>(null);

  const orderId = searchParams.get('orderId');
  const payment = searchParams.get('payment') as PaymentResult;
  const retry = searchParams.get('retry');

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    setPaymentResult(payment);
    fetchOrderStatus();
  }, [orderId, payment]);

  const fetchOrderStatus = async () => {
    try {
      const response = await fetch(`/api/payment/check-status?orderId=${orderId}`);
      const data = await response.json();

      if (data.success) {
        setOrderData(data);
      } else {
        toast.error('Gagal memuat data order');
      }
    } catch (error) {
      console.error('Error fetching order status:', error);
      toast.error('Gagal memuat data pembayaran');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    try {
      const response = await fetch('/api/payment/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Open Snap modal with new token
        if (window.snap) {
          window.snap.pay(data.token, {
            onSuccess: () => {
              setPaymentResult('success');
              fetchOrderStatus();
            },
            onPending: () => {
              setPaymentResult('pending');
              fetchOrderStatus();
            },
            onError: () => {
              setPaymentResult('error');
              fetchOrderStatus();
            },
          });
        }
      } else {
        toast.error(data.error || 'Gagal retry pembayaran');
      }
    } catch (error) {
      toast.error('Gagal retry pembayaran');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat informasi pembayaran...</p>
        </div>
      </div>
    );
  }

  const getStatusFromResult = () => {
    if (!orderData) return 'PENDING';
    return orderData.order.paymentStatus;
  };

  const canRetry = orderData?.order.canRetry && (paymentResult === 'error' || orderData.order.paymentStatus === 'FAILED' || orderData.order.paymentStatus === 'EXPIRED');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Status Pembayaran</h1>
          <p className="text-gray-600">Order #{orderData?.order.orderNumber}</p>
        </div>

        {/* Payment Status Card */}
        <PaymentStatusCard
          status={getStatusFromResult()}
          amount={orderData?.order.totalAmount}
          orderNumber={orderData?.order.orderNumber}
          paymentMethod={orderData?.order.paymentMethod}
          paidAt={orderData?.order.paidAt}
        >
          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Success Actions */}
            {paymentResult === 'success' && orderData?.order.paymentStatus === 'COMPLETED' && (
              <>
                <Link
                  href={`/admin/orders/${orderId}`}
                  className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-center transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5" />
                    Lihat Detail Order
                  </div>
                </Link>
                <Link
                  href="/admin/pos"
                  className="block w-full px-6 py-3 border-2 border-gray-300 hover:border-gray-400 bg-white text-gray-700 font-semibold rounded-lg text-center transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Home className="h-5 w-5" />
                    Kembali ke POS
                  </div>
                </Link>
              </>
            )}

            {/* Pending Actions */}
            {paymentResult === 'pending' && (
              <>
                <button
                  onClick={fetchOrderStatus}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCcw className="h-5 w-5" />
                    Refresh Status
                  </div>
                </button>
                <p className="text-sm text-gray-600 text-center">
                  Pembayaran Anda sedang diproses. Halaman akan diperbarui otomatis.
                </p>
              </>
            )}

            {/* Failed/Expired Actions */}
            {canRetry && (
              <>
                <button
                  onClick={handleRetry}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCcw className="h-5 w-5" />
                    Coba Lagi
                  </div>
                </button>
                <Link
                  href="/admin/pos"
                  className="block w-full px-6 py-3 border-2 border-gray-300 hover:border-gray-400 bg-white text-gray-700 font-semibold rounded-lg text-center transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Home className="h-5 w-5" />
                    Kembali ke POS
                  </div>
                </Link>
              </>
            )}
          </div>
        </PaymentStatusCard>

        {/* Payment Details */}
        {orderData && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Detail Pembayaran</h3>

            {orderData.midtrans && (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-gray-900">{orderData.midtrans.transaction_id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Payment Type:</span>
                  <div>
                    <PaymentMethodIcon
                      method={orderData.order.paymentMethod || 'OTHER'}
                      size="sm"
                      showLabel={false}
                    />
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Transaction Time:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(orderData.midtrans.transaction_time).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-gray-900">
                    Rp {Number(orderData.midtrans.gross_amount).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            {retry && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Percobaan #{retry}</strong> - Ini adalah percobaan pembayaran ke-{retry}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Butuh Bantuan?</h4>
          <p className="text-sm text-blue-800 mb-3">
            Jika Anda mengalami masalah dengan pembayaran atau memiliki pertanyaan,
            silakan hubungi customer service kami.
          </p>
          <div className="flex gap-2 text-sm">
            <span className="text-blue-700">📞</span>
            <span className="text-blue-900 font-medium">+62 812-3456-7890</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    }>
      <PaymentConfirmationContent />
    </Suspense>
  );
}
