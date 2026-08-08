'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { CreateStoreClassInput, StoreClass } from '@chirudeli/shared-types';
import { Button } from './Button';

interface DocRow {
  documentLabel: string;
  isRequired: boolean;
  sortOrder: number;
}

export function StoreClassForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: StoreClass;
  onSubmit: (input: CreateStoreClassInput) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '');
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [isVisible, setIsVisible] = useState(initial?.isVisible ?? true);
  const [docs, setDocs] = useState<DocRow[]>(
    initial?.requiredDocuments.map((d) => ({ documentLabel: d.documentLabel, isRequired: d.isRequired, sortOrder: d.sortOrder })) ?? [],
  );

  const addDoc = () => setDocs((d) => [...d, { documentLabel: '', isRequired: true, sortOrder: d.length }]);
  const removeDoc = (i: number) => setDocs((d) => d.filter((_, idx) => idx !== i));
  const updateDoc = (i: number, patch: Partial<DocRow>) => setDocs((d) => d.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      icon: icon || undefined,
      sortOrder,
      isActive,
      isVisible,
      requiredDocuments: docs.filter((d) => d.documentLabel.trim().length > 0),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Class name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Icon (emoji)</label>
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🍔"
            className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Display order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
          />
        </div>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-neutral-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded" />
          Active
        </label>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-neutral-700">
          <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} className="h-4 w-4 rounded" />
          Visible to customers
        </label>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-700">Required documents</label>
          <button type="button" onClick={addDoc} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600">
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {docs.map((doc, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={doc.documentLabel}
                onChange={(e) => updateDoc(i, { documentLabel: e.target.value })}
                placeholder="e.g. Pharmacy Licence"
                className="h-9 flex-1 rounded-lg border border-neutral-200 px-2 text-sm outline-none focus:border-primary-500"
              />
              <label className="flex items-center gap-1 text-xs text-neutral-500">
                <input type="checkbox" checked={doc.isRequired} onChange={(e) => updateDoc(i, { isRequired: e.target.checked })} />
                Required
              </label>
              <button type="button" onClick={() => removeDoc(i)} className="text-neutral-400 hover:text-error">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={submitting}>
          {initial ? 'Save changes' : 'Create store class'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
