import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReassignStoreManagerInput } from '@chirudeli/shared-types';
import { useApiClient } from '../context';

export function useAdminStoreManagers() {
  const client = useApiClient();
  return useQuery({ queryKey: ['admin', 'storeManagers'], queryFn: () => client.admin.storeManagers.list() });
}

export function useAdminStoreManager(id: string | undefined) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['admin', 'storeManagers', id],
    queryFn: () => client.admin.storeManagers.get(id as string),
    enabled: Boolean(id),
  });
}

function useAdminStoreManagerMutation<TInput = void, TOutput = unknown>(
  fn: (client: ReturnType<typeof useApiClient>, id: string, input: TInput) => Promise<TOutput>,
) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: TInput }) => fn(client, id, input as TInput),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'storeManagers'] });
      qc.invalidateQueries({ queryKey: ['admin', 'storeManagers', vars.id] });
    },
  });
}

export function useSuspendStoreManager() {
  return useAdminStoreManagerMutation((client, id) => client.admin.storeManagers.suspend(id));
}

export function useReactivateStoreManager() {
  return useAdminStoreManagerMutation((client, id) => client.admin.storeManagers.reactivate(id));
}

export function useResetStoreManagerPassword() {
  return useAdminStoreManagerMutation((client, id) => client.admin.storeManagers.resetPassword(id));
}

export function useReassignStoreManager() {
  return useAdminStoreManagerMutation<ReassignStoreManagerInput>((client, id, input) =>
    client.admin.storeManagers.reassign(id, input),
  );
}
