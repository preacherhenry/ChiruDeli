import type { FastifyInstance } from 'fastify';
import { createProductCategorySchema, updateProductCategorySchema, upsertProductSchema } from '@chirudeli/shared-types';
import { parseOrThrow } from '../../lib/validate';
import { authenticate, requireRole } from '../../middleware/authenticate';
import * as productsService from './products.service';

export async function productsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireRole('STORE_MANAGER'));

  app.get('/manager/product-categories', async (req) => productsService.listMyProductCategories(req.authUser!.id));

  app.post('/manager/product-categories', async (req, reply) => {
    const input = parseOrThrow(createProductCategorySchema, req.body);
    const category = await productsService.createMyProductCategory(req.authUser!.id, input);
    reply.code(201).send(category);
  });

  app.patch<{ Params: { id: string } }>('/manager/product-categories/:id', async (req) => {
    const input = parseOrThrow(updateProductCategorySchema, req.body);
    return productsService.updateMyProductCategory(req.authUser!.id, req.params.id, input);
  });

  app.delete<{ Params: { id: string } }>('/manager/product-categories/:id', async (req, reply) => {
    await productsService.deleteMyProductCategory(req.authUser!.id, req.params.id);
    reply.code(204).send();
  });

  app.get('/manager/products', async (req) => productsService.listMyProducts(req.authUser!.id));

  app.post('/manager/products', async (req, reply) => {
    const input = parseOrThrow(upsertProductSchema, req.body);
    const product = await productsService.createMyProduct(req.authUser!.id, input);
    reply.code(201).send(product);
  });

  app.patch<{ Params: { id: string } }>('/manager/products/:id', async (req) => {
    const input = parseOrThrow(upsertProductSchema, req.body);
    return productsService.updateMyProduct(req.authUser!.id, req.params.id, input);
  });

  app.delete<{ Params: { id: string } }>('/manager/products/:id', async (req, reply) => {
    await productsService.deleteMyProduct(req.authUser!.id, req.params.id);
    reply.code(204).send();
  });
}
