import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateOrderInput, CancelOrderInput, SubmitReviewInput } from '@chirudeli/shared-types';
import { useApiClient } from '../context';

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

export function useSubmitReview() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SubmitReviewInput }) =>
      client.orders.review(id, input),
    onSuccess: (_res, vars) => qc.invalidateQueries({ queryKey: ['order', vars.id] }),
  });
}
