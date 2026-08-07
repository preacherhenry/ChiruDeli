'use client';

import Link from 'next/link';
import { ChevronLeft, Check, X } from 'lucide-react';
import { PageHeader } from '../../../../src/components/PageHeader';
import { Button } from '../../../../src/components/Button';

/** Placeholder — approve/reject aren't wired to a real endpoint yet
 * (see docs/roadmap.md, "Admin dashboard backend"). Currently no
 * businesses are pending since the seed data is pre-approved. */
const PENDING: Array<{ name: string; category: string; owner: string; submitted: string }> = [];

export default function BusinessApprovalPage() {
  return (
    <div>
      <Link href="/businesses" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ChevronLeft size={16} /> Back to businesses
      </Link>
      <PageHeader title="Business approvals" />

      {PENDING.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">
          No businesses awaiting approval right now.
        </div>
      ) : (
        <div className="space-y-3">
          {PENDING.map((b) => (
            <div key={b.name} className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
              <div>
                <h3 className="font-heading text-sm font-semibold text-neutral-900">{b.name}</h3>
                <p className="text-xs text-neutral-500">
                  {b.category} · {b.owner} · submitted {b.submitted}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <X size={14} /> Reject
                </Button>
                <Button>
                  <Check size={14} /> Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
