import { Banknote, Percent, TrendingUp, Users } from 'lucide-react';
import { PageHeader } from '../../../src/components/PageHeader';
import { StatCard } from '../../../src/components/StatCard';

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" />
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Banknote} label="Gross revenue (30d)" value="K182,400" />
        <StatCard icon={Percent} label="Platform commission (30d)" value="K18,240" />
        <StatCard icon={TrendingUp} label="Order growth (MoM)" value="+12%" />
        <StatCard icon={Users} label="New customers (30d)" value="86" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-heading text-base font-semibold text-neutral-900">Top businesses</h2>
          <ol className="space-y-2 text-sm">
            {['Chirundu Grill House', 'Zambezi Fresh Groceries', 'Riverside Pharmacy'].map((b, i) => (
              <li key={b} className="flex justify-between border-b border-neutral-50 pb-2 last:border-0">
                <span className="text-neutral-800">
                  {i + 1}. {b}
                </span>
                <span className="font-medium text-neutral-900">K{(3 - i) * 4210}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-heading text-base font-semibold text-neutral-900">Top riders</h2>
          <ol className="space-y-2 text-sm">
            {['Kunda Banda', 'Grace Tembo'].map((r, i) => (
              <li key={r} className="flex justify-between border-b border-neutral-50 pb-2 last:border-0">
                <span className="text-neutral-800">
                  {i + 1}. {r}
                </span>
                <span className="font-medium text-neutral-900">{214 - i * 36} deliveries</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
