import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../../src/components/PageHeader';
import { Button } from '../../../src/components/Button';

const PRODUCTS = [
  { id: '1', name: 'Nshima & Chicken Combo', category: 'Popular', price: 'K65', available: true },
  { id: '2', name: 'Beef Stew Combo', category: 'Popular', price: 'K70', available: true },
  { id: '3', name: 'Grilled Bream', category: 'Meals', price: 'K85', available: true },
  { id: '4', name: 'Mosi Lager 500ml', category: 'Drinks', price: 'K25', available: false },
];

export default function ProductsPage() {
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
        {PRODUCTS.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-2 flex items-start justify-between">
              <span className="text-xs font-medium text-neutral-400">{p.category}</span>
              <span
                className={`rounded-pill px-2 py-0.5 text-xs font-semibold ${
                  p.available ? 'bg-primary-50 text-primary-700' : 'bg-error/10 text-error'
                }`}
              >
                {p.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <h3 className="font-heading text-base font-semibold text-neutral-900">{p.name}</h3>
            <p className="mt-1 text-sm font-semibold text-primary-700">{p.price}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
