import Link from 'next/link';
import { PageHeader } from '../../../src/components/PageHeader';

const RIDERS = [
  { name: 'Kunda Banda', vehicle: 'Motorcycle', status: 'Approved', rating: '4.8', deliveries: 214 },
  { name: 'Grace Tembo', vehicle: 'Bicycle', status: 'Approved', rating: '4.9', deliveries: 178 },
];

export default function RidersPage() {
  return (
    <div>
      <PageHeader
        title="Riders"
        action={
          <Link href="/riders/approval" className="text-sm font-semibold text-primary-600 hover:underline">
            View pending approvals
          </Link>
        }
      />
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-400">
              <th className="px-5 py-3 font-medium">Rider</th>
              <th className="px-5 py-3 font-medium">Vehicle</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Rating</th>
              <th className="px-5 py-3 font-medium">Deliveries</th>
            </tr>
          </thead>
          <tbody>
            {RIDERS.map((r) => (
              <tr key={r.name} className="border-t border-neutral-50">
                <td className="px-5 py-3 font-medium text-neutral-900">{r.name}</td>
                <td className="px-5 py-3 text-neutral-500">{r.vehicle}</td>
                <td className="px-5 py-3">
                  <span className="rounded-pill bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-neutral-900">{r.rating}</td>
                <td className="px-5 py-3 text-neutral-900">{r.deliveries}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
