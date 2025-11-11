'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Calculator, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ConfirmPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    customerName?: string;
    items?: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      totalAmount: number;
    }>;
  };
  onConfirm?: () => void;
}

/**
 * ConfirmPaymentModal Component
 * Modal untuk konfirmasi pembayaran cash oleh kasir/admin
 */
export function ConfirmPaymentModal({
  isOpen,
  onClose,
  order,
  onConfirm,
}: ConfirmPaymentModalProps) {
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'OTHER'>('CASH');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill dengan total amount
  useEffect(() => {
    if (isOpen) {
      setPaidAmount(order.totalAmount.toString());
      setNotes('');
    }
  }, [isOpen, order.totalAmount]);

  // Calculate change
  const paidAmountNum = parseFloat(paidAmount) || 0;
  const changeAmount = Math.max(0, paidAmountNum - order.totalAmount);
  const isValidAmount = paidAmountNum >= order.totalAmount;

  const handleConfirm = async () => {
    if (!isValidAmount) {
      toast.error('Jumlah pembayaran tidak cukup');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          paidAmount: paidAmountNum,
          changeAmount,
          paymentMethod,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to confirm payment');
      }

      toast.success('Pembayaran Berhasil Dikonfirmasi!', {
        description: `Order ${order.orderNumber} telah dibayar`,
        duration: 5000,
      });

      onConfirm?.();
      onClose();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Gagal Konfirmasi Pembayaran', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick amount buttons
  const quickAmounts = [
    order.totalAmount,
    Math.ceil(order.totalAmount / 50000) * 50000, // Round up to nearest 50k
    Math.ceil(order.totalAmount / 100000) * 100000, // Round up to nearest 100k
  ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Konfirmasi Pembayaran</h2>
              <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Detail Order</h3>
            {order.customerName && (
              <div className="mb-2">
                <span className="text-sm text-gray-600">Pelanggan: </span>
                <span className="text-sm font-medium text-gray-900">{order.customerName}</span>
              </div>
            )}

            {order.items && order.items.length > 0 && (
              <div className="space-y-2 mt-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.quantity}x {item.productName}
                    </span>
                    <span className="font-medium text-gray-900">
                      Rp {item.totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-200 mt-3 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  Rp {order.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['CASH', 'BANK_TRANSFER', 'OTHER'].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method as any)}
                  className={`
                    p-3 rounded-lg border-2 transition-all font-medium text-sm
                    ${paymentMethod === method
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {method === 'CASH' && '💵 Cash'}
                  {method === 'BANK_TRANSFER' && '🏦 Transfer'}
                  {method === 'OTHER' && '💳 Lainnya'}
                </button>
              ))}
            </div>
          </div>

          {/* Paid Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah Dibayar
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                Rp
              </span>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className={`
                  w-full pl-12 pr-4 py-3 border-2 rounded-lg font-semibold text-lg
                  ${!isValidAmount && paidAmount
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 bg-white'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                `}
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>

            {/* Quick Amount Buttons */}
            {paymentMethod === 'CASH' && (
              <div className="flex gap-2 mt-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setPaidAmount(amount.toString())}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    Rp {amount.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            )}

            {/* Error message */}
            {!isValidAmount && paidAmount && (
              <div className="flex items-center gap-2 mt-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Jumlah kurang Rp {(order.totalAmount - paidAmountNum).toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>

          {/* Change Amount */}
          {paymentMethod === 'CASH' && isValidAmount && changeAmount > 0 && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">Kembalian</span>
                </div>
                <span className="text-2xl font-bold text-green-700">
                  Rp {changeAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tambahkan catatan..."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValidAmount || isSubmitting}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Konfirmasi Pembayaran
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * CompactConfirmButton Component
 * Small button untuk trigger confirmation
 */
interface CompactConfirmButtonProps {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  onConfirm?: () => void;
}

export function CompactConfirmButton({
  orderId,
  orderNumber,
  totalAmount,
  onConfirm,
}: CompactConfirmButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <CheckCircle2 className="h-4 w-4" />
        Konfirmasi
      </button>

      <ConfirmPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={{ id: orderId, orderNumber, totalAmount }}
        onConfirm={() => {
          setIsModalOpen(false);
          onConfirm?.();
        }}
      />
    </>
  );
}
