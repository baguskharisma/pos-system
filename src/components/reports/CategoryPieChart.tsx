"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CategoryData {
  categoryId: string;
  categoryName: string;
  totalRevenue: number;
  percentageOfTotal: number;
  totalItemsSold: number;
}

interface CategoryPieChartProps {
  data: CategoryData[];
  loading?: boolean;
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
  "#a855f7", // violet
  "#ec4899", // pink
];

export function CategoryPieChart({ data, loading = false }: CategoryPieChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue per Kategori</CardTitle>
          <CardDescription>Distribusi penjualan berdasarkan kategori</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-slate-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue per Kategori</CardTitle>
          <CardDescription>Distribusi penjualan berdasarkan kategori</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-slate-500">Tidak ada data kategori</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.categoryName,
    value: item.totalRevenue,
    percentage: item.percentageOfTotal,
    items: item.totalItemsSold,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-slate-900">{data.name}</p>
          <p className="text-sm text-slate-600">
            Revenue: {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-slate-600">
            Persentase: {data.percentage.toFixed(1)}%
          </p>
          <p className="text-sm text-slate-600">
            Items: {data.items.toLocaleString("id-ID")}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue per Kategori</CardTitle>
        <CardDescription>
          Distribusi penjualan dari {data.length} kategori
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.percentage.toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => {
                return `${value} (${formatCurrency(entry.payload.value)})`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Category List */}
        <div className="mt-6 space-y-2">
          {data.slice(0, 5).map((category, index) => (
            <div
              key={category.categoryId}
              className="flex items-center justify-between p-2 rounded hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium text-slate-700">
                  {category.categoryName}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">
                  {formatCurrency(category.totalRevenue)}
                </div>
                <div className="text-xs text-slate-500">
                  {category.percentageOfTotal.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
