import { z } from 'zod';
import { moneySchema } from './primitives';
import { PromotionType } from './enums';

export const validatePromoQuerySchema = z.object({
  code: z.string().min(2).max(30),
  businessId: z.string().uuid().optional(),
  subtotal: moneySchema,
});
export type ValidatePromoQuery = z.infer<typeof validatePromoQuerySchema>;

export const promoValidationResultSchema = z.object({
  valid: z.boolean(),
  code: z.string(),
  type: PromotionType.schema.optional(),
  discountAmount: moneySchema.optional(),
  freeDelivery: z.boolean().optional(),
  message: z.string(),
});
export type PromoValidationResult = z.infer<typeof promoValidationResultSchema>;
