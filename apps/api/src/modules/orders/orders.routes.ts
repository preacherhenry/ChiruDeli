import type { FastifyInstance } from 'fastify';
import { createOrderSchema, cancelOrderSchema, submitReviewSchema } from '@chirudeli/shared-types';
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

  app.get('/orders', async (req) => ordersService.listOrders(req.authUser!.id));

  app.get<{ Params: { id: string } }>('/orders/:id', async (req) => {
    return ordersService.getOrder(req.authUser!.id, req.params.id);
  });

  app.post<{ Params: { id: string } }>('/orders/:id/cancel', async (req) => {
    const input = parseOrThrow(cancelOrderSchema, req.body);
    return ordersService.cancelOrder(req.authUser!.id, req.params.id, input.reason);
  });

  app.post<{ Params: { id: string } }>('/orders/:id/review', async (req) => {
    const input = parseOrThrow(submitReviewSchema, req.body);
    return ordersService.submitReview(req.authUser!.id, req.params.id, input);
  });
}
