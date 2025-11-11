"use client";

import { useState, useEffect } from "react";
import { subDays } from "date-fns";
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { DateRangeSelector } from "@/components/reports/DateRangeSelector";
import { ComparisonCard } from "@/components/reports/ComparisonCard";
import { DailySalesChart } from "@/components/reports/DailySalesChart";
import { RevenueChart } from "@/components/reports/RevenueChart";
import { TopProductsTable } from "@/components/reports/TopProductsTable";
import { CategoryPieChart } from "@/components/reports/CategoryPieChart";
import { PaymentMethodChart } from "@/components/reports/PaymentMethodChart";

interface DateRange {
  from: Date;
  to: Date;
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [topProductsData, setTopProductsData] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any>(null);
  const [paymentMethodData, setPaymentMethodData] = useState<any>(null);

  useEffect(() => {
    fetchReportsData();
  }, [dateRange]);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange.from.toISOString();
      const endDate = dateRange.to.toISOString();

      // Fetch all reports in parallel
      const [daily, monthly, topProducts, category, paymentMethods] =
        await Promise.all([
          fetch(`/api/reports/daily?startDate=${startDate}&endDate=${endDate}`).then(
            (r) => r.json()
          ),
          fetch(`/api/reports/monthly?months=6`).then((r) => r.json()),
          fetch(
            `/api/reports/top-products?startDate=${startDate}&endDate=${endDate}&limit=10`
          ).then((r) => r.json()),
          fetch(
            `/api/reports/revenue-by-category?startDate=${startDate}&endDate=${endDate}`
          ).then((r) => r.json()),
          fetch(
            `/api/reports/payment-methods?startDate=${startDate}&endDate=${endDate}`
          ).then((r) => r.json()),
        ]);

      setDailyData(daily);
      setMonthlyData(monthly);
      setTopProductsData(topProducts);
      setCategoryData(category);
      setPaymentMethodData(paymentMethods);
    } catch (error) {
      console.error("Failed to fetch reports data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate comparison metrics
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Dashboard Laporan
          </h1>
          <p className="text-slate-600">
            Analisis dan insight penjualan untuk periode yang dipilih
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="mb-8">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ComparisonCard
            title="Total Penjualan"
            value={dailyData?.summary?.totalSales || 0}
            changePercentage={
              dailyData?.summary?.totalSales && monthlyData?.summary?.totalSales
                ? calculateGrowth(
                    dailyData.summary.totalSales,
                    monthlyData.summary.totalSales / 6
                  )
                : undefined
            }
            icon={<DollarSign className="w-5 h-5" />}
            format="currency"
            loading={loading}
          />
          <ComparisonCard
            title="Total Order"
            value={dailyData?.summary?.totalOrders || 0}
            changePercentage={
              dailyData?.summary?.totalOrders && monthlyData?.summary?.totalOrders
                ? calculateGrowth(
                    dailyData.summary.totalOrders,
                    monthlyData.summary.totalOrders / 6
                  )
                : undefined
            }
            icon={<ShoppingCart className="w-5 h-5" />}
            format="number"
            loading={loading}
          />
          <ComparisonCard
            title="Rata-rata Order"
            value={dailyData?.summary?.averageOrderValue || 0}
            icon={<TrendingUp className="w-5 h-5" />}
            format="currency"
            loading={loading}
          />
          <ComparisonCard
            title="Total Item Terjual"
            value={dailyData?.summary?.totalItems || 0}
            icon={<Users className="w-5 h-5" />}
            format="number"
            loading={loading}
          />
        </div>

        {/* Daily Sales Chart */}
        <div className="mb-8">
          <DailySalesChart
            data={dailyData?.dailyReport || []}
            loading={loading}
          />
        </div>

        {/* Revenue Chart and Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RevenueChart
            data={monthlyData?.monthlyReport || []}
            loading={loading}
          />
          <PaymentMethodChart
            data={paymentMethodData?.paymentMethodBreakdown || []}
            loading={loading}
          />
        </div>

        {/* Category Pie Chart and Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CategoryPieChart
            data={categoryData?.categoryBreakdown || []}
            loading={loading}
          />
          <TopProductsTable
            data={topProductsData?.topProducts || []}
            loading={loading}
          />
        </div>

        {/* Additional Insights */}
        {!loading && categoryData && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Insight Penjualan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Top Category */}
              {categoryData?.summary?.topCategory && (
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="text-sm text-slate-600 mb-1">
                    Kategori Terlaris
                  </div>
                  <div className="text-lg font-semibold text-slate-900">
                    {categoryData.summary.topCategory.name}
                  </div>
                  <div className="text-sm text-slate-500">
                    {categoryData.summary.topCategory.percentage.toFixed(1)}% dari
                    total penjualan
                  </div>
                </div>
              )}

              {/* Most Popular Payment Method */}
              {paymentMethodData?.summary?.mostPopularMethod && (
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="text-sm text-slate-600 mb-1">
                    Metode Pembayaran Terpopuler
                  </div>
                  <div className="text-lg font-semibold text-slate-900">
                    {paymentMethodData.summary.mostPopularMethod.method}
                  </div>
                  <div className="text-sm text-slate-500">
                    {paymentMethodData.summary.mostPopularMethod.transactionCount}{" "}
                    transaksi
                  </div>
                </div>
              )}

              {/* Growth Rate */}
              {monthlyData?.summary?.growthRate !== undefined && (
                <div
                  className={`border-l-4 pl-4 ${
                    monthlyData.summary.growthRate >= 0
                      ? "border-emerald-500"
                      : "border-red-500"
                  }`}
                >
                  <div className="text-sm text-slate-600 mb-1">
                    Pertumbuhan Bulan Ini
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      monthlyData.summary.growthRate >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {monthlyData.summary.growthRate > 0 ? "+" : ""}
                    {monthlyData.summary.growthRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-500">
                    vs bulan sebelumnya
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
