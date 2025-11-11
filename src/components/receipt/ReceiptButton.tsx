"use client";

import { useState } from "react";
import { Receipt as ReceiptIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptModal } from "./ReceiptModal";

interface Order {
  id: string;
  orderNumber: string;
  invoiceNumber?: string;
  createdAt: Date | string;
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
  orderType: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  totalAmount: number;
  paymentMethod?: string;
  paidAmount?: number;
  changeAmount?: number;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
  }>;
  cashier?: {
    name: string;
  };
}

interface ReceiptButtonProps {
  order: Order;
  businessInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  autoPrint?: boolean;
}

export function ReceiptButton({
  order,
  businessInfo,
  variant = "outline",
  size = "sm",
  className,
  autoPrint = false,
}: ReceiptButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={className}
      >
        <ReceiptIcon className="w-4 h-4 mr-2" />
        Struk
      </Button>

      <ReceiptModal
        order={order}
        open={open}
        onOpenChange={setOpen}
        businessInfo={businessInfo}
        autoPrint={autoPrint}
      />
    </>
  );
}
