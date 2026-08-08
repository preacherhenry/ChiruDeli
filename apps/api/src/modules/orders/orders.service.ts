import type { Business, Prisma } from '@prisma/client';
import type { CreateOrderInput, CreateOrderItemInput } from '@chirudeli/shared-types';
import { prisma } from '../../lib/prisma';
import { env } from '../../lib/env';
import {
  ConflictError,
  NotFoundError,
  OutsideServiceAreaError,
  ValidationError,
} from '../../lib/errors';
import {
  calculateCommission,
  calculateMultiStoreDeliveryFee,
  getActiveFeeConfig,
  resolveZoneForCoordinates,
  sequencePickupStops,
} from '../../lib/fees';
import { requireCustomerProfile } from '../../lib/customers';
import { getManagedBusinessId, getPrimaryManagerUserId, requireManagedBusiness } from '../../lib/storeAccess';
import { generateOrderNumber, generateDeliveryPin } from '../../lib/orderNumber';
import { getPaymentProvider } from '../../lib/payments';
import { resolvePromotion } from '../promotions/promotions.service';
import { assertValidOrderTransition, canCustomerCancel } from '../../lib/orderStateMachine';
import { recordAudit } from '../../lib/audit';
import { createNotification } from '../notifications/notifications.service';
import { emitOrderStatusChanged, emitDeliveryLocationUpdated } from '../../realtime/events';
import {
  loadMasterOrder,
  mapMasterOrderToDto,
  mapMasterOrderToSummary,
  deriveOverallStatus,
  type MasterOrderWithRelations,
} from './orders.mapper';

const SERVICE_FEE = 5;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function getMasterOrderOrThrow(id: string): Promise<MasterOrderWithRelations> {
  const order = await loadMasterOrder(id);
  if (!order) throw new NotFoundError('Order');
  return order;
}

async function broadcastStatus(order: MasterOrderWithRelations) {
  const dto = mapMasterOrderToDto(order);
  emitOrderStatusChanged(order.id, {
    orderId: order.id,
    status: dto.status,
    rider: dto.rider,
    estimatedArrivalMinutes: dto.estimatedArrivalMinutes,
    deliveryStops: dto.deliveryStops,
    changedAt: new Date().toISOString(),
  });
}

// ── Checkout ─────────────────────────────────────────────────────────────

interface StoreGroup {
  businessId: string;
  subtotal: number;
  itemsToCreate: Array<{
    productId: string;
    nameSnapshot: string;
    priceSnapshot: Prisma.Decimal;
    quantity: number;
    addOnsLabel: string | undefined;
    addOnsPriceSnapshot: number;
    specialInstructions: string | undefined;
  }>;
}

interface ComputedOrder {
  customer: { id: string; userId: string };
  address: { id: string; userId: string; latitude: number; longitude: number };
  businessById: Map<string, Business>;
  ordered: StoreGroup[];
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  promotionId?: string;
}

/** Shared by createOrder and previewOrder — validates the cart, groups
 * items by business, and works out subtotal/delivery fee/discount. Doing
 * no DB writes itself is what makes it safe to call for a preview. */
