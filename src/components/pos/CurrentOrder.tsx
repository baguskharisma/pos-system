"use client";

import { Minus, Plus, Trash2, ShoppingCart, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/product-utils";
import type { POSCartItem } from "@/types/pos";

interface CurrentOrderProps {
  items: POSCartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  className?: string;
}

export function CurrentOrder({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  className = "",
}: CurrentOrderProps) {
  if (items.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <ShoppingCart className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">
          No items in cart
        </h3>
        <p className="text-sm text-slate-500 text-center">
          Select products to add them to the order
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Current Order
          </h2>
          <span className="bg-slate-900 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {items.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearCart}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {items.map((item) => (
          <CartItemCard
            key={item.id}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemoveItem}
          />
        ))}
      </div>
    </div>
  );
}

interface CartItemCardProps {
  item: POSCartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemove(item.productId);
    } else if (!item.maxQuantity || newQuantity <= item.maxQuantity) {
      onUpdateQuantity(item.productId, newQuantity);
    }
  };

  const itemTotal = item.price * item.quantity;
  const isMaxQuantity = item.maxQuantity && item.quantity >= item.maxQuantity;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors">
      <div className="flex gap-3">
        {/* Product Image */}
        <div className="w-16 h-16 flex-shrink-0 bg-slate-100 rounded-md overflow-hidden relative">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-slate-400" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-slate-900 truncate">
                {item.name}
              </h4>
              <p className="text-xs text-slate-500">{item.sku}</p>
            </div>
            <button
              onClick={() => onRemove(item.productId)}
              className="text-slate-400 hover:text-red-600 transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-3 w-3" />
              </Button>

              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  handleQuantityChange(value);
                }}
                className="h-8 w-16 text-center text-sm"
                min="1"
                max={item.maxQuantity}
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={isMaxQuantity}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Item Total */}
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-900">
                {formatCurrency(itemTotal)}
              </div>
              <div className="text-xs text-slate-500">
                {formatCurrency(item.price)} each
              </div>
            </div>
          </div>

          {/* Max Quantity Warning */}
          {isMaxQuantity && (
            <p className="text-xs text-amber-600 mt-1">
              Max quantity reached ({item.maxQuantity} in stock)
            </p>
          )}

          {/* Notes */}
          {item.notes && (
            <p className="text-xs text-slate-600 mt-2 italic">
              Note: {item.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
