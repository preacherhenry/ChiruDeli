import { z } from 'zod';
import { idSchema, moneySchema } from './primitives';
import { PromotionType } from './enums';

export const validatePromoInputSchema = z.object({
  code: z.string().min(2).max(30),
  subtotal: moneySchema,
  /** Every business currently in the cart. */
  businessIds: z.array(idSchema).default([]),
});
export type ValidatePromoInput = z.infer<typeof validatePromoInputSchema>;

export const promoValidationResultSchema = z.object({
  valid: z.boolean(),
  code: z.string(),
  type: PromotionType.schema.optional(),
  discountAmount: moneySchema.optional(),
  freeDelivery: z.boolean().optional(),
  message: z.string(),
});
export type PromoValidationResult = z.infer<typeof promoValidationResultSchema>;