async function computeOrder(
  userId: string,
  input: { items: CreateOrderItemInput[]; addressId: string; promoCode?: string },
): Promise<ComputedOrder> {
  const customer = await requireCustomerProfile(userId);

  const address = await prisma.address.findUnique({ where: { id: input.addressId } });
  if (!address || address.userId !== userId) throw new NotFoundError('Address');

  const zone = await resolveZoneForCoordinates(address);
  if (!zone) throw new OutsideServiceAreaError();

  const businessIds = [...new Set(input.items.map((i) => i.businessId))];
  const businesses = await prisma.business.findMany({ where: { id: { in: businessIds } } });
  const businessById = new Map(businesses.map((b) => [b.id, b]));
  for (const businessId of businessIds) {
    const business = businessById.get(businessId);
    if (!business || business.status !== 'APPROVED' || !business.isActivated) throw new NotFoundError('Business');
    if (business.storeState !== 'OPEN') {
      throw new ConflictError(`${business.name} is not accepting orders right now.`, 'BUSINESS_CLOSED');
    }
  }

  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map((i) => i.productId) } },
    include: { addOns: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  const groups = new Map<string, StoreGroup>();

  for (const item of input.items) {
    const product = productById.get(item.productId);
    if (!product) throw new NotFoundError('Product');
    if (product.businessId !== item.businessId) {
      throw new ValidationError('One of these products does not belong to the business specified.');
    }
    if (!product.isAvailable) {
      throw new ConflictError(`${product.name} is currently unavailable.`, 'PRODUCT_UNAVAILABLE');
    }
    const selectedAddOns = product.addOns.filter((a) => item.addOnIds.includes(a.id));
    const addOnsPriceSnapshot = selectedAddOns.reduce((sum, a) => sum + Number(a.priceDelta), 0);
    const lineTotal = (Number(product.price) + addOnsPriceSnapshot) * item.quantity;

    let group = groups.get(item.businessId);
    if (!group) {
      group = { businessId: item.businessId, subtotal: 0, itemsToCreate: [] };
      groups.set(item.businessId, group);
    }
    group.itemsToCreate.push({
      productId: product.id,
      nameSnapshot: product.name,
      priceSnapshot: product.price,
      quantity: item.quantity,
      addOnsLabel: selectedAddOns.map((a) => a.name).join(', ') || undefined,
      addOnsPriceSnapshot,
      specialInstructions: item.specialInstructions,
    });
    group.subtotal = round2(group.subtotal + lineTotal);
  }

  // Route order (and the distance it implies) is a property of the cart's
  // geography, decided once here — a rider doesn't get to reorder it later.
  const { ordered, totalDistanceKm } = sequencePickupStops(
    [...groups.values()].map((g) => {
      const business = businessById.get(g.businessId)!;
      return { ...g, latitude: business.latitude, longitude: business.longitude };
    }),
    address,
  );

  const subtotal = round2(ordered.reduce((sum, g) => sum + g.subtotal, 0));
  const feeConfig = await getActiveFeeConfig();
  const deliveryFee = calculateMultiStoreDeliveryFee({
    zone,
    totalDistanceKm,
    feeConfig,
    storeCount: ordered.length,
  });

  let discountAmount = 0;
  let promotionId: string | undefined;
  if (input.promoCode) {
    const promo = await resolvePromotion({
      code: input.promoCode,
      subtotal,
      businessIds,
      customerId: customer.id,
    });
    if (!promo.valid) throw new ValidationError(promo.message);
    promotionId = promo.promotionId;
    discountAmount = promo.freeDelivery ? deliveryFee : (promo.discountAmount ?? 0);
  }

  return { customer, address, businessById, ordered, subtotal, deliveryFee, discountAmount, promotionId };
}

