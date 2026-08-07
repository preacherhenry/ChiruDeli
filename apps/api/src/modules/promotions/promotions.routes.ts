import type { FastifyInstance } from 'fastify';
import { validatePromoQuerySchema } from '@chirudeli/shared-types';
import { parseOrThrow } from '../../lib/validate';
import { resolvePromotion } from './promotions.service';

export async function promotionsRoutes(app: FastifyInstance) {
  app.get('/promotions/validate', async (req) => {
    const query = parseOrThrow(validatePromoQuerySchema, req.query);
    const result = await resolvePromotion({
      code: query.code,
      subtotal: query.subtotal,
      businessId: query.businessId,
    });
    return {
      valid: result.valid,
      code: query.code.toUpperCase(),
      type: result.type,
      discountAmount: result.discountAmount,
      freeDelivery: result.freeDelivery,
      message: result.message,
    };
  });
}
