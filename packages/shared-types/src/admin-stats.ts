import { z } from 'zod';
import { moneySchema } from './primitives';

export const platformStatsSchema = z.object({
  totalStores: z.number().int(),
  pendingStoreApplications: z.number().int(),
  activeStores: z.number().int(),
  suspendedStores: z.number().int(),
  totalCustomers: z.number().int(),
  totalRiders: z.number().int(),
  ordersToday: z.number().int(),
  revenueToday: moneySchema,
  platformCommissionToday: moneySchema,
});
export type PlatformStats = z.infer<typeof platformStatsSchema>;