export async function previewOrder(
  userId: string,
  input: { items: CreateOrderItemInput[]; addressId: string; promoCode?: string },
) {
  const computed = await computeOrder(userId, input);
  const total = Math.max(0, round2(computed.subtotal + computed.deliveryFee + SERVICE_FEE - computed.discountAmount));
  return {
    totals: {
      subtotal: computed.subtotal,
      deliveryFee: computed.deliveryFee,
      serviceFee: SERVICE_FEE,
      discount: computed.discountAmount,
      total,
    },
    stores: computed.ordered.map((g) => ({
      businessId: g.businessId,
      businessName: computed.businessById.get(g.businessId)!.name,
      subtotal: g.subtotal,
    })),
  };
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  const existing = await prisma.masterOrder.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return mapMasterOrderToDto(await getMasterOrderOrThrow(existing.id));

  const { customer, address, businessById, ordered, subtotal, deliveryFee, discountAmount, promotionId } =
    await computeOrder(userId, input);

  const total = Math.max(0, round2(subtotal + deliveryFee + SERVICE_FEE - discountAmount));

  const paymentProvider = getPaymentProvider(input.paymentMethod);
  const chargeResult = await paymentProvider.charge(total, input.idempotencyKey);

  const orderNumber = generateOrderNumber();

  const masterOrder = await prisma.$transaction(async (tx) => {
    const created = await tx.masterOrder.create({
      data: {
        orderNumber,
        customerId: customer.id,
        addressId: address.id,
        paymentMethod: input.paymentMethod,
        paymentStatus: chargeResult.status,
        subtotal,
        deliveryFee,
        serviceFee: SERVICE_FEE,
        discountAmount,
        total,
        deliveryInstructions: input.deliveryInstructions,
        idempotencyKey: input.idempotencyKey,
        promotionId,
        payment: {
          create: {
            method: input.paymentMethod,
            status: chargeResult.status,
            amount: total,
            providerRef: chargeResult.providerRef,
          },
        },
        ...(promotionId
          ? { promotionRedemption: { create: { promotionId, customerId: customer.id } } }
          : {}),
      },
    });

    let sequence = 0;
    for (const group of ordered) {
      sequence++;
      const business = businessById.get(group.businessId)!;
      const commissionPercent = business.commissionOverridePercent
        ? Number(business.commissionOverridePercent)
        : env.DEFAULT_COMMISSION_PERCENT;
      const { commissionAmount, businessPayoutAmount } = calculateCommission(group.subtotal, commissionPercent);

      await tx.order.create({
        data: {
          orderNumber: `${orderNumber}-${String(sequence).padStart(2, '0')}`,
          masterOrderId: created.id,
          sequence,
          customerId: customer.id,
          businessId: business.id,
          status: 'PENDING_CONFIRMATION',
          subtotal: group.subtotal,
          commissionPercent,
          commissionAmount,
          businessPayoutAmount,
          items: { create: group.itemsToCreate },
          statusEvents: { create: { status: 'PENDING_CONFIRMATION' } },
          commission: { create: { businessId: business.id, percent: commissionPercent, amount: commissionAmount } },
        },
      });
    }

    return created;
  }, { maxWait: 10_000, timeout: 20_000 });

  await recordAudit({
    actorUserId: userId,
    action: 'ORDER_PLACED',
    entityType: 'MasterOrder',
    entityId: masterOrder.id,
    metadata: { total, businessIds: ordered.map((g) => g.businessId), storeCount: ordered.length },
  });

  for (const group of ordered) {
    const business = businessById.get(group.businessId)!;
    const managerUserId = await getPrimaryManagerUserId(business.id);
    if (managerUserId) {
      await createNotification({
        userId: managerUserId,
        type: 'NEW_ORDER',
        title: 'New order received',
        body: `Order ${orderNumber} includes K${group.subtotal} worth of items from you.`,
        data: { masterOrderId: masterOrder.id },
      });
    }
  }

  return mapMasterOrderToDto(await getMasterOrderOrThrow(masterOrder.id));
}

// ── Reads ────────────────────────────────────────────────────────────────

export async function getOrder(userId: string, masterOrderId: string) {
  const customer = await requireCustomerProfile(userId);
  const order = await getMasterOrderOrThrow(masterOrderId);
  if (order.customerId !== customer.id) throw new NotFoundError('Order');
  return mapMasterOrderToDto(order);
}

export async function listOrders(userId: string) {
  const customer = await requireCustomerProfile(userId);
  const orders = await prisma.masterOrder.findMany({
    where: { customerId: customer.id },
    orderBy: { placedAt: 'desc' },
  });
  const full = await Promise.all(orders.map((o) => getMasterOrderOrThrow(o.id)));
  return full.map(mapMasterOrderToSummary);
}

// ── Cancellation ─────────────────────────────────────────────────────────

