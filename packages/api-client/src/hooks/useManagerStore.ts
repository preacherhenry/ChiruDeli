import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OpeningHours, UpdateStoreProfileInput, UploadStoreDocumentInput } from '@chirudeli/shared-types';
import { useApiClient } from '../context';

const MY_STORE_KEY = ['manager', 'store'];

export function useMyStore() {
  const client = useApiClient();
  return useQuery({ queryKey: MY_STORE_KEY, queryFn: () => client.manager.getStore() });
}

export function useManagerDashboard() {
  const client = useApiClient();
  return useQuery({ queryKey: ['manager', 'dashboard'], queryFn: () => client.manager.dashboard() });
}

export function useManagerReviews() {
  const client = useApiClient();
  return useQuery({ queryKey: ['manager', 'reviews'], queryFn: () => client.manager.reviews() });
}

export function useUpdateStoreProfile() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateStoreProfileInput) => client.manager.updateProfile(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: MY_STORE_KEY }),
  });
}

export function useUpdateStoreHours() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OpeningHours) => client.manager.updateHours(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: MY_STORE_KEY }),
  });
}

export function useSetStoreOpenStatus() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (storeState: 'OPEN' | 'PAUSED') => client.manager.setOpenStatus(storeState),
    onSuccess: () => qc.invalidateQueries({ queryKey: MY_STORE_KEY }),
  });
}

export function useActivateStore() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => client.manager.activate(),
    onSuccess: () => qc.invalidateQueries({ queryKey: MY_STORE_KEY }),
  });
}

export function useUploadStoreDocument() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadStoreDocumentInput) => client.manager.uploadDocument(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: MY_STORE_KEY }),
  });
}
