"use client";

import { ShoppingCart, Package, AlertCircle } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/product-utils";
import type { POSProduct } from "@/types/pos";

interface POSProductGridProps {
  products: POSProduct[];
  onAddToCart: (product: POSProduct) => void;
  isLoading?: boolean;
}

export function POSProductGrid({
  products,
  onAddToCart,
  isLoading = false,
}: POSProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-slate-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="h-16 w-16 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-1">
          No products found
        </h3>
        <p className="text-sm text-slate-500">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}

interface ProductCardProps {
  product: POSProduct;
  onAddToCart: (product: POSProduct) => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isOutOfStock =
    product.trackInventory && product.quantity <= 0;
  const isLowStock =
    product.trackInventory &&
    product.quantity > 0 &&
    product.quantity <= 5;

  return (
    <button
      onClick={() => !isOutOfStock && onAddToCart(product)}
      disabled={isOutOfStock || !product.isAvailable}
      className={`
        group relative flex flex-col bg-white rounded-lg border-2 transition-all
        ${
          isOutOfStock || !product.isAvailable
            ? "border-slate-200 opacity-60 cursor-not-allowed"
            : "border-slate-200 hover:border-slate-900 hover:shadow-lg cursor-pointer"
        }
        touch-manipulation
      `}
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t-md bg-slate-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="h-12 w-12 text-slate-300" />
          </div>
        )}

        {/* Stock Badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
        {isLowStock && !isOutOfStock && (
          <div className="absolute top-2 right-2">
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {product.quantity} left
            </span>
          </div>
        )}

        {/* Category Badge */}
        {product.categoryColor && (
          <div className="absolute top-2 left-2">
            <span
              className="text-white text-xs font-medium px-2 py-1 rounded-full"
              style={{ backgroundColor: product.categoryColor }}
            >
              {product.categoryName}
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-medium text-sm text-slate-900 line-clamp-2 mb-1 text-left">
          {product.name}
        </h3>
        <p className="text-xs text-slate-500 mb-2 text-left">{product.sku}</p>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(product.price)}
            </span>
          </div>

          {!isOutOfStock && product.isAvailable && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white group-hover:bg-slate-800 transition-colors">
              <ShoppingCart className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