export async function cancelOrder(userId: string, masterOrderId: string, reason: string) {
  const customer = await requireCustomerProfile(userId);
  const order = await getMasterOrderOrThrow(masterOrderId);
  if (order.customerId !== customer.id) throw new NotFoundError('Order');

  const allCancellable = order.storeOrders.every((so) => canCustomerCancel(so.status));
  if (!allCancellable) {
    throw new ConflictError(
      'This order can no longer be cancelled — at least one store has already started preparing it.',
      'CANCELLATION_WINDOW_CLOSED',
    );
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.masterOrder.update({
      where: { id: masterOrderId },
      data: {
        cancelledAt: now,
        cancelReason: reason,
        paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus,
      },
    }),
    ...order.storeOrders.map((so) =>
      prisma.order.update({ where: { id: so.id }, data: { status: 'CANCELLED', cancelledAt: now, cancelReason: reason } }),
    ),
    ...order.storeOrders.map((so) =>
      prisma.orderStatusEvent.create({ data: { orderId: so.id, status: 'CANCELLED', changedByUserId: userId } }),
    ),
  ]);

  await recordAudit({ actorUserId: userId, action: 'ORDER_CANCELLED', entityType: 'MasterOrder', entityId: masterOrderId, metadata: { reason } });

  const updated = await getMasterOrderOrThrow(masterOrderId);
  await broadcastStatus(updated);
  for (const so of order.storeOrders) {
    const managerUserId = await getPrimaryManagerUserId(so.businessId);
    if (managerUserId) {
      await createNotification({
        userId: managerUserId,
        type: 'ORDER_CANCELLED',
        title: 'Order cancelled',
        body: `Order ${so.orderNumber} was cancelled by the customer.`,
        data: { storeOrderId: so.id },
      });
    }
  }
  return mapMasterOrderToDto(updated);
}

// ── Reviews ──────────────────────────────────────────────────────────────

export async function submitReview(
  userId: string,
  storeOrderId: string,
  input: { businessRating: number; businessComment?: string },
) {
  const customer = await requireCustomerProfile(userId);
  const storeOrder = await prisma.order.findUnique({ where: { id: storeOrderId } });
  if (!storeOrder || storeOrder.customerId !== customer.id) throw new NotFoundError('Order');
  if (storeOrder.status !== 'DELIVERED') {
    throw new ConflictError('You can only review orders after they have been delivered.');
  }
  const existing = await prisma.review.findUnique({ where: { orderId: storeOrderId } });
  if (existing) throw new ConflictError('You already reviewed this order.');

  const review = await prisma.review.create({
    data: {
      orderId: storeOrderId,
      customerId: customer.id,
      businessId: storeOrder.businessId,
      businessRating: input.businessRating,
      businessComment: input.businessComment,
    },
  });

  const agg = await prisma.review.aggregate({
    where: { businessId: storeOrder.businessId },
    _avg: { businessRating: true },
    _count: { businessRating: true },
  });
  await prisma.business.update({
    where: { id: storeOrder.businessId },
    data: { ratingAvg: agg._avg.businessRating ?? 0, ratingCount: agg._count.businessRating },
  });

  return {
    id: review.id,
    orderId: review.orderId,
    businessRating: review.businessRating,
    businessComment: review.businessComment,
    createdAt: review.createdAt.toISOString(),
  };
}

