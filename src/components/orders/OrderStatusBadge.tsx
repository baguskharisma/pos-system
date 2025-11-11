"use client";

import { Clock, ChefHat, CheckCircle, XCircle, Package } from "lucide-react";
import { getStatusColor, getStatusLabel } from "@/lib/order-utils";
import type { OrderStatus } from "@/types/order";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  showIcon?: boolean;
  className?: string;
}

const STATUS_ICONS = {
  PENDING: Clock,
  PREPARING: ChefHat,
  READY: Package,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
};

export function OrderStatusBadge({
  status,
  showIcon = true,
  className = "",
}: OrderStatusBadgeProps) {
  const Icon = STATUS_ICONS[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
        status
      )} ${className}`}
    >
      {showIcon && Icon && <Icon className="h-3.5 w-3.5" />}
      {getStatusLabel(status)}
    </span>
  );
}
