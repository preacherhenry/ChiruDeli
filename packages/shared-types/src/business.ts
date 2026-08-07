import { z } from 'zod';
import { idSchema, moneySchema } from './primitives';
import { BusinessStatus, StoreState, BusinessCategorySlug } from './enums';

export const businessCategorySchema = z.object({
  id: idSchema,
  name: z.string(),
  slug: BusinessCategorySlug.schema,
  icon: z.string(),
});
export type BusinessCategory = z.infer<typeof businessCategorySchema>;

export const openingHoursSchema = z.record(
  z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  z.object({ open: z.string(), close: z.string(), closed: z.boolean().default(false) }),
);
export type OpeningHours = z.infer<typeof openingHoursSchema>;

export const businessSummarySchema = z.object({
  id: idSchema,
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().url().nullable(),
  category: businessCategorySchema,
  ratingAvg: z.number().min(0).max(5),
  ratingCount: z.number().int().nonnegative(),
  estimatedDeliveryMinutes: z.number().int().positive(),
  deliveryFee: moneySchema,
  storeState: StoreState.schema,
  isOpenNow: z.boolean(),
});
export type BusinessSummary = z.infer<typeof businessSummarySchema>;

export const businessDetailSchema = businessSummarySchema.extend({
  coverImageUrl: z.string().url().nullable(),
  description: z.string(),
  openingHours: openingHoursSchema,
  status: BusinessStatus.schema,
  address: z.string(),
});
export type BusinessDetail = z.infer<typeof businessDetailSchema>;

export const createBusinessSchema = z.object({
  name: z.string().min(2).max(100),
  categoryId: idSchema,
  description: z.string().max(1000),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().min(2).max(200),
  openingHours: openingHoursSchema,
});
export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
