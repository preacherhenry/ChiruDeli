'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdminMasterOrders } from '@chirudeli/api-client';
import type { OrderStatus } from '@chirudeli/shared-types';
import { PageHeader } from '../../../src/components/PageHeader';
import { formatK } from '../../../src/lib/money';

const FILTERS: Array<{ value: OrderStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING_CONFIRMATION', label: 'Pending' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'RIDER_ASSIGNED', label: 'Assigned' },
  { value: 'ON_THE_WAY', label: 'In Transit' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminOrdersPage() {
  const orders = useAdminMasterOrders();
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const visible = (orders.data ?? []).filter((o) => filter === 'ALL' || o.status === filter);

  return (
    <div>
      <PageHeader title="Orders" />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-pill px-3 py-1.5 text-xs font-semibold ${
              filter === f.value ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-400">
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Stores</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Placed</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((o) => (
              <tr key={o.id} className="border-t border-neutral-50">
                <td className="px-5 py-3">
                  <Link href={`/orders/${o.id}`} className="font-medium text-primary-600 hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-5 py-3 text-neutral-600">{o.businessNames.join(', ')}</td>
                <td className="px-5 py-3 text-neutral-900">{formatK(o.total)}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${
                      o.status === 'DELIVERED' ? 'bg-primary-50 text-primary-700' : o.status === 'CANCELLED' ? 'bg-error/10 text-error' : 'bg-secondary-50 text-secondary-700'
                    }`}
                  >
                    {o.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-5 py-3 text-neutral-400">{new Date(o.placedAt).toLocaleString()}</td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-neutral-400">
                  No orders here yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
