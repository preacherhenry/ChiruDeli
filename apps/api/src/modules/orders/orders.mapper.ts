import type { Prisma } from '@prisma/client';
import type { OrderStatus } from '@chirudeli/shared-types';
import { prisma } from '../../lib/prisma';

export const masterOrderInclude = {
  address: true,
  storeOrders: {
    include: {
      business: true,
      items: { include: { product: true } },
      statusEvents: { orderBy: { changedAt: 'asc' as const } },
      review: true,
    },
    orderBy: { sequence: 'asc' as const },
  },
  delivery: {
    include: {
      rider: { include: { user: true } },
      stops: { orderBy: { sequence: 'asc' as const } },
      locationPings: { orderBy: { recordedAt: 'desc' as const }, take: 1 },
    },
  },
  payment: true,
} satisfies Prisma.MasterOrderInclude;

export type MasterOrderWithRelations = Prisma.MasterOrderGetPayload<{ include: typeof masterOrderInclude }>;
type StoreOrderWithRelations = MasterOrderWithRelations['storeOrders'][number];

export async function loadMasterOrder(id: string): Promise<MasterOrderWithRelations | null> {
  return prisma.masterOrder.findUnique({ where: { id }, include: masterOrderInclude });
}

/// Least-advanced non-cancelled store order status "gates" the whole master
/// order — it isn't DELIVERED until every store's items have arrived, and a
/// single cancelled store shouldn't hide the others' real progress.
const STATUS_PROGRESSION: OrderStatus[] = [
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
];

export function deriveOverallStatus(storeOrders: Array<{ status: OrderStatus }>): OrderStatus {
  const active = storeOrders.filter((o) => o.status !== 'CANCELLED');
  if (active.length === 0) return 'CANCELLED';
  if (active.every((o) => o.status === 'DELIVERED')) return 'DELIVERED';

  let least = active[0]!.status;
  for (const o of active) {
    if (STATUS_PROGRESSION.indexOf(o.status) < STATUS_PROGRESSION.indexOf(least)) least = o.status;
  }
  return least;
}

function mapStoreOrderToDto(order: StoreOrderWithRelations) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    sequence: order.sequence,
    businessId: order.businessId,
    businessName: order.business.name,
    businessLocation: { latitude: order.business.latitude, longitude: order.business.longitude },
    status: order.status,
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
    subtotal: Number(order.subtotal),
    statusHistory: order.statusEvents.map((e) => ({ status: e.status, changedAt: e.changedAt.toISOString() })),
    hasReview: order.review != null,
  };
}

function estimateArrivalMinutes(order: MasterOrderWithRelations): number | null {
  const delivery = order.delivery;
  if (!delivery || delivery.status === 'COMPLETED') return null;
  const remainingStops = delivery.stops.filter((s) => s.status !== 'COMPLETED').length;
  if (remainingStops === 0) return null;
  return Math.max(3, remainingStops * 8);
}

export function mapMasterOrderToDto(order: MasterOrderWithRelations) {
  const delivery = order.delivery;
  const latestPing = delivery?.locationPings[0];
  const rider = delivery?.rider;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: deriveOverallStatus(order.storeOrders),
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    storeOrders: order.storeOrders.map(mapStoreOrderToDto),
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
    rider: rider
      ? {
          id: rider.id,
          fullName: rider.fullName,
          photoUrl: rider.profilePhotoUrl,
          vehicleType: rider.vehicleType,
          ratingAvg: rider.ratingAvg,
          phone: rider.user.phone,
          location: latestPing
            ? { latitude: latestPing.latitude, longitude: latestPing.longitude }
            : rider.currentLatitude != null && rider.currentLongitude != null
              ? { latitude: rider.currentLatitude, longitude: rider.currentLongitude }
              : null,
        }
      : null,
    estimatedArrivalMinutes: estimateArrivalMinutes(order),
    deliveryStops: (delivery?.stops ?? []).map((stop) => ({
      id: stop.id,
      sequence: stop.sequence,
      type: stop.type,
      label: stop.label,
      location: { latitude: stop.latitude, longitude: stop.longitude },
      status: stop.status,
      storeOrderId: stop.storeOrderId,
    })),
    deliveryPin: delivery?.deliveryPin,
    riderRating: order.riderRating,
    riderComment: order.riderComment,
    placedAt: order.placedAt.toISOString(),
  };
}

export function mapMasterOrderToSummary(order: MasterOrderWithRelations) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    businessNames: order.storeOrders.map((so) => so.business.name),
    status: deriveOverallStatus(order.storeOrders),
    itemsSummary: order.storeOrders
      .flatMap((so) => so.items.map((i) => `${i.nameSnapshot} x${i.quantity}`))
      .join(', '),
    total: Number(order.total),
    placedAt: order.placedAt.toISOString(),
  };
}
