'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAdminStoreClasses, useCreateStoreClass, useUpdateStoreClass, useDeleteStoreClass, ApiError } from '@chirudeli/api-client';
import { PageHeader } from '../../../src/components/PageHeader';
import { Button } from '../../../src/components/Button';
import { StoreClassForm } from '../../../src/components/StoreClassForm';

export default function StoreClassesPage() {
  const storeClasses = useAdminStoreClasses();
  const createClass = useCreateStoreClass();
  const updateClass = useUpdateStoreClass();
  const deleteClass = useDeleteStoreClass();

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDelete = (id: string) => {
    setError(null);
    deleteClass.mutate(id, { onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not delete this class.') });
  };

  return (
    <div>
      <PageHeader
        title="Store Classes"
        action={
          !creating ? (
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} /> Create Store Class
            </Button>
          ) : undefined
        }
      />

      {error ? <p className="mb-4 text-sm text-error">{error}</p> : null}

      {creating ? (
        <div className="mb-6">
          <StoreClassForm
            submitting={createClass.isPending}
            onCancel={() => setCreating(false)}
            onSubmit={(input) =>
              createClass.mutate(input, {
                onSuccess: () => setCreating(false),
                onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not create class.'),
              })
            }
          />
        </div>
      ) : null}

      <div className="space-y-3">
        {(storeClasses.data ?? []).map((c) =>
          editingId === c.id ? (
            <StoreClassForm
              key={c.id}
              initial={c}
              submitting={updateClass.isPending}
              onCancel={() => setEditingId(null)}
              onSubmit={(input) =>
                updateClass.mutate(
                  { id: c.id, input },
                  {
                    onSuccess: () => setEditingId(null),
                    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not save changes.'),
                  },
                )
              }
            />
          ) : (
            <div key={c.id} className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{c.icon}</span>
                  <h3 className="font-heading text-sm font-semibold text-neutral-900">{c.name}</h3>
                  {!c.isActive ? (
                    <span className="rounded-pill bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-500">Inactive</span>
                  ) : null}
                  {!c.isVisible ? (
                    <span className="rounded-pill bg-secondary-50 px-2 py-0.5 text-xs font-semibold text-secondary-700">Hidden</span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {c.storeCount} store{c.storeCount === 1 ? '' : 's'} · {c.requiredDocuments.length} required document
                  {c.requiredDocuments.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingId(c.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => onDelete(c.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-error/5 hover:text-error"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
