'use client';

import { useState } from 'react';
import { RefreshCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentRetryProps {
  orderId: string;
  orderNumber: string;
  amount: number;
  retryCount: number;
  maxRetries: number;
  onRetrySuccess?: (token: string) => void;
  onRetryError?: (error: string) => void;
  className?: string;
}

/**
 * PaymentRetry Component
 * Display retry button and information for failed/expired payments
 */
export function PaymentRetry({
  orderId,
  orderNumber,
  amount,
  retryCount,
  maxRetries,
  onRetrySuccess,
  onRetryError,
  className = '',
}: PaymentRetryProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const retriesRemaining = maxRetries - retryCount;
  const canRetry = retriesRemaining > 0;

  const handleRetry = async () => {
    setIsRetrying(true);

    try {
      const response = await fetch('/api/payment/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Retry failed');
      }

      toast.success('Token pembayaran baru berhasil dibuat!', {
        description: `Percobaan ke-${data.retry_attempt} dari ${maxRetries}`,
      });

      onRetrySuccess?.(data.token);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal retry pembayaran';
      toast.error('Retry gagal', {
        description: errorMessage,
      });
      onRetryError?.(errorMessage);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Retry Information */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-900 mb-1">Pembayaran Gagal atau Kadaluarsa</h4>
            <p className="text-sm text-yellow-800 mb-3">
              Pembayaran untuk order <strong>{orderNumber}</strong> belum selesai.
              Anda dapat mencoba lagi untuk menyelesaikan pembayaran.
            </p>

            {/* Retry Stats */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-yellow-700">Total:</span>
                <span className="ml-1 font-bold text-yellow-900">
                  Rp {amount.toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-yellow-700">Percobaan:</span>
                <span className="ml-1 font-bold text-yellow-900">
                  {retryCount} / {maxRetries}
                </span>
              </div>
              <div>
                <span className="text-yellow-700">Sisa kesempatan:</span>
                <span className={`ml-1 font-bold ${
                  retriesRemaining <= 1 ? 'text-red-600' : 'text-yellow-900'
                }`}>
                  {retriesRemaining}x
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Retry Button */}
      {canRetry ? (
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRetrying ? (
            <>
              <RefreshCcw className="h-5 w-5 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <RefreshCcw className="h-5 w-5" />
              Coba Lagi Pembayaran
            </>
          )}
        </button>
      ) : (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Batas Percobaan Tercapai</h4>
              <p className="text-sm text-red-800">
                Anda telah mencapai batas maksimum percobaan pembayaran ({maxRetries}x).
                Silakan buat order baru atau hubungi customer service.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {canRetry && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progress percobaan</span>
            <span>{retryCount} / {maxRetries}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                retriesRemaining <= 1 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${(retryCount / maxRetries) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * RetryHistory Component
 * Show retry attempt history
 */
interface RetryAttempt {
  attemptNumber: number;
  timestamp: string;
  status: 'FAILED' | 'EXPIRED' | 'PENDING';
}

interface RetryHistoryProps {
  attempts: RetryAttempt[];
}

export function RetryHistory({ attempts }: RetryHistoryProps) {
  if (attempts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">Riwayat Percobaan:</h4>
      <div className="space-y-2">
        {attempts.map((attempt) => (
          <div
            key={attempt.attemptNumber}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">
                Percobaan #{attempt.attemptNumber}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  attempt.status === 'FAILED'
                    ? 'bg-red-100 text-red-700'
                    : attempt.status === 'EXPIRED'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {attempt.status === 'FAILED' ? 'Gagal' : attempt.status === 'EXPIRED' ? 'Kadaluarsa' : 'Pending'}
              </span>
            </div>
            <span className="text-gray-500 text-xs">
              {new Date(attempt.timestamp).toLocaleString('id-ID')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CompactRetryButton Component
 * Smaller retry button for inline use
 */
interface CompactRetryButtonProps {
  orderId: string;
  onRetry?: () => void;
  disabled?: boolean;
}

export function CompactRetryButton({ orderId, onRetry, disabled }: CompactRetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);

    try {
      const response = await fetch('/api/payment/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        throw new Error('Retry failed');
      }

      toast.success('Token pembayaran baru berhasil dibuat');
      onRetry?.();
    } catch (error) {
      toast.error('Gagal retry pembayaran');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <button
      onClick={handleRetry}
      disabled={disabled || isRetrying}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCcw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
      {isRetrying ? 'Memproses...' : 'Coba Lagi'}
    </button>
  );
}

/**
 * RetrySuccessMessage Component
 * Show success message after retry
 */
export function RetrySuccessMessage({ attemptNumber }: { attemptNumber: number }) {
  return (
    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
        <div>
          <h4 className="font-semibold text-green-900 mb-1">Token Pembayaran Baru Dibuat</h4>
          <p className="text-sm text-green-800">
            Token pembayaran baru berhasil dibuat (Percobaan #{attemptNumber}).
            Silakan lanjutkan untuk menyelesaikan pembayaran.
          </p>
        </div>
      </div>
    </div>
  );
}
