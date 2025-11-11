"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  Package,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Clock,
  Edit,
  Eye,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  category: {
    id: string;
    name: string;
    color?: string | null;
  };
  currentStock: number;
  lowStockThreshold: number | null;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "OVERSTOCK";
  isLowStock: boolean;
  isOutOfStock: boolean;
  price: number;
  costPrice: number;
  inventoryValue: number;
  potentialRevenue: number;
  imageUrl?: string | null;
  salesMetrics: {
    last30Days: number;
    dailyVelocity: number;
    daysUntilOutOfStock: number | null;
    turnoverRate: number;
  };
  recentMovements?: any[];
}

interface InventoryListProps {
  products: Product[];
  onAdjustStock?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
  isLoading?: boolean;
}

export function InventoryList({
  products,
  onAdjustStock,
  onViewDetails,
  isLoading = false,
}: InventoryListProps) {
  const [sortBy, setSortBy] = useState<"name" | "stock" | "value">("name");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-20 bg-gray-200 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  // Filter products
  const filteredProducts = products.filter((product) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "low") return product.isLowStock;
    if (filterStatus === "out") return product.isOutOfStock;
    if (filterStatus === "in") return product.stockStatus === "IN_STOCK";
    if (filterStatus === "over") return product.stockStatus === "OVERSTOCK";
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "stock":
        return a.currentStock - b.currentStock;
      case "value":
        return b.inventoryValue - a.inventoryValue;
      default:
        return 0;
    }
  });

  const getStatusBadge = (product: Product) => {
    if (product.isOutOfStock) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Out of Stock
        </Badge>
      );
    }
    if (product.isLowStock) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Low Stock
        </Badge>
      );
    }
    if (product.stockStatus === "OVERSTOCK") {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <TrendingUp className="w-3 h-3 mr-1" />
          Overstock
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-800">
        <Package className="w-3 h-3 mr-1" />
        In Stock
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterStatus === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setFilterStatus("out")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterStatus === "out"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Out of Stock ({products.filter((p) => p.isOutOfStock).length})
          </button>
          <button
            onClick={() => setFilterStatus("low")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterStatus === "low"
                ? "bg-yellow-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Low Stock ({products.filter((p) => p.isLowStock).length})
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Name</option>
            <option value="stock">Stock Level</option>
            <option value="value">Inventory Value</option>
          </select>
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-3">
        {sortedProducts.map((product) => (
          <Card
            key={product.id}
            className="p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Product Image */}
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Package className="w-8 h-8 text-gray-400" />
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      SKU: {product.sku} • {product.category.name}
                    </p>
                  </div>
                  {getStatusBadge(product)}
                </div>

                {/* Stock Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-gray-500">Current Stock</p>
                    <p className="font-semibold text-lg">
                      {product.currentStock}
                      {product.lowStockThreshold && (
                        <span className="text-xs text-gray-400 ml-1">
                          / {product.lowStockThreshold}
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Inventory Value</p>
                    <p className="font-semibold text-lg">
                      Rp{(product.inventoryValue / 1000).toFixed(0)}K
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">30-Day Sales</p>
                    <p className="font-semibold text-lg">
                      {product.salesMetrics.last30Days}
                      <span className="text-xs text-gray-400 ml-1">units</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Days Until Empty</p>
                    <p className="font-semibold text-lg flex items-center">
                      {product.salesMetrics.daysUntilOutOfStock !== null ? (
                        <>
                          <Clock className="w-4 h-4 mr-1" />
                          {product.salesMetrics.daysUntilOutOfStock}d
                        </>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Stock Level Bar */}
                {product.lowStockThreshold && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          product.isOutOfStock
                            ? "bg-red-500"
                            : product.isLowStock
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (product.currentStock / product.lowStockThreshold) * 50
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails(product.id)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                )}
                {onAdjustStock && (
                  <button
                    onClick={() => onAdjustStock(product.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Adjust Stock"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {sortedProducts.length === 0 && (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No products found with current filters</p>
        </Card>
      )}
    </div>
  );
}
