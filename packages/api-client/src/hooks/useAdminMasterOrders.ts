import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '../context';

export function useAdminMasterOrders() {
  const client = useApiClient();
  return useQuery({ queryKey: ['admin', 'masterOrders'], queryFn: () => client.admin.masterOrders.list(), refetchInterval: 20_000 });
}

export function useAdminMasterOrder(id: string | undefined) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['admin', 'masterOrders', id],
    queryFn: () => client.admin.masterOrders.get(id as string),
    enabled: Boolean(id),
  });
}

export function useAdminStats() {
  const client = useApiClient();
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: () => client.admin.stats(), refetchInterval: 30_000 });
}
