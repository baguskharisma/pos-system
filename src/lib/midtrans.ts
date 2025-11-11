import midtransClient from 'midtrans-client';

// Midtrans Configuration
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || '';
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

// Initialize Snap client
export const snap = new midtransClient.Snap({
  isProduction: MIDTRANS_IS_PRODUCTION,
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: MIDTRANS_CLIENT_KEY,
});

// Initialize Core API client (for transaction status, etc.)
export const coreApi = new midtransClient.CoreApi({
  isProduction: MIDTRANS_IS_PRODUCTION,
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: MIDTRANS_CLIENT_KEY,
});

// Payment method configurations
export const PAYMENT_METHODS = {
  QRIS: 'qris',
  GOPAY: 'gopay',
  SHOPEEPAY: 'shopeepay',
  BCA_VA: 'bca_va',
  BNI_VA: 'bni_va',
  BRI_VA: 'bri_va',
  PERMATA_VA: 'permata_va',
  MANDIRI_BILL: 'echannel',
  CREDIT_CARD: 'credit_card',
} as const;

export type PaymentMethodType = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

// Enabled payment methods configuration
export interface PaymentMethodsConfig {
  gopay?: {
    enabled: boolean;
  };
  shopeepay?: {
    enabled: boolean;
  };
  qris?: {
    enabled: boolean;
  };
  credit_card?: {
    enabled: boolean;
    secure?: boolean;
    channel?: string;
    bank?: string[];
    installment?: {
      required: boolean;
      terms?: Record<string, number[]>;
    };
  };
  bank_transfer?: {
    enabled: boolean;
    banks: Array<'bca' | 'bni' | 'bri' | 'permata'>;
  };
  echannel?: {
    enabled: boolean;
  };
}

// Default enabled payment methods
export const DEFAULT_ENABLED_PAYMENT_METHODS: PaymentMethodsConfig = {
  qris: {
    enabled: true,
  },
  gopay: {
    enabled: true,
  },
  shopeepay: {
    enabled: true,
  },
  bank_transfer: {
    enabled: true,
    banks: ['bca', 'bni', 'bri', 'permata'],
  },
  echannel: {
    enabled: true, // Mandiri Bill Payment
  },
  credit_card: {
    enabled: true,
    secure: true,
  },
};

// Transaction parameter interface
export interface MidtransTransactionParams {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  item_details?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
    category?: string;
  }>;
  enabled_payments?: string[];
  credit_card?: {
    secure?: boolean;
    channel?: string;
    bank?: string[];
  };
  callbacks?: {
    finish?: string;
    error?: string;
    pending?: string;
  };
  expiry?: {
    start_time?: string;
    unit?: 'second' | 'minute' | 'hour' | 'day';
    duration?: number;
  };
}

/**
 * Create Snap transaction token
 * @param params Transaction parameters
 * @returns Snap token and redirect URL
 */
export async function createSnapTransaction(params: MidtransTransactionParams) {
  try {
    const transaction = await snap.createTransaction(params);
    return {
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    };
  } catch (error) {
    console.error('Midtrans Snap transaction error:', error);
    throw error;
  }
}

/**
 * Get transaction status
 * @param orderId Order ID
 * @returns Transaction status
 */
export async function getTransactionStatus(orderId: string) {
  try {
    const status = await coreApi.transaction.status(orderId);
    return status;
  } catch (error) {
    console.error('Midtrans transaction status error:', error);
    throw error;
  }
}

/**
 * Cancel transaction
 * @param orderId Order ID
 * @returns Cancellation response
 */
export async function cancelTransaction(orderId: string) {
  try {
    const response = await coreApi.transaction.cancel(orderId);
    return response;
  } catch (error) {
    console.error('Midtrans cancel transaction error:', error);
    throw error;
  }
}

/**
 * Approve transaction (for credit card transactions that require approval)
 * @param orderId Order ID
 * @returns Approval response
 */
export async function approveTransaction(orderId: string) {
  try {
    const response = await coreApi.transaction.approve(orderId);
    return response;
  } catch (error) {
    console.error('Midtrans approve transaction error:', error);
    throw error;
  }
}

/**
 * Get enabled payment methods array
 * @param config Payment methods configuration
 * @returns Array of enabled payment method codes
 */
export function getEnabledPaymentMethods(config: PaymentMethodsConfig = DEFAULT_ENABLED_PAYMENT_METHODS): string[] {
  const enabled: string[] = [];

  if (config.gopay?.enabled) {
    enabled.push('gopay');
  }

  if (config.shopeepay?.enabled) {
    enabled.push('shopeepay');
  }

  if (config.qris?.enabled) {
    enabled.push('qris');
  }

  if (config.credit_card?.enabled) {
    enabled.push('credit_card');
  }

  if (config.bank_transfer?.enabled) {
    config.bank_transfer.banks.forEach(bank => {
      enabled.push(`${bank}_va`);
    });
  }

  if (config.echannel?.enabled) {
    enabled.push('echannel'); // Mandiri Bill
  }

  return enabled;
}

/**
 * Map customer-facing payment method to Midtrans enabled_payments
 * This function maps the payment method selected by customer to specific Midtrans payment options
 *
 * Payment Method Mapping:
 * - QRIS → Shows only QRIS payment option
 * - E_WALLET → Shows GoPay, ShopeePay (e-wallet options)
 * - CREDIT_CARD → Shows only credit card payment
 * - DEBIT_CARD → Shows only credit card (Midtrans handles both credit/debit through same channel)
 * - BANK_TRANSFER → Shows all Virtual Account options (BCA, BNI, BRI, Permata, Mandiri)
 * - CASH → Empty array (cash payments don't go through Midtrans)
 *
 * @param paymentMethod - The payment method from customer interface
 * @param options - Optional configuration
 * @param options.useAllMethods - If true, returns all available methods when specific method may not be enabled
 * @returns Array of Midtrans payment method codes to enable
 */
export function mapPaymentMethodToMidtrans(
  paymentMethod: string,
  options?: { useAllMethods?: boolean }
): string[] {
  // If useAllMethods is true, return all available payment methods for better UX
  // This is useful for sandbox/testing or when specific payment method might not be enabled
  if (options?.useAllMethods) {
    return getEnabledPaymentMethods(DEFAULT_ENABLED_PAYMENT_METHODS);
  }

  const methodMap: Record<string, string[]> = {
    // Digital Payment - show all digital payment methods
    'DIGITAL_PAYMENT': [
      'qris',
      'gopay',
      'shopeepay',
      'credit_card',
      'bca_va',
      'bni_va',
      'bri_va',
      'permata_va',
      'echannel'
    ],

    // Cash - this shouldn't go through Midtrans but included for completeness
    'CASH': [],
  };

  return methodMap[paymentMethod] || [];
}

/**
 * Verify notification signature from Midtrans webhook
 * @param notification Notification object from webhook
 * @returns Boolean indicating if signature is valid
 */
export function verifySignatureKey(notification: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}): boolean {
  const crypto = require('crypto');
  const { order_id, status_code, gross_amount, signature_key } = notification;

  const hash = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`)
    .digest('hex');

  return hash === signature_key;
}

/**
 * Map Midtrans transaction status to application status
 * @param transactionStatus Midtrans transaction status
 * @returns Application payment status
 */
export function mapTransactionStatus(transactionStatus: string): 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' {
  switch (transactionStatus) {
    case 'capture':
    case 'settlement':
      return 'COMPLETED';
    case 'pending':
      return 'PENDING';
    case 'deny':
    case 'expire':
    case 'failure':
      return 'FAILED';
    case 'cancel':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }
}

// Export types
export type { PaymentMethodType };
