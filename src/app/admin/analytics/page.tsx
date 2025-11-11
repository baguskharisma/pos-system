"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  Activity
} from "lucide-react";
import { InventoryDashboard } from "@/components/analytics/InventoryDashboard";
import { CustomerAnalytics } from "@/components/analytics/CustomerAnalytics";
import { SalesForecast } from "@/components/analytics/SalesForecast";
import { ProfitMarginAnalysis } from "@/components/analytics/ProfitMarginAnalysis";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Advanced Analytics
          </h1>
          <p className="text-slate-600">
            Inventory tracking, customer insights, forecasting, and profit analysis
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="forecast" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Forecast
            </TabsTrigger>
            <TabsTrigger value="profit" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Profit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            <InventoryDashboard />
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <CustomerAnalytics />
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <SalesForecast />
          </TabsContent>

          <TabsContent value="profit" className="space-y-6">
            <ProfitMarginAnalysis />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
