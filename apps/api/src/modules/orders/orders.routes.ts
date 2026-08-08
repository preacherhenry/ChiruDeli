import type { FastifyInstance } from 'fastify';
import {
  createOrderSchema,
  previewOrderSchema,
  cancelOrderSchema,
  submitReviewSchema,
  submitRiderReviewSchema,
} from '@chirudeli/shared-types';
import { parseOrThrow } from '../../lib/validate';
import { authenticate } from '../../middleware/authenticate';
import * as ordersService from './orders.service';

export async function ordersRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.post('/orders', async (req, reply) => {
    const input = parseOrThrow(createOrderSchema, req.body);
    const order = await ordersService.createOrder(req.authUser!.id, input);
    reply.code(201).send(order);
  });

  app.post('/orders/preview', async (req) => {
    const input = parseOrThrow(previewOrderSchema, req.body);
    return ordersService.previewOrder(req.authUser!.id, input);
  });

  app.get('/orders', async (req) => ordersService.listOrders(req.authUser!.id));

  // :id here is a master order id.
  app.get<{ Params: { id: string } }>('/orders/:id', async (req) => {
    return ordersService.getOrder(req.authUser!.id, req.params.id);
  });

  app.post<{ Params: { id: string } }>('/orders/:id/cancel', async (req) => {
    const input = parseOrThrow(cancelOrderSchema, req.body);
    return ordersService.cancelOrder(req.authUser!.id, req.params.id, input.reason);
  });

  app.post<{ Params: { id: string } }>('/orders/:id/rider-review', async (req) => {
    const input = parseOrThrow(submitRiderReviewSchema, req.body);
    return ordersService.submitRiderReview(req.authUser!.id, req.params.id, input);
  });

  // :id here is a STORE order id (rates that one business, not the whole master order).
  app.post<{ Params: { id: string } }>('/store-orders/:id/review', async (req) => {
    const input = parseOrThrow(submitReviewSchema, req.body);
    return ordersService.submitReview(req.authUser!.id, req.params.id, input);
  });
}
