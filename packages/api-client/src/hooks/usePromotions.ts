import { useMutation } from '@tanstack/react-query';
import { useApiClient } from '../context';

/** On-demand validation (checkout "Apply" button), not a background query. */
export function useValidatePromo() {
  const client = useApiClient();
  return useMutation({
    mutationFn: ({
      code,
      subtotal,
      businessIds,
    }: {
      code: string;
      subtotal: number;
      businessIds: string[];
    }) => client.promotions.validate(code, subtotal, businessIds),
  });
}
