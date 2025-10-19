"use client";

import { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import type { ProductQueryParams } from "@/types/product";

interface ProductFiltersProps {
  filters: ProductQueryParams;
  onFiltersChange: (filters: ProductQueryParams) => void;
}

export function ProductFilters({
  filters,
  onFiltersChange,
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: categoriesData } = useCategories({ limit: 100, isActive: true });

  const hasActiveFilters =
    filters.categoryId ||
    filters.isAvailable !== undefined ||
    filters.isFeatured !== undefined ||
    filters.trackInventory !== undefined ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.lowStock !== undefined ||
    (filters.tags && filters.tags.length > 0);

  const clearFilters = () => {
    onFiltersChange({
      page: 1,
      limit: filters.limit,
      search: filters.search,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-slate-600"
          >
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={filters.categoryId || "all"}
                onValueChange={(value) => {
                  onFiltersChange({
                    ...filters,
                    categoryId: value === "all" ? undefined : value,
                    page: 1,
                  });
                }}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categoriesData?.data.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Availability Filter */}
            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <Select
                value={
                  filters.isAvailable === undefined
                    ? "all"
                    : filters.isAvailable
                    ? "available"
                    : "hidden"
                }
                onValueChange={(value) => {
                  onFiltersChange({
                    ...filters,
                    isAvailable:
                      value === "all"
                        ? undefined
                        : value === "available"
                        ? true
                        : false,
                    page: 1,
                  });
                }}
              >
                <SelectTrigger id="availability">
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  <SelectItem value="available">Available only</SelectItem>
                  <SelectItem value="hidden">Hidden only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Min Price */}
            <div className="space-y-2">
              <Label htmlFor="minPrice">Min Price</Label>
              <Input
                id="minPrice"
                type="number"
                placeholder="0"
                min="0"
                step="1000"
                value={filters.minPrice || ""}
                onChange={(e) => {
                  onFiltersChange({
                    ...filters,
                    minPrice: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                    page: 1,
                  });
                }}
              />
            </div>

            {/* Max Price */}
            <div className="space-y-2">
              <Label htmlFor="maxPrice">Max Price</Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="No limit"
                min="0"
                step="1000"
                value={filters.maxPrice || ""}
                onChange={(e) => {
                  onFiltersChange({
                    ...filters,
                    maxPrice: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                    page: 1,
                  });
                }}
              />
            </div>

            {/* Featured Filter */}
            <div className="space-y-2">
              <Label htmlFor="featured">Featured</Label>
              <Select
                value={
                  filters.isFeatured === undefined
                    ? "all"
                    : filters.isFeatured
                    ? "yes"
                    : "no"
                }
                onValueChange={(value) => {
                  onFiltersChange({
                    ...filters,
                    isFeatured:
                      value === "all"
                        ? undefined
                        : value === "yes"
                        ? true
                        : false,
                    page: 1,
                  });
                }}
              >
                <SelectTrigger id="featured">
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  <SelectItem value="yes">Featured only</SelectItem>
                  <SelectItem value="no">Non-featured only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Inventory Tracking Filter */}
            <div className="space-y-2">
              <Label htmlFor="trackInventory">Inventory Tracking</Label>
              <Select
                value={
                  filters.trackInventory === undefined
                    ? "all"
                    : filters.trackInventory
                    ? "yes"
                    : "no"
                }
                onValueChange={(value) => {
                  onFiltersChange({
                    ...filters,
                    trackInventory:
                      value === "all"
                        ? undefined
                        : value === "yes"
                        ? true
                        : false,
                    page: 1,
                  });
                }}
              >
                <SelectTrigger id="trackInventory">
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  <SelectItem value="yes">Tracked only</SelectItem>
                  <SelectItem value="no">Not tracked only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Low Stock Filter */}
            <div className="space-y-2">
              <Label htmlFor="lowStock">Stock Status</Label>
              <Select
                value={filters.lowStock === true ? "low" : "all"}
                onValueChange={(value) => {
                  onFiltersChange({
                    ...filters,
                    lowStock: value === "low" ? true : undefined,
                    page: 1,
                  });
                }}
              >
                <SelectTrigger id="lowStock">
                  <SelectValue placeholder="All stock levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stock levels</SelectItem>
                  <SelectItem value="low">Low stock only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-700">
                  Active filters:
                </span>
                {filters.categoryId && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Category:{" "}
                    {
                      categoriesData?.data.find(
                        (c) => c.id === filters.categoryId
                      )?.name
                    }
                    <button
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          categoryId: undefined,
                          page: 1,
                        })
                      }
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.isAvailable !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {filters.isAvailable ? "Available" : "Hidden"}
                    <button
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          isAvailable: undefined,
                          page: 1,
                        })
                      }
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.isFeatured !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {filters.isFeatured ? "Featured" : "Non-featured"}
                    <button
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          isFeatured: undefined,
                          page: 1,
                        })
                      }
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.minPrice !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Min: Rp {filters.minPrice.toLocaleString()}
                    <button
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          minPrice: undefined,
                          page: 1,
                        })
                      }
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.maxPrice !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Max: Rp {filters.maxPrice.toLocaleString()}
                    <button
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          maxPrice: undefined,
                          page: 1,
                        })
                      }
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.lowStock && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Low stock
                    <button
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          lowStock: undefined,
                          page: 1,
                        })
                      }
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
