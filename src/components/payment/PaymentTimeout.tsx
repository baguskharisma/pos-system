'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface PaymentTimeoutProps {
  expiresAt: string | Date;
  onExpire?: () => void;
  showWarning?: boolean;
  warningThreshold?: number; // seconds
  className?: string;
}

/**
 * PaymentTimeout Component
 * Display countdown timer for payment expiry
 */
export function PaymentTimeout({
  expiresAt,
  onExpire,
  showWarning = true,
  warningThreshold = 120, // 2 minutes
  className = '',
}: PaymentTimeoutProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, expiry - now);

      setTimeRemaining(remaining);

      if (remaining === 0 && !isExpired) {
        setIsExpired(true);
        onExpire?.();
      }
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire, isExpired]);

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const totalSeconds = Math.floor(timeRemaining / 1000);

  const isWarning = showWarning && totalSeconds <= warningThreshold && totalSeconds > 0;
  const percentage = (totalSeconds / 600) * 100; // 10 minutes = 600 seconds

  if (isExpired) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <AlertTriangle className="h-5 w-5" />
        <span className="font-semibold">Waktu pembayaran habis</span>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Countdown Display */}
      <div
        className={`
          flex items-center gap-3 p-4 rounded-lg border-2
          ${isWarning
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-blue-50 border-blue-200 text-blue-700'
          }
        `}
      >
        <Clock className={`h-6 w-6 ${isWarning ? 'animate-pulse' : ''}`} />
        <div className="flex-1">
          <div className="text-sm font-medium">
            {isWarning ? 'Segera selesaikan pembayaran!' : 'Waktu pembayaran tersisa'}
          </div>
          <div className="text-2xl font-bold tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isWarning ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Warning Message */}
      {isWarning && (
        <div className="flex items-start gap-2 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Pembayaran akan otomatis dibatalkan dalam {totalSeconds} detik.
            Silakan selesaikan segera.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * CompactPaymentTimeout Component
 * Smaller version for inline display
 */
interface CompactPaymentTimeoutProps {
  expiresAt: string | Date;
  onExpire?: () => void;
}

export function CompactPaymentTimeout({ expiresAt, onExpire }: CompactPaymentTimeoutProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, expiry - now);

      setTimeRemaining(remaining);

      if (remaining === 0) {
        onExpire?.();
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const totalSeconds = Math.floor(timeRemaining / 1000);

  if (totalSeconds === 0) {
    return (
      <span className="text-red-600 font-semibold text-sm">Kadaluarsa</span>
    );
  }

  const isWarning = totalSeconds <= 120;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-mono font-semibold text-sm
        ${isWarning ? 'text-red-600' : 'text-blue-600'}
      `}
    >
      <Clock className={`h-4 w-4 ${isWarning ? 'animate-pulse' : ''}`} />
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  );
}

/**
 * CircularPaymentTimeout Component
 * Circular progress timer
 */
interface CircularPaymentTimeoutProps {
  expiresAt: string | Date;
  size?: number;
  strokeWidth?: number;
}

export function CircularPaymentTimeout({
  expiresAt,
  size = 120,
  strokeWidth = 8,
}: CircularPaymentTimeoutProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, expiry - now);
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const totalSeconds = Math.floor(timeRemaining / 1000);
  const percentage = (totalSeconds / 600) * 100; // 10 minutes

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const isWarning = totalSeconds <= 120 && totalSeconds > 0;
  const color = isWarning ? '#DC2626' : '#2563EB';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      {/* Time display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Clock className={`h-5 w-5 mb-1 ${isWarning ? 'text-red-600' : 'text-blue-600'}`} />
        <div className={`text-xl font-bold tabular-nums ${isWarning ? 'text-red-600' : 'text-blue-600'}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}

/**
 * usePaymentTimeout Hook
 * Hook for managing payment timeout state
 */
export function usePaymentTimeout(expiresAt: string | Date) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, expiry - now);
      const totalSeconds = Math.floor(remaining / 1000);

      setTimeRemaining(remaining);
      setIsExpired(totalSeconds === 0);
      setIsWarning(totalSeconds <= 120 && totalSeconds > 0);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const totalSeconds = Math.floor(timeRemaining / 1000);
  const percentage = (totalSeconds / 600) * 100;

  return {
    timeRemaining,
    minutes,
    seconds,
    totalSeconds,
    percentage,
    isExpired,
    isWarning,
    formattedTime: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  };
}
