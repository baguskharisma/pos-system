import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  createSnapTransaction,
  getEnabledPaymentMethods,
  DEFAULT_ENABLED_PAYMENT_METHODS,
  type MidtransTransactionParams
} from '@/lib/midtrans';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const retryPaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  customerDetails: z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).optional(),
});

/**
 * POST /api/payment/retry
 * Retry payment for failed/expired orders
 *
 * This endpoint:
 * 1. Validates order can be retried
 * 2. Increments retry count
 * 3. Generates new payment token
 * 4. Returns new token with updated expiry
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = retryPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { orderId, customerDetails } = validation.data;

    // Get order from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        cashier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is already paid
    if (order.status === 'PAID' || order.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Order is already paid' },
        { status: 400 }
      );
    }

    // Check if order can be retried
    const canRetry = ['PENDING_PAYMENT', 'CANCELLED'].includes(order.status) &&
                     ['PENDING', 'FAILED', 'EXPIRED'].includes(order.paymentStatus);

    if (!canRetry) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order cannot be retried',
          details: `Current status: ${order.status}, Payment status: ${order.paymentStatus}`,
        },
        { status: 400 }
      );
    }

    // Calculate retry count from payments
    const retryCount = order.payments.filter(p => p.status === 'FAILED' || p.status === 'EXPIRED').length;

    // Maximum retry limit
    const MAX_RETRIES = 5;
    if (retryCount >= MAX_RETRIES) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maximum retry attempts reached',
          details: `This order has been retried ${retryCount} times`,
          maxRetries: MAX_RETRIES,
        },
        { status: 400 }
      );
    }

    console.log('🔄 Retrying payment:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      retryCount: retryCount + 1,
      previousStatus: order.status,
      previousPaymentStatus: order.paymentStatus,
    });

    // Prepare item details from order items
    const itemDetails = order.items.map((item) => ({
      id: item.product.id,
      price: Math.round(Number(item.unitPrice)),
      quantity: item.quantity,
      name: item.product.name.substring(0, 50),
      category: item.product.category?.name || 'General',
    }));

    // Calculate expiry time (10 minutes from now)
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
    const expiryTimeISO = expiryTime.toISOString();

    // Prepare customer details
    const customerEmail = order.customerEmail || order.cashier?.email || '';
    const customerPhone = order.customerPhone || '';

    const customer = customerDetails || {
      first_name: order.customerName || order.cashier?.name || 'Customer',
      last_name: undefined,
      email: customerEmail,
      phone: customerPhone,
    };

    // Validate and prepare customer_details for Midtrans
    const validatedCustomerDetails: {
      first_name: string;
      last_name?: string;
      email?: string;
      phone?: string;
    } = {
      first_name: customer.first_name?.substring(0, 50) || 'Customer',
    };

    // Only add optional fields if they have valid values
    if (customer.last_name && customer.last_name.trim()) {
      validatedCustomerDetails.last_name = customer.last_name.substring(0, 50);
    }

    // Email validation: must be valid format or omitted
    if (customer.email && customer.email.trim() && customer.email.includes('@')) {
      validatedCustomerDetails.email = customer.email.trim().substring(0, 80);
    }

    // Phone validation: must be non-empty or omitted
    if (customer.phone && customer.phone.trim()) {
      validatedCustomerDetails.phone = customer.phone.trim().substring(0, 19);
    }

    // Generate new order number with retry suffix for Midtrans
    // Midtrans requires unique order_id for each transaction
    const newOrderNumber = `${order.orderNumber}-R${retryCount + 1}`;

    // Prepare transaction parameters
    const transactionParams: MidtransTransactionParams = {
      transaction_details: {
        order_id: newOrderNumber,
        gross_amount: Math.round(Number(order.totalAmount)),
      },
      customer_details: validatedCustomerDetails,
      item_details: itemDetails,
      enabled_payments: getEnabledPaymentMethods(DEFAULT_ENABLED_PAYMENT_METHODS),
      callbacks: {
        finish: `${process.env.APP_URL}/admin/orders/${order.id}?payment=success&retry=${retryCount + 1}`,
        error: `${process.env.APP_URL}/admin/orders/${order.id}?payment=error&retry=${retryCount + 1}`,
        pending: `${process.env.APP_URL}/admin/orders/${order.id}?payment=pending&retry=${retryCount + 1}`,
      },
      expiry: {
        // Skip start_time, let Midtrans use transaction time as default
        unit: 'minute',
        duration: 10,
      },
    };

    console.log('Creating retry transaction:', {
      original_order_id: order.orderNumber,
      new_order_id: newOrderNumber,
      retry_number: retryCount + 1,
      amount: transactionParams.transaction_details.gross_amount,
    });

    // Create Snap transaction
    const snapResult = await createSnapTransaction(transactionParams);

    // Update order with new payment token
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentToken: snapResult.token,
        paymentStatus: 'PENDING',
        status: 'PENDING_PAYMENT',
        updatedAt: new Date(),
      },
    });

    // Create new payment record for this retry attempt
    await prisma.payment.create({
      data: {
        orderId: order.id,
        paymentMethod: order.paymentMethod || 'OTHER',
        amount: Number(order.totalAmount),
        status: 'PENDING',
        transactionType: 'PAYMENT',
        gatewayName: 'midtrans',
        referenceNumber: newOrderNumber,
        gatewayResponse: {
          retry_attempt: retryCount + 1,
          token: snapResult.token,
        } as any,
      },
    });

    console.log('✅ Retry payment token generated:', {
      order_id: order.orderNumber,
      new_order_id: newOrderNumber,
      retry_number: retryCount + 1,
      token: snapResult.token.substring(0, 20) + '...',
      expires_at: expiryTimeISO,
    });

    // Return the snap token and redirect URL
    return NextResponse.json({
      success: true,
      token: snapResult.token,
      redirect_url: snapResult.redirect_url,
      order_id: order.orderNumber,
      order_number: order.orderNumber,
      new_transaction_id: newOrderNumber,
      amount: Number(order.totalAmount),
      expires_at: expiryTimeISO,
      retry_attempt: retryCount + 1,
      max_retries: MAX_RETRIES,
      retries_remaining: MAX_RETRIES - (retryCount + 1),
      payment_methods: getEnabledPaymentMethods(DEFAULT_ENABLED_PAYMENT_METHODS),
    });

  } catch (error) {
    console.error('❌ Retry payment error:', error);

    // Handle Midtrans specific errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate transaction',
            details: 'A payment transaction already exists. Please wait a moment and try again.',
          },
          { status: 409 }
        );
      }

      if (error.message.includes('401')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Payment gateway authentication failed',
            details: 'Invalid Midtrans credentials',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retry payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payment/retry?orderId={orderId}
 * Check if order can be retried and get retry information
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
        paymentToken: true,
        updatedAt: true,
        payments: {
          select: {
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Calculate retry count
    const retryCount = order.payments.filter(p =>
      p.status === 'FAILED' || p.status === 'EXPIRED'
    ).length;

    const MAX_RETRIES = 5;
    const canRetry = ['PENDING_PAYMENT', 'CANCELLED'].includes(order.status) &&
                     ['PENDING', 'FAILED', 'EXPIRED'].includes(order.paymentStatus) &&
                     retryCount < MAX_RETRIES;

    // Check token expiry
    const tokenAge = Date.now() - order.updatedAt.getTime();
    const TEN_MINUTES = 10 * 60 * 1000;
    const isTokenExpired = tokenAge >= TEN_MINUTES;

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: Number(order.totalAmount),
      },
      retry: {
        canRetry,
        retryCount,
        maxRetries: MAX_RETRIES,
        retriesRemaining: MAX_RETRIES - retryCount,
        reason: !canRetry ? (
          retryCount >= MAX_RETRIES ? 'Maximum retry attempts reached' :
          order.status === 'PAID' ? 'Order is already paid' :
          'Order status does not allow retry'
        ) : null,
      },
      token: {
        hasToken: !!order.paymentToken,
        expired: isTokenExpired,
        timeRemainingMs: isTokenExpired ? 0 : TEN_MINUTES - tokenAge,
      },
      lastPayments: order.payments.slice(0, 3).map(p => ({
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      })),
    });

  } catch (error) {
    console.error('❌ Get retry info error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get retry information',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
