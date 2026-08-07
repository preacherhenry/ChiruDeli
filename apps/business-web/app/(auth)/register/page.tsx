'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../src/components/Button';
import { Logo } from '../../../src/components/Logo';

const CATEGORIES = ['Food', 'Groceries', 'Pharmacy', 'Electronics', 'Stationery', 'Household', 'Clothing', 'Other'];

/** Placeholder — business self-registration isn't wired to a real endpoint
 * yet (see docs/roadmap.md, "Business dashboard backend"). */
export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push('/approval-pending');
        }}
        className="w-full max-w-lg rounded-xl bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex flex-col items-center gap-2">
          <Logo size={40} badge="BUSINESS" />
          <p className="text-sm text-neutral-500">Register your business on ChiruDeli</p>
        </div>

        <div className="grid gap-4">
          <Field label="Business name" placeholder="e.g. Chirundu Grill House" />
          <Field label="Owner phone number" placeholder="+260971234567" />
          <Field label="Owner email" type="email" placeholder="owner@example.com" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Category</label>
            <select className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500">
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <Field label="Business address" placeholder="Chirundu Town" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Description</label>
            <textarea
              placeholder="Tell customers what you offer"
              rows={3}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <Button type="submit" className="w-full">
            Submit for approval
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-neutral-500">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-primary-600">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</label>
      <input
        className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
        {...props}
      />
    </div>
  );
}
