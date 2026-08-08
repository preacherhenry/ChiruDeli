'use client';

import { Star } from 'lucide-react';
import { useManagerReviews } from '@chirudeli/api-client';
import { PageHeader } from '../../../src/components/PageHeader';

export default function ReviewsPage() {
  const reviews = useManagerReviews();

  return (
    <div>
      <PageHeader title="Reviews" />
      <div className="space-y-3">
        {(reviews.data ?? []).map((r) => (
          <div key={r.id} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < r.businessRating ? 'fill-secondary-500 text-secondary-500' : 'text-neutral-200'} />
                ))}
              </div>
              <span className="text-xs text-neutral-400">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-sm font-medium text-neutral-800">{r.customerName}</p>
            {r.businessComment ? <p className="mt-1 text-sm text-neutral-600">{r.businessComment}</p> : null}
          </div>
        ))}
        {(reviews.data ?? []).length === 0 ? <p className="py-8 text-center text-sm text-neutral-400">No reviews yet.</p> : null}
      </div>
    </div>
  );
}
