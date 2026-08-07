import Link from 'next/link';
import { PageHeader } from '../../../src/components/PageHeader';

const BUSINESSES = [
  { name: 'Chirundu Grill House', category: 'Food', status: 'Approved', orders: 214 },
  { name: 'Zambezi Fresh Groceries', category: 'Groceries', status: 'Approved', orders: 156 },
  { name: 'Riverside Pharmacy', category: 'Pharmacy', status: 'Approved', orders: 98 },
  { name: 'Chirundu Electronics Hub', category: 'Electronics', status: 'Approved', orders: 41 },
  { name: 'Border Stationers', category: 'Stationery', status: 'Approved', orders: 33 },
  { name: 'Zambezi Home & Household', category: 'Household', status: 'Approved', orders: 27 },
];

export default function BusinessesPage() {
  return (
    <div>
      <PageHeader
        title="Businesses"
        action={
          <Link href="/businesses/approval" className="text-sm font-semibold text-primary-600 hover:underline">
            View pending approvals
          </Link>
        }
      />
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-400">
              <th className="px-5 py-3 font-medium">Business</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Orders</th>
            </tr>
          </thead>
          <tbody>
            {BUSINESSES.map((b) => (
              <tr key={b.name} className="border-t border-neutral-50">
                <td className="px-5 py-3 font-medium text-neutral-900">{b.name}</td>
                <td className="px-5 py-3 text-neutral-500">{b.category}</td>
                <td className="px-5 py-3">
                  <span className="rounded-pill bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                    {b.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-neutral-900">{b.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
