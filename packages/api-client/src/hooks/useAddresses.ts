import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateAddressInput } from '@chirudeli/shared-types';
import { useApiClient } from '../context';

export function useAddresses() {
  const client = useApiClient();
  return useQuery({ queryKey: ['addresses'], queryFn: () => client.addresses.list() });
}

export function useCreateAddress() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAddressInput) => client.addresses.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
}
