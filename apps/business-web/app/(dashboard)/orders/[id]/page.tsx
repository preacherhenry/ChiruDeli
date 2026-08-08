'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useManagerOrder, useAdvanceManagerOrder, useRejectManagerOrder } from '@chirudeli/api-client';
import type { OrderStatus } from '@chirudeli/shared-types';
import { PageHeader } from '../../../../src/components/PageHeader';
import { Button } from '../../../../src/components/Button';
import { formatK } from '../../../../src/lib/money';

const NEXT_STATUS: Partial<Record<OrderStatus, { to: 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP'; label: string }>> = {
  PENDING_CONFIRMATION: { to: 'CONFIRMED', label: 'Accept order' },
  CONFIRMED: { to: 'PREPARING', label: 'Start preparing' },
  PREPARING: { to: 'READY_FOR_PICKUP', label: 'Mark ready for pickup' },
};

const CAN_REJECT: OrderStatus[] = ['PENDING_CONFIRMATION', 'CONFIRMED', 'PREPARING'];

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const order = useManagerOrder(params.id);
  const advance = useAdvanceManagerOrder();
  const reject = useRejectManagerOrder();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  if (order.isLoading || !order.data) {
    return <p className="text-sm text-neutral-400">Loading…</p>;
  }

  const o = order.data;
  const next = NEXT_STATUS[o.status];

  return (
    <div>
      <Link href="/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ChevronLeft size={16} /> Back to orders
      </Link>
      <PageHeader
        title={`Order ${o.orderNumber}`}
        action={
          next ? (
            <Button loading={advance.isPending} onClick={() => advance.mutate({ id: o.id, input: { toStatus: next.to } })}>
              {next.label}
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-heading text-base font-semibold text-neutral-900">Items</h2>
          <div className="space-y-3">
            {o.items.map((item) => (
              <div key={item.id} className="flex justify-between border-b border-neutral-50 pb-3 text-sm">
                <span className="text-neutral-800">
                  {item.nameSnapshot} × {item.quantity}
                  {item.addOnsLabel ? <span className="block text-xs text-neutral-400">{item.addOnsLabel}</span> : null}
                </span>
                <span className="font-medium text-neutral-900">{formatK(item.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between pt-1 font-heading text-base font-semibold text-neutral-900">
            <span>Subtotal</span>
            <span>{formatK(o.subtotal)}</span>
          </div>

          {CAN_REJECT.includes(o.status) ? (
            <div className="mt-6 border-t border-neutral-100 pt-4">
              {rejecting ? (
                <div className="space-y-2">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why can't this order be fulfilled?"
                    rows={2}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      loading={reject.isPending}
                      onClick={() => reject.mutate({ id: o.id, input: { reason } })}
                      disabled={reason.trim().length < 2}
                    >
                      Confirm reject
                    </Button>
                    <Button variant="ghost" onClick={() => setRejecting(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" className="text-error" onClick={() => setRejecting(true)}>
                  Reject order
                </Button>
              )}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-heading text-sm font-semibold text-neutral-900">Customer</h2>
            <p className="text-sm text-neutral-600">{o.customerName}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-heading text-sm font-semibold text-neutral-900">Delivery</h2>
            <p className="text-sm text-neutral-600">{o.deliveryArea}</p>
            {o.riderName ? <p className="mt-1 text-xs text-neutral-400">Rider: {o.riderName}</p> : null}
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-heading text-sm font-semibold text-neutral-900">Master order</h2>
            <p className="text-sm text-neutral-600">{o.masterOrderNumber}</p>
            <p className="mt-1 text-xs text-neutral-400">Placed {new Date(o.placedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
