import type { CreateOrderInput } from '@chirudeli/shared-types';
import { prisma } from '../../lib/prisma';
import { env } from '../../lib/env';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  OutsideServiceAreaError,
  ValidationError,
} from '../../lib/errors';
import { distanceProvider } from '../../lib/distance';
import { calculateCommission, calculateDeliveryFee, getActiveFeeConfig, resolveZoneForCoordinates } from '../../lib/fees';
import { requireCustomerProfile } from '../../lib/customers';
import { generateOrderNumber, generateDeliveryPin } from '../../lib/orderNumber';
import { getPaymentProvider } from '../../lib/payments';
import { resolvePromotion } from '../promotions/promotions.service';
import { assertValidOrderTransition, canCustomerCancel } from '../../lib/orderStateMachine';
import { recordAudit } from '../../lib/audit';
import { createNotification } from '../notifications/notifications.service';
import { emitOrderStatusChanged, emitDeliveryLocationUpdated } from '../../realtime/events';
import { loadOrder, mapOrderToDto, mapOrderToSummary, type OrderWithRelations } from './orders.mapper';

const SERVICE_FEE = 5;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function getOrderOrThrow(id: string): Promise<OrderWithRelations> {
  const order = await loadOrder(id);
  if (!order) throw new NotFoundError('Order');
  return order;
}

async function broadcastStatus(order: OrderWithRelations) {
  const dto = mapOrderToDto(order);
  emitOrderStatusChanged(order.id, {
    orderId: order.id,
    status: dto.status,
    deliveryStatus: dto.deliveryStatus,
    rider: dto.rider,
    estimatedArrivalMinutes: dto.estimatedArrivalMinutes,
    changedAt: new Date().toISOString(),
  });
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  const existing = await prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return mapOrderToDto(await getOrderOrThrow(existing.id));

  const customer = await requireCustomerProfile(userId);

  const address = await prisma.address.findUnique({ where: { id: input.addressId } });
  if (!address || address.userId !== userId) throw new NotFoundError('Address');

  const business = await prisma.business.findUnique({ where: { id: input.businessId } });
  if (!business || business.status !== 'APPROVED') throw new NotFoundError('Business');
  if (business.storeState !== 'OPEN') {
    throw new ConflictError('This business is not accepting orders right now.', 'BUSINESS_CLOSED');
  }

  const zone = await resolveZoneForCoordinates(address);
  if (!zone) throw new OutsideServiceAreaError();

  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, businessId: business.id },
    include: { addOns: true },
  });
  const productsById = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const itemsToCreate = input.items.map((item) => {
    const product = productsById.get(item.productId);
    if (!product) throw new NotFoundError('Product');
    if (!product.isAvailable) {
      throw new ConflictError(`${product.name} is currently unavailable.`, 'PRODUCT_UNAVAILABLE');
    }
    const selectedAddOns = product.addOns.filter((a) => item.addOnIds.includes(a.id));
    const addOnsPriceSnapshot = selectedAddOns.reduce((sum, a) => sum + Number(a.priceDelta), 0);
    const lineTotal = (Number(product.price) + addOnsPriceSnapshot) * item.quantity;
    subtotal += lineTotal;

    return {
      productId: product.id,
      nameSnapshot: product.name,
      priceSnapshot: product.price,
      quantity: item.quantity,
      addOnsLabel: selectedAddOns.map((a) => a.name).join(', ') || undefined,
      addOnsPriceSnapshot,
      specialInstructions: item.specialInstructions,
    };
  });
  subtotal = round2(subtotal);

  const distanceKm = distanceProvider.distanceKm(business, address);
  const feeConfig = await getActiveFeeConfig();
  const deliveryFee = calculateDeliveryFee({ zone, distanceKm, feeConfig });

  let discountAmount = 0;
  let promotionId: string | undefined;
  let freeDelivery = false;
  if (input.promoCode) {
    const promo = await resolvePromotion({
      code: input.promoCode,
      subtotal,
      businessId: business.id,
      customerId: customer.id,
    });
    if (!promo.valid) throw new ValidationError(promo.message);
    promotionId = promo.promotionId;
    freeDelivery = Boolean(promo.freeDelivery);
    discountAmount = freeDelivery ? deliveryFee : (promo.discountAmount ?? 0);
  }

  const commissionPercent = business.commissionOverridePercent
    ? Number(business.commissionOverridePercent)
    : env.DEFAULT_COMMISSION_PERCENT;
  const { commissionAmount, businessPayoutAmount } = calculateCommission(subtotal, commissionPercent);

  const total = Math.max(0, round2(subtotal + deliveryFee + SERVICE_FEE - discountAmount));

  const paymentProvider = getPaymentProvider(input.paymentMethod);
  const chargeResult = await paymentProvider.charge(total, input.idempotencyKey);

  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        businessId: business.id,
        addressId: address.id,
        status: 'PENDING_CONFIRMATION',
        paymentStatus: chargeResult.status,
        paymentMethod: input.paymentMethod,
        subtotal,
        deliveryFee,
        serviceFee: SERVICE_FEE,
        discountAmount,
        total,
        commissionPercent,
        commissionAmount,
        businessPayoutAmount,
        deliveryInstructions: input.deliveryInstructions,
        idempotencyKey: input.idempotencyKey,
        promotionId,
        items: { create: itemsToCreate },
        statusEvents: { create: { status: 'PENDING_CONFIRMATION' } },
        payment: {
          create: {
            method: input.paymentMethod,
            status: chargeResult.status,
            amount: total,
            providerRef: chargeResult.providerRef,
          },
        },
        commission: {
          create: { businessId: business.id, percent: commissionPercent, amount: commissionAmount },
        },
        ...(promotionId
          ? { promotionRedemption: { create: { promotionId, customerId: customer.id } } }
          : {}),
      },
    });
    return created;
  });

  await recordAudit({
    actorUserId: userId,
    action: 'ORDER_PLACED',
    entityType: 'Order',
    entityId: order.id,
    metadata: { total, businessId: business.id },
  });

  await createNotification({
    userId: business.ownerId,
    type: 'NEW_ORDER',
    title: 'New order received',
    body: `Order ${order.orderNumber} for K${total} just came in.`,
    data: { orderId: order.id },
  });

  return mapOrderToDto(await getOrderOrThrow(order.id));
}

