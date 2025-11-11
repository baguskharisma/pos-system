"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
  AlertCircle,
} from "lucide-react";

interface InventorySummary {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  overStock: number;
  totalInventoryValue: number;
  totalPotentialRevenue: number;
  totalUnits: number;
  avgTurnoverRate: number;
}

interface InventoryDashboardProps {
  summary?: InventorySummary;
  isLoading?: boolean;
}

export function InventoryDashboard({
  summary,
  isLoading = false,
}: InventoryDashboardProps) {
  const [data, setData] = useState<InventorySummary | null>(summary || null);

  useEffect(() => {
    if (summary) {
      setData(summary);
    }
  }, [summary]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-gray-200 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const stockHealthPercentage = data.totalProducts > 0
    ? Math.round((data.inStock / data.totalProducts) * 100)
    : 0;

  const criticalItemsPercentage = data.totalProducts > 0
    ? Math.round(((data.lowStock + data.outOfStock) / data.totalProducts) * 100)
    : 0;

  const profitMargin = data.totalInventoryValue > 0
    ? ((data.totalPotentialRevenue - data.totalInventoryValue) / data.totalInventoryValue) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-3xl font-bold mt-2">{data.totalProducts}</p>
              <p className="text-xs text-gray-500 mt-1">
                {data.totalUnits.toLocaleString()} units in stock
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Stock Health */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Health</p>
              <p className="text-3xl font-bold mt-2">{stockHealthPercentage}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {data.inStock} products in good stock
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${stockHealthPercentage}%` }}
            />
          </div>
        </Card>

        {/* Inventory Value */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inventory Value</p>
              <p className="text-3xl font-bold mt-2">
                Rp{(data.totalInventoryValue / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{profitMargin.toFixed(1)}% potential margin
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        {/* Turnover Rate */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Turnover</p>
              <p className="text-3xl font-bold mt-2">
                {data.avgTurnoverRate.toFixed(1)}x
              </p>
              <p className="text-xs text-gray-500 mt-1">per year</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Stock Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* In Stock */}
        <Card className="p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Stock</p>
              <p className="text-2xl font-bold text-green-700">{data.inStock}</p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              {data.totalProducts > 0
                ? Math.round((data.inStock / data.totalProducts) * 100)
                : 0}
              %
            </Badge>
          </div>
        </Card>

        {/* Low Stock */}
        <Card className="p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-700">{data.lowStock}</p>
            </div>
            <Badge className="bg-yellow-100 text-yellow-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {data.totalProducts > 0
                ? Math.round((data.lowStock / data.totalProducts) * 100)
                : 0}
              %
            </Badge>
          </div>
        </Card>

        {/* Out of Stock */}
        <Card className="p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-700">{data.outOfStock}</p>
            </div>
            <Badge className="bg-red-100 text-red-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              {data.totalProducts > 0
                ? Math.round((data.outOfStock / data.totalProducts) * 100)
                : 0}
              %
            </Badge>
          </div>
        </Card>

        {/* Overstock */}
        <Card className="p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overstock</p>
              <p className="text-2xl font-bold text-blue-700">{data.overStock}</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              <TrendingDown className="w-3 h-3 mr-1" />
              {data.totalProducts > 0
                ? Math.round((data.overStock / data.totalProducts) * 100)
                : 0}
              %
            </Badge>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {criticalItemsPercentage > 20 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <p className="font-semibold text-red-900">
                Critical Stock Levels Detected
              </p>
              <p className="text-sm text-red-700 mt-1">
                {criticalItemsPercentage}% of your products ({data.lowStock + data.outOfStock}{" "}
                items) are at critical stock levels. Consider reordering soon.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
