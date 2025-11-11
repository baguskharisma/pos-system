"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { format } from "date-fns";

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

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
  items: OrderItem[];
  cashier?: {
    name: string;
  };
}

interface ReceiptProps {
  order: Order;
  businessInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
}

export function Receipt({ order, businessInfo }: ReceiptProps) {
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrCodeRef.current && order.orderNumber) {
      // Generate QR code with order verification URL
      const verificationUrl = `${window.location.origin}/verify/${order.orderNumber}`;
      QRCode.toCanvas(qrCodeRef.current, verificationUrl, {
        width: 120,
        margin: 1,
        errorCorrectionLevel: "M",
      });
    }
  }, [order.orderNumber]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const defaultBusinessInfo = {
    name: businessInfo?.name || "POS System",
    address: businessInfo?.address || "Jl. Contoh No. 123",
    phone: businessInfo?.phone || "021-12345678",
    email: businessInfo?.email || "info@possystem.com",
    website: businessInfo?.website || "www.possystem.com",
  };

  const orderDate = new Date(order.createdAt);

  return (
    <div className="receipt-container" id="receipt-print">
      {/* Business Header */}
      <div className="receipt-header">
        <h1 className="business-name">{defaultBusinessInfo.name}</h1>
        <p className="business-info">{defaultBusinessInfo.address}</p>
        <p className="business-info">Tel: {defaultBusinessInfo.phone}</p>
        {defaultBusinessInfo.email && (
          <p className="business-info">{defaultBusinessInfo.email}</p>
        )}
        {defaultBusinessInfo.website && (
          <p className="business-info">{defaultBusinessInfo.website}</p>
        )}
      </div>

      <div className="receipt-divider">================================</div>

      {/* Order Info */}
      <div className="receipt-section">
        <div className="receipt-row">
          <span>No. Order:</span>
          <span className="bold">{order.orderNumber}</span>
        </div>
        {order.invoiceNumber && (
          <div className="receipt-row">
            <span>No. Invoice:</span>
            <span className="bold">{order.invoiceNumber}</span>
          </div>
        )}
        <div className="receipt-row">
          <span>Tanggal:</span>
          <span>{format(orderDate, "dd/MM/yyyy HH:mm")}</span>
        </div>
        <div className="receipt-row">
          <span>Kasir:</span>
          <span>{order.cashier?.name || "-"}</span>
        </div>
        <div className="receipt-row">
          <span>Tipe:</span>
          <span>{order.orderType}</span>
        </div>
        {order.tableNumber && (
          <div className="receipt-row">
            <span>Meja:</span>
            <span>{order.tableNumber}</span>
          </div>
        )}
        {order.customerName && (
          <div className="receipt-row">
            <span>Customer:</span>
            <span>{order.customerName}</span>
          </div>
        )}
        {order.customerPhone && (
          <div className="receipt-row">
            <span>No. HP:</span>
            <span>{order.customerPhone}</span>
          </div>
        )}
      </div>

      <div className="receipt-divider">================================</div>

      {/* Items List */}
      <div className="receipt-section">
        <div className="items-header">
          <span>Item</span>
          <span>Harga</span>
        </div>
        {order.items.map((item, index) => (
          <div key={index} className="item-group">
            <div className="item-name">{item.productName}</div>
            <div className="item-details">
              <span>
                {item.quantity} x {formatCurrency(item.unitPrice)}
              </span>
              <span className="item-total">{formatCurrency(item.totalAmount)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="receipt-divider">================================</div>

      {/* Totals */}
      <div className="receipt-section">
        <div className="receipt-row">
          <span>Subtotal:</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="receipt-row">
            <span>Diskon:</span>
            <span className="discount">-{formatCurrency(order.discountAmount)}</span>
          </div>
        )}
        {order.taxAmount > 0 && (
          <div className="receipt-row">
            <span>Pajak:</span>
            <span>{formatCurrency(order.taxAmount)}</span>
          </div>
        )}
        {order.serviceCharge > 0 && (
          <div className="receipt-row">
            <span>Service:</span>
            <span>{formatCurrency(order.serviceCharge)}</span>
          </div>
        )}
        <div className="receipt-divider">--------------------------------</div>
        <div className="receipt-row total-row">
          <span className="bold">TOTAL:</span>
          <span className="bold">{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>

      <div className="receipt-divider">================================</div>

      {/* Payment Info */}
      <div className="receipt-section">
        {order.paymentMethod && (
          <div className="receipt-row">
            <span>Metode:</span>
            <span className="bold">{order.paymentMethod}</span>
          </div>
        )}
        {order.paidAmount !== undefined && (
          <>
            <div className="receipt-row">
              <span>Bayar:</span>
              <span>{formatCurrency(order.paidAmount)}</span>
            </div>
            {order.changeAmount !== undefined && order.changeAmount > 0 && (
              <div className="receipt-row">
                <span>Kembalian:</span>
                <span className="bold">{formatCurrency(order.changeAmount)}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="receipt-divider">================================</div>

      {/* QR Code */}
      <div className="receipt-qr">
        <canvas ref={qrCodeRef} />
        <p className="qr-text">Scan untuk verifikasi</p>
      </div>

      <div className="receipt-divider">================================</div>

      {/* Footer */}
      <div className="receipt-footer">
        <p className="footer-text center bold">TERIMA KASIH</p>
        <p className="footer-text center">Sudah berbelanja di toko kami</p>
        <p className="footer-text center">Barang yang sudah dibeli</p>
        <p className="footer-text center">tidak dapat ditukar/dikembalikan</p>
        <p className="footer-text center small">kecuali ada kesalahan dari kami</p>
      </div>

      <style jsx>{`
        .receipt-container {
          width: 58mm;
          max-width: 220px;
          margin: 0 auto;
          padding: 10px;
          font-family: "Courier New", Courier, monospace;
          font-size: 11px;
          line-height: 1.4;
          color: #000;
          background: #fff;
        }

        .receipt-header {
          text-align: center;
          margin-bottom: 10px;
        }

        .business-name {
          font-size: 16px;
          font-weight: bold;
          margin: 0 0 5px 0;
          text-transform: uppercase;
        }

        .business-info {
          margin: 2px 0;
          font-size: 10px;
        }

        .receipt-divider {
          margin: 8px 0;
          font-size: 10px;
          overflow: hidden;
        }

        .receipt-section {
          margin: 8px 0;
        }

        .receipt-row {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
          gap: 5px;
        }

        .receipt-row span:first-child {
          flex-shrink: 0;
        }

        .receipt-row span:last-child {
          text-align: right;
        }

        .bold {
          font-weight: bold;
        }

        .discount {
          color: #000;
        }

        .items-header {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          margin-bottom: 8px;
          padding-bottom: 3px;
          border-bottom: 1px dashed #000;
        }

        .item-group {
          margin: 8px 0;
        }

        .item-name {
          font-weight: bold;
          margin-bottom: 2px;
        }

        .item-details {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
        }

        .item-total {
          font-weight: bold;
        }

        .total-row {
          font-size: 13px;
          margin-top: 5px;
        }

        .receipt-qr {
          text-align: center;
          margin: 10px 0;
        }

        .receipt-qr canvas {
          margin: 0 auto;
          display: block;
        }

        .qr-text {
          margin-top: 5px;
          font-size: 9px;
        }

        .receipt-footer {
          margin-top: 10px;
        }

        .footer-text {
          margin: 3px 0;
          font-size: 10px;
        }

        .footer-text.center {
          text-align: center;
        }

        .footer-text.small {
          font-size: 9px;
        }

        /* Print styles */
        @media print {
          .receipt-container {
            width: 58mm;
            max-width: none;
            padding: 0;
            margin: 0;
          }

          @page {
            size: 58mm auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
