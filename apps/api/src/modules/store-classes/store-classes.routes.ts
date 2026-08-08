import type { FastifyInstance } from 'fastify';
import { createStoreClassSchema, updateStoreClassSchema } from '@chirudeli/shared-types';
import { parseOrThrow } from '../../lib/validate';
import { authenticate, requireRole } from '../../middleware/authenticate';
import * as storeClassesService from './store-classes.service';

export async function storeClassesRoutes(app: FastifyInstance) {
  // Public — feeds both the customer "browse by class" screens and the
  // store-registration form's class picker.
  app.get('/store-classes', async () => storeClassesService.listStoreClasses());

  app.register(async (admin) => {
    admin.addHook('preHandler', authenticate);
    admin.addHook('preHandler', requireRole('SYSTEM_ADMIN'));

    admin.get('/admin/store-classes', async () => storeClassesService.listAdminStoreClasses());

    admin.post('/admin/store-classes', async (req, reply) => {
      const input = parseOrThrow(createStoreClassSchema, req.body);
      const created = await storeClassesService.createStoreClass(input, req.authUser!.id);
      reply.code(201).send(created);
    });

    admin.patch<{ Params: { id: string } }>('/admin/store-classes/:id', async (req) => {
      const input = parseOrThrow(updateStoreClassSchema, req.body);
      return storeClassesService.updateStoreClass(req.params.id, input, req.authUser!.id);
    });

    admin.delete<{ Params: { id: string } }>('/admin/store-classes/:id', async (req, reply) => {
      await storeClassesService.deleteStoreClass(req.params.id, req.authUser!.id);
      reply.code(204).send();
    });
  });
}
