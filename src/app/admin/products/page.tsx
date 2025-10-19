"use client";

import { useState } from "react";
import { ProductTable } from "@/components/products/ProductTable";
import { ProductFilters } from "@/components/products/ProductFilters";
import { AddProductModal } from "@/components/products/AddProductModal";
import { EditProductModal } from "@/components/products/EditProductModal";
import { DeleteProductDialog } from "@/components/products/DeleteProductDialog";
import { useProducts, useBulkUpdateProductAvailability, useToggleProductAvailability } from "@/hooks/useProducts";
import { exportProductsToCSV } from "@/lib/product-utils";
import type { Product, ProductQueryParams } from "@/types/product";

export default function ProductsPage() {
  // State for modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // State for filters and selection
  const [filters, setFilters] = useState<ProductQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch products
  const { data } = useProducts(filters);

  // Mutations
  const bulkUpdate = useBulkUpdateProductAvailability();
  const toggleAvailability = useToggleProductAvailability();

  // Handlers
  const handleFiltersChange = (newFilters: ProductQueryParams) => {
    setFilters(newFilters);
    setSelectedIds([]); // Clear selection when filters change
  };

  const handleToggleAvailability = async (product: Product) => {
    await toggleAvailability.mutateAsync({
      id: product.id,
      data: { isAvailable: !product.isAvailable },
    });
  };

  const handleBulkEnable = async () => {
    await bulkUpdate.mutateAsync({
      productIds: selectedIds,
      isAvailable: true,
    });
    setSelectedIds([]);
  };

  const handleBulkDisable = async () => {
    await bulkUpdate.mutateAsync({
      productIds: selectedIds,
      isAvailable: false,
    });
    setSelectedIds([]);
  };

  const handleExportCSV = () => {
    if (data?.data) {
      exportProductsToCSV(data.data);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Filters */}
        <ProductFilters filters={filters} onFiltersChange={handleFiltersChange} />

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-blue-900">
                {selectedIds.length} product(s) selected
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkEnable}
                  className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50"
                  disabled={bulkUpdate.isPending}
                >
                  Enable All
                </button>
                <button
                  onClick={handleBulkDisable}
                  className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50"
                  disabled={bulkUpdate.isPending}
                >
                  Disable All
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Table */}
        <ProductTable
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onAdd={() => setShowAddModal(true)}
          onEdit={setEditingProduct}
          onDelete={setDeletingProduct}
          onToggleAvailability={handleToggleAvailability}
          onExportCSV={handleExportCSV}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />

        {/* Modals */}
        <AddProductModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
        />

        <EditProductModal
          open={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          product={editingProduct}
        />

        <DeleteProductDialog
          open={!!deletingProduct}
          onClose={() => setDeletingProduct(null)}
          product={deletingProduct}
        />
      </div>
    </div>
  );
}