export async function submitRiderReview(
  userId: string,
  masterOrderId: string,
  input: { riderRating: number; riderComment?: string },
) {
  const customer = await requireCustomerProfile(userId);
  const order = await getMasterOrderOrThrow(masterOrderId);
  if (order.customerId !== customer.id) throw new NotFoundError('Order');
  if (deriveOverallStatus(order.storeOrders) !== 'DELIVERED') {
    throw new ConflictError('You can only rate your rider after delivery.');
  }
  if (order.riderRating != null) throw new ConflictError('You already rated your rider for this order.');
  const riderId = order.delivery?.riderId;
  if (!riderId) throw new ConflictError('No rider was assigned to this order.');

  await prisma.masterOrder.update({
    where: { id: masterOrderId },
    data: { riderRating: input.riderRating, riderComment: input.riderComment },
  });

  const agg = await prisma.masterOrder.aggregate({
    where: { delivery: { riderId }, riderRating: { not: null } },
    _avg: { riderRating: true },
    _count: { riderRating: true },
  });
  await prisma.rider.update({
    where: { id: riderId },
    data: { ratingAvg: agg._avg.riderRating ?? 0, ratingCount: agg._count.riderRating },
  });

  return mapMasterOrderToDto(await getMasterOrderOrThrow(masterOrderId));
}

// ── Status transitions (business side — independent per store) ──────────
// Exposed for the follow-up business dashboard AND used directly by
// scripts/simulate-order-progress.ts this session (see docs/roadmap.md).

const STORE_STATUS_NOTIFICATION_COPY: Record<
  'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP',
  { type: 'ORDER_ACCEPTED' | 'ORDER_PREPARING'; title: string; body: string }
> = {
  CONFIRMED: { type: 'ORDER_ACCEPTED', title: 'Order confirmed', body: 'confirmed your order.' },
  PREPARING: { type: 'ORDER_PREPARING', title: 'Preparing your order', body: 'is preparing your order.' },
  READY_FOR_PICKUP: { type: 'ORDER_PREPARING', title: 'Ready for pickup', body: 'has your order ready and waiting for a rider.' },
};

export async function advanceStoreOrderStatus(
  storeOrderId: string,
  toStatus: 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP',
) {
  const storeOrder = await prisma.order.findUnique({ where: { id: storeOrderId }, include: { business: true } });
  if (!storeOrder) throw new NotFoundError('Order');
  assertValidOrderTransition(storeOrder.status, toStatus);

  const timestampField = { CONFIRMED: 'confirmedAt', PREPARING: 'preparingAt', READY_FOR_PICKUP: 'readyAt' }[toStatus];

  await prisma.$transaction([
    prisma.order.update({ where: { id: storeOrderId }, data: { status: toStatus, [timestampField]: new Date() } }),
    prisma.orderStatusEvent.create({ data: { orderId: storeOrderId, status: toStatus } }),
  ]);

  const copy = STORE_STATUS_NOTIFICATION_COPY[toStatus];
  const customer = await prisma.customer.findUnique({ where: { id: storeOrder.customerId } });
  if (customer) {
    await createNotification({
      userId: customer.userId,
      type: copy.type,
      title: copy.title,
      body: `${storeOrder.business.name} ${copy.body}`,
      data: { masterOrderId: storeOrder.masterOrderId, storeOrderId },
    });
  }

  const updated = await getMasterOrderOrThrow(storeOrder.masterOrderId);
  await broadcastStatus(updated);
  return updated;
}

// ── Delivery (rider side — shared across every store in the master order) ─

