import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const confirmPaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  paidAmount: z.number().positive('Paid amount must be positive'),
  changeAmount: z.number().min(0, 'Change amount cannot be negative').optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'QRIS', 'CREDIT_CARD', 'DEBIT_CARD', 'E_WALLET', 'OTHER']).optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/orders/confirm-payment
 * Confirm cash payment by cashier/admin
 *
 * This endpoint is used when payment is done in cash/offline
 * and needs admin/cashier confirmation
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

    // Check if user has permission (ADMIN, SUPER_ADMIN, or CASHIER)
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'CASHIER'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = confirmPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { orderId, paidAmount, changeAmount, paymentMethod, notes } = validation.data;

    // Get order from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
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

    // Check if order is in correct status
    if (order.status === 'PAID' || order.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Order is already paid' },
        { status: 400 }
      );
    }

    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      return NextResponse.json(
        { success: false, error: 'Cannot confirm payment for cancelled order' },
        { status: 400 }
      );
    }

    // Validate paid amount
    const totalAmount = Number(order.totalAmount);
    if (paidAmount < totalAmount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient payment amount',
          details: {
            required: totalAmount,
            provided: paidAmount,
            shortage: totalAmount - paidAmount,
          },
        },
        { status: 400 }
      );
    }

    // Calculate change if not provided
    const calculatedChange = changeAmount !== undefined ? changeAmount : paidAmount - totalAmount;

    console.log('💰 Confirming cash payment:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount,
      paidAmount,
      changeAmount: calculatedChange,
      confirmedBy: session.user.name,
    });

    // Update order in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paymentStatus: 'COMPLETED',
          paymentMethod: paymentMethod || 'CASH',
          paidAmount,
          changeAmount: calculatedChange,
          paidAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          items: {
            include: {
              product: true,
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

      // Create payment record
      await tx.payment.create({
        data: {
          orderId: order.id,
          paymentMethod: paymentMethod || 'CASH',
          amount: totalAmount,
          status: 'COMPLETED',
          transactionType: 'PAYMENT',
          paidAt: new Date(),
          verifiedBy: session.user.id,
          verifiedAt: new Date(),
          verificationNotes: notes,
          referenceNumber: order.orderNumber,
        },
      });

      // Update product inventory if tracked
      for (const item of order.items) {
        if (item.product.trackInventory) {
          await tx.product.update({
            where: { id: item.product.id },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          });

          // Create inventory log
          await tx.inventoryLog.create({
            data: {
              productId: item.product.id,
              type: 'OUT',
              quantity: item.quantity,
              previousStock: item.product.quantity,
              currentStock: item.product.quantity - item.quantity,
              reason: `Sold in order ${order.orderNumber}`,
              referenceType: 'ORDER',
              referenceId: order.id,
              userId: session.user.id,
            },
          });
        }
      }

      return updated;
    });

    console.log('✅ Payment confirmed successfully:', {
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
      verifiedBy: session.user.name,
    });

    // Broadcast WebSocket event untuk real-time update
    try {
      // Send WebSocket notification
      const wsPayload = {
        type: 'PAYMENT_CONFIRMED',
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        totalAmount,
        paidAmount,
        changeAmount: calculatedChange,
        paymentMethod: updatedOrder.paymentMethod,
        confirmedBy: session.user.name,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to admin room via WebSocket
      if (global.io) {
        global.io.to('admin-notifications').emit('payment:confirmed', wsPayload);
        console.log('📡 [WebSocket] Broadcasted payment confirmation to admin-notifications');
      } else {
        console.warn('⚠️ [WebSocket] Socket.IO instance not available');
      }
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError);
      // Don't fail the request if WebSocket fails
    }

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed successfully',
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        paymentMethod: updatedOrder.paymentMethod,
        totalAmount: Number(updatedOrder.totalAmount),
        paidAmount: Number(updatedOrder.paidAmount),
        changeAmount: Number(updatedOrder.changeAmount),
        paidAt: updatedOrder.paidAt?.toISOString(),
      },
      verifiedBy: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    });

  } catch (error) {
    console.error('❌ Confirm payment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to confirm payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders/confirm-payment?orderId={orderId}
 * Get order details for confirmation
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
      include: {
        items: {
          include: {
            product: true,
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

    const canConfirm = ['PENDING_PAYMENT', 'AWAITING_CONFIRMATION', 'DRAFT'].includes(order.status);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: Number(order.totalAmount),
        subtotal: Number(order.subtotal),
        taxAmount: Number(order.taxAmount),
        discountAmount: Number(order.discountAmount),
        serviceCharge: Number(order.serviceCharge),
        items: order.items.map(item => ({
          id: item.id,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalAmount: Number(item.totalAmount),
        })),
        cashier: order.cashier,
        createdAt: order.createdAt.toISOString(),
      },
      canConfirm,
      hasExistingPayment: order.payments.length > 0,
    });

  } catch (error) {
    console.error('❌ Get order for confirmation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get order details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
