'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLoginBusiness, ApiError } from '@chirudeli/api-client';
import { loginSchema } from '@chirudeli/shared-types';
import { Button } from '../../../src/components/Button';
import { Logo } from '../../../src/components/Logo';
import { useSessionStore } from '../../../src/state/sessionStore';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('+260971000001');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const login = useLoginBusiness();
  const setSignedIn = useSessionStore((s) => s.setSignedIn);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ phone, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your phone number and password.');
      return;
    }
    setError(null);
    login.mutate(parsed.data, {
      onSuccess: (res) => {
        setSignedIn(res.user);
        router.push('/');
      },
      onError: (err) => setError(err instanceof ApiError ? err.message : 'Login failed.'),
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Logo size={40} badge="BUSINESS" />
          <p className="text-sm text-neutral-500">Manage your ChiruDeli storefront</p>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Phone number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
          />
        </div>
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
          />
        </div>
        {error ? <p className="mb-4 text-sm text-error">{error}</p> : null}

        <Button type="submit" loading={login.isPending} className="w-full">
          Log in
        </Button>

        <p className="mt-4 text-center text-sm text-neutral-500">
          New business?{' '}
          <Link href="/register" className="font-semibold text-primary-600">
            Register
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-neutral-400">
          Demo login: +260971000001 / Business123! (Chirundu Grill House)
        </p>
      </form>
    </div>
  );
}
