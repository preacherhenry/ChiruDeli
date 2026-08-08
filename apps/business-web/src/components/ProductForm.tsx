'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMyProductCategories, useCreateMyProduct, useUpdateMyProduct, ApiError } from '@chirudeli/api-client';
import type { Product } from '@chirudeli/shared-types';
import { Button } from './Button';

interface ProductFormProps {
  mode: 'create' | 'edit';
  productId?: string;
  initial?: Product;
}

export function ProductForm({ mode, productId, initial }: ProductFormProps) {
  const router = useRouter();
  const categories = useMyProductCategories();
  const createProduct = useCreateMyProduct();
  const updateProduct = useUpdateMyProduct();

  const [name, setName] = useState(initial?.name ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [available, setAvailable] = useState(initial?.isAvailable ?? true);
  const [error, setError] = useState<string | null>(null);

  const isPending = createProduct.isPending || updateProduct.isPending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const priceNumber = Number(price);
    if (!categoryId) {
      setError('Choose a category first.');
      return;
    }
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setError('Enter a valid price.');
      return;
    }

    const input = { categoryId, name, description, price: priceNumber, isAvailable: available, addOns: [], sortOrder: 0 };
    const onSuccess = () => router.push('/products');
    const onError = (err: unknown) => setError(err instanceof ApiError ? err.message : 'Could not save product.');

    if (mode === 'create') {
      createProduct.mutate(input, { onSuccess, onError });
    } else if (productId) {
      updateProduct.mutate({ id: productId, input }, { onSuccess, onError });
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Product name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chicken Burger"
          required
          className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
        >
          <option value="">Select a category…</option>
          {(categories.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {(categories.data ?? []).length === 0 ? (
          <p className="mt-1 text-xs text-neutral-400">Create a category first from the Categories page.</p>
        ) : null}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Price (ZMW)</label>
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="65"
          type="number"
          min="0"
          step="0.01"
          required
          className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="h-4 w-4 rounded" />
        Available for order
      </label>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={isPending}>
          {mode === 'create' ? 'Add product' : 'Save changes'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/products')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
