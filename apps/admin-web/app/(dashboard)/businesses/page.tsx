'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdminStores, useStoreClasses } from '@chirudeli/api-client';
import { PageHeader } from '../../../src/components/PageHeader';
import { StatusPill } from '../../../src/components/StatusPill';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'PENDING_APPROVAL', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'DEACTIVATED', label: 'Deactivated' },
];

export default function BusinessesPage() {
  const [status, setStatus] = useState('');
  const [storeClassId, setStoreClassId] = useState('');
  const [search, setSearch] = useState('');
  const storeClasses = useStoreClasses();
  const stores = useAdminStores({ status: status || undefined, storeClassId: storeClassId || undefined, search: search || undefined });

  return (
    <div>
      <PageHeader
        title="Stores"
        action={
          <Link href="/businesses/approval" className="text-sm font-semibold text-primary-600 hover:underline">
            View pending approvals
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`rounded-pill px-3 py-1.5 text-xs font-semibold ${
              status === f.value ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {f.label}
          </button>
        ))}
        <select
          value={storeClassId}
          onChange={(e) => setStoreClassId(e.target.value)}
          className="h-9 rounded-pill border border-neutral-200 px-3 text-xs text-neutral-600 outline-none"
        >
          <option value="">All classes</option>
          {(storeClasses.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stores…"
          className="h-9 rounded-pill border border-neutral-200 px-3 text-xs text-neutral-600 outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-400">
              <th className="px-5 py-3 font-medium">Store</th>
              <th className="px-5 py-3 font-medium">Class</th>
              <th className="px-5 py-3 font-medium">Manager</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Registered</th>
            </tr>
          </thead>
          <tbody>
            {(stores.data ?? []).map((b) => (
              <tr key={b.id} className="border-t border-neutral-50">
                <td className="px-5 py-3">
                  <Link href={`/businesses/${b.id}`} className="font-medium text-primary-600 hover:underline">
                    {b.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-neutral-500">{b.storeClass.name}</td>
                <td className="px-5 py-3 text-neutral-600">{b.managerName ?? '—'}</td>
                <td className="px-5 py-3">
                  <StatusPill status={b.status} isActivated={b.isActivated} />
                </td>
                <td className="px-5 py-3 text-neutral-400">{new Date(b.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {(stores.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-neutral-400">
                  No stores match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
