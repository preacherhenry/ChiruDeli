import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../context';

export function useNotifications() {
  const client = useApiClient();
  return useQuery({ queryKey: ['notifications'], queryFn: () => client.notifications.list() });
}

export function useMarkNotificationRead() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.notifications.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
