"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { CreditCard, Banknote, Smartphone, Wallet } from "lucide-react";

interface PaymentMethodData {
  paymentMethod: string;
  transactionCount: number;
  totalAmount: number;
  percentageOfTotal: number;
  averageTransactionValue: number;
}

interface PaymentMethodChartProps {
  data: PaymentMethodData[];
  loading?: boolean;
}

const COLORS: { [key: string]: string } = {
  CASH: "#10b981",
  BANK_TRANSFER: "#3b82f6",
  QRIS: "#8b5cf6",
  CREDIT_CARD: "#f59e0b",
  DEBIT_CARD: "#06b6d4",
  E_WALLET: "#ec4899",
  OTHER: "#64748b",
};

const ICONS: { [key: string]: React.ReactNode } = {
  CASH: <Banknote className="w-4 h-4" />,
  BANK_TRANSFER: <CreditCard className="w-4 h-4" />,
  QRIS: <Smartphone className="w-4 h-4" />,
  CREDIT_CARD: <CreditCard className="w-4 h-4" />,
  DEBIT_CARD: <CreditCard className="w-4 h-4" />,
  E_WALLET: <Wallet className="w-4 h-4" />,
  OTHER: <Wallet className="w-4 h-4" />,
};

const METHOD_LABELS: { [key: string]: string } = {
  CASH: "Tunai",
  BANK_TRANSFER: "Transfer Bank",
  QRIS: "QRIS",
  CREDIT_CARD: "Kartu Kredit",
  DEBIT_CARD: "Kartu Debit",
  E_WALLET: "E-Wallet",
  OTHER: "Lainnya",
};

export function PaymentMethodChart({ data, loading = false }: PaymentMethodChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Metode Pembayaran</CardTitle>
          <CardDescription>Distribusi transaksi berdasarkan metode pembayaran</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-slate-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Metode Pembayaran</CardTitle>
          <CardDescription>Distribusi transaksi berdasarkan metode pembayaran</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-slate-500">Tidak ada data metode pembayaran</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: METHOD_LABELS[item.paymentMethod] || item.paymentMethod,
    "Total Transaksi": item.totalAmount,
    "Jumlah": item.transactionCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metode Pembayaran</CardTitle>
        <CardDescription>
          Distribusi transaksi dari {data.length} metode pembayaran
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
            <XAxis
              type="number"
              className="text-sm"
              tick={{ fill: "#64748b" }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toString();
              }}
            />
            <YAxis
              type="category"
              dataKey="name"
              className="text-sm"
              tick={{ fill: "#64748b" }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "12px",
              }}
              formatter={(value: number, name: string) => {
                if (name === "Total Transaksi") {
                  return [formatCurrency(value), name];
                }
                return [value.toLocaleString("id-ID"), name];
              }}
            />
            <Bar dataKey="Total Transaksi" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[data[index].paymentMethod] || "#64748b"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Payment Method Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.map((method) => (
            <div
              key={method.paymentMethod}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: `${COLORS[method.paymentMethod]}15`,
                    color: COLORS[method.paymentMethod],
                  }}
                >
                  {ICONS[method.paymentMethod]}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {METHOD_LABELS[method.paymentMethod] || method.paymentMethod}
                  </div>
                  <div className="text-xs text-slate-500">
                    {method.transactionCount} transaksi
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">
                  {formatCurrency(method.totalAmount)}
                </div>
                <div className="text-xs text-slate-500">
                  {method.percentageOfTotal.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
