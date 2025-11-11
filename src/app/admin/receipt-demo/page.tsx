"use client";

import { useState } from "react";
import { Receipt, ReceiptModal, ReceiptButton } from "@/components/receipt";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReceiptDemoPage() {
  const [showModal, setShowModal] = useState(false);

  // Sample order data
  const sampleOrder = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    orderNumber: "ORD-2024-001",
    invoiceNumber: "INV-2024-001",
    createdAt: new Date(),
    customerName: "John Doe",
    customerPhone: "081234567890",
    tableNumber: "A-5",
    orderType: "DINE_IN",
    subtotal: 150000,
    discountAmount: 15000,
    taxAmount: 13500,
    serviceCharge: 7500,
    totalAmount: 156000,
    paymentMethod: "CASH",
    paidAmount: 200000,
    changeAmount: 44000,
    items: [
      {
        productName: "Nasi Goreng Spesial",
        quantity: 2,
        unitPrice: 35000,
        totalAmount: 70000,
      },
      {
        productName: "Es Teh Manis",
        quantity: 2,
        unitPrice: 5000,
        totalAmount: 10000,
      },
      {
        productName: "Ayam Goreng Crispy",
        quantity: 1,
        unitPrice: 45000,
        totalAmount: 45000,
      },
      {
        productName: "Soto Ayam",
        quantity: 1,
        unitPrice: 25000,
        totalAmount: 25000,
      },
    ],
    cashier: {
      name: "Jane Smith",
    },
  };

  const businessInfo = {
    name: "Warung Makan Sederhana",
    address: "Jl. Merdeka No. 45, Jakarta Pusat",
    phone: "021-5551234",
    email: "warung@example.com",
    website: "www.warungenak.com",
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Receipt Component Demo
          </h1>
          <p className="text-slate-600">
            Demo komponen receipt untuk thermal printer 58mm
          </p>
        </div>

        {/* Demo Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Receipt Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Receipt Preview</CardTitle>
              <CardDescription>
                Preview receipt dengan format thermal printer 58mm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-300 overflow-x-auto">
                <Receipt order={sampleOrder} businessInfo={businessInfo} />
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="space-y-6">
            {/* Usage Examples */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Examples</CardTitle>
                <CardDescription>
                  Berbagai cara menggunakan komponen receipt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Example 1: Receipt Button */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-slate-900 mb-2">
                    1. Receipt Button
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Button yang otomatis membuka modal receipt
                  </p>
                  <ReceiptButton
                    order={sampleOrder}
                    businessInfo={businessInfo}
                  />
                </div>

                {/* Example 2: Receipt Modal */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-slate-900 mb-2">
                    2. Receipt Modal
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Modal dengan kontrol manual
                  </p>
                  <Button onClick={() => setShowModal(true)} variant="outline">
                    Buka Receipt Modal
                  </Button>
                  <ReceiptModal
                    order={sampleOrder}
                    open={showModal}
                    onOpenChange={setShowModal}
                    businessInfo={businessInfo}
                  />
                </div>

                {/* Example 3: Auto Print */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-slate-900 mb-2">
                    3. Auto Print
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Receipt dengan auto-print setelah payment
                  </p>
                  <ReceiptButton
                    order={sampleOrder}
                    businessInfo={businessInfo}
                    autoPrint={true}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Format thermal printer 58mm</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>QR code untuk verifikasi order</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Business header customizable</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Order details lengkap</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Items list dengan harga</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Payment info lengkap</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Print, Download, Share functionality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Auto-print support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Order Data */}
            <Card>
              <CardHeader>
                <CardTitle>Sample Order Data</CardTitle>
                <CardDescription>
                  Data yang digunakan untuk demo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-xs">
                    {JSON.stringify(sampleOrder, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Code Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Code Examples</CardTitle>
            <CardDescription>
              Cara menggunakan komponen receipt di aplikasi Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Example 1 */}
            <div>
              <h3 className="font-semibold text-sm text-slate-900 mb-2">
                Basic Usage
              </h3>
              <div className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs">
{`import { ReceiptButton } from "@/components/receipt";

export function OrderDetail({ order }) {
  return (
    <div>
      <h1>Order Details</h1>
      <ReceiptButton order={order} />
    </div>
  );
}`}
                </pre>
              </div>
            </div>

            {/* Example 2 */}
            <div>
              <h3 className="font-semibold text-sm text-slate-900 mb-2">
                With Auto Print
              </h3>
              <div className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs">
{`import { ReceiptModal } from "@/components/receipt";

export function PaymentSuccess({ order }) {
  const [showReceipt, setShowReceipt] = useState(true);

  return (
    <ReceiptModal
      order={order}
      open={showReceipt}
      onOpenChange={setShowReceipt}
      autoPrint={true}
    />
  );
}`}
                </pre>
              </div>
            </div>

            {/* Example 3 */}
            <div>
              <h3 className="font-semibold text-sm text-slate-900 mb-2">
                Custom Business Info
              </h3>
              <div className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs">
{`import { ReceiptButton } from "@/components/receipt";

const businessInfo = {
  name: "Warung Makan Sederhana",
  address: "Jl. Merdeka No. 45",
  phone: "021-5551234",
  email: "warung@example.com"
};

<ReceiptButton
  order={order}
  businessInfo={businessInfo}
/>`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
