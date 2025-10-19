"use client";

import { User, Phone, MapPin, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomerInfo, OrderType } from "@/types/pos";

interface CustomerInfoFormProps {
  customerInfo: CustomerInfo;
  orderType: OrderType;
  onChange: (customerInfo: CustomerInfo) => void;
  className?: string;
}

export function CustomerInfoForm({
  customerInfo,
  orderType,
  onChange,
  className = "",
}: CustomerInfoFormProps) {
  const handleChange = (field: keyof CustomerInfo, value: string) => {
    onChange({
      ...customerInfo,
      [field]: value,
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Customer Name */}
      <div className="space-y-1.5">
        <Label htmlFor="customer-name" className="text-xs text-slate-600 flex items-center gap-1">
          <User className="h-3 w-3" />
          Customer Name {orderType === "DELIVERY" && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id="customer-name"
          type="text"
          placeholder="Enter customer name"
          value={customerInfo.name || ""}
          onChange={(e) => handleChange("name", e.target.value)}
          className="h-9"
        />
      </div>

      {/* Phone Number */}
      <div className="space-y-1.5">
        <Label htmlFor="customer-phone" className="text-xs text-slate-600 flex items-center gap-1">
          <Phone className="h-3 w-3" />
          Phone Number {orderType === "DELIVERY" && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id="customer-phone"
          type="tel"
          placeholder="Enter phone number"
          value={customerInfo.phone || ""}
          onChange={(e) => handleChange("phone", e.target.value)}
          className="h-9"
        />
      </div>

      {/* Table Number - Only for DINE_IN */}
      {orderType === "DINE_IN" && (
        <div className="space-y-1.5">
          <Label htmlFor="table-number" className="text-xs text-slate-600 flex items-center gap-1">
            <Hash className="h-3 w-3" />
            Table Number
          </Label>
          <Input
            id="table-number"
            type="text"
            placeholder="Enter table number"
            value={customerInfo.tableNumber || ""}
            onChange={(e) => handleChange("tableNumber", e.target.value)}
            className="h-9"
          />
        </div>
      )}

      {/* Delivery Address - Only for DELIVERY */}
      {orderType === "DELIVERY" && (
        <div className="space-y-1.5">
          <Label htmlFor="delivery-address" className="text-xs text-slate-600 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Delivery Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="delivery-address"
            type="text"
            placeholder="Enter delivery address"
            value={customerInfo.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
            className="h-9"
          />
        </div>
      )}
    </div>
  );
}
