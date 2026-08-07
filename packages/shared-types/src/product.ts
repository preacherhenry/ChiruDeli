import { z } from 'zod';
import { idSchema, moneySchema } from './primitives';

export const productAddOnSchema = z.object({
  id: idSchema,
  name: z.string(),
  priceDelta: moneySchema,
});
export type ProductAddOn = z.infer<typeof productAddOnSchema>;

export const productCategorySchema = z.object({
  id: idSchema,
  name: z.string(),
  sortOrder: z.number().int(),
});
export type ProductCategory = z.infer<typeof productCategorySchema>;

export const productSchema = z.object({
  id: idSchema,
  businessId: idSchema,
  categoryId: idSchema,
  categoryName: z.string(),
  name: z.string(),
  description: z.string(),
  price: moneySchema,
  imageUrl: z.string().url().nullable(),
  isAvailable: z.boolean(),
  addOns: z.array(productAddOnSchema),
});
export type Product = z.infer<typeof productSchema>;

export const upsertProductSchema = z.object({
  categoryId: idSchema,
  name: z.string().min(2).max(80),
  description: z.string().max(500).default(''),
  price: moneySchema,
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().default(true),
});
export type UpsertProductInput = z.infer<typeof upsertProductSchema>;
