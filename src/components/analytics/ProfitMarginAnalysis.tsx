"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { ComparisonCard } from "@/components/reports/ComparisonCard";

export function ProfitMarginAnalysis() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [groupBy, setGroupBy] = useState<"product" | "category">("product");

  useEffect(() => {
    fetchData();
  }, [groupBy]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/profit-margin?groupBy=${groupBy}&sortBy=margin`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch profit analysis:", error);
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ComparisonCard
          title="Total Revenue"
          value={data?.summary?.totalRevenue || 0}
          format="currency"
          icon={<DollarSign className="w-5 h-5" />}
          loading={loading}
        />
        <ComparisonCard
          title="Total Profit"
          value={data?.summary?.totalProfit || 0}
          format="currency"
          icon={<TrendingUp className="w-5 h-5" />}
          loading={loading}
        />
        <ComparisonCard
          title="Overall Margin"
          value={`${(data?.summary?.overallMargin || 0).toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          loading={loading}
        />
        <ComparisonCard
          title="Low Margin Items"
          value={data?.summary?.lowMarginProducts || 0}
          icon={<AlertCircle className="w-5 h-5" />}
          loading={loading}
        />
      </div>

      {/* Group By Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setGroupBy("product")}
          className={`px-4 py-2 rounded-lg font-medium ${
            groupBy === "product"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          By Product
        </button>
        <button
          onClick={() => setGroupBy("category")}
          className={`px-4 py-2 rounded-lg font-medium ${
            groupBy === "category"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          By Category
        </button>
      </div>

      {/* Profit Margin Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Margin Analysis</CardTitle>
          <CardDescription>
            Top items by profit margin percentage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-96 bg-slate-100 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data?.data?.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey={groupBy === "product" ? "productName" : "categoryName"}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip formatter={(value: number, name: string) => {
                  if (name.includes("Margin")) return `${value.toFixed(2)}%`;
                  return formatCurrency(value);
                }} />
                <Legend />
                <Bar dataKey="profitMargin" fill="#10b981" name="Profit Margin %" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Name</th>
                    <th className="text-right py-3 px-2">Revenue</th>
                    <th className="text-right py-3 px-2">Cost</th>
                    <th className="text-right py-3 px-2">Profit</th>
                    <th className="text-right py-3 px-2">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.slice(0, 15).map((item: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-2 font-medium">
                        {item.productName || item.categoryName}
                      </td>
                      <td className="text-right py-3 px-2">
                        {formatCurrency(item.totalRevenue)}
                      </td>
                      <td className="text-right py-3 px-2">
                        {formatCurrency(item.totalCost)}
                      </td>
                      <td className="text-right py-3 px-2">
                        {formatCurrency(item.totalProfit)}
                      </td>
                      <td className="text-right py-3 px-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${
                            item.profitMargin >= 30
                              ? "bg-green-100 text-green-700"
                              : item.profitMargin >= 15
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.profitMargin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
