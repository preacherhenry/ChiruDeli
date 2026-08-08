'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStoreClasses, useRegisterStore, ApiError } from '@chirudeli/api-client';
import type { OpeningHours } from '@chirudeli/shared-types';
import { Button } from '../../../src/components/Button';
import { Logo } from '../../../src/components/Logo';
import { OpeningHoursEditor, DEFAULT_OPENING_HOURS } from '../../../src/components/OpeningHoursEditor';
import { apiClient } from '../../../src/lib/apiClient';

// Chirundu town center — a sensible default until the manager fine-tunes it.
const DEFAULT_COORDS = { lat: -16.0334, lng: 28.85 };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function RegisterPage() {
  const router = useRouter();
  const storeClasses = useStoreClasses();
  const registerStore = useRegisterStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [storeName, setStoreName] = useState('');
  const [storeClassId, setStoreClassId] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [openingHours, setOpeningHours] = useState<OpeningHours>(DEFAULT_OPENING_HOURS);

  const [documents, setDocuments] = useState<Record<string, File | null>>({});
  const [error, setError] = useState<string | null>(null);

  const selectedClass = storeClasses.data?.find((c) => c.id === storeClassId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!storeClassId) {
      setError('Please choose a store class.');
      return;
    }

    registerStore.mutate(
      {
        manager: { fullName, phone, email: email || undefined, password },
        store: {
          name: storeName,
          description,
          storeClassId,
          phone: storePhone || undefined,
          email: storeEmail || undefined,
          address,
          latitude: DEFAULT_COORDS.lat,
          longitude: DEFAULT_COORDS.lng,
          openingHours,
          prepTimeMinutes: 20,
        },
      },
      {
        onSuccess: async () => {
          // Registration doesn't hand back a session, so log the manager in
          // first (persists a token onto apiClient's shared storage) and
          // then upload each document through the normal authenticated client.
          const login = await apiClient.auth.loginBusiness({ phone, password });
          await apiClient.auth.persistSession(login);

          if (selectedClass) {
            for (const req of selectedClass.requiredDocuments) {
              const file = documents[req.id];
              if (!file) continue;
              const fileData = await fileToBase64(file);
              await apiClient.manager.uploadDocument({ requirementId: req.id, label: req.documentLabel, mimeType: file.type, fileData });
            }
          }

          router.push('/approval-pending');
        },
        onError: (err) => setError(err instanceof ApiError ? err.message : 'Registration failed.'),
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <form onSubmit={onSubmit} className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Logo size={40} badge="BUSINESS" />
          <h1 className="font-heading text-lg font-bold text-neutral-900">Register Your Store</h1>
          <p className="text-center text-sm text-neutral-500">Start selling and reaching customers through ChiruDeli.</p>
        </div>

        <Section title="Personal information">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={fullName} onChange={setFullName} required />
            <Field label="Phone number" value={phone} onChange={setPhone} placeholder="+260971234567" required />
            <Field label="Email (optional)" type="email" value={email} onChange={setEmail} />
            <Field label="Password" type="password" value={password} onChange={setPassword} required />
          </div>
        </Section>

        <Section title="Store information">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Store name" value={storeName} onChange={setStoreName} required />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Store class</label>
              <select
                value={storeClassId}
                onChange={(e) => setStoreClassId(e.target.value)}
                required
                className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
              >
                <option value="">Select a class…</option>
                {(storeClasses.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon ? `${c.icon} ` : ''}
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Store phone (optional)" value={storePhone} onChange={setStorePhone} />
            <Field label="Store email (optional)" type="email" value={storeEmail} onChange={setStoreEmail} />
          </div>
          <div className="mt-4">
            <Field label="Store address" value={address} onChange={setAddress} required />
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell customers what you offer"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
            />
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Opening hours</label>
            <OpeningHoursEditor value={openingHours} onChange={setOpeningHours} />
          </div>
        </Section>

        {selectedClass && selectedClass.requiredDocuments.length > 0 ? (
          <Section title="Required documents">
            <div className="space-y-3">
              {selectedClass.requiredDocuments.map((req) => (
                <div key={req.id}>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    {req.documentLabel}
                    {req.isRequired ? <span className="text-error"> *</span> : null}
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setDocuments((d) => ({ ...d, [req.id]: e.target.files?.[0] ?? null }))}
                    className="block w-full text-sm text-neutral-600"
                  />
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {error ? <p className="mb-4 text-sm text-error">{error}</p> : null}

        <Button type="submit" loading={registerStore.isPending} className="w-full">
          Submit for approval
        </Button>

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 border-b border-neutral-100 pb-6 last:border-b-0 last:pb-0">
      <h2 className="mb-3 font-heading text-sm font-semibold text-neutral-900">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
      />
    </div>
  );
}
