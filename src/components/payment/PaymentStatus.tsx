'use client';

import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2, RefreshCcw } from 'lucide-react';

export type PaymentStatusType =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

interface PaymentStatusProps {
  status: PaymentStatusType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  PENDING: {
    label: 'Menunggu Pembayaran',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: Clock,
  },
  PROCESSING: {
    label: 'Memproses Pembayaran',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Loader2,
  },
  COMPLETED: {
    label: 'Pembayaran Berhasil',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle2,
  },
  FAILED: {
    label: 'Pembayaran Gagal',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
  },
  EXPIRED: {
    label: 'Pembayaran Kadaluarsa',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: AlertCircle,
  },
  REFUNDED: {
    label: 'Dikembalikan',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: RefreshCcw,
  },
  PARTIALLY_REFUNDED: {
    label: 'Sebagian Dikembalikan',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: RefreshCcw,
  },
};

const sizeConfig = {
  sm: {
    iconSize: 'h-4 w-4',
    textSize: 'text-xs',
    padding: 'px-2 py-1',
  },
  md: {
    iconSize: 'h-5 w-5',
    textSize: 'text-sm',
    padding: 'px-3 py-1.5',
  },
  lg: {
    iconSize: 'h-6 w-6',
    textSize: 'text-base',
    padding: 'px-4 py-2',
  },
};

/**
 * PaymentStatus Component
 *
 * Display payment status with icon and label
 *
 * @example
 * <PaymentStatus status="COMPLETED" size="md" />
 */
export function PaymentStatus({
  status,
  size = 'md',
  showLabel = true,
  showIcon = true,
  className = '',
}: PaymentStatusProps) {
  const config = statusConfig[status];
  const sizeConf = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center gap-2 rounded-full border
        ${config.bgColor} ${config.borderColor} ${config.color}
        ${sizeConf.padding} ${sizeConf.textSize}
        font-medium
        ${className}
      `}
    >
      {showIcon && (
        <Icon
          className={`
            ${sizeConf.iconSize}
            ${status === 'PROCESSING' ? 'animate-spin' : ''}
          `}
        />
      )}
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}

/**
 * PaymentStatusCard Component
 * Full card with status, description, and action buttons
 */
interface PaymentStatusCardProps {
  status: PaymentStatusType;
  title?: string;
  description?: string;
  amount?: number;
  orderNumber?: string;
  paymentMethod?: string;
  paidAt?: string;
  children?: React.ReactNode;
}

export function PaymentStatusCard({
  status,
  title,
  description,
  amount,
  orderNumber,
  paymentMethod,
  paidAt,
  children,
}: PaymentStatusCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const defaultTitles = {
    PENDING: 'Menunggu Pembayaran',
    PROCESSING: 'Pembayaran Sedang Diproses',
    COMPLETED: 'Pembayaran Berhasil!',
    FAILED: 'Pembayaran Gagal',
    EXPIRED: 'Pembayaran Kadaluarsa',
    REFUNDED: 'Pembayaran Telah Dikembalikan',
    PARTIALLY_REFUNDED: 'Pembayaran Sebagian Dikembalikan',
  };

  const defaultDescriptions = {
    PENDING: 'Silakan selesaikan pembayaran Anda',
    PROCESSING: 'Kami sedang memverifikasi pembayaran Anda',
    COMPLETED: 'Terima kasih! Pembayaran Anda telah diterima',
    FAILED: 'Pembayaran tidak dapat diproses',
    EXPIRED: 'Waktu pembayaran telah habis',
    REFUNDED: 'Dana telah dikembalikan ke rekening Anda',
    PARTIALLY_REFUNDED: 'Sebagian dana telah dikembalikan',
  };

  return (
    <div className={`rounded-lg border-2 ${config.borderColor} ${config.bgColor} p-6`}>
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Icon */}
        <div className={`rounded-full p-4 ${config.bgColor}`}>
          <Icon
            className={`h-12 w-12 ${config.color} ${
              status === 'PROCESSING' ? 'animate-spin' : ''
            }`}
          />
        </div>

        {/* Title */}
        <div>
          <h2 className={`text-2xl font-bold ${config.color}`}>
            {title || defaultTitles[status]}
          </h2>
          <p className="text-gray-600 mt-2">
            {description || defaultDescriptions[status]}
          </p>
        </div>

        {/* Payment Details */}
        {(amount || orderNumber || paymentMethod || paidAt) && (
          <div className="w-full border-t border-gray-200 pt-4 mt-4 space-y-2 text-sm">
            {orderNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Nomor Order:</span>
                <span className="font-medium">{orderNumber}</span>
              </div>
            )}
            {amount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold text-lg">
                  Rp {amount.toLocaleString('id-ID')}
                </span>
              </div>
            )}
            {paymentMethod && (
              <div className="flex justify-between">
                <span className="text-gray-600">Metode Pembayaran:</span>
                <span className="font-medium">{paymentMethod}</span>
              </div>
            )}
            {paidAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Waktu Pembayaran:</span>
                <span className="font-medium">
                  {new Date(paidAt).toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {children && (
          <div className="w-full pt-4 mt-4 border-t border-gray-200">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * PaymentStatusBadge Component
 * Small badge for displaying in lists
 */
export function PaymentStatusBadge({ status }: { status: PaymentStatusType }) {
  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full
        text-xs font-medium
        ${config.bgColor} ${config.color}
      `}
    >
      {config.label}
    </span>
  );
}
