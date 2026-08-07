'use client';

import { useState } from 'react';
import { PageHeader } from '../../../src/components/PageHeader';
import { Button } from '../../../src/components/Button';

export default function ProfilePage() {
  const [storeOpen, setStoreOpen] = useState(true);

  return (
    <div>
      <PageHeader title="Business Profile" />

      <div className="mb-6 flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="font-heading text-sm font-semibold text-neutral-900">Store status</h2>
          <p className="text-sm text-neutral-500">
            {storeOpen ? 'Your store is open and accepting orders.' : 'Your store is paused — customers cannot order.'}
          </p>
        </div>
        <Button variant={storeOpen ? 'outline' : 'primary'} onClick={() => setStoreOpen((v) => !v)}>
          {storeOpen ? 'Pause store' : 'Reopen store'}
        </Button>
      </div>

      <div className="max-w-xl space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <Field label="Business name" defaultValue="Chirundu Grill House" />
        <Field label="Category" defaultValue="Food" />
        <Field label="Address" defaultValue="Chirundu Grill House, Chirundu, Zambia" />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Description</label>
          <textarea
            rows={3}
            defaultValue="Char-grilled Zambian favourites — nshima, chicken, bream, and cold drinks."
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
          />
        </div>
        <Field label="Opening hours" defaultValue="Mon-Thu 07:00-21:00, Fri-Sat 07:00-22:00, Sun 09:00-18:00" />
        <Button>Save changes</Button>
      </div>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</label>
      <input
        defaultValue={defaultValue}
        className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
      />
    </div>
  );
}
