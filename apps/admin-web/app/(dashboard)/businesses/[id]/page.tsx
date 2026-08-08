'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Check, X, FileText } from 'lucide-react';
import {
  useAdminStore,
  useApproveStore,
  useRejectStore,
  useRequestStoreChanges,
  useSuspendStore,
  useReactivateStore,
  useDeactivateStore,
  useReviewStoreDocument,
} from '@chirudeli/api-client';
import { PageHeader } from '../../../../src/components/PageHeader';
import { Button } from '../../../../src/components/Button';
import { StatusPill } from '../../../../src/components/StatusPill';

type PendingAction = 'reject' | 'requestChanges' | 'suspend' | null;

export default function StoreDetailPage({ params }: { params: { id: string } }) {
  const store = useAdminStore(params.id);
  const approve = useApproveStore();
  const reject = useRejectStore();
  const requestChanges = useRequestStoreChanges();
  const suspend = useSuspendStore();
  const reactivate = useReactivateStore();
  const deactivate = useDeactivateStore();
  const reviewDocument = useReviewStoreDocument();

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [reasonText, setReasonText] = useState('');
  const [docNoteById, setDocNoteById] = useState<Record<string, string>>({});

  if (store.isLoading || !store.data) return <p className="text-sm text-neutral-400">Loading…</p>;
  const b = store.data;

  const isReviewable = ['PENDING_APPROVAL', 'UNDER_REVIEW', 'RESUBMISSION'].includes(b.status);
  const isApproved = b.status === 'APPROVED';
  const isSuspended = b.status === 'SUSPENDED';

  const runAction = (action: 'reject' | 'requestChanges' | 'suspend') => {
    if (action === 'reject') reject.mutate({ id: b.id, input: { reason: reasonText } });
    if (action === 'requestChanges') requestChanges.mutate({ id: b.id, input: { message: reasonText } });
    if (action === 'suspend') suspend.mutate({ id: b.id, input: { reason: reasonText } });
    setPendingAction(null);
    setReasonText('');
  };

  return (
    <div>
      <Link href="/businesses" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ChevronLeft size={16} /> Back to stores
      </Link>
      <PageHeader title={b.name} action={<StatusPill status={b.status} isActivated={b.isActivated} />} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-heading text-sm font-semibold text-neutral-900">Store information</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Store class" value={`${b.storeClass.icon ?? ''} ${b.storeClass.name}`} />
              <Info label="Address" value={b.address} />
              <Info label="Phone" value={b.phone ?? '—'} />
              <Info label="Email" value={b.email ?? '—'} />
              <Info label="Registration number" value={b.registrationNumber ?? '—'} />
              <Info label="Tax ID" value={b.taxId ?? '—'} />
            </dl>
            {b.description ? <p className="mt-3 text-sm text-neutral-600">{b.description}</p> : null}
            {b.rejectionReason ? (
              <p className="mt-3 rounded-lg bg-error/5 p-3 text-sm text-error">{b.rejectionReason}</p>
            ) : null}
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-heading text-sm font-semibold text-neutral-900">Documents</h2>
            {b.documents.length === 0 ? (
              <p className="text-sm text-neutral-400">No documents uploaded.</p>
            ) : (
              <div className="space-y-3">
                {b.documents.map((doc) => (
                  <div key={doc.id} className="rounded-lg border border-neutral-100 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-neutral-400" />
                        <span className="text-sm font-medium text-neutral-800">{doc.label}</span>
                      </div>
                      <span
                        className={`rounded-pill px-2 py-0.5 text-xs font-semibold ${
                          doc.status === 'APPROVED'
                            ? 'bg-primary-50 text-primary-700'
                            : doc.status === 'REJECTED'
                              ? 'bg-error/10 text-error'
                              : 'bg-secondary-50 text-secondary-700'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                    <a href={doc.fileData} download={doc.label} className="mt-1 inline-block text-xs text-primary-600 hover:underline">
                      View / download
                    </a>
                    {doc.status === 'PENDING' ? (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          value={docNoteById[doc.id] ?? ''}
                          onChange={(e) => setDocNoteById((s) => ({ ...s, [doc.id]: e.target.value }))}
                          placeholder="Note (optional for approve, helpful for reject)"
                          className="h-8 flex-1 rounded-lg border border-neutral-200 px-2 text-xs outline-none focus:border-primary-500"
                        />
                        <button
                          onClick={() =>
                            reviewDocument.mutate({ storeId: b.id, docId: doc.id, input: { status: 'APPROVED', reviewNote: docNoteById[doc.id] } })
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() =>
                            reviewDocument.mutate({ storeId: b.id, docId: doc.id, input: { status: 'REJECTED', reviewNote: docNoteById[doc.id] } })
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-error/10 text-error hover:bg-error/20"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : doc.reviewNote ? (
                      <p className="mt-1 text-xs text-neutral-400">{doc.reviewNote}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-heading text-sm font-semibold text-neutral-900">Store Manager</h2>
            {b.managers.map((m) => (
              <div key={m.id} className="mb-2 last:mb-0">
                <p className="text-sm font-medium text-neutral-800">{m.fullName}</p>
                <p className="text-xs text-neutral-500">{m.phone}</p>
                {m.email ? <p className="text-xs text-neutral-500">{m.email}</p> : null}
                <span
                  className={`mt-1 inline-block rounded-pill px-2 py-0.5 text-xs font-semibold ${
                    m.accountStatus === 'ACTIVE' ? 'bg-primary-50 text-primary-700' : 'bg-error/10 text-error'
                  }`}
                >
                  {m.accountStatus}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-heading text-sm font-semibold text-neutral-900">Stats</h2>
            <dl className="space-y-2 text-sm">
              <Info label="Products" value={String(b.productCount)} />
              <Info label="Orders" value={String(b.orderCount)} />
              <Info label="Rating" value={`${b.ratingAvg.toFixed(1)} (${b.ratingCount})`} />
            </dl>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-heading text-sm font-semibold text-neutral-900">Actions</h2>

            {pendingAction ? (
              <div className="space-y-2">
                <textarea
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  rows={3}
                  placeholder={
                    pendingAction === 'reject'
                      ? 'Reason for rejection'
                      : pendingAction === 'requestChanges'
                        ? "What needs to be corrected?"
                        : 'Reason for suspension'
                  }
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => runAction(pendingAction)} disabled={reasonText.trim().length < 2}>
                    Confirm
                  </Button>
                  <Button variant="ghost" onClick={() => setPendingAction(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {isReviewable ? (
                  <>
                    <Button loading={approve.isPending} onClick={() => approve.mutate({ id: b.id })}>
                      Approve store
                    </Button>
                    <Button variant="outline" onClick={() => setPendingAction('requestChanges')}>
                      Request changes
                    </Button>
                    <Button variant="ghost" className="text-error" onClick={() => setPendingAction('reject')}>
                      Reject store
                    </Button>
                  </>
                ) : null}
                {isApproved ? (
                  <Button variant="outline" className="text-error" onClick={() => setPendingAction('suspend')}>
                    Suspend store
                  </Button>
                ) : null}
                {isSuspended ? (
                  <Button loading={reactivate.isPending} onClick={() => reactivate.mutate({ id: b.id })}>
                    Reactivate store
                  </Button>
                ) : null}
                {isApproved || isSuspended ? (
                  <Button variant="ghost" className="text-error" loading={deactivate.isPending} onClick={() => deactivate.mutate({ id: b.id })}>
                    Deactivate store
                  </Button>
                ) : null}
                {!isReviewable && !isApproved && !isSuspended ? (
                  <p className="text-sm text-neutral-400">No actions available for this status.</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-neutral-400">{label}</dt>
      <dd className="text-neutral-800">{value}</dd>
    </div>
  );
}