export async function assignRiderToMasterOrder(masterOrderId: string, riderId: string) {
  const order = await getMasterOrderOrThrow(masterOrderId);

  const notReady = order.storeOrders.filter((so) => so.status !== 'READY_FOR_PICKUP');
  if (notReady.length > 0) {
    throw new ConflictError('Every store must be ready for pickup before a rider can be assigned.', 'NOT_ALL_READY');
  }

  const rider = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!rider || rider.status !== 'APPROVED') throw new NotFoundError('Rider');

  const sortedStoreOrders = [...order.storeOrders].sort((a, b) => a.sequence - b.sequence);
  const { totalDistanceKm } = sequencePickupStops(
    sortedStoreOrders.map((so) => ({ latitude: so.business.latitude, longitude: so.business.longitude })),
    order.address,
  );

  const stopsData = [
    ...sortedStoreOrders.map((so, idx) => ({
      sequence: idx + 1,
      type: 'PICKUP' as const,
      storeOrderId: so.id,
      label: so.business.name,
      latitude: so.business.latitude,
      longitude: so.business.longitude,
    })),
    {
      sequence: sortedStoreOrders.length + 1,
      type: 'DROPOFF' as const,
      storeOrderId: null,
      label: 'Customer delivery',
      latitude: order.address.latitude,
      longitude: order.address.longitude,
    },
  ];

  await prisma.$transaction([
    prisma.masterDelivery.create({
      data: {
        masterOrderId,
        riderId,
        status: 'ASSIGNED',
        totalDistanceKm,
        estimatedEarnings: order.deliveryFee,
        deliveryPin: generateDeliveryPin(),
        stops: { create: stopsData },
      },
    }),
    ...sortedStoreOrders.map((so) => prisma.order.update({ where: { id: so.id }, data: { status: 'RIDER_ASSIGNED' } })),
    ...sortedStoreOrders.map((so) => prisma.orderStatusEvent.create({ data: { orderId: so.id, status: 'RIDER_ASSIGNED' } })),
  ]);

  const customer = await prisma.customer.findUnique({ where: { id: order.customerId } });
  if (customer) {
    await createNotification({
      userId: customer.userId,
      type: 'RIDER_ASSIGNED',
      title: 'Rider assigned',
      body: `${rider.fullName} is heading out to collect your order${sortedStoreOrders.length > 1 ? `s from ${sortedStoreOrders.length} stores` : ''}.`,
      data: { masterOrderId },
    });
  }

  const updated = await getMasterOrderOrThrow(masterOrderId);
  await broadcastStatus(updated);
  return updated;
}

export async function completeDeliveryStop(masterOrderId: string, stopId: string) {
  const order = await getMasterOrderOrThrow(masterOrderId);
  const delivery = order.delivery;
  if (!delivery) throw new NotFoundError('Delivery');

  const stops = [...delivery.stops].sort((a, b) => a.sequence - b.sequence);
  const stopIndex = stops.findIndex((s) => s.id === stopId);
  if (stopIndex === -1) throw new NotFoundError('Delivery stop');
  const stop = stops[stopIndex]!;
  if (stop.status === 'COMPLETED') throw new ConflictError('This stop is already completed.');
  if (stops.slice(0, stopIndex).some((s) => s.status !== 'COMPLETED')) {
    throw new ConflictError('Complete the earlier stops first.', 'STOPS_OUT_OF_ORDER');
  }

  const now = new Date();
  const nextStop = stops[stopIndex + 1];
  const isLastPickup = stop.type === 'PICKUP' && nextStop?.type === 'DROPOFF';
  const isDropoff = stop.type === 'DROPOFF';
  const storeOrderIds = order.storeOrders.map((so) => so.id);

  await prisma.$transaction([
    prisma.deliveryStop.update({
      where: { id: stopId },
      data: { status: 'COMPLETED', completedAt: now, arrivedAt: stop.arrivedAt ?? now },
    }),
    ...(stop.type === 'PICKUP' && stop.storeOrderId
      ? [
          prisma.order.update({ where: { id: stop.storeOrderId }, data: { status: 'PICKED_UP', pickedUpAt: now } }),
          prisma.orderStatusEvent.create({ data: { orderId: stop.storeOrderId, status: 'PICKED_UP' } }),
        ]
      : []),
    ...(isLastPickup ? [prisma.masterDelivery.update({ where: { id: delivery.id }, data: { status: 'IN_PROGRESS' } })] : []),
    ...(isLastPickup
      ? [
          prisma.order.updateMany({ where: { id: { in: storeOrderIds } }, data: { status: 'ON_THE_WAY' } }),
          ...storeOrderIds.map((id) => prisma.orderStatusEvent.create({ data: { orderId: id, status: 'ON_THE_WAY' } })),
        ]
      : []),
    ...(isDropoff
      ? [
          prisma.masterDelivery.update({ where: { id: delivery.id }, data: { status: 'COMPLETED', completedAt: now } }),
          prisma.order.updateMany({ where: { id: { in: storeOrderIds } }, data: { status: 'DELIVERED', deliveredAt: now } }),
          ...storeOrderIds.map((id) => prisma.orderStatusEvent.create({ data: { orderId: id, status: 'DELIVERED' } })),
          ...(order.paymentMethod === 'CASH_ON_DELIVERY'
            ? [
                prisma.masterOrder.update({ where: { id: masterOrderId }, data: { paymentStatus: 'PAID' } }),
                ...(order.payment
                  ? [prisma.payment.update({ where: { id: order.payment.id }, data: { status: 'PAID', completedAt: now } })]
                  : []),
              ]
            : []),
        ]
      : []),
  ]);

  const customer = await prisma.customer.findUnique({ where: { id: order.customerId } });
  if (customer) {
    if (isDropoff) {
      await createNotification({ userId: customer.userId, type: 'ORDER_DELIVERED', title: 'Delivered!', body: 'Enjoy — your order has arrived.', data: { masterOrderId } });
    } else if (isLastPickup) {
      await createNotification({ userId: customer.userId, type: 'RIDER_APPROACHING', title: 'On the way', body: 'Your rider has everything and is heading your way.', data: { masterOrderId } });
    } else if (stop.type === 'PICKUP') {
      await createNotification({ userId: customer.userId, type: 'RIDER_APPROACHING', title: 'Order picked up', body: `Your rider picked up your order from ${stop.label}.`, data: { masterOrderId } });
    }
  }

  const updated = await getMasterOrderOrThrow(masterOrderId);
  await broadcastStatus(updated);
  return updated;
}

