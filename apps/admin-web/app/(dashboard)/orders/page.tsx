'use client';

import { useState } from 'react';
import { PageHeader } from '../../../src/components/PageHeader';

const FILTERS = ['All', 'Pending', 'Preparing', 'Assigned', 'In Transit', 'Delivered', 'Cancelled'];

const ORDERS = [
  { id: 'CD-260807-K3F9', business: 'Chirundu Grill House', customer: 'Mwansa Phiri', total: 'K145', status: 'Preparing' },
  { id: 'CD-260807-A8Q2', business: 'Riverside Pharmacy', customer: 'Grace Tembo', total: 'K78', status: 'Delivered' },
  { id: 'CD-260807-P0M4', business: 'Chirundu Grill House', customer: 'Kunda Banda', total: 'K120', status: 'Pending' },
  { id: 'CD-260806-7XPL', business: 'Zambezi Fresh Groceries', customer: 'Joseph Mulenga', total: 'K210', status: 'Delivered' },
];

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState('All');
  const visible = filter === 'All' ? ORDERS : ORDERS.filter((o) => o.status === filter);

  return (
    <div>
      <PageHeader title="Orders" />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-pill px-3 py-1.5 text-xs font-semibold ${
              filter === f ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-400">
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Business</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((o) => (
              <tr key={o.id} className="border-t border-neutral-50">
                <td className="px-5 py-3 font-medium text-primary-600">{o.id}</td>
                <td className="px-5 py-3 text-neutral-600">{o.business}</td>
                <td className="px-5 py-3 text-neutral-600">{o.customer}</td>
                <td className="px-5 py-3 text-neutral-900">{o.total}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${
                      o.status === 'Delivered' ? 'bg-primary-50 text-primary-700' : 'bg-secondary-50 text-secondary-700'
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
