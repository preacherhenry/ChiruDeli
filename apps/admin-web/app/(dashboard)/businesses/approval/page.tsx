'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminStores } from '@chirudeli/api-client';
import { PageHeader } from '../../../../src/components/PageHeader';
import { StatusPill } from '../../../../src/components/StatusPill';

export default function BusinessApprovalPage() {
  const pendingA = useAdminStores({ status: 'PENDING_APPROVAL' });
  const pendingB = useAdminStores({ status: 'UNDER_REVIEW' });
  const pendingC = useAdminStores({ status: 'RESUBMISSION' });
  const pending = [...(pendingA.data ?? []), ...(pendingB.data ?? []), ...(pendingC.data ?? [])];

  return (
    <div>
      <Link href="/businesses" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ChevronLeft size={16} /> Back to stores
      </Link>
      <PageHeader title="Store Approvals" />

      {pending.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">
          No stores awaiting approval right now.
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((b) => (
            <Link
              key={b.id}
              href={`/businesses/${b.id}`}
              className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm hover:shadow-md"
            >
              <div>
                <h3 className="font-heading text-sm font-semibold text-neutral-900">{b.name}</h3>
                <p className="text-xs text-neutral-500">
                  {b.storeClass.name} · {b.managerName ?? 'Unknown manager'} · {b.phone ?? 'No phone'} · submitted{' '}
                  {new Date(b.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-neutral-400">{b.address}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={b.status} />
                <ChevronRight size={16} className="text-neutral-300" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
