import type { FastifyInstance } from 'fastify';
import { createAddressSchema } from '@chirudeli/shared-types';
import { parseOrThrow } from '../../lib/validate';
import { authenticate } from '../../middleware/authenticate';
import { prisma } from '../../lib/prisma';

export async function addressesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/addresses', async (req) => {
    const addresses = await prisma.address.findMany({
      where: { userId: req.authUser!.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return addresses.map((a) => ({
      id: a.id,
      label: a.label,
      line1: a.line1,
      area: a.area,
      latitude: a.latitude,
      longitude: a.longitude,
      deliveryInstructions: a.deliveryInstructions ?? undefined,
      isDefault: a.isDefault,
    }));
  });

  app.post('/addresses', async (req, reply) => {
    const input = parseOrThrow(createAddressSchema, req.body);
    if (input.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.authUser!.id },
        data: { isDefault: false },
      });
    }
    const address = await prisma.address.create({
      data: { ...input, userId: req.authUser!.id },
    });
    reply.code(201).send({
      id: address.id,
      label: address.label,
      line1: address.line1,
      area: address.area,
      latitude: address.latitude,
      longitude: address.longitude,
      deliveryInstructions: address.deliveryInstructions ?? undefined,
      isDefault: address.isDefault,
    });
  });
}
