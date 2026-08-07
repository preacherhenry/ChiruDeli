import { z } from 'zod';
import { idSchema, coordinatesSchema } from './primitives';

export const addressSchema = z.object({
  id: idSchema,
  label: z.string().min(1).max(40),
  line1: z.string().min(1).max(200),
  area: z.string().min(1).max(120),
  latitude: z.number(),
  longitude: z.number(),
  deliveryInstructions: z.string().max(280).optional(),
  isDefault: z.boolean(),
});
export type Address = z.infer<typeof addressSchema>;

export const createAddressSchema = z.object({
  label: z.string().min(1).max(40),
  line1: z.string().min(1).max(200),
  area: z.string().min(1).max(120),
  ...coordinatesSchema.shape,
  deliveryInstructions: z.string().max(280).optional(),
  isDefault: z.boolean().default(false),
});
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
