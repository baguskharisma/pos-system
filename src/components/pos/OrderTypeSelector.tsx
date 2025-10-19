"use client";

import { UtensilsCrossed, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { OrderType } from "@/types/pos";

interface OrderTypeSelectorProps {
  selected: OrderType;
  onChange: (orderType: OrderType) => void;
  className?: string;
}

const ORDER_TYPES: Array<{
  value: OrderType;
  label: string;
  icon: typeof UtensilsCrossed;
  color: string;
}> = [
  {
    value: "DINE_IN",
    label: "Dine In",
    icon: UtensilsCrossed,
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    value: "TAKEAWAY",
    label: "Takeaway",
    icon: ShoppingBag,
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    value: "DELIVERY",
    label: "Delivery",
    icon: Truck,
    color: "bg-orange-500 hover:bg-orange-600",
  },
];

export function OrderTypeSelector({
  selected,
  onChange,
  className = "",
}: OrderTypeSelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-xs text-slate-600">Order Type</Label>
      <div className="grid grid-cols-3 gap-2">
        {ORDER_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selected === type.value;

          return (
            <Button
              key={type.value}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(type.value)}
              className={`flex flex-col items-center gap-1 h-auto py-3 ${
                isSelected ? type.color : ""
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{type.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
