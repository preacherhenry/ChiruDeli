import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminUpdateStoreInput,
  RejectStoreInput,
  RequestStoreChangesInput,
  SuspendStoreInput,
  ReviewStoreDocumentInput,
} from '@chirudeli/shared-types';
import { useApiClient } from '../context';

export function useAdminStores(filters: { status?: string; storeClassId?: string; search?: string } = {}) {
  const client = useApiClient();
  return useQuery({ queryKey: ['admin', 'stores', filters], queryFn: () => client.admin.stores.list(filters) });
}

export function useAdminStore(id: string | undefined) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['admin', 'stores', id],
    queryFn: () => client.admin.stores.get(id as string),
    enabled: Boolean(id),
  });
}

function useAdminStoreMutation<TInput = void>(
  fn: (client: ReturnType<typeof useApiClient>, id: string, input: TInput) => Promise<unknown>,
) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: TInput }) => fn(client, id, input as TInput),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'stores'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stores', vars.id] });
    },
  });
}

export function useUpdateAdminStore() {
  return useAdminStoreMutation<AdminUpdateStoreInput>((client, id, input) => client.admin.stores.update(id, input));
}

export function useApproveStore() {
  return useAdminStoreMutation((client, id) => client.admin.stores.approve(id));
}

export function useRejectStore() {
  return useAdminStoreMutation<RejectStoreInput>((client, id, input) => client.admin.stores.reject(id, input));
}

export function useRequestStoreChanges() {
  return useAdminStoreMutation<RequestStoreChangesInput>((client, id, input) => client.admin.stores.requestChanges(id, input));
}

export function useSuspendStore() {
  return useAdminStoreMutation<SuspendStoreInput>((client, id, input) => client.admin.stores.suspend(id, input));
}

export function useReactivateStore() {
  return useAdminStoreMutation((client, id) => client.admin.stores.reactivate(id));
}

export function useDeactivateStore() {
  return useAdminStoreMutation((client, id) => client.admin.stores.deactivate(id));
}

export function useReviewStoreDocument() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, docId, input }: { storeId: string; docId: string; input: ReviewStoreDocumentInput }) =>
      client.admin.stores.reviewDocument(storeId, docId, input),
    onSuccess: (_res, vars) => qc.invalidateQueries({ queryKey: ['admin', 'stores', vars.storeId] }),
  });
}
