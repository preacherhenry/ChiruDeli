import { z } from 'zod';
import { idSchema } from './primitives';

/** A single admin-defined document requirement — free text, not an enum, so
 * a new document type never needs a code change (spec §17/§18). */
export const storeClassDocumentRequirementSchema = z.object({
  id: idSchema,
  documentLabel: z.string().min(1).max(120),
  isRequired: z.boolean(),
  sortOrder: z.number().int(),
});
export type StoreClassDocumentRequirement = z.infer<typeof storeClassDocumentRequirementSchema>;

/** Slim shape embedded in business summaries/details. */
export const storeClassSummarySchema = z.object({
  id: idSchema,
  name: z.string(),
  slug: z.string(),
  icon: z.string().nullable(),
});
export type StoreClassSummary = z.infer<typeof storeClassSummarySchema>;

export const storeClassSchema = z.object({
  id: idSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  icon: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  isActive: z.boolean(),
  isVisible: z.boolean(),
  sortOrder: z.number().int(),
  storeCount: z.number().int().nonnegative(),
  requiredDocuments: z.array(storeClassDocumentRequirementSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type StoreClass = z.infer<typeof storeClassSchema>;

const documentRequirementInputSchema = z.object({
  documentLabel: z.string().min(1).max(120),
  isRequired: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const createStoreClassSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(500).default(''),
  icon: z.string().max(16).optional(),
  coverImageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  requiredDocuments: z.array(documentRequirementInputSchema).default([]),
});
export type CreateStoreClassInput = z.infer<typeof createStoreClassSchema>;

export const updateStoreClassSchema = createStoreClassSchema.partial();
export type UpdateStoreClassInput = z.infer<typeof updateStoreClassSchema>;
