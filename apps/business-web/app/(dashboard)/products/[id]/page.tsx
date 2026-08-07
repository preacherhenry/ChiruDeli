import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '../../../../src/components/PageHeader';
import { ProductForm } from '../../../../src/components/ProductForm';

export default function EditProductPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <Link href="/products" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ChevronLeft size={16} /> Back to products
      </Link>
      <PageHeader title="Edit product" />
      <ProductForm
        mode="edit"
        initial={{
          name: 'Nshima & Chicken Combo',
          category: 'Popular',
          price: '65',
          description: 'Grilled chicken quarter with nshima and veg.',
          available: true,
        }}
      />
      <p className="mt-2 text-xs text-neutral-400">Editing product {params.id}</p>
    </div>
  );
}
