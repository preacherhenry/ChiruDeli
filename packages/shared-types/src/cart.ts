import { z } from 'zod';
import { idSchema, moneySchema } from './primitives';

/**
 * The cart is client-side only (not persisted server-side) — it's submitted
 * wholesale as part of CreateOrderInput at checkout. Items from any number
 * of businesses can sit in the cart at once; the customer never has to
 * clear or switch carts to order from a different store (see
 * docs/architecture.md, "Multi-store cart & order splitting").
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

export const cartStoreSchema = z.object({
  businessId: idSchema,
  businessName: z.string(),
  items: z.array(cartItemSchema),
});
export type CartStore = z.infer<typeof cartStoreSchema>;

export const cartSchema = z.object({
  stores: z.array(cartStoreSchema),
});
export type Cart = z.infer<typeof cartSchema>;
