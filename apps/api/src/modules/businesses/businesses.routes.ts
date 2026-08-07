import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parseOrThrow } from '../../lib/validate';
import * as businessesService from './businesses.service';

const listQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

const detailQuerySchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

export async function businessesRoutes(app: FastifyInstance) {
  app.get('/business-categories', async () => businessesService.listCategories());

  app.get('/businesses', async (req) => {
    const query = parseOrThrow(listQuerySchema, req.query);
    return businessesService.listBusinesses(query);
  });

  app.get<{ Params: { id: string } }>('/businesses/:id', async (req) => {
    const query = parseOrThrow(detailQuerySchema, req.query);
    return businessesService.getBusiness(req.params.id, query);
  });

  app.get<{ Params: { id: string } }>('/businesses/:id/products', async (req) => {
    return businessesService.listProducts(req.params.id);
  });
}
