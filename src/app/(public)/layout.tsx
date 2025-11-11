"use client";

import { ReactNode } from "react";
import { WebSocketProvider } from "@/components/providers/WebSocketProvider";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <WebSocketProvider showNotifications={false}>
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    </WebSocketProvider>
  );
}
