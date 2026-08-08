import { z } from 'zod';
import { idSchema } from './primitives';
import { AccountStatus } from './enums';

const managedStoreRefSchema = z.object({ id: idSchema, name: z.string(), isPrimary: z.boolean() });

export const adminStoreManagerListItemSchema = z.object({
  id: idSchema,
  fullName: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  accountStatus: AccountStatus.schema,
  stores: z.array(managedStoreRefSchema),
  createdAt: z.string().datetime(),
});
export type AdminStoreManagerListItem = z.infer<typeof adminStoreManagerListItemSchema>;

export const adminStoreManagerDetailSchema = adminStoreManagerListItemSchema.extend({
  nationalIdInfo: z.string().nullable(),
  lastLoginAt: z.string().datetime().nullable(),
});
export type AdminStoreManagerDetail = z.infer<typeof adminStoreManagerDetailSchema>;

export const reassignStoreManagerSchema = z.object({
  businessId: idSchema,
  isPrimary: z.boolean().default(true),
});
export type ReassignStoreManagerInput = z.infer<typeof reassignStoreManagerSchema>;

export const resetStoreManagerPasswordResultSchema = z.object({ temporaryPassword: z.string() });
export type ResetStoreManagerPasswordResult = z.infer<typeof resetStoreManagerPasswordResultSchema>;
