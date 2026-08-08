import { z } from 'zod';
import { idSchema } from './primitives';

/** Rates one store order's business. Posted per store order — a multi-store
 * master order gets one of these per business it touched. */
export const submitReviewSchema = z.object({
  businessRating: z.number().int().min(1).max(5),
  businessComment: z.string().max(500).optional(),
});
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

export const reviewSchema = z.object({
  id: idSchema,
  orderId: idSchema,
  businessRating: z.number(),
  businessComment: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type Review = z.infer<typeof reviewSchema>;

/** Rates the rider — once per master order, since one rider handles every
 * pickup and the final delivery regardless of how many stores were involved. */
export const submitRiderReviewSchema = z.object({
  riderRating: z.number().int().min(1).max(5),
  riderComment: z.string().max(500).optional(),
});
export type SubmitRiderReviewInput = z.infer<typeof submitRiderReviewSchema>;

export const managerReviewSchema = z.object({
  id: idSchema,
  orderId: idSchema,
  businessRating: z.number(),
  businessComment: z.string().nullable(),
  customerName: z.string(),
  createdAt: z.string().datetime(),
});
export type ManagerReview = z.infer<typeof managerReviewSchema>;
