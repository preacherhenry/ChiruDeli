import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parseOrThrow } from '../../lib/validate';
import { prisma } from '../../lib/prisma';
import * as ordersService from '../orders/orders.service';

const advanceBodySchema = z.object({
  toStatus: z.enum(['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED']),
});
const assignRiderBodySchema = z.object({ riderId: z.string().uuid() });
const pingBodySchema = z.object({ latitude: z.number(), longitude: z.number(), riderId: z.string().uuid() });

/**
 * Dev-only harness so `scripts/simulate-order-progress.ts` can drive a real
 * order through the full status workflow — and trigger real Socket.io
 * broadcasts from THIS running server process — without the rider/business
 * apps existing yet. Not part of the public product API surface (see
 * docs/roadmap.md); business/rider dashboards will replace these with
 * properly role-gated endpoints.
 */
export async function devRoutes(app: FastifyInstance) {
  if (process.env.NODE_ENV === 'production') return;

  app.post<{ Params: { id: string } }>('/dev/orders/:id/advance', async (req) => {
    const body = parseOrThrow(advanceBodySchema, req.body);
    return ordersService.advanceOrderStatus(req.params.id, body.toStatus);
  });

  app.post<{ Params: { id: string } }>('/dev/orders/:id/assign-rider', async (req) => {
    const body = parseOrThrow(assignRiderBodySchema, req.body);
    return ordersService.assignRider(req.params.id, body.riderId);
  });

  app.post<{ Params: { id: string } }>('/dev/deliveries/:id/ping', async (req, reply) => {
    const body = parseOrThrow(pingBodySchema, req.body);
    await ordersService.recordRiderLocationPing(req.params.id, body.riderId, body.latitude, body.longitude);
    reply.code(204).send();
  });

  app.get('/dev/orders/latest-pending', async (req, reply) => {
    const { phone } = req.query as { phone?: string };
    const user = phone ? await prisma.user.findUnique({ where: { phone } }) : null;
    const customer = user ? await prisma.customer.findUnique({ where: { userId: user.id } }) : null;
    const order = await prisma.order.findFirst({
      where: customer ? { customerId: customer.id, status: 'PENDING_CONFIRMATION' } : { status: 'PENDING_CONFIRMATION' },
      orderBy: { placedAt: 'desc' },
    });
    if (!order) return reply.code(404).send({ message: 'No pending order found.' });
    return { id: order.id, orderNumber: order.orderNumber };
  });

  app.get('/dev/riders/online', async () => {
    return prisma.rider.findMany({
      where: { status: 'APPROVED', onlineStatus: 'ONLINE' },
      select: { id: true, fullName: true, currentLatitude: true, currentLongitude: true },
    });
  });
}
