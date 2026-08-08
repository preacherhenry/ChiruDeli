'use client';

import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
import { useMyProducts, useDeleteMyProduct } from '@chirudeli/api-client';
import { PageHeader } from '../../../src/components/PageHeader';
import { Button } from '../../../src/components/Button';
import { formatK } from '../../../src/lib/money';

export default function ProductsPage() {
  const products = useMyProducts();
  const deleteProduct = useDeleteMyProduct();

  return (
    <div>
      <PageHeader
        title="Products"
        action={
          <Link href="/products/new">
            <Button>
              <Plus size={16} /> Add Product
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(products.data ?? []).map((p) => (
          <div key={p.id} className="rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-2 flex items-start justify-between">
              <span className="text-xs font-medium text-neutral-400">{p.categoryName}</span>
              <span
                className={`rounded-pill px-2 py-0.5 text-xs font-semibold ${
                  p.isAvailable ? 'bg-primary-50 text-primary-700' : 'bg-error/10 text-error'
                }`}
              >
                {p.isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <Link href={`/products/${p.id}`} className="block">
              <h3 className="font-heading text-base font-semibold text-neutral-900">{p.name}</h3>
              <p className="mt-1 text-sm font-semibold text-primary-700">{formatK(p.price)}</p>
            </Link>
            <button
              onClick={() => deleteProduct.mutate(p.id)}
              className="mt-3 inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-error"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        ))}
        {(products.data ?? []).length === 0 ? (
          <p className="col-span-full py-8 text-center text-sm text-neutral-400">No products yet — add your first one.</p>
        ) : null}
      </div>
    </div>
  );
}
