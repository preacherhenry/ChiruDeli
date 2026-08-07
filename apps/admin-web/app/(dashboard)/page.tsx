import { Users, Store, Bike, ClipboardList, Banknote, ShieldAlert, Radio } from 'lucide-react';
import { PageHeader } from '../../src/components/PageHeader';
import { StatCard } from '../../src/components/StatCard';

const DAILY_ORDERS = [
  { day: 'Mon', count: 34 },
  { day: 'Tue', count: 28 },
  { day: 'Wed', count: 41 },
  { day: 'Thu', count: 37 },
  { day: 'Fri', count: 52 },
  { day: 'Sat', count: 61 },
  { day: 'Sun', count: 45 },
];

const CATEGORY_SHARE = [
  { label: 'Food', pct: 42 },
  { label: 'Groceries', pct: 27 },
  { label: 'Pharmacy', pct: 14 },
  { label: 'Electronics', pct: 9 },
  { label: 'Other', pct: 8 },
];

export default function OverviewPage() {
  return (
    <div>
      <PageHeader title="Overview" />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total customers" value="1,204" />
        <StatCard icon={Store} label="Total businesses" value="6" />
        <StatCard icon={Bike} label="Total riders" value="2" />
        <StatCard icon={ClipboardList} label="Orders today" value="47" />
        <StatCard icon={Banknote} label="Revenue today" value="K6,830" />
        <StatCard icon={ShieldAlert} label="Pending approvals" value="0" />
        <StatCard icon={Radio} label="Active deliveries" value="3" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-heading text-base font-semibold text-neutral-900">Daily orders</h2>
          <div className="flex items-end gap-3" style={{ height: 160 }}>
            {DAILY_ORDERS.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-md bg-primary-500" style={{ height: `${(d.count / 61) * 100}%` }} />
                </div>
                <span className="text-xs text-neutral-400">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-heading text-base font-semibold text-neutral-900">Popular categories</h2>
          <div className="space-y-3">
            {CATEGORY_SHARE.map((c) => (
              <div key={c.label}>
                <div className="mb-1 flex justify-between text-xs text-neutral-500">
                  <span>{c.label}</span>
                  <span>{c.pct}%</span>
                </div>
                <div className="h-2 w-full rounded-pill bg-neutral-100">
                  <div className="h-2 rounded-pill bg-secondary-500" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
