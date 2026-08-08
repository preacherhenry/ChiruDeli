'use client';

import { Banknote, TrendingUp, ShoppingBag, Percent } from 'lucide-react';
import { useManagerOrders, useManagerDashboard } from '@chirudeli/api-client';
import { PageHeader } from '../../../src/components/PageHeader';
import { StatCard } from '../../../src/components/StatCard';
import { formatK } from '../../../src/lib/money';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function SalesPage() {
  const orders = useManagerOrders();
  const dashboard = useManagerDashboard();

  const delivered = (orders.data ?? []).filter((o) => o.status === 'DELIVERED');
  const now = Date.now();
  const last7Days = delivered.filter((o) => now - new Date(o.placedAt).getTime() <= 7 * DAY_MS);
  const last30Days = delivered.filter((o) => now - new Date(o.placedAt).getTime() <= 30 * DAY_MS);
  const sum = (list: typeof delivered) => list.reduce((s, o) => s + o.subtotal, 0);

  const dailyTotals = Array.from({ length: 7 }).map((_, i) => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - (6 - i));
    const dayEnd = dayStart.getTime() + DAY_MS;
    const total = delivered
      .filter((o) => new Date(o.placedAt).getTime() >= dayStart.getTime() && new Date(o.placedAt).getTime() < dayEnd)
      .reduce((s, o) => s + o.subtotal, 0);
    return { label: dayStart.toLocaleDateString('en-GB', { weekday: 'short' }), total };
  });
  const maxDaily = Math.max(1, ...dailyTotals.map((d) => d.total));

  return (
    <div>
      <PageHeader title="Sales" />
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Banknote} label="This week" value={formatK(sum(last7Days))} />
        <StatCard icon={TrendingUp} label="This month" value={formatK(sum(last30Days))} />
        <StatCard icon={ShoppingBag} label="Delivered orders this week" value={String(last7Days.length)} />
        <StatCard icon={Percent} label="Store rating" value={dashboard.data ? dashboard.data.ratingAvg.toFixed(1) : '—'} />
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-heading text-base font-semibold text-neutral-900">Last 7 days</h2>
        <div className="flex items-end gap-3" style={{ height: 160 }}>
          {dailyTotals.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div className="w-full rounded-t-md bg-primary-500" style={{ height: `${Math.round((d.total / maxDaily) * 100)}%` }} />
              </div>
              <span className="text-xs text-neutral-400">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