export async function recordRiderLocationPing(
  masterDeliveryId: string,
  riderId: string,
  latitude: number,
  longitude: number,
) {
  const delivery = await prisma.masterDelivery.findUnique({ where: { id: masterDeliveryId } });
  if (!delivery) throw new NotFoundError('Delivery');

  await prisma.$transaction([
    prisma.deliveryLocationPing.create({ data: { masterDeliveryId, riderId, latitude, longitude } }),
    prisma.rider.update({ where: { id: riderId }, data: { currentLatitude: latitude, currentLongitude: longitude, lastLocationAt: new Date() } }),
  ]);

  emitDeliveryLocationUpdated(delivery.masterOrderId, {
    orderId: delivery.masterOrderId,
    riderId,
    location: { latitude, longitude },
    recordedAt: new Date().toISOString(),
  });
}

// ── Store manager: "my orders" (spec §25 — own store's orders only) ─────

const managerOrderInclude = {
  items: true,
  statusEvents: { orderBy: { changedAt: 'asc' as const } },
  masterOrder: {
    include: {
      customer: true,
      address: true,
      delivery: { include: { rider: true } },
    },
  },
} satisfies Prisma.OrderInclude;

type ManagerOrderRow = Prisma.OrderGetPayload<{ include: typeof managerOrderInclude }>;

function mapManagerOrder(order: ManagerOrderRow) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    masterOrderId: order.masterOrderId,
    masterOrderNumber: order.masterOrder.orderNumber,
    status: order.status,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      nameSnapshot: item.nameSnapshot,
      priceSnapshot: Number(item.priceSnapshot),
      quantity: item.quantity,
      addOnsLabel: item.addOnsLabel ?? undefined,
      specialInstructions: item.specialInstructions ?? undefined,
      lineTotal: Number(item.priceSnapshot) * item.quantity + Number(item.addOnsPriceSnapshot) * item.quantity,
    })),
    subtotal: Number(order.subtotal),
    statusHistory: order.statusEvents.map((e) => ({ status: e.status, changedAt: e.changedAt.toISOString() })),
    customerName: order.masterOrder.customer.displayName,
    deliveryArea: order.masterOrder.address.area,
    riderName: order.masterOrder.delivery?.rider?.fullName ?? null,
    placedAt: order.masterOrder.placedAt.toISOString(),
  };
}

