import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Logo } from '../../../src/components/Logo';

export default function ApprovalPendingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-4 text-center">
      <Logo size={40} badge="BUSINESS" />
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-50">
        <Clock className="text-secondary-600" size={28} />
      </div>
      <h1 className="font-heading text-xl font-bold text-neutral-900">Your business is under review</h1>
      <p className="max-w-sm text-sm text-neutral-500">
        ChiruDeli admin reviews new businesses within 1-2 business days. You&apos;ll be able to log
        in and start receiving orders as soon as you&apos;re approved.
      </p>
      <Link href="/login" className="text-sm font-semibold text-primary-600">
        Back to login
      </Link>
    </div>
  );
}
