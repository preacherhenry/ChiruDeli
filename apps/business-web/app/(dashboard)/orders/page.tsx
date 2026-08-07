'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '../../../src/components/PageHeader';

const STATUSES = ['All', 'New', 'Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Delivered', 'Cancelled'];

const ORDERS = [
  { id: 'CD-260807-K3F9', customer: 'Mwansa Phiri', items: 'Nshima & Chicken Combo x2', total: 'K145', status: 'Preparing' },
  { id: 'CD-260807-A8Q2', customer: 'Grace Tembo', items: 'Grilled Bream x1', total: 'K78', status: 'Delivered' },
  { id: 'CD-260807-P0M4', customer: 'Kunda Banda', items: 'Beef Stew Combo x1, Mosi Lager x2', total: 'K120', status: 'New' },
  { id: 'CD-260806-7XPL', customer: 'Joseph Mulenga', items: 'T-Bone & Chips x2', total: 'K210', status: 'Delivered' },
];

export default function OrdersPage() {
  const [filter, setFilter] = useState('All');
  const visible = filter === 'All' ? ORDERS : ORDERS.filter((o) => o.status === filter);

  return (
    <div>
      <PageHeader title="Orders" />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-pill px-3 py-1.5 text-xs font-semibold ${
              filter === s ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-400">
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((o) => (
              <tr key={o.id} className="border-t border-neutral-50">
                <td className="px-5 py-3">
                  <Link href={`/orders/${o.id}`} className="font-medium text-primary-600 hover:underline">
                    {o.id}
                  </Link>
                </td>
                <td className="px-5 py-3 text-neutral-600">{o.customer}</td>
                <td className="px-5 py-3 text-neutral-500">{o.items}</td>
                <td className="px-5 py-3 text-neutral-900">{o.total}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${
                      o.status === 'Delivered'
                        ? 'bg-primary-50 text-primary-700'
                        : o.status === 'New'
                          ? 'bg-info/10 text-info'
                          : 'bg-secondary-50 text-secondary-700'
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
