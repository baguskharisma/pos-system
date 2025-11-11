import { NextRequest, NextResponse } from 'next/server';
import {
  verifySignatureKey,
  mapTransactionStatus,
  getTransactionStatus
} from '@/lib/midtrans';
import { prisma } from '@/lib/prisma';

/**
 * Midtrans Webhook Notification Handler
 * POST /api/payment/notification
 *
 * This endpoint receives payment notifications from Midtrans
 * Configure in Midtrans Dashboard: Settings > Configuration > Notification URL
 *
 * Notification Flow:
 * 1. Midtrans sends notification when payment status changes
 * 2. Verify signature to ensure authenticity
 * 3. Verify transaction status with Midtrans API
 * 4. Update order status in database
 * 5. Create payment record
 * 6. Return success response
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse notification from Midtrans
    const notification = await request.json();

    console.log('📥 Received Midtrans notification:', {
      order_id: notification.order_id,
      transaction_status: notification.transaction_status,
      payment_type: notification.payment_type,
      fraud_status: notification.fraud_status,
    });

    // Validate required fields
    if (!notification.order_id || !notification.transaction_status) {
      console.error('❌ Invalid notification: missing required fields');
      return NextResponse.json(
        { success: false, error: 'Invalid notification data' },
        { status: 400 }
      );
    }

    // Verify signature (bypass in development for manual testing)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isValidSignature = isDevelopment
      ? true // Bypass signature verification in development mode
      : verifySignatureKey({
          order_id: notification.order_id,
          status_code: notification.status_code,
          gross_amount: notification.gross_amount,
          signature_key: notification.signature_key,
        });

    if (!isValidSignature) {
      console.error('❌ Invalid signature key for order:', notification.order_id);
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    if (isDevelopment) {
      console.log('⚠️  Development mode: Signature verification bypassed');
    } else {
      console.log('✅ Signature verified');
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
      status_code,
      settlement_time,
      signature_key,
    } = notification;

    // Find order by order number
    const order = await prisma.order.findFirst({
      where: { orderNumber: order_id },
      include: {
        payments: {
          where: {
            gatewayTransactionId: transaction_id,
          },
        },
      },
    });

    if (!order) {
      console.error('❌ Order not found:', order_id);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('📦 Order found:', {
      id: order.id,
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      currentPaymentStatus: order.paymentStatus,
    });

    // Verify transaction status with Midtrans API (double-check)
    let verifiedStatus;
    let verifiedTransactionData;
    try {
      verifiedTransactionData = await getTransactionStatus(order_id);
      verifiedStatus = verifiedTransactionData.transaction_status;

      console.log('✅ Transaction verified with Midtrans API:', {
        transaction_id: verifiedTransactionData.transaction_id,
        status: verifiedStatus,
      });
    } catch (error) {
      console.error('⚠️ Failed to verify transaction status with API:', error);
      verifiedStatus = transaction_status; // Fallback to notification status
      verifiedTransactionData = notification;
    }

    // Map payment type to PaymentMethod enum
    const paymentMethodMap: Record<string, any> = {
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

    const paymentMethod = paymentMethodMap[payment_type] || 'OTHER';

    // Determine order status and payment status based on transaction status
    let newOrderStatus = order.status;
    let newPaymentStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' = 'PENDING';
    let paidAt: Date | null = null;

    // Handle different transaction statuses
    switch (verifiedStatus) {
      case 'capture':
        if (fraud_status === 'accept') {
          newOrderStatus = 'PAID';
          newPaymentStatus = 'COMPLETED';
          paidAt = new Date(settlement_time || transaction_time);
        } else if (fraud_status === 'challenge') {
          newOrderStatus = 'AWAITING_CONFIRMATION';
          newPaymentStatus = 'PROCESSING';
        } else if (fraud_status === 'deny') {
          newOrderStatus = 'CANCELLED';
          newPaymentStatus = 'FAILED';
        }
        break;

      case 'settlement':
        newOrderStatus = 'PAID';
        newPaymentStatus = 'COMPLETED';
        paidAt = new Date(settlement_time || transaction_time);
        break;

      case 'pending':
        newOrderStatus = 'PENDING_PAYMENT';
        newPaymentStatus = 'PENDING';
        break;

      case 'deny':
        newOrderStatus = 'CANCELLED';
        newPaymentStatus = 'FAILED';
        break;

      case 'expire':
        newOrderStatus = 'CANCELLED';
        newPaymentStatus = 'EXPIRED';
        break;

      case 'cancel':
        newOrderStatus = 'CANCELLED';
        newPaymentStatus = 'FAILED';
        break;

      case 'refund':
      case 'partial_refund':
        newPaymentStatus = verifiedStatus === 'refund' ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
        if (verifiedStatus === 'refund') {
          newOrderStatus = 'REFUNDED';
        }
        break;

      default:
        console.warn('⚠️ Unknown transaction status:', verifiedStatus);
        newPaymentStatus = 'PROCESSING';
    }

    console.log('📝 Status mapping:', {
      transaction_status: verifiedStatus,
      fraud_status,
      newOrderStatus,
      newPaymentStatus,
    });

    // Use transaction to update order and create/update payment record
    await prisma.$transaction(async (tx) => {
      // Update order
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: newOrderStatus,
          paymentStatus: newPaymentStatus,
          paymentMethod: paymentMethod,
          paidAt: paidAt,
          paidAmount: paidAt ? Number(gross_amount) : undefined,
          updatedAt: new Date(),
        },
      });

      // Create or update payment record
      const existingPayment = order.payments.find(
        p => p.gatewayTransactionId === transaction_id
      );

      if (existingPayment) {
        // Update existing payment record
        await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: newPaymentStatus,
            gatewayStatus: verifiedStatus,
            gatewayResponse: verifiedTransactionData as any,
            paidAt: paidAt,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new payment record
        await tx.payment.create({
          data: {
            orderId: order.id,
            paymentMethod: paymentMethod,
            amount: Number(gross_amount),
            status: newPaymentStatus,
            transactionType: 'PAYMENT',
            gatewayName: 'midtrans',
            gatewayTransactionId: transaction_id,
            gatewayStatus: verifiedStatus,
            gatewayResponse: verifiedTransactionData as any,
            gatewayCallbackData: notification as any,
            referenceNumber: order_id,
            paidAt: paidAt,
          },
        });
      }

      // Reduce inventory when payment is successful (settlement or capture with accept)
      // For non-cash orders, inventory was NOT reduced at order creation time
      // Only reduce inventory once when payment is confirmed
      if (newPaymentStatus === 'COMPLETED' && !existingPayment) {
        console.log('📦 Payment successful, reducing inventory for order:', order_id);

        // Get order items
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: order.id },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                trackInventory: true,
                quantity: true,
              },
            },
          },
        });

        // Reduce inventory for each item
        for (const item of orderItems) {
          if (item.product.trackInventory) {
            // Check if enough stock
            if (item.product.quantity < item.quantity) {
              console.warn(`⚠️ Insufficient stock for product ${item.product.name} (${item.product.id})`);
              console.warn(`  Available: ${item.product.quantity}, Required: ${item.quantity}`);
              // Note: Payment already confirmed, so we'll proceed but log the warning
              // You may want to handle this differently (send notification to admin, etc.)
            }

            // Decrease stock
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
                quantity: -item.quantity,
                previousStock: item.product.quantity,
                currentStock: Math.max(0, item.product.quantity - item.quantity),
                reason: `Order ${order.orderNumber} - Payment Confirmed (${payment_type})`,
                referenceType: 'ORDER',
                referenceId: order.id,
              },
            });

            console.log(`✅ Inventory reduced for ${item.product.name}: ${item.product.quantity} → ${Math.max(0, item.product.quantity - item.quantity)}`);
          }
        }
      }
    });

    const processingTime = Date.now() - startTime;

    console.log('✅ Order updated successfully:', {
      orderId: order.id,
      orderNumber: order_id,
      status: newOrderStatus,
      paymentStatus: newPaymentStatus,
      processingTime: `${processingTime}ms`,
    });

    // Send WebSocket notification for real-time updates
    if (newPaymentStatus === 'COMPLETED') {
      try {
        const io = (global as any).io;
        if (!io) {
          console.error("❌ Global io not found");
        } else {
          const payload = {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: newOrderStatus,
            paymentStatus: newPaymentStatus,
            paymentMethod: paymentMethod,
            paymentType: payment_type,
            amount: Number(gross_amount),
            paidAt: paidAt?.toISOString(),
          };
          console.log("📡 [WEBHOOK] Emitting payment:completed event with payload:", payload);
          io.emit("payment:completed", payload);
          io.emit("order:updated", payload);
          console.log("✓ [WEBHOOK] Payment completion events emitted successfully");
        }
      } catch (wsError) {
        console.error("❌ [WEBHOOK] WebSocket notification error:", wsError);
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Notification processed successfully',
      order: {
        id: order.id,
        orderNumber: order_id,
        status: newOrderStatus,
        paymentStatus: newPaymentStatus,
      },
      processing_time_ms: processingTime,
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error('❌ Webhook processing error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: `${processingTime}ms`,
    });

    // Return 500 error so Midtrans will retry
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payment/notification
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'active',
    message: 'Midtrans webhook notification endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
