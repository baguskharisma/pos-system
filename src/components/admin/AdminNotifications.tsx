"use client";

/**
 * Admin Notifications Wrapper
 * Add this to any admin page to enable real-time notifications
 */

import { RealtimeNotifications } from "@/components/notifications/RealtimeNotifications";

interface AdminNotificationsProps {
  userRole?: "ADMIN" | "SUPER_ADMIN" | "CASHIER";
}

export function AdminNotifications({ userRole }: AdminNotificationsProps) {
  return (
    <RealtimeNotifications
      userRole={userRole}
      enableOrderNotifications={true}
      enableInventoryNotifications={true}
      enablePaymentNotifications={true}
      autoInvalidateQueries={true}
    />
  );
}
