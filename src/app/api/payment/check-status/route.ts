import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getTransactionStatus, mapTransactionStatus } from '@/lib/midtrans';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * GET /api/payment/check-status?orderId={orderId}
 * Check payment status for an order from Midtrans
 *
 * This endpoint:
 * 1. Fetches order from database
 * 2. Checks transaction status with Midtrans API
 * 3. Updates local database if status has changed
 * 4. Returns current status
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get order identifier from query params
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const orderNumber = searchParams.get('orderNumber');

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Order ID or Order Number is required' },
        { status: 400 }
      );
    }

    // Find order in database
    const order = await prisma.order.findFirst({
      where: orderId
        ? { id: orderId }
        : { orderNumber: orderNumber! },
      include: {
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order has payment token
    if (!order.paymentToken) {
      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          totalAmount: Number(order.totalAmount),
          hasPaymentToken: false,
        },
        midtrans: null,
        message: 'No payment token found for this order',
      });
    }

    // Check if payment token is expired (10 minutes)
    const tokenAge = Date.now() - order.updatedAt.getTime();
    const TEN_MINUTES = 10 * 60 * 1000;
    const isTokenExpired = tokenAge >= TEN_MINUTES;

    // Get transaction status from Midtrans
    let midtransData: any = null;
    let statusFromMidtrans = false;

    try {
      const transactionStatus = await getTransactionStatus(order.orderNumber);
      midtransData = transactionStatus;
      statusFromMidtrans = true;

      console.log('✅ Transaction status from Midtrans:', {
        order_id: order.orderNumber,
        transaction_status: transactionStatus.transaction_status,
        payment_type: transactionStatus.payment_type,
      });

      // Determine new status based on Midtrans response
      let newOrderStatus = order.status;
      let newPaymentStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'REFUNDED' = 'PENDING';
      let paidAt: Date | null = order.paidAt;

      // Map payment type
      const paymentTypeMap: Record<string, any> = {
        'qris': 'QRIS',
        'gopay': 'E_WALLET',
        'shopeepay': 'E_WALLET',
        'bank_transfer': 'BANK_TRANSFER',
        'bca_va': 'BANK_TRANSFER',
        'bni_va': 'BANK_TRANSFER',
        'bri_va': 'BANK_TRANSFER',
        'permata_va': 'BANK_TRANSFER',
        'echannel': 'BANK_TRANSFER',
        'credit_card': 'CREDIT_CARD',
        'debit_card': 'DEBIT_CARD',
      };

      const paymentMethod = paymentTypeMap[transactionStatus.payment_type] || 'OTHER';

      // Handle transaction status
      if (transactionStatus.transaction_status === 'capture' || transactionStatus.transaction_status === 'settlement') {
        if (transactionStatus.fraud_status === 'accept' || !transactionStatus.fraud_status) {
          newOrderStatus = 'PAID';
          newPaymentStatus = 'COMPLETED';
          paidAt = new Date(transactionStatus.settlement_time || transactionStatus.transaction_time);
        } else if (transactionStatus.fraud_status === 'challenge') {
          newOrderStatus = 'AWAITING_CONFIRMATION';
          newPaymentStatus = 'PROCESSING';
        }
      } else if (transactionStatus.transaction_status === 'pending') {
        newOrderStatus = 'PENDING_PAYMENT';
        newPaymentStatus = 'PENDING';
      } else if (transactionStatus.transaction_status === 'deny') {
        newOrderStatus = 'CANCELLED';
        newPaymentStatus = 'FAILED';
      } else if (transactionStatus.transaction_status === 'expire') {
        newOrderStatus = 'CANCELLED';
        newPaymentStatus = 'EXPIRED';
      } else if (transactionStatus.transaction_status === 'cancel') {
        newOrderStatus = 'CANCELLED';
        newPaymentStatus = 'FAILED';
      } else if (transactionStatus.transaction_status === 'refund') {
        newOrderStatus = 'REFUNDED';
        newPaymentStatus = 'REFUNDED';
      }

      // Update order if status has changed
      if (order.paymentStatus !== newPaymentStatus || order.status !== newOrderStatus) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: newOrderStatus,
            paymentStatus: newPaymentStatus,
            paymentMethod: paymentMethod,
            paidAt: paidAt,
            paidAmount: newPaymentStatus === 'COMPLETED' ? Number(transactionStatus.gross_amount) : undefined,
            updatedAt: new Date(),
          },
        });

        console.log('📝 Order status updated:', {
          orderId: order.id,
          oldStatus: order.status,
          newStatus: newOrderStatus,
          oldPaymentStatus: order.paymentStatus,
          newPaymentStatus: newPaymentStatus,
        });

        // Update the order object for response
        order.status = newOrderStatus;
        order.paymentStatus = newPaymentStatus;
        order.paymentMethod = paymentMethod as any;
        order.paidAt = paidAt;
      }

    } catch (error: any) {
      // If transaction not found in Midtrans (404)
      if (error?.message?.includes('404') || error?.statusCode === 404) {
        console.log('⚠️ Transaction not found in Midtrans:', order.orderNumber);

        // If token is expired and transaction not found, mark as expired
        if (isTokenExpired && order.paymentStatus === 'PENDING') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'EXPIRED',
              status: 'CANCELLED',
              updatedAt: new Date(),
            },
          });

          return NextResponse.json({
            success: true,
            order: {
              id: order.id,
              orderNumber: order.orderNumber,
              status: 'CANCELLED',
              paymentStatus: 'EXPIRED',
              totalAmount: Number(order.totalAmount),
              hasPaymentToken: true,
              tokenExpired: true,
            },
            midtrans: null,
            message: 'Payment token expired and transaction not found',
          });
        }

        return NextResponse.json({
          success: true,
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            totalAmount: Number(order.totalAmount),
            hasPaymentToken: true,
            tokenExpired: isTokenExpired,
          },
          midtrans: null,
          message: 'Transaction not found in Midtrans',
        });
      }

      console.error('❌ Error checking Midtrans status:', error);
      // Continue with local status if API call fails
    }

    // Calculate time remaining if token exists
    let timeRemaining: number | null = null;
    if (!isTokenExpired) {
      timeRemaining = TEN_MINUTES - tokenAge;
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: Number(order.totalAmount),
        paidAmount: order.paidAmount ? Number(order.paidAmount) : null,
        paidAt: order.paidAt?.toISOString() || null,
        hasPaymentToken: true,
        tokenExpired: isTokenExpired,
        timeRemainingMs: timeRemaining,
        canRetry: isTokenExpired || order.paymentStatus === 'FAILED' || order.paymentStatus === 'EXPIRED',
      },
      midtrans: midtransData ? {
        transaction_id: midtransData.transaction_id,
        transaction_status: midtransData.transaction_status,
        transaction_time: midtransData.transaction_time,
        settlement_time: midtransData.settlement_time,
        payment_type: midtransData.payment_type,
        fraud_status: midtransData.fraud_status,
        gross_amount: midtransData.gross_amount,
        status_code: midtransData.status_code,
      } : null,
      statusFromMidtrans,
      latestPayment: order.payments.length > 0 ? {
        id: order.payments[0].id,
        status: order.payments[0].status,
        amount: Number(order.payments[0].amount),
        paymentMethod: order.payments[0].paymentMethod,
        gatewayTransactionId: order.payments[0].gatewayTransactionId,
        paidAt: order.payments[0].paidAt?.toISOString() || null,
      } : null,
    });

  } catch (error) {
    console.error('❌ Payment status check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check payment status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payment/check-status
 * Batch check payment status for multiple orders
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderIds } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'orderIds array is required' },
        { status: 400 }
      );
    }

    if (orderIds.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum 50 orders can be checked at once' },
        { status: 400 }
      );
    }

    // Fetch all orders
    const orders = await prisma.order.findMany({
      where: {
        id: {
          in: orderIds,
        },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentToken: true,
        totalAmount: true,
        updatedAt: true,
      },
    });

    const results = [];
    const TEN_MINUTES = 10 * 60 * 1000;

    for (const order of orders) {
      const tokenAge = Date.now() - order.updatedAt.getTime();
      const isTokenExpired = tokenAge >= TEN_MINUTES;

      results.push({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: Number(order.totalAmount),
        hasPaymentToken: !!order.paymentToken,
        tokenExpired: isTokenExpired,
        canRetry: isTokenExpired || order.paymentStatus === 'FAILED' || order.paymentStatus === 'EXPIRED',
      });
    }

    return NextResponse.json({
      success: true,
      orders: results,
      total: results.length,
    });

  } catch (error) {
    console.error('❌ Batch status check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check payment status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
