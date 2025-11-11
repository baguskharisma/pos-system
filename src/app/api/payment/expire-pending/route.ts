import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/payment/expire-pending
 * Expire pending payments that are older than 10 minutes
 *
 * This endpoint should be called periodically (e.g., via cron job)
 * to clean up expired pending payments.
 *
 * Can be triggered via:
 * 1. Cron job (e.g., Vercel Cron, AWS Lambda)
 * 2. Manual trigger from admin panel
 * 3. External scheduler (e.g., GitHub Actions)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Optional: Add authentication for cron jobs
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Calculate cutoff time (10 minutes ago)
    const TEN_MINUTES_AGO = new Date(Date.now() - 10 * 60 * 1000);

    console.log('🕐 Starting payment expiry job:', {
      cutoff_time: TEN_MINUTES_AGO.toISOString(),
    });

    // Find pending orders with expired payment tokens
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ['PENDING_PAYMENT'],
        },
        paymentStatus: {
          in: ['PENDING', 'PROCESSING'],
        },
        paymentToken: {
          not: null,
        },
        updatedAt: {
          lt: TEN_MINUTES_AGO,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        updatedAt: true,
      },
    });

    console.log(`📋 Found ${expiredOrders.length} expired pending payments`);

    if (expiredOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired payments found',
        expired_count: 0,
        processing_time_ms: Date.now() - startTime,
      });
    }

    // Update expired orders
    const updatedOrders = await prisma.$transaction(
      expiredOrders.map((order) =>
        prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'EXPIRED',
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancellationReason: 'Payment expired - exceeded 10 minute time limit',
            updatedAt: new Date(),
          },
        })
      )
    );

    // Create/update payment records for expired payments
    const paymentRecords = await prisma.$transaction(
      expiredOrders.map((order) =>
        prisma.payment.upsert({
          where: {
            orderId_status: {
              orderId: order.id,
              status: 'PENDING',
            },
          },
          create: {
            orderId: order.id,
            paymentMethod: 'OTHER',
            amount: 0,
            status: 'EXPIRED',
            transactionType: 'PAYMENT',
            gatewayName: 'midtrans',
            referenceNumber: order.orderNumber,
            expiredAt: new Date(),
            gatewayResponse: {
              expired_by: 'system',
              expired_reason: 'Payment token exceeded 10 minute time limit',
            } as any,
          },
          update: {
            status: 'EXPIRED',
            expiredAt: new Date(),
            updatedAt: new Date(),
          },
        })
      )
    );

    const processingTime = Date.now() - startTime;

    console.log('✅ Payment expiry job completed:', {
      expired_count: updatedOrders.length,
      processing_time_ms: processingTime,
      expired_orders: updatedOrders.map(o => o.orderNumber),
    });

    return NextResponse.json({
      success: true,
      message: 'Expired payments processed successfully',
      expired_count: updatedOrders.length,
      expired_orders: updatedOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        previousStatus: expiredOrders.find(o => o.id === order.id)?.paymentStatus,
        newStatus: order.paymentStatus,
      })),
      processing_time_ms: processingTime,
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error('❌ Payment expiry job error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processing_time_ms: processingTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process expired payments',
        details: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: processingTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payment/expire-pending
 * Get count of pending payments that need to be expired
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const TEN_MINUTES_AGO = new Date(Date.now() - 10 * 60 * 1000);

    const pendingCount = await prisma.order.count({
      where: {
        status: {
          in: ['PENDING_PAYMENT'],
        },
        paymentStatus: {
          in: ['PENDING', 'PROCESSING'],
        },
        paymentToken: {
          not: null,
        },
        updatedAt: {
          lt: TEN_MINUTES_AGO,
        },
        deletedAt: null,
      },
    });

    const recentExpired = await prisma.order.count({
      where: {
        paymentStatus: 'EXPIRED',
        updatedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    return NextResponse.json({
      success: true,
      pending_to_expire: pendingCount,
      recently_expired: recentExpired,
      cutoff_time: TEN_MINUTES_AGO.toISOString(),
      current_time: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Get pending expiry count error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get pending expiry count',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
