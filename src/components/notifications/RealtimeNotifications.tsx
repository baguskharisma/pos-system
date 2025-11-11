"use client";

/**
 * Real-time Notifications Component
 * Add this component to your layout or specific pages to receive WebSocket notifications
 */

import { useWebSocketEvent } from "@/hooks/useWebSocketEvent";
import { useWebSocketRoom } from "@/hooks/useWebSocketRoom";
import { WebSocketEvent, WebSocketRoom } from "@/lib/websocket/types";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { usePaymentNotifications } from "@/hooks/usePaymentNotifications";

interface RealtimeNotificationsProps {
  enableOrderNotifications?: boolean;
  enableInventoryNotifications?: boolean;
  enablePaymentNotifications?: boolean;
  userRole?: "CASHIER" | "ADMIN" | "SUPER_ADMIN";
  autoInvalidateQueries?: boolean;
}

export function RealtimeNotifications({
  enableOrderNotifications = true,
  enableInventoryNotifications = true,
  enablePaymentNotifications = true,
  userRole,
  autoInvalidateQueries = true,
}: RealtimeNotificationsProps) {
  const queryClient = useQueryClient();

  // Join appropriate room based on user role
  useWebSocketRoom(
    userRole === "ADMIN" || userRole === "SUPER_ADMIN"
      ? WebSocketRoom.ADMINS
      : WebSocketRoom.CASHIERS
  );

  // Payment confirmation notifications (for cash payments)
  usePaymentNotifications({
    enabled: enablePaymentNotifications,
    onPaymentConfirmed: (notification) => {
      if (autoInvalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["pending-cash-orders"] });
        queryClient.invalidateQueries({ queryKey: ["analytics"] });
      }
    },
    onOrderCreated: (notification) => {
      if (autoInvalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["pending-cash-orders"] });
      }
    },
    onOrderUpdated: (notification) => {
      if (autoInvalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["orders", notification.orderId] });
      }
    },
    showToast: true, // Show toast notifications for payment events
  });

  // Order Events
  useWebSocketEvent(
    WebSocketEvent.ORDER_CREATED,
    (payload) => {
      console.log("🔔 ORDER_CREATED event received:", payload);

      if (!enableOrderNotifications) {
        console.log("⚠️ Order notifications disabled, skipping");
        return;
      }

      // Toast notification removed - using NotificationDropdown instead

      if (autoInvalidateQueries) {
        console.log("🔄 Invalidating queries: orders, analytics");

        // Invalidate and refetch immediately
        queryClient.invalidateQueries({
          queryKey: ["orders"],
          refetchType: "active" // Only refetch queries that are currently being used
        });

        queryClient.invalidateQueries({
          queryKey: ["analytics"],
          refetchType: "active"
        });

        console.log("✓ Queries invalidated and refetch triggered");
      }
    },
    [enableOrderNotifications, autoInvalidateQueries]
  );

  useWebSocketEvent(
    WebSocketEvent.ORDER_STATUS_CHANGED,
    (payload) => {
      if (!enableOrderNotifications) return;

      // Toast notification removed - using NotificationDropdown instead

      if (autoInvalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["orders", payload.orderId] });
      }
    },
    [enableOrderNotifications, autoInvalidateQueries]
  );

  useWebSocketEvent(
    WebSocketEvent.ORDER_CANCELLED,
    (payload) => {
      if (!enableOrderNotifications) return;

      toast.error(`Order ${payload.orderNumber} cancelled`, {
        description: payload.reason || "No reason provided",
      });

      if (autoInvalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
    },
    [enableOrderNotifications, autoInvalidateQueries]
  );

  // Inventory Events
  useWebSocketEvent(
    WebSocketEvent.INVENTORY_UPDATED,
    (payload) => {
      if (!enableInventoryNotifications) return;

      const changeText = payload.change > 0 ? `+${payload.change}` : payload.change;

      if (autoInvalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["products", payload.productId] });
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
      }
    },
    [enableInventoryNotifications, autoInvalidateQueries]
  );

  useWebSocketEvent(
    WebSocketEvent.INVENTORY_LOW,
    (payload) => {
      if (!enableInventoryNotifications) return;

      toast.warning(`Low stock: ${payload.productName}`, {
        description: `Only ${payload.currentQuantity} left in stock`,
        action: {
          label: "Restock",
          onClick: () => {
            window.location.href = `/admin/products/${payload.productId}`;
          },
        },
        duration: 10000,
      });

      if (autoInvalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["inventory", "alerts"] });
      }
    },
    [enableInventoryNotifications, autoInvalidateQueries]
  );

  useWebSocketEvent(
    WebSocketEvent.INVENTORY_OUT,
    (payload) => {
      if (!enableInventoryNotifications) return;

      toast.error(`Out of stock: ${payload.productName}`, {
        description: "Product is no longer available",
        action: {
          label: "Restock",
          onClick: () => {
            window.location.href = `/admin/products/${payload.productId}`;
          },
        },
        duration: 15000,
      });

      if (autoInvalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["inventory", "alerts"] });
      }
    },
    [enableInventoryNotifications, autoInvalidateQueries]
  );

  useWebSocketEvent(
    WebSocketEvent.PRODUCT_AVAILABILITY_CHANGED,
    (payload) => {
      if (!enableInventoryNotifications) return;

      const status = payload.isAvailable ? "available" : "unavailable";

      toast.info(`${payload.productName} is now ${status}`, {
        description: payload.reason,
      });

      if (autoInvalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["products", payload.productId] });
      }
    },
    [enableInventoryNotifications, autoInvalidateQueries]
  );

  // Payment Events
  useWebSocketEvent(
    WebSocketEvent.PAYMENT_RECEIVED,
    (payload) => {
      if (!enablePaymentNotifications) return;

      toast.success(`Payment received: ${payload.orderNumber}`, {
        description: `${payload.paymentMethod} - $${payload.amount.toFixed(2)}`,
      });

      if (autoInvalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["analytics"] });
      }
    },
    [enablePaymentNotifications, autoInvalidateQueries]
  );

  useWebSocketEvent(
    WebSocketEvent.PAYMENT_FAILED,
    (payload) => {
      if (!enablePaymentNotifications) return;

      toast.error(`Payment failed: ${payload.orderNumber}`, {
        description: payload.error,
        duration: 10000,
      });
    },
    [enablePaymentNotifications]
  );

  // System Notifications
  useWebSocketEvent(
    WebSocketEvent.SYSTEM_NOTIFICATION,
    (payload) => {
      const toastFn =
        payload.type === "error"
          ? toast.error
          : payload.type === "warning"
          ? toast.warning
          : payload.type === "success"
          ? toast.success
          : toast.info;

      toastFn(payload.title, {
        description: payload.message,
        action: payload.action
          ? {
              label: payload.action.label,
              onClick: () => {
                window.location.href = payload.action!.url;
              },
            }
          : undefined,
      });
    },
    []
  );

  // This component doesn't render anything, it just handles WebSocket events
  return null;
}
