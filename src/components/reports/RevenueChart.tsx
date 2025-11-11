"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface MonthlyData {
  month: number;
  year: number;
  monthLabel: string;
  totalSales: number;
  totalDiscount: number;
  totalTax: number;
  netSales: number;
}

interface RevenueChartProps {
  data: MonthlyData[];
  loading?: boolean;
}

export function RevenueChart({ data, loading = false }: RevenueChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Bulanan</CardTitle>
          <CardDescription>Breakdown revenue, diskon, dan pajak</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-slate-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    month: item.monthLabel,
    "Total Penjualan": item.totalSales,
    "Diskon": item.totalDiscount,
    "Pajak": item.totalTax,
    "Penjualan Bersih": item.netSales,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Bulanan</CardTitle>
        <CardDescription>
          Breakdown revenue dengan diskon dan pajak per bulan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
            <XAxis
              dataKey="month"
              className="text-sm"
              tick={{ fill: "#64748b" }}
            />
            <YAxis
              className="text-sm"
              tick={{ fill: "#64748b" }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toString();
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "12px",
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend />
            <Bar dataKey="Total Penjualan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Penjualan Bersih" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Diskon" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Pajak" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
