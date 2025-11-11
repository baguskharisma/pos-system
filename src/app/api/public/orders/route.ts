import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerCheckoutSchema } from "@/lib/validations/orders";
import { Prisma } from "@prisma/client";
import {
  createSnapTransaction,
  mapPaymentMethodToMidtrans,
  type MidtransTransactionParams
} from "@/lib/midtrans";

// Generate order number (format: CUST-YYYYMMDD-XXXXX)
async function generateOrderNumber(): Promise<string> {
  const maxRetries = 10;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");

    // Count orders today with CUST prefix
    const count = await prisma.order.count({
      where: {
        orderNumber: {
          startsWith: `CUST-${dateStr}`,
        },
      },
    });

    const sequence = (count + 1 + attempt).toString().padStart(5, "0");
    const orderNumber = `CUST-${dateStr}-${sequence}`;

    // Check if this order number already exists
    const exists = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!exists) {
      return orderNumber;
    }

    // If exists, retry with next sequence
  }

  // Fallback to timestamp-based if all retries fail
  return `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log received payment method for debugging
    console.log('📝 Received payment method:', body.paymentMethod);
    console.log('📝 Full request body:', JSON.stringify(body, null, 2));

    // Validate request body
    const validatedData = customerCheckoutSchema.parse(body);

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Determine if payment is non-cash (requires Midtrans)
    const isNonCashPayment = validatedData.paymentMethod !== "CASH";

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName: validatedData.customerName,
          customerPhone: validatedData.customerPhone,
          customerEmail: validatedData.customerEmail,
          customerAddress: validatedData.customerAddress,
          tableNumber: validatedData.tableNumber,
          orderType: validatedData.orderType,
          orderSource: "CUSTOMER",
          status: "PENDING_PAYMENT",
          paymentStatus: isNonCashPayment ? "PENDING" : "PENDING",
          paymentMethod: validatedData.paymentMethod,
          subtotal: new Prisma.Decimal(validatedData.subtotal),
          taxAmount: new Prisma.Decimal(validatedData.taxAmount),
          taxRate: new Prisma.Decimal(validatedData.taxRate),
          discountAmount: new Prisma.Decimal(validatedData.discountAmount),
          serviceCharge: new Prisma.Decimal(validatedData.serviceCharge),
          deliveryFee: new Prisma.Decimal(validatedData.deliveryFee),
          totalAmount: new Prisma.Decimal(validatedData.totalAmount),
          notes: validatedData.notes,
        },
      });

      // Create order items
      const orderItems = await Promise.all(
        validatedData.items.map((item) =>
          tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.productId,
              productName: item.productName,
              productSku: item.productSku,
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(item.unitPrice),
              costPrice: item.costPrice
                ? new Prisma.Decimal(item.costPrice)
                : null,
              discountAmount: new Prisma.Decimal(item.discountAmount),
              discountPercent: item.discountPercent
                ? new Prisma.Decimal(item.discountPercent)
                : null,
              subtotal: new Prisma.Decimal(item.subtotal),
              taxAmount: new Prisma.Decimal(item.taxAmount),
              totalAmount: new Prisma.Decimal(item.totalAmount),
              notes: item.notes,
            },
          })
        )
      );

      // For non-cash payments, we will NOT decrease inventory yet
      // Inventory will be decreased after payment is confirmed
      // For cash payments, decrease inventory immediately
      if (!isNonCashPayment) {
        for (const item of validatedData.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { trackInventory: true, quantity: true },
          });

          if (product?.trackInventory) {
            // Check if enough stock
            if (product.quantity < item.quantity) {
              throw new Error(
                `Stok tidak cukup untuk produk ${item.productName}`
              );
            }

            // Decrease stock
            await tx.product.update({
              where: { id: item.productId },
              data: {
                quantity: {
                  decrement: item.quantity,
                },
              },
            });

            // Create inventory log
            await tx.inventoryLog.create({
              data: {
                productId: item.productId,
                type: "OUT",
                quantity: -item.quantity,
                previousStock: product.quantity,
                currentStock: product.quantity - item.quantity,
                reason: `Order ${newOrder.orderNumber} (Cash - Pending Confirmation)`,
                referenceType: "ORDER",
                referenceId: newOrder.id,
              },
            });
          }
        }
      }

      return {
        ...newOrder,
        items: orderItems,
      };
    });

    // For non-cash payments, create Midtrans Snap token
    let paymentToken = null;
    let paymentRedirectUrl = null;

    if (isNonCashPayment) {
      try {
        // Get order items for Midtrans
        const orderWithItems = await prisma.order.findUnique({
          where: { id: order.id },
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
          },
        });

        if (!orderWithItems) {
          throw new Error("Order not found after creation");
        }

        // Prepare item details for Midtrans
        const itemDetails = orderWithItems.items.map((item) => ({
          id: item.product.id,
          price: Math.round(Number(item.unitPrice)),
          quantity: item.quantity,
          name: item.product.name.substring(0, 50),
          category: item.product.category?.name || "General",
        }));

        // Add delivery fee as item if exists
        if (validatedData.deliveryFee > 0) {
          itemDetails.push({
            id: "DELIVERY_FEE",
            price: Math.round(validatedData.deliveryFee),
            quantity: 1,
            name: "Biaya Pengiriman",
            category: "Delivery",
          });
        }

        // Add service charge as item if exists
        if (validatedData.serviceCharge > 0) {
          itemDetails.push({
            id: "SERVICE_CHARGE",
            price: Math.round(validatedData.serviceCharge),
            quantity: 1,
            name: "Biaya Layanan",
            category: "Service",
          });
        }

        // Validate and prepare customer_details for Midtrans
        const validatedCustomerDetails: {
          first_name: string;
          last_name?: string;
          email?: string;
          phone?: string;
        } = {
          first_name: validatedData.customerName?.substring(0, 50) || "Customer",
        };

        // Only add optional fields if they have valid values
        // Email validation: must be valid format or omitted
        if (validatedData.customerEmail && validatedData.customerEmail.trim() && validatedData.customerEmail.includes('@')) {
          validatedCustomerDetails.email = validatedData.customerEmail.trim().substring(0, 80);
        }

        // Phone validation: must be non-empty or omitted
        if (validatedData.customerPhone && validatedData.customerPhone.trim()) {
          validatedCustomerDetails.phone = validatedData.customerPhone.trim().substring(0, 19);
        }

        // Map payment method to Midtrans enabled_payments
        // Set USE_SPECIFIC_MAPPING to true after you activate payment methods in Midtrans Dashboard
        // For now, set to false to show all available payment methods (prevents "no channels" error)
        const USE_SPECIFIC_MAPPING = false; // TODO: Change to true after activating payment methods in Midtrans Dashboard

        const enabledPayments = mapPaymentMethodToMidtrans(
          validatedData.paymentMethod,
          { useAllMethods: !USE_SPECIFIC_MAPPING } // false = specific mapping, true = all methods
        );

        // Build transaction params
        const transactionParams: MidtransTransactionParams = {
          transaction_details: {
            order_id: order.orderNumber,
            gross_amount: Math.round(Number(order.totalAmount)),
          },
          customer_details: validatedCustomerDetails,
          item_details: itemDetails,
          callbacks: {
            finish: `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/order/${order.id}?payment=success`,
            error: `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/order/${order.id}?payment=error`,
            pending: `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/order/${order.id}?payment=pending`,
          },
          expiry: {
            // Skip start_time, let Midtrans use transaction time as default
            unit: 'minute',
            duration: 15, // 15 minutes for customer orders
          },
        };

        // Only add enabled_payments if we have specific payment methods to enable
        // If empty array or cash, don't include enabled_payments (let Midtrans show all)
        if (enabledPayments.length > 0) {
          transactionParams.enabled_payments = enabledPayments;
        }

        console.log('🔄 Creating Midtrans Snap transaction for customer order:', {
          order_id: order.orderNumber,
          amount: transactionParams.transaction_details.gross_amount,
          payment_method: validatedData.paymentMethod,
          enabled_payments: enabledPayments,
          customer_details: transactionParams.customer_details,
          expiry: transactionParams.expiry,
        });

        // Create Snap transaction
        const snapResult = await createSnapTransaction(transactionParams);

        // Update order with payment token
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentToken: snapResult.token,
            updatedAt: new Date(),
          },
        });

        paymentToken = snapResult.token;
        paymentRedirectUrl = snapResult.redirect_url;

        console.log('✅ Midtrans Snap token created:', {
          order_id: order.orderNumber,
          token: snapResult.token.substring(0, 20) + '...',
          redirect_url: snapResult.redirect_url,
        });

      } catch (midtransError) {
        console.error('❌ Error creating Midtrans transaction:', midtransError);

        // Rollback: Soft delete the order if Midtrans transaction creation fails
        try {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              deletedAt: new Date(),
              status: 'CANCELLED',
              cancellationReason: 'Failed to create payment token',
            },
          });

          console.log('🔄 Order soft deleted due to Midtrans error:', order.orderNumber);
        } catch (deleteError) {
          console.error('❌ Error soft deleting failed order:', deleteError);
          // Continue to throw the original error even if deletion fails
        }

        throw new Error(
          `Gagal membuat token pembayaran: ${midtransError instanceof Error ? midtransError.message : 'Unknown error'}`
        );
      }
    }

    // Send WebSocket notifications for real-time updates
    if (order) {
      try {
        const io = (global as any).io;
        if (!io) {
          console.error("❌ Global io not found");
        } else {
          const payload = {
            orderId: order.id,
            orderNumber: order.orderNumber,
            orderType: order.orderType,
            totalAmount: Number(order.totalAmount),
            itemCount: order.items?.length || 0,
            customerName: order.customerName || "Guest",
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt.toISOString(),
          };
          console.log("📡 [PUBLIC] Emitting order:created event with payload:", payload);
          io.emit("order:created", payload);
          console.log("✓ [PUBLIC] Event emitted successfully to ALL clients");
        }
      } catch (wsError) {
        console.error("❌ [PUBLIC] WebSocket notification error:", wsError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pesanan berhasil dibuat",
        data: {
          ...order,
          paymentToken,
          paymentRedirectUrl,
          requiresPayment: isNonCashPayment,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating customer order:", error);

    // Handle validation errors
    if (error instanceof Error) {
      if (error.name === "ZodError") {
        return NextResponse.json(
          {
            success: false,
            message: "Data tidak valid",
            errors: error,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat membuat pesanan",
      },
      { status: 500 }
    );
  }
}
