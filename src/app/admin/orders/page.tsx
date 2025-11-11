"use client";

import { useState } from "react";
import { Package, Download, TrendingUp, Clock, DollarSign, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrderDetailsModal } from "@/components/orders/OrderDetailsModal";
import { formatCurrency } from "@/lib/product-utils";
import { exportOrdersToCSV } from "@/lib/order-utils";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { toast } from "sonner";
import type { Order, OrderStatus } from "@/types/order";

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch orders from database
  const { data, isLoading, refetch } = useOrders({
    limit: 100,
  });

  // Update order status mutation
  const updateOrderStatus = useUpdateOrderStatus();

  // Convert database orders to UI format
  const orders: Order[] = (data?.data || []).map((dbOrder: any) => {
    const order: Order = {
      id: dbOrder.id,
      orderNumber: dbOrder.orderNumber,
      status: dbOrder.status,
      orderType: dbOrder.orderType,

      // Items
      items: dbOrder.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.productSku,
        quantity: item.quantity,
        price: Number(item.unitPrice),
        total: Number(item.totalAmount),
        notes: item.notes,
      })),
      itemCount: dbOrder.items.length,

      // Financial
      subtotal: Number(dbOrder.subtotal),
      discountAmount: Number(dbOrder.discountAmount || 0),
      taxAmount: Number(dbOrder.taxAmount || 0),
      tipAmount: 0, // Not stored separately in order table
      total: Number(dbOrder.totalAmount),

      // Customer
      customer: {
        name: dbOrder.customerName,
        phone: dbOrder.customerPhone,
        address: dbOrder.customerAddress,
        tableNumber: dbOrder.tableNumber,
      },

      // Payment
      payment: {
        method: dbOrder.paymentMethod,
        amountPaid: Number(dbOrder.paidAmount || 0),
        amountTendered: Number(dbOrder.paidAmount || 0),
        change: Number(dbOrder.changeAmount || 0),
        tipAmount: 0,
      },

      // Timeline - construct from timestamps
      timeline: [
        {
          status: "PENDING" as OrderStatus,
          timestamp: dbOrder.createdAt,
          note: "Order created",
        },
        ...(dbOrder.paidAt
          ? [
              {
                status: "PAID" as OrderStatus,
                timestamp: dbOrder.paidAt,
                note: "Payment received",
              },
            ]
          : []),
        ...(dbOrder.preparingAt
          ? [
              {
                status: "PREPARING" as OrderStatus,
                timestamp: dbOrder.preparingAt,
                note: "Order being prepared",
              },
            ]
          : []),
        ...(dbOrder.readyAt
          ? [
              {
                status: "READY" as OrderStatus,
                timestamp: dbOrder.readyAt,
                note: "Order ready",
              },
            ]
          : []),
        ...(dbOrder.completedAt
          ? [
              {
                status: "COMPLETED" as OrderStatus,
                timestamp: dbOrder.completedAt,
                note: "Order completed",
              },
            ]
          : []),
        ...(dbOrder.cancelledAt
          ? [
              {
                status: "CANCELLED" as OrderStatus,
                timestamp: dbOrder.cancelledAt,
                note: "Order cancelled",
              },
            ]
          : []),
      ],

      // Metadata
      createdAt: dbOrder.createdAt,
      updatedAt: dbOrder.updatedAt,
      completedAt: dbOrder.completedAt,
      cashierName: dbOrder.cashier?.name || "System",
    };

    return order;
  });

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus.mutateAsync({
        orderId,
        status: newStatus,
      });
    } catch (error) {
      // Error is handled by the mutation's onError
      console.error("Failed to update order status:", error);
    }
  };

  const handleExportOrders = () => {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }

    const filename = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    exportOrdersToCSV(orders, filename);
    toast.success("Orders exported successfully");
  };

  // Calculate statistics (exclude cancelled orders from revenue)
  // Total Orders = PAID + COMPLETED (consistent with reports)
  const paidOrders = orders.filter(
    (o) => o.status === "PAID" || o.status === "COMPLETED"
  );

  const stats = {
    totalOrders: paidOrders.length,
    totalRevenue: paidOrders.reduce((sum, order) => sum + order.total, 0),
    averageOrderValue:
      paidOrders.length > 0
        ? paidOrders.reduce((sum, order) => sum + order.total, 0) / paidOrders.length
        : 0,
    pendingOrders: orders.filter((o) => o.status === "PENDING" || o.status === "PENDING_PAYMENT").length,
    cancelledOrders: orders.filter((o) => o.status === "CANCELLED").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="h-8 w-8" />
              Order Management
            </h1>
            <p className="text-slate-600 mt-1">
              Manage and track all orders from your POS system
            </p>
          </div>

          <Button
            onClick={handleExportOrders}
            className="gap-2"
            disabled={orders.length === 0}
          >
            <Download className="h-4 w-4" />
            Export Orders
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Avg Order Value</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(stats.averageOrderValue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Pending Orders</p>
              <p className="text-2xl font-bold text-slate-900">{stats.pendingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Cancelled Orders</p>
              <p className="text-2xl font-bold text-slate-900">{stats.cancelledOrders}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500">Loading orders...</div>
          </div>
        ) : (
          <OrdersTable
            orders={orders}
            onOrderClick={handleOrderClick}
            onStatusUpdate={handleStatusUpdate}
            onRefresh={() => refetch()}
          />
        )}
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}
