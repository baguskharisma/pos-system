"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  CreditCard,
  ChefHat,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OrderStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "AWAITING_CONFIRMATION"
  | "PAID"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

interface OrderStatusProps {
  status: OrderStatus;
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  createdAt: Date;
  paidAt?: Date | null;
  preparingAt?: Date | null;
  readyAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  estimatedReadyTime?: Date | null;
}

interface StatusStep {
  key: OrderStatus;
  label: string;
  icon: React.ElementType;
  description: string;
}

export function OrderStatus({
  status,
  orderType,
  createdAt,
  paidAt,
  preparingAt,
  readyAt,
  completedAt,
  cancelledAt,
  estimatedReadyTime,
}: OrderStatusProps) {
  // Define status steps based on order type
  const getStatusSteps = (): StatusStep[] => {
    const baseSteps: StatusStep[] = [
      {
        key: "PENDING_PAYMENT",
        label: "Menunggu Pembayaran",
        icon: CreditCard,
        description: "Pesanan menunggu pembayaran",
      },
      {
        key: "PAID",
        label: "Pembayaran Berhasil",
        icon: CheckCircle2,
        description: "Pembayaran telah dikonfirmasi",
      },
      {
        key: "PREPARING",
        label: "Sedang Diproses",
        icon: ChefHat,
        description: "Pesanan sedang disiapkan",
      },
    ];

    if (orderType === "DELIVERY") {
      baseSteps.push({
        key: "READY",
        label: "Siap Dikirim",
        icon: Truck,
        description: "Pesanan siap untuk dikirim",
      });
    } else {
      baseSteps.push({
        key: "READY",
        label: "Siap Diambil",
        icon: Package,
        description: "Pesanan siap untuk diambil",
      });
    }

    baseSteps.push({
      key: "COMPLETED",
      label: "Selesai",
      icon: CheckCircle2,
      description: "Pesanan telah selesai",
    });

    return baseSteps;
  };

  const statusSteps = getStatusSteps();

  // Get status badge color and text
  const getStatusBadge = () => {
    switch (status) {
      case "PENDING_PAYMENT":
      case "AWAITING_CONFIRMATION":
        return { variant: "default" as const, text: "Menunggu Pembayaran" };
      case "PAID":
        return { variant: "default" as const, text: "Dibayar" };
      case "PREPARING":
        return { variant: "default" as const, text: "Diproses" };
      case "READY":
        return { variant: "default" as const, text: "Siap" };
      case "COMPLETED":
        return { variant: "default" as const, text: "Selesai" };
      case "CANCELLED":
        return { variant: "destructive" as const, text: "Dibatalkan" };
      case "REFUNDED":
        return { variant: "destructive" as const, text: "Dikembalikan" };
      default:
        return { variant: "default" as const, text: status };
    }
  };

  // Get current step index
  const getCurrentStepIndex = () => {
    const statusOrder = statusSteps.map((s) => s.key);
    return statusOrder.indexOf(status);
  };

  const currentStepIndex = getCurrentStepIndex();
  const statusBadge = getStatusBadge();

  // Calculate estimated time
  const getEstimatedTime = () => {
    if (estimatedReadyTime) {
      return estimatedReadyTime;
    }

    // Default estimation: 15-30 minutes from paid time
    if (paidAt) {
      const estimatedMinutes = 20;
      const estimated = new Date(paidAt);
      estimated.setMinutes(estimated.getMinutes() + estimatedMinutes);
      return estimated;
    }

    return null;
  };

  const estimatedTime = getEstimatedTime();

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Status Pesanan</h3>
            <p className="text-sm text-slate-500 mt-1">
              Lacak status pesanan Anda
            </p>
          </div>
          <Badge variant={statusBadge.variant} className="text-sm">
            {statusBadge.text}
          </Badge>
        </div>

        {/* Estimated Time */}
        {estimatedTime &&
          status !== "COMPLETED" &&
          status !== "CANCELLED" &&
          status !== "REFUNDED" && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Estimasi Waktu Siap
                </p>
                <p className="text-sm text-blue-700">
                  {estimatedTime.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )}

        {/* Timeline */}
        {status !== "CANCELLED" && status !== "REFUNDED" && (
          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.key} className="flex gap-4">
                  {/* Icon */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        isCompleted
                          ? "bg-green-100 text-green-600"
                          : "bg-slate-100 text-slate-400"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div
                        className={cn(
                          "w-0.5 h-12 mt-2 transition-colors",
                          isCompleted ? "bg-green-600" : "bg-slate-200"
                        )}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <h4
                      className={cn(
                        "font-medium",
                        isCurrent
                          ? "text-slate-900"
                          : isCompleted
                          ? "text-slate-700"
                          : "text-slate-400"
                      )}
                    >
                      {step.label}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">
                      {step.description}
                    </p>
                    {isCompleted && (
                      <p className="text-xs text-slate-400 mt-1">
                        {index === 0 && createdAt
                          ? new Date(createdAt).toLocaleString("id-ID")
                          : index === 1 && paidAt
                          ? new Date(paidAt).toLocaleString("id-ID")
                          : index === 2 && preparingAt
                          ? new Date(preparingAt).toLocaleString("id-ID")
                          : index === 3 && readyAt
                          ? new Date(readyAt).toLocaleString("id-ID")
                          : index === 4 && completedAt
                          ? new Date(completedAt).toLocaleString("id-ID")
                          : ""}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancelled or Refunded Status */}
        {(status === "CANCELLED" || status === "REFUNDED") && (
          <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-medium text-red-900">
                {status === "CANCELLED"
                  ? "Pesanan Dibatalkan"
                  : "Pesanan Dikembalikan"}
              </h4>
              <p className="text-sm text-red-700 mt-1">
                {status === "CANCELLED"
                  ? "Pesanan ini telah dibatalkan"
                  : "Pembayaran telah dikembalikan"}
              </p>
              {cancelledAt && (
                <p className="text-xs text-red-600 mt-2">
                  {new Date(cancelledAt).toLocaleString("id-ID")}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
