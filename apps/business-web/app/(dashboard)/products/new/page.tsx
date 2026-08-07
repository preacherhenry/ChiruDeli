import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '../../../../src/components/PageHeader';
import { ProductForm } from '../../../../src/components/ProductForm';

export default function NewProductPage() {
  return (
    <div>
      <Link href="/products" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ChevronLeft size={16} /> Back to products
      </Link>
      <PageHeader title="Add product" />
      <ProductForm mode="create" />
    </div>
  );
}
