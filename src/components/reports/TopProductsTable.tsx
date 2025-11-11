"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package } from "lucide-react";

interface TopProduct {
  productId: string;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  averagePrice: number;
}

interface TopProductsTableProps {
  data: TopProduct[];
  loading?: boolean;
}

export function TopProductsTable({ data, loading = false }: TopProductsTableProps) {
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
          <CardTitle>Top Produk Terlaris</CardTitle>
          <CardDescription>Produk dengan penjualan tertinggi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Produk Terlaris</CardTitle>
          <CardDescription>Produk dengan penjualan tertinggi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Tidak ada data produk</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Produk Terlaris</CardTitle>
        <CardDescription>
          {data.length} produk dengan penjualan tertinggi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">
                  Rank
                </th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">
                  Produk
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-slate-700">
                  Qty Terjual
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-slate-700">
                  Revenue
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-slate-700">
                  Profit
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-slate-700">
                  Margin
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((product, index) => (
                <tr
                  key={product.productId}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {index < 3 && (
                        <TrendingUp className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="font-semibold text-slate-700">
                        #{index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="font-medium text-slate-900">
                      {product.productName}
                    </div>
                    <div className="text-xs text-slate-500">
                      Rata-rata: {formatCurrency(product.averagePrice)}
                    </div>
                  </td>
                  <td className="text-right py-3 px-2">
                    <span className="font-medium text-slate-900">
                      {product.totalQuantitySold.toLocaleString("id-ID")}
                    </span>
                  </td>
                  <td className="text-right py-3 px-2">
                    <span className="font-medium text-blue-600">
                      {formatCurrency(product.totalRevenue)}
                    </span>
                  </td>
                  <td className="text-right py-3 px-2">
                    <span className="font-medium text-green-600">
                      {formatCurrency(product.totalProfit)}
                    </span>
                  </td>
                  <td className="text-right py-3 px-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        product.profitMargin >= 30
                          ? "bg-green-100 text-green-700"
                          : product.profitMargin >= 15
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.profitMargin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
