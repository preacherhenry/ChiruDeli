import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateOrderInput,
  PreviewOrderInput,
  CancelOrderInput,
  SubmitReviewInput,
  SubmitRiderReviewInput,
} from '@chirudeli/shared-types';
import { useApiClient } from '../context';

/** Recomputed on-demand (cart contents change, promo applied, ...) rather
 * than kept as a background query. */
export function usePreviewOrder() {
  const client = useApiClient();
  return useMutation({ mutationFn: (input: PreviewOrderInput) => client.orders.preview(input) });
}

export function useCreateOrder() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => client.orders.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useOrder(id: string | undefined) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => client.orders.get(id as string),
    enabled: Boolean(id),
    // Live updates arrive over the socket (subscribeToOrderTracking); this
    // light poll is only a fallback for clients that missed a socket event.
    refetchInterval: 20_000,
  });
}

export function useOrders() {
  const client = useApiClient();
  return useQuery({ queryKey: ['orders'], queryFn: () => client.orders.list() });
}

export function useCancelOrder() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CancelOrderInput }) =>
      client.orders.cancel(id, input),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', vars.id] });
    },
  });
}

/** Rates one store's business — a multi-store master order gets one call of
 * this per store. */
export function useSubmitReview() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SubmitReviewInput }) =>
      client.storeOrders.review(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order'] }),
  });
}

/** Rates the rider — once per master order. */
export function useSubmitRiderReview() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SubmitRiderReviewInput }) =>
      client.orders.riderReview(id, input),
    onSuccess: (_res, vars) => qc.invalidateQueries({ queryKey: ['order', vars.id] }),
  });
}
