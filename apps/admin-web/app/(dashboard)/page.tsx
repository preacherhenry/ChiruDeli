'use client';

import { Users, Store, Bike, ClipboardList, Banknote, ShieldAlert, Percent } from 'lucide-react';
import { useAdminStats } from '@chirudeli/api-client';
import { PageHeader } from '../../src/components/PageHeader';
import { StatCard } from '../../src/components/StatCard';
import { formatK } from '../../src/lib/money';

export default function OverviewPage() {
  const stats = useAdminStats();
  const s = stats.data;

  return (
    <div>
      <PageHeader title="Platform Overview" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Store} label="Total stores" value={String(s?.totalStores ?? '—')} />
        <StatCard icon={ShieldAlert} label="Pending applications" value={String(s?.pendingStoreApplications ?? '—')} />
        <StatCard icon={Store} label="Active stores" value={String(s?.activeStores ?? '—')} />
        <StatCard icon={ShieldAlert} label="Suspended stores" value={String(s?.suspendedStores ?? '—')} />
        <StatCard icon={Users} label="Total customers" value={String(s?.totalCustomers ?? '—')} />
        <StatCard icon={Bike} label="Total riders" value={String(s?.totalRiders ?? '—')} />
        <StatCard icon={ClipboardList} label="Orders today" value={String(s?.ordersToday ?? '—')} />
        <StatCard icon={Banknote} label="Revenue today" value={s ? formatK(s.revenueToday) : '—'} />
        <StatCard icon={Percent} label="Platform commission today" value={s ? formatK(s.platformCommissionToday) : '—'} />
      </div>
    </div>
  );
}
