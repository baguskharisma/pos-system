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

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { orderId, amount, customerDetails, items } = body;

    // Validate required fields
    if (!orderId || !amount) {
      return NextResponse.json(
        { error: 'Order ID and amount are required' },
        { status: 400 }
      );
    }

    // Get order from database to verify
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Prepare item details from order items
    const itemDetails = order.orderItems.map((item) => ({
      id: item.product.id,
      price: Number(item.price),
      quantity: item.quantity,
      name: item.product.name,
      category: item.product.category?.name || 'General',
    }));

    // Validate and prepare customer_details for Midtrans
    const validatedCustomerDetails: {
      first_name: string;
      last_name?: string;
      email?: string;
      phone?: string;
    } = customerDetails || {
      first_name: order.user?.name || 'Customer',
    };

    // Only add email if it's valid
    if (!customerDetails) {
      const userEmail = order.user?.email;
      if (userEmail && userEmail.trim() && userEmail.includes('@')) {
        validatedCustomerDetails.email = userEmail.trim().substring(0, 80);
      }
    }

    // Prepare transaction parameters
    const transactionParams: MidtransTransactionParams = {
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: Number(order.totalAmount),
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
        duration: 30, // Payment expires in 30 minutes
      },
    };

    // Create Snap transaction
    const snapResult = await createSnapTransaction(transactionParams);

    // Update order with payment token
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentToken: snapResult.token,
        updatedAt: new Date(),
      },
    });

    // Return the snap token and redirect URL
    return NextResponse.json({
      success: true,
      token: snapResult.token,
      redirect_url: snapResult.redirect_url,
      order_id: order.orderNumber,
    });

  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