export async function getOrder(userId: string, orderId: string) {
  const customer = await requireCustomerProfile(userId);
  const order = await getOrderOrThrow(orderId);
  if (order.customerId !== customer.id) throw new NotFoundError('Order');
  return mapOrderToDto(order);
}

export async function listOrders(userId: string) {
  const customer = await requireCustomerProfile(userId);
  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { placedAt: 'desc' },
  });
  const full = await Promise.all(orders.map((o) => getOrderOrThrow(o.id)));
  return full.map(mapOrderToSummary);
}

export async function cancelOrder(userId: string, orderId: string, reason: string) {
  const customer = await requireCustomerProfile(userId);
  const order = await getOrderOrThrow(orderId);
  if (order.customerId !== customer.id) throw new NotFoundError('Order');
  if (!canCustomerCancel(order.status)) {
    throw new ConflictError(
      'This order can no longer be cancelled — it is already being prepared.',
      'CANCELLATION_WINDOW_CLOSED',
    );
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
        paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus,
      },
    }),
    prisma.orderStatusEvent.create({
      data: { orderId, status: 'CANCELLED', changedByUserId: userId },
    }),
  ]);

  await recordAudit({
    actorUserId: userId,
    action: 'ORDER_CANCELLED',
    entityType: 'Order',
    entityId: orderId,
    metadata: { reason },
  });

  const updated = await getOrderOrThrow(orderId);
  await broadcastStatus(updated);
  await createNotification({
    userId: updated.business.ownerId,
    type: 'ORDER_CANCELLED',
    title: 'Order cancelled',
    body: `Order ${updated.orderNumber} was cancelled by the customer.`,
    data: { orderId },
  });
  return mapOrderToDto(updated);
}

