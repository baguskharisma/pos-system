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
const createPaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  customerDetails: z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).optional(),
});

/**
 * POST /api/payment/create
 * Generate Midtrans Snap token and create payment transaction
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
    const validation = createPaymentSchema.safeParse(body);

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

    // Check if order is cancelled
    if (order.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Order is cancelled' },
        { status: 400 }
      );
    }

    // Check if payment token is still valid (not expired)
    if (order.paymentToken && order.updatedAt) {
      const tokenAge = Date.now() - order.updatedAt.getTime();
      const TEN_MINUTES = 10 * 60 * 1000;

      // If token is less than 10 minutes old, return existing token
      if (tokenAge < TEN_MINUTES) {
        return NextResponse.json({
          success: true,
          token: order.paymentToken,
          redirect_url: `https://app.${process.env.MIDTRANS_IS_PRODUCTION === 'true' ? '' : 'sandbox.'}midtrans.com/snap/v3/redirection/${order.paymentToken}`,
          order_id: order.orderNumber,
          is_retry: true,
          expires_at: new Date(order.updatedAt.getTime() + TEN_MINUTES).toISOString(),
        });
      }
    }

    // Prepare item details from order items
    const itemDetails = order.items.map((item) => ({
      id: item.product.id,
      price: Math.round(Number(item.unitPrice)), // Midtrans requires integer
      quantity: item.quantity,
      name: item.product.name.substring(0, 50), // Midtrans has 50 char limit
      category: item.product.category?.name || 'General',
    }));

    // Calculate expiry time (10 minutes from now)
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
    const expiryTimeISO = expiryTime.toISOString();

    // Prepare customer details - make sure email is valid or undefined
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

    // Prepare transaction parameters
    const transactionParams: MidtransTransactionParams = {
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: Math.round(Number(order.totalAmount)), // Midtrans requires integer
      },
      customer_details: validatedCustomerDetails,
      item_details: itemDetails,
      enabled_payments: getEnabledPaymentMethods(DEFAULT_ENABLED_PAYMENT_METHODS),
      callbacks: {
        finish: `${process.env.APP_URL}/admin/orders/${order.id}?payment=success`,
        error: `${process.env.APP_URL}/admin/orders/${order.id}?payment=error`,
        pending: `${process.env.APP_URL}/admin/orders/${order.id}?payment=pending`,
      },
      expiry: {
        // Skip start_time, let Midtrans use transaction time as default
        unit: 'minute',
        duration: 10, // 10 minutes expiry
      },
    };

    console.log('Creating Midtrans transaction:', {
      order_id: order.orderNumber,
      amount: transactionParams.transaction_details.gross_amount,
      customer_details: transactionParams.customer_details,
      expiry: transactionParams.expiry,
    });

    // Create Snap transaction
    const snapResult = await createSnapTransaction(transactionParams);

    // Update order with payment token and expiry
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentToken: snapResult.token,
        paymentStatus: 'PENDING',
        status: 'PENDING_PAYMENT',
        updatedAt: new Date(),
      },
    });

    console.log('✅ Payment token generated:', {
      order_id: order.orderNumber,
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
      amount: Number(order.totalAmount),
      expires_at: expiryTimeISO,
      payment_methods: getEnabledPaymentMethods(DEFAULT_ENABLED_PAYMENT_METHODS),
    });

  } catch (error) {
    console.error('❌ Create payment error:', error);

    // Handle Midtrans specific errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate transaction',
            details: 'A payment transaction already exists for this order',
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
        error: 'Failed to create payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payment/create?orderId={orderId}
 * Get existing payment token if still valid
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
        paymentToken: true,
        paymentStatus: true,
        status: true,
        totalAmount: true,
        updatedAt: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!order.paymentToken) {
      return NextResponse.json(
        { success: false, error: 'No payment token found' },
        { status: 404 }
      );
    }

    // Check if token is still valid (within 10 minutes)
    const tokenAge = Date.now() - order.updatedAt.getTime();
    const TEN_MINUTES = 10 * 60 * 1000;

    if (tokenAge >= TEN_MINUTES) {
      return NextResponse.json(
        { success: false, error: 'Payment token expired', expired: true },
        { status: 410 }
      );
    }

    const expiresAt = new Date(order.updatedAt.getTime() + TEN_MINUTES);

    return NextResponse.json({
      success: true,
      token: order.paymentToken,
      redirect_url: `https://app.${process.env.MIDTRANS_IS_PRODUCTION === 'true' ? '' : 'sandbox.'}midtrans.com/snap/v3/redirection/${order.paymentToken}`,
      order_id: order.orderNumber,
      amount: Number(order.totalAmount),
      expires_at: expiresAt.toISOString(),
      time_remaining_ms: TEN_MINUTES - tokenAge,
    });

  } catch (error) {
    console.error('❌ Get payment token error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get payment token',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
