"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonCardProps {
  title: string;
  value: string | number;
  previousValue?: number;
  changePercentage?: number;
  icon?: React.ReactNode;
  format?: "currency" | "number" | "percentage";
  loading?: boolean;
}

export function ComparisonCard({
  title,
  value,
  previousValue,
  changePercentage,
  icon,
  format = "number",
  loading = false,
}: ComparisonCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === "string") return val;

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case "percentage":
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat("id-ID").format(val);
    }
  };

  const getTrendIcon = () => {
    if (changePercentage === undefined || changePercentage === 0) {
      return <Minus className="w-4 h-4" />;
    }
    if (changePercentage > 0) {
      return <TrendingUp className="w-4 h-4" />;
    }
    return <TrendingDown className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (changePercentage === undefined || changePercentage === 0) {
      return "text-slate-500";
    }
    if (changePercentage > 0) {
      return "text-green-600";
    }
    return "text-red-600";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-600">
            {title}
          </CardTitle>
          {icon && <div className="text-slate-400">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-slate-900">
            {formatValue(value)}
          </div>
          {changePercentage !== undefined && (
            <div className={cn("flex items-center gap-1 text-sm", getTrendColor())}>
              {getTrendIcon()}
              <span className="font-medium">
                {Math.abs(changePercentage).toFixed(1)}%
              </span>
              <span className="text-slate-500">vs periode sebelumnya</span>
            </div>
          )}
          {previousValue !== undefined && changePercentage === undefined && (
            <div className="text-sm text-slate-500">
              Sebelumnya: {formatValue(previousValue)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
