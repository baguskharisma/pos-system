"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, TrendingDown, RefreshCw } from "lucide-react";
import { ComparisonCard } from "@/components/reports/ComparisonCard";

interface InventoryAlert {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  lowStockThreshold: number;
  severity: "critical" | "warning" | "info";
  isOutOfStock: boolean;
  salesVelocity: {
    dailyAverage: number;
    daysUntilOutOfStock: number | null;
  };
  recommendation: {
    action: string;
    suggestedQuantity: number;
    estimatedCost: number;
  };
}

export function InventoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tracking, alertsData] = await Promise.all([
        fetch("/api/inventory/tracking").then((r) => r.json()),
        fetch("/api/inventory/alerts").then((r) => r.json()),
      ]);

      setTrackingData(tracking);
      setAlerts(alertsData.alerts || []);
    } catch (error) {
      console.error("Failed to fetch inventory data:", error);
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "warning":
        return "text-amber-600 bg-amber-50 border-amber-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ComparisonCard
          title="Total Products"
          value={trackingData?.summary?.totalProducts || 0}
          icon={<Package className="w-5 h-5" />}
          loading={loading}
        />
        <ComparisonCard
          title="Low Stock Items"
          value={trackingData?.summary?.lowStock || 0}
          icon={<TrendingDown className="w-5 h-5" />}
          loading={loading}
        />
        <ComparisonCard
          title="Out of Stock"
          value={trackingData?.summary?.outOfStock || 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          loading={loading}
        />
        <ComparisonCard
          title="Inventory Value"
          value={trackingData?.summary?.totalInventoryValue || 0}
          format="currency"
          icon={<Package className="w-5 h-5" />}
          loading={loading}
        />
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stock Alerts</CardTitle>
              <CardDescription>
                Products that need attention ({alerts.length} alerts)
              </CardDescription>
            </div>
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No inventory alerts at this time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {alert.severity === "critical" && (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        <h4 className="font-semibold">{alert.name}</h4>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/50">
                          {alert.sku}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-xs opacity-75">Current Stock</p>
                          <p className="font-semibold">{alert.currentStock} units</p>
                        </div>
                        <div>
                          <p className="text-xs opacity-75">Daily Sales</p>
                          <p className="font-semibold">
                            {alert.salesVelocity.dailyAverage.toFixed(1)} units
                          </p>
                        </div>
                        <div>
                          <p className="text-xs opacity-75">Days Until Out</p>
                          <p className="font-semibold">
                            {alert.salesVelocity.daysUntilOutOfStock || "∞"} days
                          </p>
                        </div>
                        <div>
                          <p className="text-xs opacity-75">Recommended</p>
                          <p className="font-semibold">
                            {alert.recommendation.suggestedQuantity} units
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 text-xs opacity-75">
                        Estimated reorder cost:{" "}
                        {formatCurrency(alert.recommendation.estimatedCost)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Tracking</CardTitle>
          <CardDescription>
            All products with inventory tracking enabled
          </CardDescription>
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
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-2 text-sm font-semibold">Product</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold">Stock</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold">Status</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingData?.products?.slice(0, 10).map((product: any) => (
                    <tr key={product.id} className="border-b border-slate-100">
                      <td className="py-3 px-2">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-slate-500">{product.sku}</div>
                      </td>
                      <td className="text-right py-3 px-2">{product.currentStock}</td>
                      <td className="text-right py-3 px-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${
                            product.stockStatus === "OUT_OF_STOCK"
                              ? "bg-red-100 text-red-700"
                              : product.stockStatus === "LOW_STOCK"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {product.stockStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className="text-right py-3 px-2">
                        {formatCurrency(product.inventoryValue)}
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
