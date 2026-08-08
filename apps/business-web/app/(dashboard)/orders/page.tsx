'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useManagerOrders } from '@chirudeli/api-client';
import type { OrderStatus } from '@chirudeli/shared-types';
import { PageHeader } from '../../../src/components/PageHeader';
import { formatK } from '../../../src/lib/money';

const STATUSES: Array<{ value: OrderStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING_CONFIRMATION', label: 'New' },
  { value: 'CONFIRMED', label: 'Accepted' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { value: 'RIDER_ASSIGNED', label: 'Rider Assigned' },
  { value: 'ON_THE_WAY', label: 'On the Way' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: 'New',
  CONFIRMED: 'Accepted',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  RIDER_ASSIGNED: 'Rider Assigned',
  PICKED_UP: 'Picked Up',
  ON_THE_WAY: 'On the Way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function OrdersPage() {
  const orders = useManagerOrders();
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');

  const visible = (orders.data ?? []).filter((o) => filter === 'ALL' || o.status === filter);

  return (
    <div>
      <PageHeader title="Orders" />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`rounded-pill px-3 py-1.5 text-xs font-semibold ${
              filter === s.value ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-400">
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
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
                <td className="px-5 py-3 text-neutral-600">{o.customerName}</td>
                <td className="px-5 py-3 text-neutral-900">{formatK(o.subtotal)}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${
                      o.status === 'DELIVERED'
                        ? 'bg-primary-50 text-primary-700'
                        : o.status === 'CANCELLED'
                          ? 'bg-error/10 text-error'
                          : o.status === 'PENDING_CONFIRMATION'
                            ? 'bg-info/10 text-info'
                            : 'bg-secondary-50 text-secondary-700'
                    }`}
                  >
                    {STATUS_LABEL[o.status]}
                  </span>
                </td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-neutral-400">
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
