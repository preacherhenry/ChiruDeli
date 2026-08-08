import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdvanceStoreOrderInput, RejectStoreOrderInput } from '@chirudeli/shared-types';
import { useApiClient } from '../context';

export function useManagerOrders() {
  const client = useApiClient();
  return useQuery({ queryKey: ['manager', 'orders'], queryFn: () => client.manager.orders.list(), refetchInterval: 20_000 });
}

export function useManagerOrder(id: string | undefined) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['manager', 'orders', id],
    queryFn: () => client.manager.orders.get(id as string),
    enabled: Boolean(id),
  });
}

export function useRejectManagerOrder() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RejectStoreOrderInput }) => client.manager.orders.reject(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manager', 'orders'] }),
  });
}

export function useAdvanceManagerOrder() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdvanceStoreOrderInput }) => client.manager.orders.advance(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manager', 'orders'] }),
  });
}
