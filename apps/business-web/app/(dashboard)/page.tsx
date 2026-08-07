import { ClipboardList, Banknote, Clock, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../src/components/PageHeader';
import { StatCard } from '../../src/components/StatCard';

const RECENT_ORDERS = [
  { id: 'CD-260807-K3F9', customer: 'Mwansa Phiri', total: 'K145', status: 'Preparing' },
  { id: 'CD-260807-A8Q2', customer: 'Grace Tembo', total: 'K78', status: 'Delivered' },
  { id: 'CD-260806-7XPL', customer: 'Joseph Mulenga', total: 'K210', status: 'Delivered' },
];

export default function OverviewPage() {
  return (
    <div>
      <PageHeader title="Overview" />
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Today's orders" value="12" />
        <StatCard icon={Banknote} label="Today's sales" value="K1,840" />
        <StatCard icon={Clock} label="Pending orders" value="3" />
        <StatCard icon={CheckCircle2} label="Completed orders" value="9" />
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-4 font-heading text-base font-semibold text-neutral-900">
          Recent orders
        </div>
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
            {RECENT_ORDERS.map((o) => (
              <tr key={o.id} className="border-t border-neutral-50">
                <td className="px-5 py-3 font-medium text-neutral-900">{o.id}</td>
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
