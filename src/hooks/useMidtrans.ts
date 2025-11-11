import { useEffect, useState } from 'react';

// Extend Window interface to include snap
declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: MidtransPaymentResult) => void;
          onPending?: (result: MidtransPaymentResult) => void;
          onError?: (result: MidtransPaymentResult) => void;
          onClose?: () => void;
        }
      ) => void;
      hide: () => void;
      show: () => void;
    };
  }
}

export interface MidtransPaymentResult {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
}

export interface UseMidtransOptions {
  clientKey?: string;
  onSuccess?: (result: MidtransPaymentResult) => void;
  onPending?: (result: MidtransPaymentResult) => void;
  onError?: (result: MidtransPaymentResult) => void;
  onClose?: () => void;
}

/**
 * React hook for Midtrans Snap integration
 *
 * @example
 * ```tsx
 * const { isReady, pay } = useMidtrans({
 *   onSuccess: (result) => {
 *     console.log('Payment success:', result);
 *   },
 *   onPending: (result) => {
 *     console.log('Payment pending:', result);
 *   },
 *   onError: (result) => {
 *     console.log('Payment error:', result);
 *   },
 * });
 *
 * // When ready to pay
 * pay(snapToken);
 * ```
 */
export function useMidtrans(options: UseMidtransOptions = {}) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const clientKey = options.clientKey || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  useEffect(() => {
    // Check if snap script is already loaded
    if (window.snap) {
      setIsReady(true);
      setIsLoading(false);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey || '');
    script.async = true;

    // Handle script load
    script.onload = () => {
      setIsReady(true);
      setIsLoading(false);
    };

    script.onerror = () => {
      console.error('Failed to load Midtrans Snap script');
      setIsReady(false);
      setIsLoading(false);
    };

    // Append script to document
    document.body.appendChild(script);

    // Cleanup
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [clientKey, isProduction]);

  /**
   * Open Midtrans Snap payment modal
   * @param token Snap token from backend
   */
  const pay = (token: string) => {
    if (!isReady || !window.snap) {
      console.error('Midtrans Snap is not ready');
      return;
    }

    window.snap.pay(token, {
      onSuccess: (result) => {
        console.log('Payment success:', result);
        options.onSuccess?.(result);
      },
      onPending: (result) => {
        console.log('Payment pending:', result);
        options.onPending?.(result);
      },
      onError: (result) => {
        console.error('Payment error:', result);
        options.onError?.(result);
      },
      onClose: () => {
        console.log('Payment modal closed');
        options.onClose?.();
      },
    });
  };

  /**
   * Hide Midtrans Snap payment modal
   */
  const hide = () => {
    if (window.snap) {
      window.snap.hide();
    }
  };

  /**
   * Show Midtrans Snap payment modal (if previously hidden)
   */
  const show = () => {
    if (window.snap) {
      window.snap.show();
    }
  };

  return {
    isReady,
    isLoading,
    pay,
    hide,
    show,
  };
}

/**
 * Create payment transaction with backend
 * @param orderId Order ID
 * @returns Snap token and redirect URL
 */
export async function createPaymentTransaction(orderId: string, customerDetails?: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}) {
  const response = await fetch('/api/payments/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderId,
      customerDetails,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create payment transaction');
  }

  return response.json();
}

/**
 * Check payment status for an order
 * @param orderId Order ID
 * @returns Payment status
 */
export async function checkPaymentStatus(orderId: string) {
  const response = await fetch(`/api/payments/status?orderId=${orderId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to check payment status');
  }

  return response.json();
}

/**
 * Cancel payment transaction
 * @param orderId Order ID
 * @returns Cancellation result
 */
export async function cancelPaymentTransaction(orderId: string) {
  const response = await fetch('/api/payments/cancel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to cancel payment transaction');
  }

  return response.json();
}
