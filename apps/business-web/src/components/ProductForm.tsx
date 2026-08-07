'use client';

import { useRouter } from 'next/navigation';
import { Button } from './Button';

interface ProductFormProps {
  mode: 'create' | 'edit';
  initial?: { name: string; category: string; price: string; description: string; available: boolean };
}

/** Placeholder — not wired to POST/PATCH /businesses/:id/products yet (see
 * docs/roadmap.md, "Business dashboard backend"). Submitting returns to the
 * product list so the navigation flow is real even before the API call is. */
export function ProductForm({ mode, initial }: ProductFormProps) {
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push('/products');
      }}
      className="max-w-xl space-y-4 rounded-xl bg-white p-6 shadow-sm"
    >
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Product name</label>
        <input
          defaultValue={initial?.name}
          placeholder="e.g. Chicken Burger"
          className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Category</label>
        <input
          defaultValue={initial?.category}
          placeholder="e.g. Meals"
          className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Price (ZMW)</label>
        <input
          defaultValue={initial?.price}
          placeholder="65"
          type="number"
          className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Description</label>
        <textarea
          defaultValue={initial?.description}
          rows={3}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" defaultChecked={initial?.available ?? true} className="h-4 w-4 rounded" />
        Available for order
      </label>

      <div className="flex gap-3 pt-2">
        <Button type="submit">{mode === 'create' ? 'Add product' : 'Save changes'}</Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/products')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
