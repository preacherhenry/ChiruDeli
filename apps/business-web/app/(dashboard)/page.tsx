'use client';

import { ClipboardList, Banknote, Clock, Package, Star } from 'lucide-react';
import { useMyStore, useManagerDashboard, useActivateStore, useSetStoreOpenStatus } from '@chirudeli/api-client';
import { PageHeader } from '../../src/components/PageHeader';
import { StatCard } from '../../src/components/StatCard';
import { Button } from '../../src/components/Button';
import { OnboardingChecklist } from '../../src/components/OnboardingChecklist';
import { useSessionStore } from '../../src/state/sessionStore';
import { formatK } from '../../src/lib/money';

export default function OverviewPage() {
  const user = useSessionStore((s) => s.user);
  const myStore = useMyStore();
  const dashboard = useManagerDashboard();
  const activateStore = useActivateStore();
  const setOpenStatus = useSetStoreOpenStatus();

  if (myStore.isLoading || !myStore.data) {
    return <p className="text-sm text-neutral-400">Loading…</p>;
  }

  const store = myStore.data;

  return (
    <div>
      <PageHeader title={`Good ${timeOfDay()}, ${user?.fullName ?? 'there'}`} />

      <div className="mb-6 flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="font-heading text-base font-semibold text-neutral-900">{store.name}</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            {store.effectiveIsOpen ? '🟢 OPEN — Accepting orders' : '🔴 CLOSED — Not accepting orders'}
            {store.status === 'SUSPENDED' ? ' (suspended by ChiruDeli)' : ''}
          </p>
        </div>
        {store.isActivated && store.status !== 'SUSPENDED' && store.status !== 'DEACTIVATED' ? (
          <Button
            variant={store.storeState === 'OPEN' ? 'outline' : 'primary'}
            loading={setOpenStatus.isPending}
            onClick={() => setOpenStatus.mutate(store.storeState === 'OPEN' ? 'PAUSED' : 'OPEN')}
          >
            {store.storeState === 'OPEN' ? 'Pause store' : 'Reopen store'}
          </Button>
        ) : null}
      </div>

      {!store.isActivated ? (
        <div className="mb-6">
          {store.status === 'APPROVED' ? (
            <OnboardingChecklist
              checklist={store.onboarding}
              onActivate={() => activateStore.mutate()}
              activating={activateStore.isPending}
            />
          ) : store.status === 'REJECTED' ? (
            <div className="rounded-xl bg-error/5 p-5 text-sm text-error">
              Your store registration could not be approved.
              {store.rejectionReason ? <p className="mt-1">{store.rejectionReason}</p> : null}
            </div>
          ) : store.status === 'RESUBMISSION' ? (
            <div className="rounded-xl bg-secondary-50 p-5 text-sm text-secondary-700">
              Your store registration requires additional information.
              {store.rejectionReason ? <p className="mt-1">{store.rejectionReason}</p> : null}
            </div>
          ) : (
            <div className="rounded-xl bg-info/5 p-5 text-sm text-info">
              Your store registration has been submitted successfully. Your application is currently being reviewed by
              the ChiruDeli administration team.
            </div>
          )}
        </div>
      ) : null}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={ClipboardList} label="Today's orders" value={String(dashboard.data?.todayOrders ?? 0)} />
        <StatCard icon={Banknote} label="Today's sales" value={formatK(dashboard.data?.todaySales ?? 0)} />
        <StatCard icon={Clock} label="Pending orders" value={String(dashboard.data?.pendingOrders ?? 0)} />
        <StatCard icon={Package} label="Products" value={String(dashboard.data?.productCount ?? 0)} />
        <StatCard icon={Star} label="Store rating" value={dashboard.data ? dashboard.data.ratingAvg.toFixed(1) : '—'} />
      </div>
    </div>
  );
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
