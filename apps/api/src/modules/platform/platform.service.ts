import { prisma } from '../../lib/prisma';

const REVIEWABLE_STATUSES = ['PENDING_APPROVAL', 'UNDER_REVIEW', 'RESUBMISSION'] as const;

export async function getPlatformStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalStores,
    pendingStoreApplications,
    activeStores,
    suspendedStores,
    totalCustomers,
    totalRiders,
    ordersToday,
    revenueTodayAgg,
    commissionTodayAgg,
  ] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { status: { in: [...REVIEWABLE_STATUSES] } } }),
    prisma.business.count({ where: { status: 'APPROVED', isActivated: true } }),
    prisma.business.count({ where: { status: 'SUSPENDED' } }),
    prisma.customer.count(),
    prisma.rider.count(),
    prisma.masterOrder.count({ where: { placedAt: { gte: startOfToday } } }),
    prisma.masterOrder.aggregate({ where: { placedAt: { gte: startOfToday }, cancelledAt: null }, _sum: { total: true } }),
    prisma.commission.aggregate({ where: { createdAt: { gte: startOfToday } }, _sum: { amount: true } }),
  ]);

  return {
    totalStores,
    pendingStoreApplications,
    activeStores,
    suspendedStores,
    totalCustomers,
    totalRiders,
    ordersToday,
    revenueToday: Number(revenueTodayAgg._sum.total ?? 0),
    platformCommissionToday: Number(commissionTodayAgg._sum.amount ?? 0),
  };
}