export async function listManagerOrders(userId: string) {
  const businessId = await getManagedBusinessId(userId);
  const orders = await prisma.order.findMany({
    where: { businessId },
    include: managerOrderInclude,
    orderBy: { masterOrder: { placedAt: 'desc' } },
  });
  return orders.map(mapManagerOrder);
}

export async function getManagerOrderDetail(userId: string, storeOrderId: string) {
  const order = await prisma.order.findUnique({ where: { id: storeOrderId }, include: managerOrderInclude });
  if (!order) throw new NotFoundError('Order');
  await requireManagedBusiness(userId, order.businessId);
  return mapManagerOrder(order);
}

/** Ownership-checked wrapper around advanceStoreOrderStatus for the real
 * manager-facing "accept/prepare/ready" actions (dev.routes.ts's version of
 * this is unchecked, dev-only tooling). */
export async function advanceMyStoreOrderStatus(
  userId: string,
  storeOrderId: string,
  toStatus: 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP',
) {
  const order = await prisma.order.findUnique({ where: { id: storeOrderId } });
  if (!order) throw new NotFoundError('Order');
  await requireManagedBusiness(userId, order.businessId);
  await advanceStoreOrderStatus(storeOrderId, toStatus);
  return getManagerOrderDetail(userId, storeOrderId);
}

/** A store rejecting its own order — distinct from the customer's whole-
 * master-order cancel (spec §26's "Accept/reject orders"). Only the
 * rejecting store's line is cancelled; sibling stores in the same master
 * order are unaffected, matching the "never see another store's order
 * details" isolation rule. */
export async function rejectStoreOrder(userId: string, storeOrderId: string, reason: string) {
  const order = await prisma.order.findUnique({ where: { id: storeOrderId }, include: { business: true } });
  if (!order) throw new NotFoundError('Order');
  await requireManagedBusiness(userId, order.businessId);
  assertValidOrderTransition(order.status, 'CANCELLED');

  const now = new Date();
  await prisma.$transaction([
    prisma.order.update({ where: { id: storeOrderId }, data: { status: 'CANCELLED', cancelledAt: now, cancelReason: reason } }),
    prisma.orderStatusEvent.create({ data: { orderId: storeOrderId, status: 'CANCELLED', changedByUserId: userId } }),
  ]);
  await recordAudit({ actorUserId: userId, action: 'STORE_ORDER_REJECTED', entityType: 'Order', entityId: storeOrderId, metadata: { reason } });

  const masterOrder = await prisma.masterOrder.findUniqueOrThrow({ where: { id: order.masterOrderId }, include: { customer: true } });
  await createNotification({
    userId: masterOrder.customer.userId,
    type: 'ORDER_CANCELLED',
    title: 'Part of your order was cancelled',
    body: `${order.business.name} could not fulfil order ${order.orderNumber}: ${reason}`,
    data: { masterOrderId: order.masterOrderId, storeOrderId },
  });

  const updated = await getMasterOrderOrThrow(order.masterOrderId);
  await broadcastStatus(updated);
  return getManagerOrderDetail(userId, storeOrderId);
}

// ── System admin: global master-order monitoring (spec §24) ─────────────

export async function listAdminMasterOrders() {
  const orders = await prisma.masterOrder.findMany({ orderBy: { placedAt: 'desc' }, take: 200 });
  const full = await Promise.all(orders.map((o) => getMasterOrderOrThrow(o.id)));
  return full.map(mapMasterOrderToSummary);
}

export async function getAdminMasterOrderDetail(masterOrderId: string) {
  return mapMasterOrderToDto(await getMasterOrderOrThrow(masterOrderId));
}
