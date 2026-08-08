import type { FastifyInstance } from 'fastify';
import { validatePromoInputSchema } from '@chirudeli/shared-types';
import { parseOrThrow } from '../../lib/validate';
import { resolvePromotion } from './promotions.service';

export async function promotionsRoutes(app: FastifyInstance) {
  app.post('/promotions/validate', async (req) => {
    const input = parseOrThrow(validatePromoInputSchema, req.body);
    const result = await resolvePromotion({
      code: input.code,
      subtotal: input.subtotal,
      businessIds: input.businessIds,
    });
    return {
      valid: result.valid,
      code: input.code.toUpperCase(),
      type: result.type,
      discountAmount: result.discountAmount,
      freeDelivery: result.freeDelivery,
      message: result.message,
    };
  });
}
