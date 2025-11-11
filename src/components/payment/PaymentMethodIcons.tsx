'use client';

import { CreditCard, Smartphone, Building2, QrCode, Wallet } from 'lucide-react';

export type PaymentMethodType =
  | 'QRIS'
  | 'GOPAY'
  | 'SHOPEEPAY'
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'E_WALLET'
  | 'OTHER';

interface PaymentMethodIconProps {
  method: PaymentMethodType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const methodConfig = {
  QRIS: {
    label: 'QRIS',
    icon: QrCode,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  GOPAY: {
    label: 'GoPay',
    icon: Wallet,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  SHOPEEPAY: {
    label: 'ShopeePay',
    icon: Wallet,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  BANK_TRANSFER: {
    label: 'Transfer Bank',
    icon: Building2,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  CREDIT_CARD: {
    label: 'Kartu Kredit',
    icon: CreditCard,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  DEBIT_CARD: {
    label: 'Kartu Debit',
    icon: CreditCard,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  E_WALLET: {
    label: 'E-Wallet',
    icon: Smartphone,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  OTHER: {
    label: 'Lainnya',
    icon: Wallet,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
};

const sizeConfig = {
  sm: {
    iconSize: 'h-4 w-4',
    textSize: 'text-xs',
    padding: 'p-2',
  },
  md: {
    iconSize: 'h-6 w-6',
    textSize: 'text-sm',
    padding: 'p-3',
  },
  lg: {
    iconSize: 'h-8 w-8',
    textSize: 'text-base',
    padding: 'p-4',
  },
};

/**
 * PaymentMethodIcon Component
 * Display payment method icon with optional label
 */
export function PaymentMethodIcon({
  method,
  size = 'md',
  showLabel = true,
  className = '',
}: PaymentMethodIconProps) {
  const config = methodConfig[method];
  const sizeConf = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`rounded-lg ${config.bgColor} ${sizeConf.padding}`}>
        <Icon className={`${sizeConf.iconSize} ${config.color}`} />
      </div>
      {showLabel && (
        <span className={`${sizeConf.textSize} font-medium text-gray-700`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

/**
 * PaymentMethodGrid Component
 * Display all available payment methods in a grid
 */
interface PaymentMethodGridProps {
  methods?: PaymentMethodType[];
  onSelect?: (method: PaymentMethodType) => void;
  selected?: PaymentMethodType;
}

export function PaymentMethodGrid({
  methods = ['QRIS', 'GOPAY', 'SHOPEEPAY', 'BANK_TRANSFER', 'CREDIT_CARD'],
  onSelect,
  selected,
}: PaymentMethodGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {methods.map((method) => {
        const config = methodConfig[method];
        const Icon = config.icon;
        const isSelected = selected === method;

        return (
          <button
            key={method}
            onClick={() => onSelect?.(method)}
            className={`
              flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
              ${isSelected
                ? `${config.bgColor} border-current ${config.color}`
                : 'border-gray-200 hover:border-gray-300 bg-white'
              }
              ${onSelect ? 'cursor-pointer' : ''}
            `}
          >
            <Icon className={`h-8 w-8 ${isSelected ? config.color : 'text-gray-400'}`} />
            <span className={`text-xs font-medium ${isSelected ? config.color : 'text-gray-600'}`}>
              {config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * PaymentMethodsList Component
 * Display payment methods in a list format
 */
export function PaymentMethodsList() {
  const allMethods: PaymentMethodType[] = [
    'QRIS',
    'GOPAY',
    'SHOPEEPAY',
    'BANK_TRANSFER',
    'CREDIT_CARD',
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Metode Pembayaran yang Tersedia:
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {allMethods.map((method) => (
          <div
            key={method}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white"
          >
            <PaymentMethodIcon method={method} size="sm" showLabel={true} />
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        💳 Pembayaran aman dengan Midtrans. Semua metode pembayaran utama didukung.
      </p>
    </div>
  );
}

/**
 * PaymentMethodCard Component
 * Detailed card for each payment method
 */
interface PaymentMethodCardProps {
  method: PaymentMethodType;
  description?: string;
  available?: boolean;
  onClick?: () => void;
}

export function PaymentMethodCard({
  method,
  description,
  available = true,
  onClick,
}: PaymentMethodCardProps) {
  const config = methodConfig[method];
  const Icon = config.icon;

  const defaultDescriptions = {
    QRIS: 'Bayar dengan scan QR code menggunakan aplikasi e-wallet favorit Anda',
    GOPAY: 'Bayar langsung menggunakan saldo GoPay Anda',
    SHOPEEPAY: 'Bayar menggunakan saldo ShopeePay Anda',
    BANK_TRANSFER: 'Transfer melalui Virtual Account bank pilihan Anda',
    CREDIT_CARD: 'Bayar menggunakan kartu kredit Visa, Mastercard, JCB, atau Amex',
    DEBIT_CARD: 'Bayar menggunakan kartu debit Anda',
    E_WALLET: 'Bayar menggunakan e-wallet pilihan Anda',
    OTHER: 'Metode pembayaran lainnya',
  };

  return (
    <button
      onClick={onClick}
      disabled={!available}
      className={`
        w-full text-left p-4 rounded-lg border-2 transition-all
        ${available
          ? 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
          : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
        }
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`rounded-lg ${config.bgColor} p-3`}>
          <Icon className={`h-6 w-6 ${config.color}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">{config.label}</h4>
            {!available && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                Tidak Tersedia
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {description || defaultDescriptions[method]}
          </p>
        </div>
      </div>
    </button>
  );
}

/**
 * Bank logos for bank transfer
 */
export function BankLogos() {
  const banks = [
    { name: 'BCA', color: 'bg-blue-600' },
    { name: 'BNI', color: 'bg-orange-500' },
    { name: 'BRI', color: 'bg-blue-500' },
    { name: 'Mandiri', color: 'bg-yellow-500' },
    { name: 'Permata', color: 'bg-green-600' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {banks.map((bank) => (
        <div
          key={bank.name}
          className={`px-3 py-1.5 rounded ${bank.color} text-white text-xs font-semibold`}
        >
          {bank.name}
        </div>
      ))}
    </div>
  );
}
