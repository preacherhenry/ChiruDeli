import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateStoreClassInput, UpdateStoreClassInput } from '@chirudeli/shared-types';
import { useApiClient } from '../context';

/** Public — feeds the customer "browse by class" screens and the store
 * registration form's class picker. */
export function useStoreClasses() {
  const client = useApiClient();
  return useQuery({ queryKey: ['storeClasses'], queryFn: () => client.storeClasses.list() });
}

export function useAdminStoreClasses() {
  const client = useApiClient();
  return useQuery({ queryKey: ['admin', 'storeClasses'], queryFn: () => client.admin.storeClasses.list() });
}

export function useCreateStoreClass() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStoreClassInput) => client.admin.storeClasses.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'storeClasses'] }),
  });
}

export function useUpdateStoreClass() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateStoreClassInput }) => client.admin.storeClasses.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'storeClasses'] }),
  });
}

export function useDeleteStoreClass() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.admin.storeClasses.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'storeClasses'] }),
  });
}