export async function submitReview(
  userId: string,
  orderId: string,
  input: { businessRating: number; businessComment?: string; riderRating?: number; riderComment?: string },
) {
  const customer = await requireCustomerProfile(userId);
  const order = await getOrderOrThrow(orderId);
  if (order.customerId !== customer.id) throw new NotFoundError('Order');
  if (order.status !== 'DELIVERED') {
    throw new ConflictError('You can only review orders after they have been delivered.');
  }

  const existing = await prisma.review.findUnique({ where: { orderId } });
  if (existing) throw new ConflictError('You already reviewed this order.');

  const review = await prisma.review.create({
    data: {
      orderId,
      customerId: customer.id,
      businessId: order.businessId,
      riderId: order.riderId,
      businessRating: input.businessRating,
      businessComment: input.businessComment,
      riderRating: input.riderRating,
      riderComment: input.riderComment,
    },
  });

  const businessAgg = await prisma.review.aggregate({
    where: { businessId: order.businessId, businessRating: { not: null } },
    _avg: { businessRating: true },
    _count: { businessRating: true },
  });
  await prisma.business.update({
    where: { id: order.businessId },
    data: {
      ratingAvg: businessAgg._avg.businessRating ?? 0,
      ratingCount: businessAgg._count.businessRating,
    },
  });

  if (order.riderId && input.riderRating) {
    const riderAgg = await prisma.review.aggregate({
      where: { riderId: order.riderId, riderRating: { not: null } },
      _avg: { riderRating: true },
      _count: { riderRating: true },
    });
    await prisma.rider.update({
      where: { id: order.riderId },
      data: {
        ratingAvg: riderAgg._avg.riderRating ?? 0,
        ratingCount: riderAgg._count.riderRating,
      },
    });
  }

  return {
    id: review.id,
    orderId: review.orderId,
    businessRating: review.businessRating,
    businessComment: review.businessComment,
    riderRating: review.riderRating,
    riderComment: review.riderComment,
    createdAt: review.createdAt.toISOString(),
  };
}

// ── Status transitions ──────────────────────────────────────────────────
// Exposed for the follow-up business/rider dashboards AND used directly by
// scripts/simulate-order-progress.ts this session (see docs/roadmap.md).

