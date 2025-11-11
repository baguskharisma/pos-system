'use client';

import { useState } from 'react';
import { useMidtrans, createPaymentTransaction } from '@/hooks/useMidtrans';
import { toast } from 'sonner';

interface MidtransPaymentButtonProps {
  orderId: string;
  orderNumber: string;
  amount: number;
  customerDetails?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  onSuccess?: () => void;
  onError?: () => void;
  className?: string;
}

/**
 * Midtrans Payment Button Component
 *
 * Example usage:
 * ```tsx
 * <MidtransPaymentButton
 *   orderId="uuid"
 *   orderNumber="ORD-20250107-0001"
 *   amount={100000}
 *   customerDetails={{
 *     first_name: "John",
 *     email: "john@example.com",
 *     phone: "+62812345678"
 *   }}
 *   onSuccess={() => router.push('/orders/success')}
 * />
 * ```
 */
export function MidtransPaymentButton({
  orderId,
  orderNumber,
  amount,
  customerDetails,
  onSuccess,
  onError,
  className = '',
}: MidtransPaymentButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const { isReady, isLoading, pay } = useMidtrans({
    onSuccess: (result) => {
      console.log('✅ Payment successful:', result);
      toast.success('Pembayaran Berhasil!', {
        description: `Order ${orderNumber} telah dibayar.`,
        duration: 5000,
      });
      setIsProcessing(false);

      // Redirect to confirmation page with success status
      if (typeof window !== 'undefined') {
        window.location.href = `/checkout/payment-confirmation?orderId=${orderId}&payment=success`;
      }

      onSuccess?.();
    },
    onPending: (result) => {
      console.log('⏳ Payment pending:', result);
      toast.info('Pembayaran Sedang Diproses', {
        description: 'Pembayaran Anda sedang diverifikasi. Mohon tunggu konfirmasi.',
        duration: 5000,
      });
      setIsProcessing(false);

      // Redirect to confirmation page with pending status
      if (typeof window !== 'undefined') {
        window.location.href = `/checkout/payment-confirmation?orderId=${orderId}&payment=pending`;
      }
    },
    onError: (result) => {
      console.error('❌ Payment failed:', result);
      toast.error('Pembayaran Gagal', {
        description: result.status_message || 'Silakan coba lagi atau pilih metode pembayaran lain.',
        duration: 5000,
      });
      setIsProcessing(false);

      // Redirect to confirmation page with error status
      if (typeof window !== 'undefined') {
        window.location.href = `/checkout/payment-confirmation?orderId=${orderId}&payment=error`;
      }

      onError?.();
    },
    onClose: () => {
      console.log('💡 Payment modal closed by user');
      toast.info('Pembayaran Dibatalkan', {
        description: 'Anda menutup jendela pembayaran. Silakan coba lagi jika ingin melanjutkan.',
      });
      setIsProcessing(false);
    },
  });

  const handlePayment = async () => {
    if (!isReady) {
      toast.error('Payment system not ready', {
        description: 'Please wait a moment and try again.',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment transaction
      const response = await createPaymentTransaction(orderId, customerDetails);

      if (!response.success || !response.token) {
        throw new Error('Failed to get payment token');
      }

      // Open Midtrans Snap payment modal
      pay(response.token);

    } catch (error) {
      console.error('Failed to create payment:', error);
      toast.error('Failed to initiate payment', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
      setIsProcessing(false);
      onError?.();
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={!isReady || isLoading || isProcessing}
      className={`
        relative inline-flex items-center justify-center
        px-6 py-3 rounded-lg font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className || 'bg-blue-600 hover:bg-blue-700 text-white'}
      `}
    >
      {isLoading && (
        <span className="mr-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}
      {isProcessing && (
        <span className="mr-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}
      {isLoading
        ? 'Loading Payment System...'
        : isProcessing
        ? 'Processing...'
        : `Pay Rp ${amount.toLocaleString('id-ID')}`}
    </button>
  );
}

/**
 * Payment Methods Display Component
 * Shows available payment methods
 */
export function PaymentMethodsDisplay() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Available Payment Methods:</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* QRIS */}
        <div className="flex flex-col items-center p-3 border rounded-lg hover:border-blue-500 transition-colors">
          <div className="text-2xl mb-1">📱</div>
          <span className="text-xs font-medium">QRIS</span>
        </div>

        {/* E-Wallets */}
        <div className="flex flex-col items-center p-3 border rounded-lg hover:border-blue-500 transition-colors">
          <div className="text-2xl mb-1">💳</div>
          <span className="text-xs font-medium">E-Wallet</span>
        </div>

        {/* Bank Transfer */}
        <div className="flex flex-col items-center p-3 border rounded-lg hover:border-blue-500 transition-colors">
          <div className="text-2xl mb-1">🏦</div>
          <span className="text-xs font-medium">Bank Transfer</span>
        </div>

        {/* Credit Card */}
        <div className="flex flex-col items-center p-3 border rounded-lg hover:border-blue-500 transition-colors">
          <div className="text-2xl mb-1">💳</div>
          <span className="text-xs font-medium">Credit Card</span>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Secure payment powered by Midtrans. All major payment methods supported.
      </p>
    </div>
  );
}
