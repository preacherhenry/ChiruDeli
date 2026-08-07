import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '../../../../src/components/PageHeader';
import { Button } from '../../../../src/components/Button';

const NEXT_STATUS: Record<string, string> = {
  New: 'Accept order',
  Accepted: 'Start preparing',
  Preparing: 'Mark ready for pickup',
};

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const status = 'Preparing';

  return (
    <div>
      <Link href="/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ChevronLeft size={16} /> Back to orders
      </Link>
      <PageHeader
        title={`Order ${params.id}`}
        action={NEXT_STATUS[status] ? <Button>{NEXT_STATUS[status]}</Button> : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-heading text-base font-semibold text-neutral-900">Items</h2>
          <div className="space-y-3">
            {[
              { name: 'Nshima & Chicken Combo', qty: 2, price: 'K130' },
              { name: 'Mosi Lager 500ml', qty: 1, price: 'K25' },
            ].map((item) => (
              <div key={item.name} className="flex justify-between border-b border-neutral-50 pb-3 text-sm">
                <span className="text-neutral-800">
                  {item.name} × {item.qty}
                </span>
                <span className="font-medium text-neutral-900">{item.price}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span>K155</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Delivery fee</span>
              <span>K15</span>
            </div>
            <div className="flex justify-between pt-1 font-heading text-base font-semibold text-neutral-900">
              <span>Total</span>
              <span>K175</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-heading text-sm font-semibold text-neutral-900">Customer</h2>
            <p className="text-sm text-neutral-600">Mwansa Phiri</p>
            <p className="text-sm text-neutral-400">+260976543210</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-heading text-sm font-semibold text-neutral-900">Delivery</h2>
            <p className="text-sm text-neutral-600">Plot 24, Kariba Road, Chirundu Town</p>
            <p className="mt-1 text-xs text-neutral-400">&quot;Blue gate, call on arrival.&quot;</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-heading text-sm font-semibold text-neutral-900">Payment</h2>
            <p className="text-sm text-neutral-600">Cash on Delivery · Pending</p>
          </div>
        </div>
      </div>
    </div>
  );
}
