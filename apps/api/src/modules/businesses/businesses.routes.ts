import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  registerStoreSchema,
  updateStoreProfileSchema,
  updateOpeningHoursSchema,
  setStoreOpenStatusSchema,
  uploadStoreDocumentSchema,
  reviewStoreDocumentSchema,
  rejectStoreSchema,
  requestStoreChangesSchema,
  suspendStoreSchema,
  adminUpdateStoreSchema,
  reassignStoreManagerSchema,
} from '@chirudeli/shared-types';
import { parseOrThrow } from '../../lib/validate';
import { authenticate, requireRole } from '../../middleware/authenticate';
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

const adminListQuerySchema = z.object({
  status: z.string().optional(),
  storeClassId: z.string().optional(),
  search: z.string().optional(),
});

export async function businessesRoutes(app: FastifyInstance) {
  // ── Public / customer-facing ────────────────────────────────────────
  app.get('/businesses', async (req) => businessesService.listBusinesses(parseOrThrow(listQuerySchema, req.query)));

  app.get<{ Params: { id: string } }>('/businesses/:id', async (req) => {
    const query = parseOrThrow(detailQuerySchema, req.query);
    return businessesService.getBusiness(req.params.id, query);
  });

  app.get<{ Params: { id: string } }>('/businesses/:id/products', async (req) => businessesService.listProducts(req.params.id));

  // ── Store registration (spec §2/§3/§4) — no auth required, this IS how
  // a store manager account is created. ──────────────────────────────
  app.post('/stores/register', async (req, reply) => {
    const input = parseOrThrow(registerStoreSchema, req.body);
    const result = await businessesService.registerStore(input);
    reply.code(201).send(result);
  });

  // ── Store manager: "my store" ───────────────────────────────────────
  app.register(async (manager) => {
    manager.addHook('preHandler', authenticate);
    manager.addHook('preHandler', requireRole('STORE_MANAGER'));

    manager.get('/manager/store', async (req) => businessesService.getMyStore(req.authUser!.id));

    manager.patch('/manager/store/profile', async (req) => {
      const input = parseOrThrow(updateStoreProfileSchema, req.body);
      return businessesService.updateMyStoreProfile(req.authUser!.id, input);
    });

    manager.patch('/manager/store/hours', async (req) => {
      const input = parseOrThrow(updateOpeningHoursSchema, req.body);
      return businessesService.updateMyStoreHours(req.authUser!.id, input);
    });

    manager.patch('/manager/store/open-status', async (req) => {
      const input = parseOrThrow(setStoreOpenStatusSchema, req.body);
      return businessesService.setMyStoreOpenStatus(req.authUser!.id, input.storeState);
    });

    manager.post('/manager/store/activate', async (req) => businessesService.activateMyStore(req.authUser!.id));

    manager.get('/manager/dashboard', async (req) => businessesService.getManagerDashboardStats(req.authUser!.id));

    manager.get('/manager/store/reviews', async (req) => businessesService.listMyStoreReviews(req.authUser!.id));

    manager.post('/manager/store/documents', async (req, reply) => {
      const input = parseOrThrow(uploadStoreDocumentSchema, req.body);
      const doc = await businessesService.uploadMyStoreDocument(req.authUser!.id, input);
      reply.code(201).send(doc);
    });
  });

  // ── System admin: store approvals / management ──────────────────────
  app.register(async (admin) => {
    admin.addHook('preHandler', authenticate);
    admin.addHook('preHandler', requireRole('SYSTEM_ADMIN'));

    admin.get('/admin/stores', async (req) => businessesService.listAdminBusinesses(parseOrThrow(adminListQuerySchema, req.query)));

    admin.get<{ Params: { id: string } }>('/admin/stores/:id', async (req) => businessesService.getAdminBusinessDetail(req.params.id));

    admin.patch<{ Params: { id: string } }>('/admin/stores/:id', async (req) => {
      const input = parseOrThrow(adminUpdateStoreSchema, req.body);
      return businessesService.adminUpdateStore(req.params.id, input, req.authUser!.id);
    });

    admin.post<{ Params: { id: string } }>('/admin/stores/:id/approve', async (req) =>
      businessesService.approveStore(req.params.id, req.authUser!.id),
    );

    admin.post<{ Params: { id: string } }>('/admin/stores/:id/reject', async (req) => {
      const input = parseOrThrow(rejectStoreSchema, req.body);
      return businessesService.rejectStore(req.params.id, input.reason, req.authUser!.id);
    });

    admin.post<{ Params: { id: string } }>('/admin/stores/:id/request-changes', async (req) => {
      const input = parseOrThrow(requestStoreChangesSchema, req.body);
      return businessesService.requestStoreChanges(req.params.id, input.message, req.authUser!.id);
    });

    admin.post<{ Params: { id: string } }>('/admin/stores/:id/suspend', async (req) => {
      const input = parseOrThrow(suspendStoreSchema, req.body);
      return businessesService.suspendStore(req.params.id, input.reason, req.authUser!.id);
    });

    admin.post<{ Params: { id: string } }>('/admin/stores/:id/reactivate', async (req) =>
      businessesService.reactivateStore(req.params.id, req.authUser!.id),
    );

    admin.post<{ Params: { id: string } }>('/admin/stores/:id/deactivate', async (req) =>
      businessesService.deactivateStore(req.params.id, req.authUser!.id),
    );

    admin.post<{ Params: { id: string; docId: string } }>('/admin/stores/:id/documents/:docId/review', async (req) => {
      const input = parseOrThrow(reviewStoreDocumentSchema, req.body);
      return businessesService.reviewStoreDocument(req.params.id, req.params.docId, input, req.authUser!.id);
    });

    admin.get('/admin/store-managers', async () => businessesService.listAdminStoreManagers());

    admin.get<{ Params: { id: string } }>('/admin/store-managers/:id', async (req) =>
      businessesService.getAdminStoreManagerDetail(req.params.id),
    );

    admin.post<{ Params: { id: string } }>('/admin/store-managers/:id/suspend', async (req) =>
      businessesService.suspendStoreManager(req.params.id, req.authUser!.id),
    );

    admin.post<{ Params: { id: string } }>('/admin/store-managers/:id/reactivate', async (req) =>
      businessesService.reactivateStoreManager(req.params.id, req.authUser!.id),
    );

    admin.post<{ Params: { id: string } }>('/admin/store-managers/:id/reset-password', async (req) =>
      businessesService.resetStoreManagerPassword(req.params.id, req.authUser!.id),
    );

    admin.post<{ Params: { id: string } }>('/admin/store-managers/:id/reassign', async (req) => {
      const input = parseOrThrow(reassignStoreManagerSchema, req.body);
      return businessesService.reassignStoreManager(req.params.id, input, req.authUser!.id);
    });
  });
}
