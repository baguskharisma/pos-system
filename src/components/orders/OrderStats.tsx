/**
 * Order Stats Component
 * src/components/orders/OrderStats.tsx
 */

"use client";

import {
  ShoppingCart,
  TrendingUp,
  CheckCircle,
  XCircle,
  DollarSign,
} from "lucide-react";
import { formatCurrency } from "@/lib/order-utils";

interface OrderStatsSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  completedOrders: number;
  cancelledOrders: number;
}

interface OrderStatsProps {
  summary?: OrderStatsSummary;
}

export function OrderStats({ summary }: OrderStatsProps) {
  if (!summary) {
    return null;
  }

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(summary.totalRevenue),
      icon: DollarSign,
      color: "text-green-600 bg-green-50",
      change: null,
    },
    {
      label: "Total Orders",
      value: summary.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: "text-blue-600 bg-blue-50",
      change: null,
    },
    {
      label: "Average Order",
      value: formatCurrency(summary.averageOrderValue),
      icon: TrendingUp,
      color: "text-purple-600 bg-purple-50",
      change: null,
    },
    {
      label: "Completed",
      value: summary.completedOrders.toLocaleString(),
      icon: CheckCircle,
      color: "text-emerald-600 bg-emerald-50",
      change: null,
    },
    {
      label: "Cancelled",
      value: summary.cancelledOrders.toLocaleString(),
      icon: XCircle,
      color: "text-red-600 bg-red-50",
      change: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>
                {stat.change && (
                  <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                )}
              </div>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}