'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SnapScriptLoader } from '@/components/payment/SnapScriptLoader';
import { MidtransPaymentButton } from '@/components/payment/MidtransPaymentButton';
import { PaymentMethodsList } from '@/components/payment/PaymentMethodIcons';
import { PaymentTimeout } from '@/components/payment/PaymentTimeout';
import { PaymentRetry } from '@/components/payment/PaymentRetry';
import { Loader2, ShoppingCart, CreditCard, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [snapReady, setSnapReady] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      checkPaymentStatus();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Order not found');
      }

      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Gagal memuat data order');
      toast.error('Gagal memuat data order');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payment/check-status?orderId=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setTokenInfo(data);

        // If already paid, redirect to confirmation
        if (data.order.paymentStatus === 'COMPLETED') {
          router.push(`/checkout/payment-confirmation?orderId=${orderId}&payment=success`);
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const handlePaymentExpire = () => {
    toast.error('Waktu pembayaran habis', {
      description: 'Silakan coba lagi untuk melanjutkan pembayaran',
    });
    checkPaymentStatus();
  };

  const handleRetrySuccess = (token: string) => {
    if (window.snap && snapReady) {
      window.snap.pay(token, {
        onSuccess: () => {
          router.push(`/checkout/payment-confirmation?orderId=${orderId}&payment=success`);
        },
        onPending: () => {
          router.push(`/checkout/payment-confirmation?orderId=${orderId}&payment=pending`);
        },
        onError: () => {
          router.push(`/checkout/payment-confirmation?orderId=${orderId}&payment=error`);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat data checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
              <p className="text-red-800 mb-4">{error || 'Order tidak ditemukan'}</p>
              <button
                onClick={() => router.push('/admin/pos')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Kembali ke POS
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canPay = order.status !== 'PAID' && order.status !== 'COMPLETED' && order.status !== 'CANCELLED';
  const needsRetry = tokenInfo?.order.canRetry;

  return (
    <>
      {/* Load Midtrans Snap.js */}
      <SnapScriptLoader
        onReady={() => setSnapReady(true)}
        onError={() => toast.error('Gagal memuat sistem pembayaran')}
      />

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
                <p className="text-gray-600">Order #{order.orderNumber}</p>
              </div>
            </div>

            {/* Payment Timeout */}
            {canPay && tokenInfo?.order.hasPaymentToken && !tokenInfo?.order.tokenExpired && (
              <PaymentTimeout
                expiresAt={new Date(tokenInfo.order.updatedAt || Date.now()).getTime() + 10 * 60 * 1000}
                onExpire={handlePaymentExpire}
                className="mb-4"
              />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Detail Order</h2>
                <div className="space-y-3">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.product.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity}x @ Rp {Number(item.unitPrice).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        Rp {Number(item.totalAmount).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Metode Pembayaran</h2>
                </div>
                <PaymentMethodsList />
              </div>

              {/* Retry Section */}
              {needsRetry && (
                <PaymentRetry
                  orderId={orderId}
                  orderNumber={order.orderNumber}
                  amount={Number(order.totalAmount)}
                  retryCount={tokenInfo?.retry?.retryCount || 0}
                  maxRetries={tokenInfo?.retry?.maxRetries || 5}
                  onRetrySuccess={handleRetrySuccess}
                />
              )}
            </div>

            {/* Payment Summary & Action */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Pembayaran</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">Rp {Number(order.subtotal).toLocaleString('id-ID')}</span>
                  </div>

                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Diskon</span>
                      <span className="font-medium text-green-600">
                        -Rp {Number(order.discountAmount).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}

                  {order.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pajak</span>
                      <span className="font-medium">Rp {Number(order.taxAmount).toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  {order.serviceCharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Biaya Layanan</span>
                      <span className="font-medium">Rp {Number(order.serviceCharge).toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-gray-900">
                        Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Button */}
                {canPay && !needsRetry && (
                  <MidtransPaymentButton
                    orderId={orderId}
                    orderNumber={order.orderNumber}
                    amount={Number(order.totalAmount)}
                    customerDetails={{
                      first_name: order.customerName || 'Customer',
                      email: order.customerEmail || '',
                      phone: order.customerPhone || '',
                    }}
                    className="w-full"
                  />
                )}

                {/* Info */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800">
                    🔒 Pembayaran aman dan terlindungi dengan enkripsi SSL
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
