'use client';

import { useEffect, useState } from 'react';
import { useMyStore, useUpdateStoreHours, ApiError } from '@chirudeli/api-client';
import type { OpeningHours } from '@chirudeli/shared-types';
import { PageHeader } from '../../../src/components/PageHeader';
import { Button } from '../../../src/components/Button';
import { OpeningHoursEditor, DEFAULT_OPENING_HOURS } from '../../../src/components/OpeningHoursEditor';

export default function HoursPage() {
  const myStore = useMyStore();
  const updateHours = useUpdateStoreHours();
  const [hours, setHours] = useState<OpeningHours>(DEFAULT_OPENING_HOURS);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (myStore.data) setHours(myStore.data.openingHours as OpeningHours);
  }, [myStore.data]);

  if (myStore.isLoading || !myStore.data) return <p className="text-sm text-neutral-400">Loading…</p>;

  const onSave = () => {
    setError(null);
    setSaved(false);
    updateHours.mutate(hours, { onSuccess: () => setSaved(true), onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not save.') });
  };

  return (
    <div>
      <PageHeader title="Opening Hours" />
      <div className="max-w-xl rounded-xl bg-white p-6 shadow-sm">
        <OpeningHoursEditor value={hours} onChange={setHours} />
        {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}
        {saved ? <p className="mt-4 text-sm text-primary-700">Saved.</p> : null}
        <Button className="mt-4" loading={updateHours.isPending} onClick={onSave}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
