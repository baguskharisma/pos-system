"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, Receipt } from "lucide-react";

interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

interface ReceiptPreviewProps {
  orderNumber: string;
  orderType: string;
  createdAt: Date;
  items: ReceiptItem[];
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  customerName?: string | null;
  tableNumber?: string | null;
  paymentMethod: string;
}

export function ReceiptPreview({
  orderNumber,
  orderType,
  createdAt,
  items,
  subtotal,
  taxAmount,
  serviceCharge,
  deliveryFee,
  discountAmount,
  totalAmount,
  customerName,
  tableNumber,
  paymentMethod,
}: ReceiptPreviewProps) {
  const handleDownload = () => {
    // Create receipt content
    const receiptWindow = window.open("", "_blank");
    if (!receiptWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt - ${orderNumber}</title>
          <style>
            @media print {
              body { margin: 0; }
            }
            body {
              font-family: 'Courier New', monospace;
              max-width: 80mm;
              margin: 0 auto;
              padding: 10mm;
              font-size: 12px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 20px;
            }
            .header p {
              margin: 5px 0;
              font-size: 11px;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
            .info {
              margin: 10px 0;
              font-size: 11px;
            }
            .items {
              margin: 10px 0;
            }
            .item {
              margin: 5px 0;
            }
            .item-name {
              font-weight: bold;
            }
            .item-detail {
              display: flex;
              justify-content: space-between;
              padding-left: 10px;
            }
            .summary {
              margin-top: 10px;
            }
            .summary-line {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .total {
              font-weight: bold;
              font-size: 14px;
              margin-top: 10px;
              padding-top: 5px;
              border-top: 1px solid #000;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RAVORA POS</h1>
            <p>Terima kasih atas pesanan Anda</p>
          </div>

          <div class="divider"></div>

          <div class="info">
            <div style="display: flex; justify-content: space-between;">
              <span>No. Pesanan:</span>
              <span><strong>${orderNumber}</strong></span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Tanggal:</span>
              <span>${new Date(createdAt).toLocaleString("id-ID")}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Tipe:</span>
              <span>${orderType}</span>
            </div>
            ${
              tableNumber
                ? `<div style="display: flex; justify-content: space-between;">
                <span>Meja:</span>
                <span>${tableNumber}</span>
              </div>`
                : ""
            }
            ${
              customerName
                ? `<div style="display: flex; justify-content: space-between;">
                <span>Nama:</span>
                <span>${customerName}</span>
              </div>`
                : ""
            }
            <div style="display: flex; justify-content: space-between;">
              <span>Pembayaran:</span>
              <span>${paymentMethod}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="items">
            ${items
              .map(
                (item) => `
              <div class="item">
                <div class="item-name">${item.productName}</div>
                <div class="item-detail">
                  <span>${item.quantity} x Rp ${Number(
                  item.unitPrice
                ).toLocaleString("id-ID")}</span>
                  <span>Rp ${Number(item.totalAmount).toLocaleString(
                    "id-ID"
                  )}</span>
                </div>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="divider"></div>

          <div class="summary">
            <div class="summary-line">
              <span>Subtotal:</span>
              <span>Rp ${Number(subtotal).toLocaleString("id-ID")}</span>
            </div>
            ${
              Number(discountAmount) > 0
                ? `<div class="summary-line">
                <span>Diskon:</span>
                <span>- Rp ${Number(discountAmount).toLocaleString(
                  "id-ID"
                )}</span>
              </div>`
                : ""
            }
            <div class="summary-line">
              <span>Pajak:</span>
              <span>Rp ${Number(taxAmount).toLocaleString("id-ID")}</span>
            </div>
            ${
              Number(serviceCharge) > 0
                ? `<div class="summary-line">
                <span>Biaya Layanan:</span>
                <span>Rp ${Number(serviceCharge).toLocaleString("id-ID")}</span>
              </div>`
                : ""
            }
            ${
              Number(deliveryFee) > 0
                ? `<div class="summary-line">
                <span>Biaya Pengiriman:</span>
                <span>Rp ${Number(deliveryFee).toLocaleString("id-ID")}</span>
              </div>`
                : ""
            }
            <div class="summary-line total">
              <span>TOTAL:</span>
              <span>Rp ${Number(totalAmount).toLocaleString("id-ID")}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="footer">
            <p>Terima kasih telah berbelanja!</p>
            <p>www.ravora.com</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          <h3 className="font-semibold text-lg">Struk Pembelian</h3>
        </div>
        <Button onClick={handleDownload} size="sm" variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>

      {/* Receipt Preview */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 font-mono text-sm">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">RAVORA POS</h2>
          <p className="text-xs mt-1">Terima kasih atas pesanan Anda</p>
        </div>

        <Separator className="my-4" />

        {/* Order Info */}
        <div className="space-y-1 text-xs mb-4">
          <div className="flex justify-between">
            <span>No. Pesanan:</span>
            <span className="font-bold">{orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Tanggal:</span>
            <span>{new Date(createdAt).toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span>Tipe:</span>
            <span>{orderType}</span>
          </div>
          {tableNumber && (
            <div className="flex justify-between">
              <span>Meja:</span>
              <span>{tableNumber}</span>
            </div>
          )}
          {customerName && (
            <div className="flex justify-between">
              <span>Nama:</span>
              <span>{customerName}</span>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Items */}
        <div className="space-y-2 mb-4">
          {items.map((item, index) => (
            <div key={index} className="text-xs">
              <div className="font-bold">{item.productName}</div>
              <div className="flex justify-between pl-2">
                <span>
                  {item.quantity} x Rp{" "}
                  {Number(item.unitPrice).toLocaleString("id-ID")}
                </span>
                <span>Rp {Number(item.totalAmount).toLocaleString("id-ID")}</span>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Summary */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>Rp {Number(subtotal).toLocaleString("id-ID")}</span>
          </div>
          {Number(discountAmount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Diskon:</span>
              <span>- Rp {Number(discountAmount).toLocaleString("id-ID")}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Pajak:</span>
            <span>Rp {Number(taxAmount).toLocaleString("id-ID")}</span>
          </div>
          {Number(serviceCharge) > 0 && (
            <div className="flex justify-between">
              <span>Biaya Layanan:</span>
              <span>Rp {Number(serviceCharge).toLocaleString("id-ID")}</span>
            </div>
          )}
          {Number(deliveryFee) > 0 && (
            <div className="flex justify-between">
              <span>Biaya Pengiriman:</span>
              <span>Rp {Number(deliveryFee).toLocaleString("id-ID")}</span>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between font-bold">
          <span>TOTAL:</span>
          <span>Rp {Number(totalAmount).toLocaleString("id-ID")}</span>
        </div>

        <Separator className="my-4" />

        {/* Footer */}
        <div className="text-center text-xs">
          <p>Terima kasih telah berbelanja!</p>
          <p className="mt-1">www.ravora.com</p>
        </div>
      </div>
    </Card>
  );
}
