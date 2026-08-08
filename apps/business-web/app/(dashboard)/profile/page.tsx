'use client';

import { useEffect, useState } from 'react';
import { useMyStore, useUpdateStoreProfile, useSetStoreOpenStatus, ApiError } from '@chirudeli/api-client';
import { PageHeader } from '../../../src/components/PageHeader';
import { Button } from '../../../src/components/Button';

export default function ProfilePage() {
  const myStore = useMyStore();
  const updateProfile = useUpdateStoreProfile();
  const setOpenStatus = useSetStoreOpenStatus();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!myStore.data) return;
    setName(myStore.data.name);
    setPhone(myStore.data.phone ?? '');
    setAddress(myStore.data.address);
    setDescription(myStore.data.description);
  }, [myStore.data]);

  if (myStore.isLoading || !myStore.data) return <p className="text-sm text-neutral-400">Loading…</p>;
  const store = myStore.data;

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    updateProfile.mutate(
      { name, phone: phone || undefined, address, description },
      { onSuccess: () => setSaved(true), onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not save.') },
    );
  };

  return (
    <div>
      <PageHeader title="Store Profile" />

      <div className="mb-6 flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="font-heading text-sm font-semibold text-neutral-900">Store status</h2>
          <p className="text-sm text-neutral-500">
            {store.status === 'SUSPENDED'
              ? 'Suspended by ChiruDeli — contact support.'
              : store.storeState === 'OPEN'
                ? 'Your store is open and accepting orders.'
                : 'Your store is paused — customers cannot order.'}
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

      <form onSubmit={onSave} className="max-w-xl space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <Field label="Store name" value={name} onChange={setName} />
        <Field label="Store class" value={store.storeClass.name} onChange={() => {}} disabled />
        <Field label="Phone" value={phone} onChange={setPhone} />
        <Field label="Address" value={address} onChange={setAddress} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
          />
        </div>
        {error ? <p className="text-sm text-error">{error}</p> : null}
        {saved ? <p className="text-sm text-primary-700">Saved.</p> : null}
        <Button type="submit" loading={updateProfile.isPending}>
          Save changes
        </Button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</label>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500 disabled:bg-neutral-50 disabled:text-neutral-400"
      />
    </div>
  );
}
