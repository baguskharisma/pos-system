"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface DailyData {
  date: string;
  totalOrders: number;
  totalSales: number;
  totalItems: number;
  averageOrderValue: number;
}

interface DailySalesChartProps {
  data: DailyData[];
  loading?: boolean;
}

export function DailySalesChart({ data, loading = false }: DailySalesChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Penjualan Harian</CardTitle>
          <CardDescription>Grafik penjualan per hari</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-slate-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    date: format(new Date(item.date), "dd MMM"),
    "Total Penjualan": item.totalSales,
    "Total Order": item.totalOrders,
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
        <CardTitle>Penjualan Harian</CardTitle>
        <CardDescription>Grafik penjualan dan jumlah order per hari</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
            <XAxis
              dataKey="date"
              className="text-sm"
              tick={{ fill: "#64748b" }}
            />
            <YAxis
              yAxisId="left"
              className="text-sm"
              tick={{ fill: "#64748b" }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toString();
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-sm"
              tick={{ fill: "#64748b" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "12px",
              }}
              formatter={(value: number, name: string) => {
                if (name === "Total Penjualan") {
                  return [formatCurrency(value), name];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="Total Penjualan"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Total Order"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
