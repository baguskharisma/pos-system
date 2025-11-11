"use client";

import { useState } from "react";
import { Printer, Download, Share2, X } from "lucide-react";
import { Receipt } from "./Receipt";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  printReceipt,
  downloadReceiptAsImage,
  shareReceipt,
  isWebShareSupported,
} from "@/lib/print-utils";

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

interface ReceiptModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  autoPrint?: boolean;
}

export function ReceiptModal({
  order,
  open,
  onOpenChange,
  businessInfo,
  autoPrint = false,
}: ReceiptModalProps) {
  const [printing, setPrinting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Auto-print when modal opens if autoPrint is enabled
  useState(() => {
    if (open && autoPrint && order) {
      setTimeout(() => {
        handlePrint();
      }, 500);
    }
  });

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await printReceipt("receipt-print");
    } catch (error) {
      console.error("Print failed:", error);
    } finally {
      setPrinting(false);
    }
  };

  const handleDownload = async () => {
    if (!order) return;

    setDownloading(true);
    try {
      await downloadReceiptAsImage(
        "receipt-print",
        `receipt-${order.orderNumber}.png`
      );
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!order) return;

    try {
      await shareReceipt("receipt-print", `Receipt ${order.orderNumber}`);
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Struk Pembayaran</DialogTitle>
          <DialogDescription>
            Order #{order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        {/* Receipt Preview */}
        <div className="my-4 bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-x-auto">
          <Receipt order={order} businessInfo={businessInfo} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handlePrint}
            disabled={printing}
            className="flex-1"
            size="lg"
          >
            <Printer className="w-4 h-4 mr-2" />
            {printing ? "Printing..." : "Print"}
          </Button>

          <Button
            onClick={handleDownload}
            disabled={downloading}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? "Downloading..." : "Download"}
          </Button>

          {isWebShareSupported() && (
            <Button
              onClick={handleShare}
              variant="outline"
              size="lg"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          )}
        </div>

        {/* Info Text */}
        <p className="text-xs text-slate-500 text-center mt-2">
          Pastikan printer thermal 58mm sudah terhubung sebelum mencetak
        </p>
      </DialogContent>
    </Dialog>
  );
}
