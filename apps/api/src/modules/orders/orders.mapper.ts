import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export const orderInclude = {
  business: true,
  address: true,
  items: { include: { product: true } },
  rider: {
    include: {
      user: true,
      locationPings: { orderBy: { recordedAt: 'desc' as const }, take: 1 },
    },
  },
  delivery: true,
  payment: true,
  review: true,
  statusEvents: { orderBy: { changedAt: 'asc' as const } },
} satisfies Prisma.OrderInclude;

export type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export async function loadOrder(id: string): Promise<OrderWithRelations | null> {
  return prisma.order.findUnique({ where: { id }, include: orderInclude });
}

function estimateArrivalMinutes(order: OrderWithRelations): number | null {
  if (!order.delivery) return null;
  switch (order.status) {
    case 'RIDER_ASSIGNED':
      return Math.max(5, Math.round(order.delivery.distanceKm * 3) + 8);
    case 'PICKED_UP':
    case 'ON_THE_WAY':
      return Math.max(2, Math.round(order.delivery.distanceKm * 2.5));
    default:
      return null;
  }
}

export function mapOrderToDto(order: OrderWithRelations) {
  const latestPing = order.rider?.locationPings[0];

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    businessId: order.businessId,
    businessName: order.business.name,
    businessLocation: { latitude: order.business.latitude, longitude: order.business.longitude },
    status: order.status,
    deliveryStatus: order.delivery?.status ?? null,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      nameSnapshot: item.nameSnapshot,
      priceSnapshot: Number(item.priceSnapshot),
      quantity: item.quantity,
      addOnsLabel: item.addOnsLabel ?? undefined,
      specialInstructions: item.specialInstructions ?? undefined,
      lineTotal:
        Number(item.priceSnapshot) * item.quantity + Number(item.addOnsPriceSnapshot) * item.quantity,
    })),
    totals: {
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      serviceFee: Number(order.serviceFee),
      discount: Number(order.discountAmount),
      total: Number(order.total),
    },
    address: {
      id: order.address.id,
      label: order.address.label,
      line1: order.address.line1,
      area: order.address.area,
      latitude: order.address.latitude,
      longitude: order.address.longitude,
      deliveryInstructions: order.address.deliveryInstructions ?? undefined,
      isDefault: order.address.isDefault,
    },
    deliveryInstructions: order.deliveryInstructions ?? undefined,
    rider: order.rider
      ? {
          id: order.rider.id,
          fullName: order.rider.fullName,
          photoUrl: order.rider.profilePhotoUrl,
          vehicleType: order.rider.vehicleType,
          ratingAvg: order.rider.ratingAvg,
          phone: order.rider.user.phone,
          location: latestPing
            ? { latitude: latestPing.latitude, longitude: latestPing.longitude }
            : order.rider.currentLatitude != null && order.rider.currentLongitude != null
              ? { latitude: order.rider.currentLatitude, longitude: order.rider.currentLongitude }
              : null,
        }
      : null,
    estimatedArrivalMinutes: estimateArrivalMinutes(order),
    statusHistory: order.statusEvents.map((e) => ({
      status: e.status,
      changedAt: e.changedAt.toISOString(),
    })),
    placedAt: order.placedAt.toISOString(),
    deliveryPin: order.delivery?.deliveryPin,
    hasReview: order.review != null,
  };
}

export function mapOrderToSummary(order: OrderWithRelations) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    businessName: order.business.name,
    status: order.status,
    itemsSummary: order.items.map((i) => `${i.nameSnapshot} x${i.quantity}`).join(', '),
    total: Number(order.total),
    placedAt: order.placedAt.toISOString(),
  };
}
