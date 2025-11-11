"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Users, TrendingUp, DollarSign, ShoppingBag } from "lucide-react";
import { ComparisonCard } from "@/components/reports/ComparisonCard";

const SEGMENT_COLORS: { [key: string]: string } = {
  vip: "#10b981",
  loyal: "#3b82f6",
  potential: "#8b5cf6",
  "at-risk": "#f59e0b",
  new: "#06b6d4",
  lost: "#ef4444",
};

export function CustomerAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/analytics/customers");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch customer analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const segmentData = data?.summary?.segments
    ? Object.entries(data.summary.segments).map(([key, value]) => ({
        name: key.toUpperCase(),
        value: value as number,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ComparisonCard
          title="Total Customers"
          value={data?.summary?.totalCustomers || 0}
          icon={<Users className="w-5 h-5" />}
          loading={loading}
        />
        <ComparisonCard
          title="Avg Lifetime Value"
          value={data?.summary?.metrics?.averageLifetimeValue || 0}
          format="currency"
          icon={<DollarSign className="w-5 h-5" />}
          loading={loading}
        />
        <ComparisonCard
          title="Avg Order Value"
          value={data?.summary?.metrics?.averageOrderValue || 0}
          format="currency"
          icon={<ShoppingBag className="w-5 h-5" />}
          loading={loading}
        />
        <ComparisonCard
          title="VIP Customers"
          value={data?.summary?.segments?.vip || 0}
          icon={<TrendingUp className="w-5 h-5" />}
          loading={loading}
        />
      </div>

      {/* Customer Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Segmentation</CardTitle>
            <CardDescription>Based on RFM (Recency, Frequency, Monetary) analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-80 bg-slate-100 rounded animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={segmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {segmentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SEGMENT_COLORS[entry.name.toLowerCase()]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
            <CardDescription>Highest lifetime value customers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {data?.summary?.topCustomers?.map((customer: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-slate-500">{customer.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(customer.lifetimeValue)}</div>
                      <div className="text-sm text-slate-500">{customer.totalOrders} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
