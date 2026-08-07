import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import * as notificationsService from './notifications.service';

export async function notificationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/notifications', async (req) => notificationsService.listNotifications(req.authUser!.id));

  app.patch<{ Params: { id: string } }>('/notifications/:id/read', async (req, reply) => {
    await notificationsService.markNotificationRead(req.authUser!.id, req.params.id);
    reply.code(204).send();
  });
}
