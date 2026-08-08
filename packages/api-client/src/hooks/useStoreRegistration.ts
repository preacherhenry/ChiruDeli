import { useMutation } from '@tanstack/react-query';
import type { RegisterStoreInput } from '@chirudeli/shared-types';
import { useApiClient } from '../context';

export function useRegisterStore() {
  const client = useApiClient();
  return useMutation({ mutationFn: (input: RegisterStoreInput) => client.stores.register(input) });
}
