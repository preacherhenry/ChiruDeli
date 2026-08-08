import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middleware/authenticate';
import { getPlatformStats } from './platform.service';

export async function platformRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireRole('SYSTEM_ADMIN'));

  app.get('/admin/stats', async () => getPlatformStats());
}
