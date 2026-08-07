import { z } from 'zod';
import { idSchema, moneySchema } from './primitives';

/**
 * The cart is client-side only (not persisted server-side) — it's submitted
 * wholesale as part of CreateOrderInput at checkout. This schema is the
 * shape the customer app keeps in its local cart store.
 */
export const cartItemSchema = z.object({
  productId: idSchema,
  name: z.string(),
  unitPrice: moneySchema,
  imageUrl: z.string().url().nullable(),
  quantity: z.number().int().positive(),
  addOnIds: z.array(idSchema).default([]),
  addOnsLabel: z.string().optional(),
  specialInstructions: z.string().max(280).optional(),
});
export type CartItem = z.infer<typeof cartItemSchema>;

export const cartSchema = z.object({
  businessId: idSchema.nullable(),
  items: z.array(cartItemSchema),
});
export type Cart = z.infer<typeof cartSchema>;
