import { NextRequest, NextResponse } from 'next/server';
import {
  verifySignatureKey,
  mapTransactionStatus,
  getTransactionStatus
} from '@/lib/midtrans';
import { prisma } from '@/lib/prisma';

/**
 * Midtrans Webhook Handler
 * This endpoint receives payment notifications from Midtrans
 *
 * Webhook URL should be configured in Midtrans Dashboard:
 * Settings > Configuration > Notification URL
 */
export async function POST(request: NextRequest) {
  try {
    // Parse notification from Midtrans
    const notification = await request.json();

    console.log('Received Midtrans notification:', {
      order_id: notification.order_id,
      transaction_status: notification.transaction_status,
      payment_type: notification.payment_type,
    });

    // Verify signature
    const isValid = verifySignatureKey(notification);
    if (!isValid) {
      console.error('Invalid signature key');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Extract notification data
    const {
      order_id,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_time,
      gross_amount,
      transaction_id,
    } = notification;

    // Find order by order number
    const order = await prisma.order.findFirst({
      where: { orderNumber: order_id },
    });

    if (!order) {
      console.error('Order not found:', order_id);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify transaction status with Midtrans API
    let verifiedStatus;
    try {
      const statusResponse = await getTransactionStatus(order_id);
      verifiedStatus = statusResponse.transaction_status;
    } catch (error) {
      console.error('Failed to verify transaction status:', error);
      verifiedStatus = transaction_status; // Fallback to notification status
    }

    // Map Midtrans status to application status
    const mappedStatus = mapTransactionStatus(verifiedStatus);

    // Determine if payment was successful
    let paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' = 'PENDING';
    let orderStatus = order.status;

    if (verifiedStatus === 'capture' || verifiedStatus === 'settlement') {
      if (fraud_status === 'accept' || !fraud_status) {
        paymentStatus = 'PAID';
        orderStatus = 'COMPLETED';
      }
    } else if (verifiedStatus === 'pending') {
      paymentStatus = 'PENDING';
      orderStatus = 'PENDING';
    } else if (verifiedStatus === 'deny' || verifiedStatus === 'expire' || verifiedStatus === 'cancel') {
      paymentStatus = 'FAILED';
      orderStatus = 'CANCELLED';
    }

    // Update order in database
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: orderStatus,
        paymentStatus,
        paymentMethod: payment_type,
        paidAt: paymentStatus === 'PAID' ? new Date(transaction_time) : null,
        updatedAt: new Date(),
        // Store transaction details in a JSON field if available
        // transactionDetails: {
        //   transaction_id,
        //   payment_type,
        //   transaction_status: verifiedStatus,
        //   fraud_status,
        //   gross_amount,
        // },
      },
    });

    console.log('Order updated successfully:', {
      orderId: order.id,
      orderNumber: order_id,
      status: orderStatus,
      paymentStatus,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Notification processed successfully',
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check webhook status
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Midtrans webhook endpoint is active',
  });
}
