"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InventoryDashboard } from "@/components/inventory/InventoryDashboard";
import { InventoryList } from "@/components/inventory/InventoryList";
import { StockAdjustmentModal } from "@/components/inventory/StockAdjustmentModal";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Upload,
  RefreshCcw,
  Filter,
  Search,
  AlertCircle,
} from "lucide-react";

interface InventoryData {
  summary: any;
  data: any[];
  pagination: any;
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    categoryId: "",
    lowStock: false,
    outOfStock: false,
    overStock: false,
  });

  const queryClient = useQueryClient();

  // Fetch inventory data
  const { data: inventoryData, isLoading, error, refetch } = useQuery<InventoryData>({
    queryKey: ["inventory", filters, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.categoryId) params.append("categoryId", filters.categoryId);
      if (filters.lowStock) params.append("lowStock", "true");
      if (filters.outOfStock) params.append("outOfStock", "true");
      if (filters.overStock) params.append("overStock", "true");
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/inventory?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch inventory");
      }
      return response.json();
    },
    retry: false,
  });

  // Fetch inventory alerts
  const { data: alertsData } = useQuery({
    queryKey: ["inventory-alerts"],
    queryFn: async () => {
      const response = await fetch("/api/inventory/alerts");
      if (!response.ok) throw new Error("Failed to fetch alerts");
      return response.json();
    },
  });

  // Fetch inventory analytics
  const { data: analyticsData } = useQuery({
    queryKey: ["inventory-analytics"],
    queryFn: async () => {
      const response = await fetch("/api/inventory/analytics");
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  // Stock adjustment mutation
  const adjustStockMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to adjust stock");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-analytics"] });
    },
  });

  const handleAdjustStock = (productId: string) => {
    const product = inventoryData?.data.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct({
        id: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: product.currentStock,
        lowStockThreshold: product.lowStockThreshold,
      });
      setIsAdjustmentModalOpen(true);
    }
  };

  const handleViewDetails = (productId: string) => {
    // Navigate to product details or open a details modal
    window.location.href = `/admin/products/${productId}`;
  };

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/inventory?format=csv");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export data:", error);
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Inventory
            </h2>
            <p className="text-gray-600 mb-6">
              {error instanceof Error ? error.message : "Failed to load inventory data"}
            </p>
            <button
              onClick={() => refetch()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Inventory Management
            </h1>
            <p className="text-gray-600 mt-1">
              Track and manage your product inventory
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleExportData}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Critical Alerts */}
        {alertsData?.summary?.critical > 0 && (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
              <div>
                <p className="font-semibold text-red-900">
                  {alertsData.summary.critical} Critical Stock Alert
                  {alertsData.summary.critical > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-red-700 mt-1">
                  You have {alertsData.summary.outOfStock} out of stock items and{" "}
                  {alertsData.summary.lowStock} low stock items that need immediate
                  attention.
                </p>
                <button
                  onClick={() => setActiveTab("alerts")}
                  className="text-sm text-red-800 font-medium mt-2 hover:underline"
                >
                  View Alerts →
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border-b">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="alerts">
              Alerts
              {alertsData?.summary?.totalAlerts > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                  {alertsData.summary.totalAlerts}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <InventoryDashboard
              summary={inventoryData?.summary}
              isLoading={isLoading}
            />

            {/* Quick Stats from Analytics */}
            {analyticsData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    Top Sellers (30 days)
                  </h3>
                  <div className="space-y-2">
                    {analyticsData.insights?.topSellers
                      ?.slice(0, 5)
                      .map((item: any) => (
                        <div
                          key={item.product.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="truncate mr-2">
                            {item.product.name}
                          </span>
                          <span className="font-semibold">
                            {item.unitsSold}
                          </span>
                        </div>
                      ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    Most Profitable
                  </h3>
                  <div className="space-y-2">
                    {analyticsData.insights?.mostProfitable
                      ?.slice(0, 5)
                      .map((item: any) => (
                        <div
                          key={item.product.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="truncate mr-2">
                            {item.product.name}
                          </span>
                          <span className="font-semibold text-green-600">
                            Rp{(item.grossProfit / 1000).toFixed(0)}K
                          </span>
                        </div>
                      ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    Dead Stock
                  </h3>
                  <div className="space-y-2">
                    {analyticsData.insights?.deadStock?.length > 0 ? (
                      analyticsData.insights.deadStock
                        .slice(0, 5)
                        .map((item: any) => (
                          <div
                            key={item.product.id}
                            className="flex justify-between text-sm"
                          >
                            <span className="truncate mr-2">
                              {item.product.name}
                            </span>
                            <span className="font-semibold text-red-600">
                              {item.currentStock}
                            </span>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-gray-500">No dead stock</p>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            {/* Search and Filters */}
            <Card className="p-4">
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setFilters({ ...filters, lowStock: !filters.lowStock })
                    }
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      filters.lowStock
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Low Stock
                  </button>
                  <button
                    onClick={() =>
                      setFilters({ ...filters, outOfStock: !filters.outOfStock })
                    }
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      filters.outOfStock
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Out of Stock
                  </button>
                </div>
              </div>
            </Card>

            <InventoryList
              products={inventoryData?.data || []}
              onAdjustStock={handleAdjustStock}
              onViewDetails={handleViewDetails}
              isLoading={isLoading}
            />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Stock Alerts</h3>
              {alertsData?.alerts && alertsData.alerts.length > 0 ? (
                <div className="space-y-3">
                  {alertsData.alerts.map((alert: any) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.severity === "critical"
                          ? "border-red-500 bg-red-50"
                          : "border-yellow-500 bg-yellow-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{alert.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            SKU: {alert.sku} • Current: {alert.currentStock}{" "}
                            {alert.lowStockThreshold && (
                              <>/ Threshold: {alert.lowStockThreshold}</>
                            )}
                          </p>
                          <p className="text-sm mt-2">
                            Recommendation: Order{" "}
                            {alert.recommendation.suggestedQuantity} units (Est.
                            cost: Rp
                            {(
                              alert.recommendation.estimatedCost / 1000
                            ).toFixed(0)}
                            K)
                          </p>
                        </div>
                        <button
                          onClick={() => handleAdjustStock(alert.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Adjust Stock
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No alerts</p>
              )}
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Inventory Analytics
              </h3>
              {analyticsData ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold">
                        Rp
                        {(
                          analyticsData.summary.overview.totalRevenue / 1000000
                        ).toFixed(1)}
                        M
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gross Profit</p>
                      <p className="text-2xl font-bold text-green-600">
                        Rp
                        {(
                          analyticsData.summary.overview.totalGrossProfit /
                          1000000
                        ).toFixed(1)}
                        M
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Profit Margin</p>
                      <p className="text-2xl font-bold">
                        {analyticsData.summary.overview.avgProfitMargin.toFixed(
                          1
                        )}
                        %
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Turnover Rate</p>
                      <p className="text-2xl font-bold">
                        {analyticsData.summary.overview.avgTurnoverRate.toFixed(
                          1
                        )}
                        x
                      </p>
                    </div>
                  </div>

                  {/* More analytics details can be added here */}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Loading analytics...
                </p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSubmit={async (data) => {
          await adjustStockMutation.mutateAsync(data);
        }}
      />
    </div>
  );
}
