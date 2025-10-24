/**
 * Order Filters Component
 * src/components/orders/OrderFilters.tsx
 */

"use client";

import { useState } from "react";
import { Search, Calendar, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OrderQueryParams, OrderStatus, OrderType } from "@/types/order";

interface OrderFiltersProps {
  filters: OrderQueryParams;
  onFiltersChange: (filters: OrderQueryParams) => void;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "PENDING_PAYMENT", label: "Pending Payment" },
  { value: "AWAITING_CONFIRMATION", label: "Awaiting Confirmation" },
  { value: "PAID", label: "Paid" },
  { value: "PREPARING", label: "Preparing" },
  { value: "READY", label: "Ready" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
];

const ORDER_TYPE_OPTIONS: { value: OrderType; label: string }[] = [
  { value: "DINE_IN", label: "Dine In" },
  { value: "TAKEAWAY", label: "Takeaway" },
  { value: "DELIVERY", label: "Delivery" },
];

export function OrderFilters({ filters, onFiltersChange }: OrderFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchValue(value);
    const newFilters = { ...filters, search: value || undefined, page: 1 };
    onFiltersChange(newFilters);
  };

  // Handle status filter
  const handleStatusChange = (status: OrderStatus | "") => {
    const newFilters = {
      ...filters,
      status: status || undefined,
      page: 1,
    };
    onFiltersChange(newFilters);
  };

  // Handle order type filter
  const handleOrderTypeChange = (orderType: OrderType | "") => {
    const newFilters = {
      ...filters,
      orderType: orderType || undefined,
      page: 1,
    };
    onFiltersChange(newFilters);
  };

  // Handle date range
  const handleDateFromChange = (dateFrom: string) => {
    const newFilters = {
      ...filters,
      dateFrom: dateFrom || undefined,
      page: 1,
    };
    onFiltersChange(newFilters);
  };

  const handleDateToChange = (dateTo: string) => {
    const newFilters = {
      ...filters,
      dateTo: dateTo || undefined,
      page: 1,
    };
    onFiltersChange(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchValue("");
    onFiltersChange({
      page: 1,
      limit: filters.limit,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.orderType ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
      {/* Search and Quick Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by order number, customer name, or phone..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchValue && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={filters.status || ""}
          onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
          className="px-4 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Order Type Filter */}
        <select
          value={filters.orderType || ""}
          onChange={(e) => handleOrderTypeChange(e.target.value as OrderType)}
          className="px-4 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          {ORDER_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Toggle Advanced Filters */}
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="h-4 w-4" />
          {showAdvanced ? "Hide" : "More"} Filters
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="pt-4 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                From Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  value={filters.dateFrom || ""}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                To Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  value={filters.dateTo || ""}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Min Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Min Amount
              </label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minAmount || ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    minAmount: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                    page: 1,
                  })
                }
              />
            </div>

            {/* Max Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Amount
              </label>
              <Input
                type="number"
                placeholder="0"
                value={filters.maxAmount || ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    maxAmount: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                    page: 1,
                  })
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <p className="text-sm text-slate-600">Active filters applied</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}