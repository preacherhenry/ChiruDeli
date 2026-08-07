import { useMutation } from '@tanstack/react-query';
import { useApiClient } from '../context';

/** On-demand validation (checkout "Apply" button), not a background query. */
export function useValidatePromo() {
  const client = useApiClient();
  return useMutation({
    mutationFn: ({
      code,
      subtotal,
      businessId,
    }: {
      code: string;
      subtotal: number;
      businessId?: string;
    }) => client.promotions.validate(code, subtotal, businessId),
  });
}
