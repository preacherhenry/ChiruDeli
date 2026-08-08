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

const upsertProductAddOnSchema = z.object({
  name: z.string().min(1).max(60),
  priceDelta: moneySchema.default(0),
});

export const upsertProductSchema = z.object({
  categoryId: idSchema,
  name: z.string().min(2).max(80),
  description: z.string().max(500).default(''),
  price: moneySchema,
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().default(true),
  stock: z.number().int().nonnegative().nullable().optional(),
  sortOrder: z.number().int().default(0),
  addOns: z.array(upsertProductAddOnSchema).default([]),
});
export type UpsertProductInput = z.infer<typeof upsertProductSchema>;

export const createProductCategorySchema = z.object({
  name: z.string().min(1).max(60),
  sortOrder: z.number().int().default(0),
});
export type CreateProductCategoryInput = z.infer<typeof createProductCategorySchema>;

export const updateProductCategorySchema = createProductCategorySchema.partial();
export type UpdateProductCategoryInput = z.infer<typeof updateProductCategorySchema>;
