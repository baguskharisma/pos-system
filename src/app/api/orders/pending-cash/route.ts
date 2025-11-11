import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/orders/pending-cash
 * Get all pending cash payment orders
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

    // Check if user has permission
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'CASHIER'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Fetch pending orders
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: {
            in: ['PENDING_PAYMENT', 'AWAITING_CONFIRMATION'],
          },
          paymentStatus: {
            in: ['PENDING', 'PROCESSING'],
          },
          deletedAt: null,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
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
        orderBy: {
          createdAt: 'asc', // Oldest first (FIFO)
        },
        take: limit,
        skip,
      }),
      prisma.order.count({
        where: {
          status: {
            in: ['PENDING_PAYMENT', 'AWAITING_CONFIRMATION'],
          },
          paymentStatus: {
            in: ['PENDING', 'PROCESSING'],
          },
          deletedAt: null,
        },
      }),
    ]);

    // Format response
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      totalAmount: Number(order.totalAmount),
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      discountAmount: Number(order.discountAmount),
      status: order.status,
      paymentStatus: order.paymentStatus,
      orderType: order.orderType,
      createdAt: order.createdAt.toISOString(),
      cashier: order.cashier,
      items: order.items.map(item => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalAmount: Number(item.totalAmount),
      })),
      itemCount: order.items.length,
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + orders.length < total,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Get pending cash orders error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get pending orders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
