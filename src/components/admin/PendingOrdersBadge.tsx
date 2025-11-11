'use client';

import { useState, useEffect } from 'react';
import { Bell, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface PendingOrdersBadgeProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showZero?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button' | 'inline';
}

/**
 * PendingOrdersBadge Component
 * Display notification badge for pending cash orders
 */
export function PendingOrdersBadge({
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  showZero = false,
  size = 'md',
  variant = 'icon',
}: PendingOrdersBadgeProps) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNewOrders, setHasNewOrders] = useState(false);

  // Fetch pending orders count
  const fetchCount = async (silent = false) => {
    if (!silent) setIsLoading(true);

    try {
      const response = await fetch('/api/orders/pending-cash');
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      const newCount = data.orders?.length || 0;

      // Check if there are new orders
      if (newCount > count && count > 0) {
        setHasNewOrders(true);
        // Play notification sound (optional)
        playNotificationSound();
      }

      setCount(newCount);
    } catch (error) {
      console.error('Error fetching pending orders count:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (error) {
      console.log('Notification sound error:', error);
    }
  };

  useEffect(() => {
    fetchCount();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchCount(true);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Clear "new orders" indicator after click
  const handleClick = () => {
    setHasNewOrders(false);
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      iconSize: 'h-4 w-4',
      textSize: 'text-xs',
      badgeSize: 'h-4 min-w-[16px] text-[10px]',
      padding: 'px-2 py-1',
    },
    md: {
      iconSize: 'h-5 w-5',
      textSize: 'text-sm',
      badgeSize: 'h-5 min-w-[20px] text-xs',
      padding: 'px-3 py-1.5',
    },
    lg: {
      iconSize: 'h-6 w-6',
      textSize: 'text-base',
      badgeSize: 'h-6 min-w-[24px] text-sm',
      padding: 'px-4 py-2',
    },
  };

  const config = sizeConfig[size];

  // Don't show if zero and showZero is false
  if (count === 0 && !showZero) {
    return null;
  }

  // Loading state
  if (isLoading && count === 0) {
    return (
      <div className="inline-flex items-center gap-2">
        <div className="animate-pulse bg-gray-200 rounded-full h-6 w-6" />
      </div>
    );
  }

  // Icon variant (for header/navigation)
  if (variant === 'icon') {
    return (
      <Link
        href="/admin/orders?status=pending"
        onClick={handleClick}
        className="relative inline-flex items-center p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Pending Cash Payments"
      >
        <DollarSign className={`${config.iconSize} text-yellow-600`} />
        {count > 0 && (
          <span
            className={`
              absolute -top-1 -right-1 inline-flex items-center justify-center
              ${config.badgeSize} ${hasNewOrders ? 'animate-pulse' : ''}
              px-1 font-bold text-white bg-yellow-600 rounded-full ring-2 ring-white
            `}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    );
  }

  // Button variant (for dashboard/cards)
  if (variant === 'button') {
    return (
      <Link
        href="/admin/orders?status=pending"
        onClick={handleClick}
        className={`
          inline-flex items-center gap-2 ${config.padding}
          bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-200
          rounded-lg transition-colors font-medium
          ${hasNewOrders ? 'animate-pulse' : ''}
        `}
      >
        <DollarSign className={`${config.iconSize} text-yellow-600`} />
        <span className={`${config.textSize} text-yellow-900`}>
          {count} Pembayaran Pending
        </span>
        {hasNewOrders && (
          <span className="inline-flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
        )}
      </Link>
    );
  }

  // Inline variant (for text)
  return (
    <Link
      href="/admin/orders?status=pending"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 hover:underline"
    >
      <span className={`${config.textSize} font-medium text-gray-700`}>
        Pending Cash Orders
      </span>
      {count > 0 && (
        <span
          className={`
            inline-flex items-center justify-center
            ${config.badgeSize}
            px-1.5 font-bold text-white bg-yellow-600 rounded-full
            ${hasNewOrders ? 'animate-pulse' : ''}
          `}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

/**
 * PendingOrdersAlert Component
 * Full-width alert banner for pending orders
 */
export function PendingOrdersAlert() {
  const [count, setCount] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/orders/pending-cash');
        if (response.ok) {
          const data = await response.json();
          setCount(data.orders?.length || 0);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0 || isDismissed) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-yellow-600" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-900">
              {count} Pembayaran Cash Menunggu Konfirmasi
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Silakan konfirmasi pembayaran cash yang masuk
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders?status=pending"
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg text-sm transition-colors"
          >
            Lihat Orders
          </Link>
          <button
            onClick={() => setIsDismissed(true)}
            className="px-3 py-2 text-yellow-700 hover:text-yellow-900 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * PendingOrdersCounter Component
 * Simple counter for dashboards
 */
export function PendingOrdersCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/orders/pending-cash');
        if (response.ok) {
          const data = await response.json();
          setCount(data.orders?.length || 0);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (count === null) {
    return (
      <div className="animate-pulse bg-gray-200 rounded h-8 w-16" />
    );
  }

  return (
    <span className="text-3xl font-bold text-gray-900">
      {count}
    </span>
  );
}
