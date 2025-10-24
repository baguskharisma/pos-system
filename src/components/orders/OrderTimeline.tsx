/**
 * Order Timeline Component
 * src/components/orders/OrderTimeline.tsx
 */

"use client";

import {
  ShoppingCart,
  CreditCard,
  ChefHat,
  CheckCircle,
  XCircle,
  Clock,
  Check,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/order-utils";
import type { Order } from "@/types/order";

interface OrderTimelineProps {
  order: Order;
}

const ICON_MAP = {
  ShoppingCart,
  CreditCard,
  ChefHat,
  Check,
  CheckCircle,
  XCircle,
};

export function OrderTimeline({ order }: OrderTimelineProps) {
  const events = [];

  // Order Created
  events.push({
    status: "CREATED",
    label: "Order Created",
    timestamp: order.createdAt,
    icon: "ShoppingCart" as const,
    color: "text-blue-600 bg-blue-50",
  });

  // Payment Received
  if (order.paidAt) {
    events.push({
      status: "PAID",
      label: "Payment Received",
      timestamp: order.paidAt,
      icon: "CreditCard" as const,
      color: "text-green-600 bg-green-50",
    });
  }

  // Preparation Started
  if (order.preparingAt) {
    events.push({
      status: "PREPARING",
      label: "Preparation Started",
      timestamp: order.preparingAt,
      icon: "ChefHat" as const,
      color: "text-orange-600 bg-orange-50",
    });
  }

  // Order Ready
  if (order.readyAt) {
    events.push({
      status: "READY",
      label: "Order Ready",
      timestamp: order.readyAt,
      icon: "Check" as const,
      color: "text-purple-600 bg-purple-50",
    });
  }

  // Order Completed
  if (order.completedAt) {
    events.push({
      status: "COMPLETED",
      label: "Order Completed",
      timestamp: order.completedAt,
      icon: "CheckCircle" as const,
      color: "text-emerald-600 bg-emerald-50",
    });
  }

  // Order Cancelled
  if (order.cancelledAt) {
    events.push({
      status: "CANCELLED",
      label: "Order Cancelled",
      timestamp: order.cancelledAt,
      icon: "XCircle" as const,
      color: "text-red-600 bg-red-50",
    });
  }

  // Sort by timestamp
  events.sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const Icon = ICON_MAP[event.icon];
        const isLast = index === events.length - 1;

        return (
          <div key={event.status} className="relative flex gap-4">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-slate-200" />
            )}

            {/* Icon */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${event.color}`}
            >
              <Icon className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-900">{event.label}</p>
                  <p className="text-sm text-slate-600">
                    {formatDate(event.timestamp)}
                  </p>
                </div>
                <span className="text-sm font-medium text-slate-600">
                  {formatTime(event.timestamp)}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Estimated Ready Time */}
      {order.estimatedReadyTime && !order.readyAt && !order.cancelledAt && (
        <div className="relative flex gap-4 opacity-50">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-slate-400 bg-slate-100 border-2 border-dashed border-slate-300">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-600">Estimated Ready Time</p>
            <p className="text-sm text-slate-500">
              {formatDate(order.estimatedReadyTime)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}