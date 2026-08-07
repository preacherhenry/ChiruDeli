import { z } from 'zod';
import { idSchema } from './primitives';

export const submitReviewSchema = z.object({
  businessRating: z.number().int().min(1).max(5),
  businessComment: z.string().max(500).optional(),
  riderRating: z.number().int().min(1).max(5).optional(),
  riderComment: z.string().max(500).optional(),
});
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

export const reviewSchema = z.object({
  id: idSchema,
  orderId: idSchema,
  businessRating: z.number().nullable(),
  businessComment: z.string().nullable(),
  riderRating: z.number().nullable(),
  riderComment: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type Review = z.infer<typeof reviewSchema>;
