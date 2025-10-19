"use client";

import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Star,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useProducts } from "@/hooks/useProducts";
import type { Product, ProductQueryParams } from "@/types/product";
import { formatCurrency } from "@/lib/product-utils";

interface ProductTableProps {
  filters: ProductQueryParams;
  onFiltersChange: (filters: ProductQueryParams) => void;
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleAvailability: (product: Product) => void;
  onExportCSV: () => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ProductTable({
  filters,
  onFiltersChange,
  onAdd,
  onEdit,
  onDelete,
  onToggleAvailability,
  onExportCSV,
  selectedIds,
  onSelectionChange,
}: ProductTableProps) {
  const { data, isLoading, error } = useProducts(filters);

  const handleSort = (
    field: "name" | "price" | "sku" | "quantity" | "createdAt" | "updatedAt"
  ) => {
    if (filters.sortBy === field) {
      onFiltersChange({
        ...filters,
        sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
      });
    } else {
      onFiltersChange({
        ...filters,
        sortBy: field,
        sortOrder: "asc",
      });
    }
  };

  const handleSelectAll = () => {
    if (!data?.data) return;
    if (selectedIds.length === data.data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.data.map((p) => p.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const isLowStock = (product: Product) => {
    if (!product.trackInventory || product.lowStockAlert === null) return false;
    return product.quantity <= product.lowStockAlert;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Products</h2>
          <p className="text-slate-500 mt-2">
            Manage your product catalog and inventory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onExportCSV}
            className="gap-2"
            disabled={!data?.data || data.data.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={onAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Search and Bulk Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search products by name, SKU, barcode..."
            value={filters.search || ""}
            onChange={(e) => {
              onFiltersChange({
                ...filters,
                search: e.target.value || undefined,
                page: 1,
              });
            }}
            className="pl-9"
          />
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">
              {selectedIds.length} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onToggleAvailability({ id: selectedIds[0] } as Product)
              }
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Enable
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onToggleAvailability({ id: selectedIds[0] } as Product)
              }
              className="gap-2"
            >
              <EyeOff className="h-4 w-4" />
              Disable
            </Button>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">
            Failed to load products. Please try again.
          </p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-slate-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && data && (
        <>
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">
                      <Checkbox
                        checked={
                          data.data.length > 0 &&
                          selectedIds.length === data.data.length
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left w-20">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Image
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider hover:text-slate-700"
                      >
                        Product
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("sku")}
                        className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider hover:text-slate-700"
                      >
                        SKU
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("price")}
                        className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider hover:text-slate-700"
                      >
                        Price
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("quantity")}
                        className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider hover:text-slate-700"
                      >
                        Stock
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.data.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <p className="text-slate-500">No products found.</p>
                        {filters.search && (
                          <p className="text-sm text-slate-400 mt-1">
                            Try adjusting your search or filters
                          </p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    data.data.map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <Checkbox
                            checked={selectedIds.includes(product.id)}
                            onCheckedChange={() => handleSelectOne(product.id)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center">
                              <span className="text-slate-400 text-xs">
                                No Image
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            {product.isFeatured && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-900 truncate">
                                {product.name}
                              </div>
                              {product.description && (
                                <div className="text-sm text-slate-500 truncate max-w-xs">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                            {product.sku}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.category && (
                            <div className="flex items-center gap-2">
                              {product.category.color && (
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: product.category.color }}
                                />
                              )}
                              <span className="text-sm text-slate-900">
                                {product.category.name}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            {formatCurrency(product.price)}
                          </div>
                          {product.compareAtPrice && (
                            <div className="text-xs text-slate-500 line-through">
                              {formatCurrency(product.compareAtPrice)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.trackInventory ? (
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-medium ${
                                  isLowStock(product)
                                    ? "text-red-600"
                                    : product.quantity === 0
                                    ? "text-slate-400"
                                    : "text-slate-900"
                                }`}
                              >
                                {product.quantity}
                              </span>
                              {isLowStock(product) && (
                                <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                  Low
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Not tracked
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => onToggleAvailability(product)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                              product.isAvailable
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                            }`}
                          >
                            {product.isAvailable ? (
                              <>
                                <Eye className="h-3 w-3" />
                                Available
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3" />
                                Hidden
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(product)}
                              className="gap-1"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(product)}
                              className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing {(filters.page || 1 - 1) * (filters.limit || 10) + 1} to{" "}
                {Math.min(
                  (filters.page || 1) * (filters.limit || 10),
                  data.pagination.total
                )}{" "}
                of {data.pagination.total} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      page: (filters.page || 1) - 1,
                    })
                  }
                  disabled={filters.page === 1 || !filters.page}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: data.pagination.totalPages })
                    .map((_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === data.pagination.totalPages ||
                        Math.abs(p - (filters.page || 1)) <= 1
                    )
                    .map((p, idx, arr) => (
                      <div key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="px-2 text-slate-400">...</span>
                        )}
                        <Button
                          variant={
                            (filters.page || 1) === p ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            onFiltersChange({ ...filters, page: p })
                          }
                          className="w-9"
                        >
                          {p}
                        </Button>
                      </div>
                    ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      page: (filters.page || 1) + 1,
                    })
                  }
                  disabled={filters.page === data.pagination.totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
