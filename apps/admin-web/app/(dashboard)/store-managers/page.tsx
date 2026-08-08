'use client';

import { useState } from 'react';
import {
  useAdminStoreManagers,
  useSuspendStoreManager,
  useReactivateStoreManager,
  useResetStoreManagerPassword,
  ApiError,
} from '@chirudeli/api-client';
import { PageHeader } from '../../../src/components/PageHeader';
import { Button } from '../../../src/components/Button';

export default function StoreManagersPage() {
  const managers = useAdminStoreManagers();
  const suspend = useSuspendStoreManager();
  const reactivate = useReactivateStoreManager();
  const resetPassword = useResetStoreManagerPassword();

  const [error, setError] = useState<string | null>(null);
  const [tempPasswordFor, setTempPasswordFor] = useState<{ id: string; password: string } | null>(null);

  return (
    <div>
      <PageHeader title="Store Managers" />
      {error ? <p className="mb-4 text-sm text-error">{error}</p> : null}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-400">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Stores managed</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(managers.data ?? []).map((m) => (
              <tr key={m.id} className="border-t border-neutral-50">
                <td className="px-5 py-3 font-medium text-neutral-900">{m.fullName}</td>
                <td className="px-5 py-3 text-neutral-500">{m.phone}</td>
                <td className="px-5 py-3 text-neutral-600">{m.stores.map((s) => s.name).join(', ') || '—'}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${
                      m.accountStatus === 'ACTIVE' ? 'bg-primary-50 text-primary-700' : 'bg-error/10 text-error'
                    }`}
                  >
                    {m.accountStatus}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-2">
                    {m.accountStatus === 'SUSPENDED' ? (
                      <Button
                        variant="ghost"
                        loading={reactivate.isPending}
                        onClick={() => reactivate.mutate({ id: m.id }, { onError: (err) => setError(err instanceof ApiError ? err.message : 'Failed.') })}
                      >
                        Reactivate
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        className="text-error"
                        loading={suspend.isPending}
                        onClick={() => suspend.mutate({ id: m.id }, { onError: (err) => setError(err instanceof ApiError ? err.message : 'Failed.') })}
                      >
                        Suspend
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      loading={resetPassword.isPending}
                      onClick={() =>
                        resetPassword.mutate(
                          { id: m.id },
                          {
                            onSuccess: (res) => setTempPasswordFor({ id: m.id, password: res.temporaryPassword }),
                            onError: (err) => setError(err instanceof ApiError ? err.message : 'Failed.'),
                          },
                        )
                      }
                    >
                      Reset password
                    </Button>
                  </div>
                  {tempPasswordFor?.id === m.id ? (
                    <p className="mt-2 rounded-lg bg-secondary-50 px-3 py-2 text-xs text-secondary-700">
                      New temporary password: <span className="font-mono font-semibold">{tempPasswordFor.password}</span>
                    </p>
                  ) : null}
                </td>
              </tr>
            ))}
            {(managers.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-neutral-400">
                  No store managers yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
