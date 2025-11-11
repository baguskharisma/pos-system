"use client";

/**
 * Client-side wrapper for Admin Layout
 * Provides real-time notifications and other client-side features
 */

import { AdminNotifications } from "./AdminNotifications";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  userRole?: "ADMIN" | "SUPER_ADMIN" | "CASHIER";
}

export function AdminLayoutClient({ children, userRole }: AdminLayoutClientProps) {
  return (
    <>
      <AdminNotifications userRole={userRole} />
      {children}
    </>
  );
}
