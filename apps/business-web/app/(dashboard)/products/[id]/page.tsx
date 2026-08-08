'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useMyProducts } from '@chirudeli/api-client';
import { PageHeader } from '../../../../src/components/PageHeader';
import { ProductForm } from '../../../../src/components/ProductForm';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const products = useMyProducts();
  const product = products.data?.find((p) => p.id === params.id);

  return (
    <div>
      <Link href="/products" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ChevronLeft size={16} /> Back to products
      </Link>
      <PageHeader title="Edit product" />
      {products.isLoading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : product ? (
        <ProductForm mode="edit" productId={product.id} initial={product} />
      ) : (
        <p className="text-sm text-neutral-400">Product not found.</p>
      )}
    </div>
  );
}
