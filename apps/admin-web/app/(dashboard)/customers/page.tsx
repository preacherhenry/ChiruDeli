'use client';

import { PageHeader } from '../../../src/components/PageHeader';
import { Button } from '../../../src/components/Button';

const CUSTOMERS = [
  { name: 'Mwansa Phiri', phone: '+260976543210', orders: 12, status: 'Active' },
  { name: 'Chanda Musonda', phone: '+260977112233', orders: 4, status: 'Active' },
  { name: 'Beauty Nyirenda', phone: '+260978445566', orders: 1, status: 'Active' },
];

export default function CustomersPage() {
  return (
    <div>
      <PageHeader title="Customers" />
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-400">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Orders</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {CUSTOMERS.map((c) => (
              <tr key={c.phone} className="border-t border-neutral-50">
                <td className="px-5 py-3 font-medium text-neutral-900">{c.name}</td>
                <td className="px-5 py-3 text-neutral-500">{c.phone}</td>
                <td className="px-5 py-3 text-neutral-900">{c.orders}</td>
                <td className="px-5 py-3">
                  <span className="rounded-pill bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Button variant="outline" className="h-8 px-3 text-xs">
                    Suspend
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
