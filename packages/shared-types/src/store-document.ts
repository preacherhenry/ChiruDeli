import { z } from 'zod';
import { idSchema } from './primitives';
import { DocumentStatus } from './enums';

export const storeDocumentSchema = z.object({
  id: idSchema,
  requirementId: idSchema.nullable(),
  label: z.string(),
  mimeType: z.string(),
  status: DocumentStatus.schema,
  reviewNote: z.string().nullable(),
  uploadedAt: z.string().datetime(),
  reviewedAt: z.string().datetime().nullable(),
  /** A data: URI (base64) — see docs/architecture.md's DocumentStorageProvider note. */
  fileData: z.string(),
});
export type StoreDocument = z.infer<typeof storeDocumentSchema>;

/** Base64-encoded file content, capped well under Postgres/Fastify body
 * limits — fine for registration documents (PDFs/photos), not for video. */
export const uploadStoreDocumentSchema = z.object({
  requirementId: idSchema.optional(),
  label: z.string().min(1).max(120),
  mimeType: z.string().min(3).max(100),
  fileData: z.string().min(1).max(8_000_000),
});
export type UploadStoreDocumentInput = z.infer<typeof uploadStoreDocumentSchema>;

export const reviewStoreDocumentSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().max(500).optional(),
});
export type ReviewStoreDocumentInput = z.infer<typeof reviewStoreDocumentSchema>;
