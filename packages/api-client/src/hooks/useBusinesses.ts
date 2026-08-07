import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '../context';

export function useBusinesses(params: {
  category?: string;
  search?: string;
  lat?: number;
  lng?: number;
}) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['businesses', params],
    queryFn: () => client.businesses.list(params),
  });
}

export function useBusiness(id: string | undefined, coords?: { lat?: number; lng?: number }) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['business', id, coords],
    queryFn: () => client.businesses.get(id as string, coords),
    enabled: Boolean(id),
  });
}

export function useProducts(businessId: string | undefined) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['products', businessId],
    queryFn: () => client.businesses.products(businessId as string),
    enabled: Boolean(businessId),
  });
}