export async function advanceOrderStatus(
  orderId: string,
  toStatus: 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'PICKED_UP' | 'ON_THE_WAY' | 'DELIVERED',
) {
  const order = await getOrderOrThrow(orderId);
  assertValidOrderTransition(order.status, toStatus);

  const timestampField = {
    CONFIRMED: 'confirmedAt',
    PREPARING: 'preparingAt',
    READY_FOR_PICKUP: 'readyAt',
    PICKED_UP: 'pickedUpAt',
    ON_THE_WAY: null,
    DELIVERED: 'deliveredAt',
  }[toStatus];

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: toStatus,
        ...(timestampField ? { [timestampField]: new Date() } : {}),
        ...(toStatus === 'DELIVERED' && order.paymentMethod === 'CASH_ON_DELIVERY'
          ? { paymentStatus: 'PAID' }
          : {}),
      },
    }),
    prisma.orderStatusEvent.create({ data: { orderId, status: toStatus } }),
    ...(order.delivery && (toStatus === 'PICKED_UP' || toStatus === 'DELIVERED')
      ? [
          prisma.delivery.update({
            where: { id: order.delivery.id },
            data:
              toStatus === 'PICKED_UP'
                ? { status: 'PICKED_UP', pickedUpAt: new Date() }
                : { status: 'COMPLETED', completedAt: new Date() },
          }),
        ]
      : []),
    ...(order.delivery && toStatus === 'ON_THE_WAY'
      ? [prisma.delivery.update({ where: { id: order.delivery.id }, data: { status: 'EN_ROUTE_TO_DROPOFF' } })]
      : []),
    ...(toStatus === 'DELIVERED' && order.paymentMethod === 'CASH_ON_DELIVERY' && order.payment
      ? [prisma.payment.update({ where: { id: order.payment.id }, data: { status: 'PAID', completedAt: new Date() } })]
      : []),
  ]);

  type StatusNotificationType = 'ORDER_ACCEPTED' | 'ORDER_PREPARING' | 'RIDER_APPROACHING' | 'ORDER_DELIVERED';
  const notificationCopy: Record<string, { type: StatusNotificationType; title: string; body: string }> = {
    CONFIRMED: { type: 'ORDER_ACCEPTED', title: 'Order confirmed', body: `${order.business.name} confirmed your order.` },
    PREPARING: { type: 'ORDER_PREPARING', title: 'Preparing your order', body: `${order.business.name} is preparing your order.` },
    READY_FOR_PICKUP: { type: 'ORDER_PREPARING', title: 'Ready for pickup', body: 'Your order is ready and waiting for a rider.' },
    PICKED_UP: { type: 'RIDER_APPROACHING', title: 'Order picked up', body: 'Your rider has picked up your order.' },
    ON_THE_WAY: { type: 'RIDER_APPROACHING', title: 'On the way', body: 'Your order is on the way!' },
    DELIVERED: { type: 'ORDER_DELIVERED', title: 'Delivered', body: 'Enjoy! Your order has been delivered.' },
  };
  const copy = notificationCopy[toStatus];
  const customer = await prisma.customer.findUnique({ where: { id: order.customerId } });
  if (copy && customer) {
    await createNotification({ userId: customer.userId, type: copy.type, title: copy.title, body: copy.body, data: { orderId } });
  }

  const updated = await getOrderOrThrow(orderId);
  await broadcastStatus(updated);
  return updated;
}

export async function assignRider(orderId: string, riderId: string) {
  const order = await getOrderOrThrow(orderId);
  assertValidOrderTransition(order.status, 'RIDER_ASSIGNED');

  const rider = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!rider || rider.status !== 'APPROVED') throw new NotFoundError('Rider');

  const distanceKm = distanceProvider.distanceKm(
    { latitude: order.business.latitude, longitude: order.business.longitude },
    { latitude: order.address.latitude, longitude: order.address.longitude },
  );

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: 'RIDER_ASSIGNED', riderId } }),
    prisma.orderStatusEvent.create({ data: { orderId, status: 'RIDER_ASSIGNED' } }),
    prisma.delivery.create({
      data: {
        orderId,
        riderId,
        status: 'ASSIGNED',
        distanceKm,
        estimatedEarnings: order.deliveryFee,
        pickupLatitude: order.business.latitude,
        pickupLongitude: order.business.longitude,
        dropoffLatitude: order.address.latitude,
        dropoffLongitude: order.address.longitude,
        deliveryPin: generateDeliveryPin(),
      },
    }),
  ]);

  const customer = await prisma.customer.findUnique({ where: { id: order.customerId } });
  if (customer) {
    await createNotification({
      userId: customer.userId,
      type: 'RIDER_ASSIGNED',
      title: 'Rider assigned',
      body: `${rider.fullName} is heading to pick up your order.`,
      data: { orderId },
    });
  }

  const updated = await getOrderOrThrow(orderId);
  await broadcastStatus(updated);
  return updated;
}

export async function recordRiderLocationPing(deliveryId: string, riderId: string, latitude: number, longitude: number) {
  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) throw new NotFoundError('Delivery');

  await prisma.$transaction([
    prisma.deliveryLocationPing.create({ data: { deliveryId, riderId, latitude, longitude } }),
    prisma.rider.update({ where: { id: riderId }, data: { currentLatitude: latitude, currentLongitude: longitude, lastLocationAt: new Date() } }),
  ]);

  emitDeliveryLocationUpdated(delivery.orderId, {
    orderId: delivery.orderId,
    riderId,
    location: { latitude, longitude },
    recordedAt: new Date().toISOString(),
  });
}
