import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { cancelTransaction } from '@/lib/midtrans';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/payments/cancel
 * Cancel a pending payment transaction
 */
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
    const { orderId, orderNumber } = body;

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

    // Check if order can be cancelled
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot cancel a paid order' },
        { status: 400 }
      );
    }

    // Cancel transaction in Midtrans
    try {
      const cancelResult = await cancelTransaction(order.orderNumber);

      // Update order status in database
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Payment cancelled successfully',
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: 'CANCELLED',
        },
        midtrans: cancelResult,
      });

    } catch (error) {
      console.error('Midtrans cancel error:', error);

      // If transaction doesn't exist in Midtrans, just update local status
      if (error instanceof Error && error.message.includes('404')) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
            updatedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Order cancelled (transaction not found in Midtrans)',
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: 'CANCELLED',
          },
        });
      }

      throw error;
    }

  } catch (error) {
    console.error('Cancel payment error:', error);
    return NextResponse.json(
      {
        error: 'Failed to cancel payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
