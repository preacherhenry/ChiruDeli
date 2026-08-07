import { Banknote, TrendingUp, ShoppingBag, Percent } from 'lucide-react';
import { PageHeader } from '../../../src/components/PageHeader';
import { StatCard } from '../../../src/components/StatCard';

const DAILY = [
  { date: 'Mon', sales: 'K1,240' },
  { date: 'Tue', sales: 'K980' },
  { date: 'Wed', sales: 'K1,510' },
  { date: 'Thu', sales: 'K1,340' },
  { date: 'Fri', sales: 'K1,890' },
  { date: 'Sat', sales: 'K2,210' },
  { date: 'Sun', sales: 'K1,660' },
];

export default function SalesPage() {
  return (
    <div>
      <PageHeader title="Sales" />
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Banknote} label="This week" value="K10,830" />
        <StatCard icon={TrendingUp} label="This month" value="K42,150" />
        <StatCard icon={ShoppingBag} label="Orders this week" value="146" />
        <StatCard icon={Percent} label="Platform commission" value="10%" />
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-heading text-base font-semibold text-neutral-900">This week</h2>
        <div className="flex items-end gap-3" style={{ height: 160 }}>
          {DAILY.map((d) => {
            const value = Number(d.sales.replace(/[K,]/g, ''));
            const heightPct = Math.round((value / 2210) * 100);
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-md bg-primary-500" style={{ height: `${heightPct}%` }} />
                </div>
                <span className="text-xs text-neutral-400">{d.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
