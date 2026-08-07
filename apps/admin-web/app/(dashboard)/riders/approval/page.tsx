'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '../../../../src/components/PageHeader';

/** Placeholder — see docs/roadmap.md, "Rider app backend" for the real
 * document-review workflow (RiderDocument records + approve/reject). */
const PENDING: Array<{ name: string; vehicle: string; submitted: string }> = [];

export default function RiderApprovalPage() {
  return (
    <div>
      <Link href="/riders" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ChevronLeft size={16} /> Back to riders
      </Link>
      <PageHeader title="Rider approvals" />
      {PENDING.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">
          No riders awaiting approval right now.
        </div>
      ) : null}
    </div>
  );
}
