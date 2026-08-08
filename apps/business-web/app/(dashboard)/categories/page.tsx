'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  useMyProductCategories,
  useCreateMyProductCategory,
  useDeleteMyProductCategory,
  ApiError,
} from '@chirudeli/api-client';
import { PageHeader } from '../../../src/components/PageHeader';
import { Button } from '../../../src/components/Button';

export default function CategoriesPage() {
  const categories = useMyProductCategories();
  const createCategory = useCreateMyProductCategory();
  const deleteCategory = useDeleteMyProductCategory();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    createCategory.mutate(
      { name: name.trim(), sortOrder: categories.data?.length ?? 0 },
      { onSuccess: () => setName(''), onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not create category.') },
    );
  };

  const onDelete = (id: string) => {
    setError(null);
    deleteCategory.mutate(id, { onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not delete category.') });
  };

  return (
    <div>
      <PageHeader title="Categories" />
      <p className="mb-4 text-sm text-neutral-500">
        Organise your own menu/catalogue — e.g. Burgers, Drinks, Desserts. These are separate from ChiruDeli&apos;s store
        classes.
      </p>

      <form onSubmit={onCreate} className="mb-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="h-11 flex-1 rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
        />
        <Button type="submit" loading={createCategory.isPending}>
          <Plus size={16} /> Add
        </Button>
      </form>

      {error ? <p className="mb-4 text-sm text-error">{error}</p> : null}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {(categories.data ?? []).map((c) => (
          <div key={c.id} className="flex items-center justify-between border-b border-neutral-50 px-5 py-3 text-sm last:border-b-0">
            <span className="text-neutral-800">{c.name}</span>
            <button onClick={() => onDelete(c.id)} className="text-neutral-400 hover:text-error">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {(categories.data ?? []).length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-400">No categories yet — add your first one above.</p>
        ) : null}
      </div>
    </div>
  );
}
