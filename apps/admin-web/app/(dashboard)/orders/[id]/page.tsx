'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useAdminMasterOrder } from '@chirudeli/api-client';
import { PageHeader } from '../../../../src/components/PageHeader';
import { formatK } from '../../../../src/lib/money';

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = useAdminMasterOrder(params.id);

  if (order.isLoading || !order.data) return <p className="text-sm text-neutral-400">Loading…</p>;
  const o = order.data;

  return (
    <div>
      <Link href="/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ChevronLeft size={16} /> Back to orders
      </Link>
      <PageHeader title={`Master Order ${o.orderNumber}`} />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryStat label="Stores" value={String(o.storeOrders.length)} />
        <SummaryStat label="Items" value={String(o.storeOrders.reduce((n, so) => n + so.items.reduce((s, i) => s + i.quantity, 0), 0))} />
        <SummaryStat label="Payment" value={`${o.paymentMethod.replace(/_/g, ' ')} · ${o.paymentStatus}`} />
        <SummaryStat label="Total" value={formatK(o.totals.total)} />
      </div>

      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-2 font-heading text-sm font-semibold text-neutral-900">Delivery</h2>
        <p className="text-sm text-neutral-600">
          Status: <span className="font-medium">{o.status.replace(/_/g, ' ')}</span>
        </p>
        {o.rider ? (
          <p className="mt-1 text-sm text-neutral-600">
            Rider: {o.rider.fullName} ({o.rider.vehicleType}) · {o.rider.phone}
          </p>
        ) : (
          <p className="mt-1 text-sm text-neutral-400">No rider assigned yet.</p>
        )}
        <p className="mt-1 text-xs text-neutral-400">
          {o.address.line1}, {o.address.area}
        </p>
      </div>

      <div className="space-y-4">
        {o.storeOrders.map((so) => (
          <div key={so.id} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-heading text-sm font-semibold text-neutral-900">
                Store Order {so.orderNumber} — {so.businessName}
              </h3>
              <span className="rounded-pill bg-secondary-50 px-2.5 py-1 text-xs font-semibold text-secondary-700">
                {so.status.replace(/_/g, ' ')}
              </span>
            </div>
            {so.items.map((item) => (
              <div key={item.id} className="flex justify-between border-t border-neutral-50 py-2 text-sm">
                <span className="text-neutral-700">
                  {item.nameSnapshot} × {item.quantity}
                </span>
                <span className="text-neutral-900">{formatK(item.lineTotal)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 text-sm font-semibold text-neutral-900">
              <span>Store subtotal</span>
              <span>{formatK(so.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="mt-1 font-heading text-base font-semibold text-neutral-900">{value}</div>
    </div>
  );
}
