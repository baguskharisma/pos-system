'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useWebSocket } from '@/components/providers/WebSocketProvider';

export interface PaymentNotification {
  type: string;
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  totalAmount?: number;
  paidAmount?: number;
  changeAmount?: number;
  paymentMethod?: string;
  confirmedBy?: string;
  timestamp: string;
}

interface UsePaymentNotificationsOptions {
  enabled?: boolean;
  onPaymentConfirmed?: (notification: PaymentNotification) => void;
  onOrderCreated?: (notification: PaymentNotification) => void;
  onOrderUpdated?: (notification: PaymentNotification) => void;
  showToast?: boolean;
}

/**
 * usePaymentNotifications Hook
 * Listen to real-time payment notifications via WebSocket
 *
 * @example
 * ```tsx
 * const { notifications, isConnected } = usePaymentNotifications({
 *   enabled: true,
 *   onPaymentConfirmed: (notification) => {
 *     console.log('Payment confirmed:', notification);
 *     refetchOrders();
 *   },
 *   showToast: true,
 * });
 * ```
 */
export function usePaymentNotifications(options: UsePaymentNotificationsOptions = {}) {
  const {
    enabled = true,
    onPaymentConfirmed,
    onOrderCreated,
    onOrderUpdated,
    showToast = true,
  } = options;

  const { socket, isConnected, joinRoom } = useWebSocket();
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [lastNotification, setLastNotification] = useState<PaymentNotification | null>(null);

  const addNotification = useCallback((notification: PaymentNotification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
    setLastNotification(notification);
  }, []);

  // Join admin notifications room
  useEffect(() => {
    if (!enabled || !isConnected) return;

    // Join the admin-notifications room for real-time updates
    joinRoom('admin-notifications' as any);
    console.log('✅ Joined admin-notifications room');

    return () => {
      // Cleanup handled by WebSocketProvider
    };
  }, [enabled, isConnected, joinRoom]);

  // Listen to WebSocket events
  useEffect(() => {
    if (!enabled || !socket || !isConnected) return;

    const handlePaymentConfirmed = (data: any) => {
      console.log('📡 [WebSocket] Received payment:confirmed event:', data);

      const notification: PaymentNotification = {
        type: 'PAYMENT_CONFIRMED',
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        status: data.status,
        paymentStatus: data.paymentStatus,
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount,
        changeAmount: data.changeAmount,
        paymentMethod: data.paymentMethod,
        confirmedBy: data.confirmedBy,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      addNotification(notification);
    };

    const handleOrderCreated = (data: any) => {
      console.log('📡 [WebSocket] Received order:created event:', data);

      const notification: PaymentNotification = {
        type: 'ORDER_CREATED',
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        status: 'PENDING',
        totalAmount: data.totalAmount,
        timestamp: data.createdAt || new Date().toISOString(),
      };

      addNotification(notification);
    };

    const handleOrderUpdated = (data: any) => {
      console.log('📡 [WebSocket] Received order:updated event:', data);

      const notification: PaymentNotification = {
        type: 'ORDER_UPDATED',
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        status: data.status,
        paymentStatus: data.paymentStatus,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      addNotification(notification);
    };

    // Subscribe to events
    socket.on('payment:confirmed', handlePaymentConfirmed);
    socket.on('order:created', handleOrderCreated);
    socket.on('order:updated', handleOrderUpdated);

    // Cleanup
    return () => {
      socket.off('payment:confirmed', handlePaymentConfirmed);
      socket.off('order:created', handleOrderCreated);
      socket.off('order:updated', handleOrderUpdated);
    };
  }, [enabled, socket, isConnected, addNotification]);

  // Handle notification
  useEffect(() => {
    if (!lastNotification) return;

    const { type, orderNumber, confirmedBy } = lastNotification;

    // Show toast notification
    if (showToast) {
      switch (type) {
        case 'PAYMENT_CONFIRMED':
          toast.success('💰 Pembayaran Dikonfirmasi', {
            description: `Order ${orderNumber} telah dibayar${confirmedBy ? ` oleh ${confirmedBy}` : ''}`,
            duration: 5000,
          });
          onPaymentConfirmed?.(lastNotification);
          break;

        case 'ORDER_CREATED':
          toast.info('🛒 Order Baru', {
            description: `Order ${orderNumber} telah dibuat`,
            duration: 4000,
          });
          onOrderCreated?.(lastNotification);
          break;

        case 'ORDER_UPDATED':
          toast.info('📝 Order Diupdate', {
            description: `Order ${orderNumber} telah diupdate`,
            duration: 3000,
          });
          onOrderUpdated?.(lastNotification);
          break;
      }
    }
  }, [lastNotification, showToast, onPaymentConfirmed, onOrderCreated, onOrderUpdated]);

  // Simulate receiving notification (for testing)
  const simulateNotification = useCallback((notification: PaymentNotification) => {
    addNotification(notification);
  }, [addNotification]);

  return {
    isConnected,
    notifications,
    lastNotification,
    simulateNotification,
  };
}

/**
 * usePaymentConfirmationListener Hook
 * Simplified hook specifically for listening to payment confirmations
 */
export function usePaymentConfirmationListener(
  onConfirmed: (notification: PaymentNotification) => void
) {
  return usePaymentNotifications({
    enabled: true,
    onPaymentConfirmed: onConfirmed,
    showToast: true,
  });
}

/**
 * usePendingOrdersCounter Hook
 * Real-time counter for pending orders
 */
export function usePendingOrdersCounter() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCount = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, [fetchCount]);

  // Listen to payment confirmations to update count
  usePaymentNotifications({
    enabled: true,
    onPaymentConfirmed: () => {
      fetchCount();
    },
    onOrderCreated: () => {
      fetchCount();
    },
    showToast: false,
  });

  return {
    count,
    isLoading,
    refresh: fetchCount,
  };
}
