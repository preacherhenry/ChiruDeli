'use client';

import { PageHeader } from '../../../src/components/PageHeader';
import { Button } from '../../../src/components/Button';

export default function DeliveryFeesPage() {
  return (
    <div>
      <PageHeader title="Delivery Fees" />
      <div className="max-w-md space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-500">
          Used for zones without a fixed fee: <code className="rounded bg-neutral-100 px-1.5 py-0.5">delivery fee = base fee + distance × per-km rate</code>
        </p>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Base fee (K)</label>
          <input
            defaultValue="15"
            type="number"
            className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Per-km rate (K)</label>
          <input
            defaultValue="5"
            type="number"
            className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
          />
        </div>
        <Button>Save changes</Button>
      </div>
    </div>
  );
}
