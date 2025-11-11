"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { ComparisonCard } from "@/components/reports/ComparisonCard";

export function SalesForecast() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/analytics/forecast?historicalDays=30&forecastDays=7");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch forecast:", error);
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

  // Combine historical and forecast data
  const chartData = [
    ...(data?.historicalData || []).map((d: any) => ({
      date: d.date.split("-").slice(1).join("/"),
      actual: d.sales,
      type: "historical",
    })),
    ...(data?.forecast || []).map((d: any) => ({
      date: d.date.split("-").slice(1).join("/"),
      predicted: d.predicted,
      lower: d.lower,
      upper: d.upper,
      type: "forecast",
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ComparisonCard
          title="Historical Avg"
          value={data?.summary?.historical?.averageDailySales || 0}
          format="currency"
          icon={<Activity className="w-5 h-5" />}
          loading={loading}
        />
        <ComparisonCard
          title="Forecast Avg"
          value={data?.summary?.forecast?.averageDailyPredicted || 0}
          format="currency"
          icon={<TrendingUp className="w-5 h-5" />}
          loading={loading}
        />
        <ComparisonCard
          title="Projected Growth"
          value={data?.summary?.forecast?.projectedGrowth || 0}
          format="percentage"
          changePercentage={data?.summary?.forecast?.projectedGrowth}
          icon={data?.summary?.forecast?.projectedGrowth >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          loading={loading}
        />
        <ComparisonCard
          title="Confidence"
          value={(data?.summary?.forecast?.confidence * 100 || 0).toFixed(0) + "%"}
          icon={<Activity className="w-5 h-5" />}
          loading={loading}
        />
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Forecast</CardTitle>
          <CardDescription>
            Historical sales and 7-day forecast with confidence intervals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-96 bg-slate-100 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                    return value;
                  }}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="upper"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  stroke="none"
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  fill="#ffffff"
                  fillOpacity={1}
                  stroke="none"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981" }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "#3b82f6" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-40 bg-slate-100 rounded animate-pulse" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Direction:</span>
                  <span className="font-semibold capitalize">{data?.summary?.trends?.sales?.direction}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Change Rate:</span>
                  <span className="font-semibold">{data?.summary?.trends?.sales?.changePercentage.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Strength:</span>
                  <div className="w-32 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(data?.summary?.trends?.sales?.strength || 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seasonality</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-40 bg-slate-100 rounded animate-pulse" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Detected:</span>
                  <span className={`font-semibold ${data?.summary?.seasonality?.detected ? "text-green-600" : "text-slate-400"}`}>
                    {data?.summary?.seasonality?.detected ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Strength:</span>
                  <span className="font-semibold">{((data?.summary?.seasonality?.strength || 0) * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
