"use client";

import { useState, useEffect } from "react";
import { Bell, Check, X, Package, ShoppingCart, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useWebSocketEvent } from "@/hooks/useWebSocketEvent";
import { WebSocketEvent } from "@/lib/websocket/types";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface Notification {
  id: string;
  type: "order_created" | "order_status_changed" | "payment_completed" | "inventory_low";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Listen for order created events
  useWebSocketEvent(
    WebSocketEvent.ORDER_CREATED,
    (payload) => {
      const newNotification: Notification = {
        id: `order-created-${payload.orderId}-${Date.now()}`,
        type: "order_created",
        title: "Pesanan Baru",
        message: `Pesanan ${payload.orderNumber} dari ${payload.customerName || payload.cashierName || "Customer"} - ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(payload.totalAmount)}`,
        timestamp: new Date(),
        read: false,
        data: payload,
      };

      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  // Listen for order status changed events
  useWebSocketEvent(
    WebSocketEvent.ORDER_STATUS_CHANGED,
    (payload) => {
      const statusLabels: Record<string, string> = {
        PENDING_PAYMENT: "Menunggu Pembayaran",
        PAID: "Dibayar",
        PREPARING: "Sedang Diproses",
        READY: "Siap Diambil",
        COMPLETED: "Selesai",
        CANCELLED: "Dibatalkan",
      };

      const newNotification: Notification = {
        id: `order-status-${payload.orderId}-${Date.now()}`,
        type: "order_status_changed",
        title: "Status Pesanan Diperbarui",
        message: `Pesanan ${payload.orderNumber}: ${statusLabels[payload.oldStatus]} → ${statusLabels[payload.newStatus]}`,
        timestamp: new Date(),
        read: false,
        data: payload,
      };

      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  // Listen for payment completed events
  useWebSocketEvent(
    WebSocketEvent.PAYMENT_COMPLETED,
    (payload) => {
      const paymentMethodLabels: Record<string, string> = {
        CASH: "Tunai",
        DIGITAL_PAYMENT: "Pembayaran Digital",
      };

      const newNotification: Notification = {
        id: `payment-completed-${payload.orderId}-${Date.now()}`,
        type: "payment_completed",
        title: "Pembayaran Berhasil",
        message: `Pesanan ${payload.orderNumber} - ${paymentMethodLabels[payload.paymentMethod] || payload.paymentMethod} - ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(payload.amount)}`,
        timestamp: new Date(),
        read: false,
        data: payload,
      };

      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
  };

  // Clear notification
  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "order_created":
        return <ShoppingCart className="h-4 w-4 text-blue-600" />;
      case "order_status_changed":
        return <Package className="h-4 w-4 text-green-600" />;
      case "payment_completed":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "inventory_low":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </>
          )}
          <span className="sr-only">View notifications</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-slate-900">Notifikasi</h3>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-7 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Tandai Semua
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3 w-3 mr-1" />
                Hapus Semua
              </Button>
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">Tidak ada notifikasi</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-slate-50 transition-colors ${
                  !notification.read ? "bg-blue-50/50" : ""
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">
                        {notification.title}
                      </p>
                      <button
                        onClick={() => clearNotification(notification.id)}
                        className="flex-shrink-0 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(notification.timestamp, {
                          addSuffix: true,
                          locale: idLocale,
                        })}
                      </p>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Tandai telah dibaca
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {notifications.length > 10 && (
          <div className="px-4 py-2 text-center border-t">
            <p className="text-xs text-slate-500">
              Menampilkan 10 dari {notifications.length} notifikasi
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
