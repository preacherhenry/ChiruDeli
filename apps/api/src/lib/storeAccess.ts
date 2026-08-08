import { prisma } from './prisma';
import { ForbiddenError } from './errors';

/** Mirrors lib/customers.ts's requireCustomerProfile. */
export async function requireStoreManagerProfile(userId: string) {
  const manager = await prisma.storeManager.findUnique({ where: { userId } });
  if (!manager) throw new ForbiddenError('This action requires a store manager account.');
  return manager;
}

/**
 * Never trust a store id supplied by the frontend (spec §32) — this is the
 * one place that decides whether the authenticated user actually manages a
 * given business, and every manager-scoped route/service call goes through
 * it (or `getManagedBusinessId` below for "my store" routes that shouldn't
 * even accept a store id from the client).
 */
export async function requireManagedBusiness(userId: string, businessId: string) {
  const assignment = await prisma.storeManagerAssignment.findFirst({
    where: { businessId, storeManager: { userId } },
    include: { business: true },
  });
  if (!assignment) throw new ForbiddenError('You do not manage this store.');
  return assignment.business;
}

/** For "my store" endpoints (`/manager/*`) — resolves the caller's own
 * (primary) store instead of accepting one in the request at all. */
export async function getManagedBusinessId(userId: string): Promise<string> {
  const manager = await requireStoreManagerProfile(userId);
  const assignment = await prisma.storeManagerAssignment.findFirst({
    where: { storeManagerId: manager.id },
    orderBy: { isPrimary: 'desc' },
  });
  if (!assignment) throw new ForbiddenError('No store is assigned to this account yet.');
  return assignment.businessId;
}

/** Resolves who should receive "new order"/store-status notifications for a
 * business — replaces the old direct `business.ownerId` read. */
export async function getPrimaryManagerUserId(businessId: string): Promise<string | null> {
  const assignment = await prisma.storeManagerAssignment.findFirst({
    where: { businessId },
    orderBy: { isPrimary: 'desc' },
    include: { storeManager: true },
  });
  return assignment?.storeManager.userId ?? null;
}
