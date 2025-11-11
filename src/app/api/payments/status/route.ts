import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getTransactionStatus, mapTransactionStatus } from '@/lib/midtrans';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/payments/status
 * Check payment status for an order
 * Query params: orderId or orderNumber
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get order identifier from query params
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const orderNumber = searchParams.get('orderNumber');

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { error: 'Order ID or Order Number is required' },
        { status: 400 }
      );
    }

    // Find order in database
    const order = await prisma.order.findFirst({
      where: orderId
        ? { id: orderId }
        : { orderNumber: orderNumber! },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get transaction status from Midtrans
    try {
      const transactionStatus = await getTransactionStatus(order.orderNumber);
      const mappedStatus = mapTransactionStatus(transactionStatus.transaction_status);

      // Update local database if status has changed
      let paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' = 'PENDING';
      let orderStatus = order.status;

      if (transactionStatus.transaction_status === 'capture' || transactionStatus.transaction_status === 'settlement') {
        if (transactionStatus.fraud_status === 'accept' || !transactionStatus.fraud_status) {
          paymentStatus = 'PAID';
          orderStatus = 'COMPLETED';
        }
      } else if (transactionStatus.transaction_status === 'pending') {
        paymentStatus = 'PENDING';
      } else if (
        transactionStatus.transaction_status === 'deny' ||
        transactionStatus.transaction_status === 'expire' ||
        transactionStatus.transaction_status === 'cancel'
      ) {
        paymentStatus = 'FAILED';
        orderStatus = 'CANCELLED';
      }

      // Update order if status has changed
      if (order.paymentStatus !== paymentStatus || order.status !== orderStatus) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: orderStatus,
            paymentStatus,
            paymentMethod: transactionStatus.payment_type,
            paidAt: paymentStatus === 'PAID' ? new Date(transactionStatus.transaction_time) : null,
            updatedAt: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: orderStatus,
          paymentStatus,
        },
        midtrans: {
          transaction_id: transactionStatus.transaction_id,
          transaction_status: transactionStatus.transaction_status,
          transaction_time: transactionStatus.transaction_time,
          payment_type: transactionStatus.payment_type,
          fraud_status: transactionStatus.fraud_status,
          gross_amount: transactionStatus.gross_amount,
        },
      });

    } catch (error) {
      // If transaction not found in Midtrans, return local status
      if (error instanceof Error && error.message.includes('404')) {
        return NextResponse.json({
          success: true,
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
          },
          midtrans: null,
          message: 'Transaction not found in Midtrans',
        });
      }

      throw error;
    }

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check payment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
