import { Metadata } from "next";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { formatIDR } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Dashboard | POS System",
  description: "Admin dashboard for POS system",
};

const stats = [
  {
    name: "Total Pendapatan",
    value: formatIDR(45231890),
    change: "+20.1%",
    trend: "up",
    icon: DollarSign,
  },
  {
    name: "Penjualan",
    value: "+2.350",
    change: "+180.1%",
    trend: "up",
    icon: ShoppingCart,
  },
  {
    name: "Pelanggan",
    value: "+12.234",
    change: "+19%",
    trend: "up",
    icon: Users,
  },
  {
    name: "Aktif Sekarang",
    value: "+573",
    change: "+201",
    trend: "up",
    icon: TrendingUp,
  },
];

const recentSales = [
  {
    customer: "Budi Santoso",
    email: "budi.santoso@email.com",
    amount: formatIDR(1999000),
  },
  {
    customer: "Siti Nurhaliza",
    email: "siti.nurhaliza@email.com",
    amount: formatIDR(350000),
  },
  {
    customer: "Ahmad Wijaya",
    email: "ahmad.wijaya@email.com",
    amount: formatIDR(299000),
  },
  {
    customer: "Dewi Lestari",
    email: "dewi@email.com",
    amount: formatIDR(99000),
  },
  {
    customer: "Rini Kusuma",
    email: "rini.kusuma@email.com",
    amount: formatIDR(450000),
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
        <p className="text-slate-500 mt-2">
          Selamat datang! Berikut adalah ringkasan toko Anda hari ini.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">{stat.name}</p>
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <div className="mt-1 flex items-center gap-1">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-xs text-slate-500">dari bulan lalu</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Sales */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900">Penjualan Terbaru</h3>
          <p className="text-sm text-slate-500 mt-1">
            Anda telah melakukan 265 penjualan bulan ini.
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div
                key={sale.email}
                className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <Users className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {sale.customer}
                    </p>
                    <p className="text-xs text-slate-500">{sale.email}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {sale.amount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
