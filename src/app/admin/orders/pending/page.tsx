import { Suspense } from 'react';
import { PendingCashOrders } from '@/components/admin/PendingCashOrders';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Pending Cash Orders',
  description: 'Manage pending cash payment orders',
};

export default function PendingOrdersPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/orders">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Pending Cash Orders
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Confirm cash payments from customers
            </p>
          </div>
        </div>

        {/* Main Content */}
        <Suspense
          fallback={
            <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="mt-4 text-sm text-slate-600">Loading orders...</p>
            </div>
          }
        >
          <PendingCashOrders />
        </Suspense>
      </div>
    </div>
  );
}
