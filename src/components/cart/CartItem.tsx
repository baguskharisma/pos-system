"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCartStore, type CartItem as CartItemType } from "@/store/cart";
import { useState } from "react";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem, updateNote } = useCartStore();
  const [showNoteInput, setShowNoteInput] = useState(!!item.note);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(item.product.id);
    } else {
      updateQuantity(item.product.id, newQuantity);
    }
  };

  const handleNoteChange = (note: string) => {
    updateNote(item.product.id, note);
  };

  const itemTotal = Number(item.product.price) * item.quantity;
  const maxQuantity = item.product.trackInventory
    ? item.product.quantity
    : 999;

  return (
    <div className="flex gap-3 py-4 border-b last:border-b-0">
      {/* Product Image */}
      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
        {item.product.imageUrl ? (
          <Image
            src={item.product.imageUrl}
            alt={item.product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
            No Image
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        {/* Product Name & Category */}
        <div className="mb-1">
          <h3 className="font-semibold text-sm line-clamp-1">
            {item.product.name}
          </h3>
          <Badge
            variant="outline"
            className="text-xs mt-1"
            style={
              item.product.category.color
                ? { borderColor: item.product.category.color }
                : {}
            }
          >
            {item.product.category.name}
          </Badge>
        </div>

        {/* Price */}
        <div className="text-sm font-semibold text-slate-900 mb-2">
          Rp {Number(item.product.price).toLocaleString("id-ID")}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleQuantityChange(item.quantity - 1)}
          >
            <Minus className="w-3 h-3" />
          </Button>

          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              handleQuantityChange(Math.min(val, maxQuantity));
            }}
            className="h-7 w-14 text-center text-sm"
            min={1}
            max={maxQuantity}
          />

          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={
              item.product.trackInventory &&
              item.quantity >= item.product.quantity
            }
          >
            <Plus className="w-3 h-3" />
          </Button>

          <div className="flex-1" />

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => removeItem(item.product.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Note/Special Request */}
        {!showNoteInput ? (
          <button
            onClick={() => setShowNoteInput(true)}
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
          >
            + Tambah catatan
          </button>
        ) : (
          <Textarea
            placeholder="Catatan khusus (misal: tanpa gula, extra pedas, dll)"
            value={item.note || ""}
            onChange={(e) => handleNoteChange(e.target.value)}
            className="text-xs mt-1 min-h-[60px]"
          />
        )}

        {/* Item Total */}
        <div className="text-sm font-bold text-slate-900 mt-2">
          Subtotal: Rp {itemTotal.toLocaleString("id-ID")}
        </div>
      </div>
    </div>
  );
}
