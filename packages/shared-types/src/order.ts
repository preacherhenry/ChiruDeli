import { z } from 'zod';
import { idSchema, moneySchema, coordinatesSchema } from './primitives';
import { OrderStatus, PaymentStatus, PaymentMethod, DeliveryStopType, DeliveryStopStatus } from './enums';
import { addressSchema } from './address';

// ── Checkout input ───────────────────────────────────────────────────────
// Items carry their own businessId; the server groups them into one Order
// (store order) per business and wraps the set in one MasterOrder.

export const createOrderItemSchema = z.object({
  businessId: idSchema,
  productId: idSchema,
  quantity: z.number().int().positive().max(50),
  addOnIds: z.array(idSchema).default([]),
  specialInstructions: z.string().max(280).optional(),
});
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;

export const createOrderSchema = z.object({
  idempotencyKey: z.string().uuid(),
  items: z.array(createOrderItemSchema).min(1),
  addressId: idSchema,
  deliveryInstructions: z.string().max(280).optional(),
  paymentMethod: PaymentMethod.schema,
  promoCode: z.string().max(30).optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** Same shape as checkout, minus the fields only meaningful once you're
 * actually committing (idempotency key, payment method). Used by the Cart
 * and Checkout screens to show accurate totals before placing the order. */
export const previewOrderSchema = z.object({
  items: z.array(createOrderItemSchema).min(1),
  addressId: idSchema,
  promoCode: z.string().max(30).optional(),
});
export type PreviewOrderInput = z.infer<typeof previewOrderSchema>;

// ── Store order (one per business within a master order) ───────────────

export const orderItemSchema = z.object({
  id: idSchema,
  productId: idSchema,
  nameSnapshot: z.string(),
  priceSnapshot: moneySchema,
  quantity: z.number().int(),
  addOnsLabel: z.string().optional(),
  specialInstructions: z.string().optional(),
  lineTotal: moneySchema,
});
export type OrderItem = z.infer<typeof orderItemSchema>;

export const orderStatusEventSchema = z.object({
  status: OrderStatus.schema,
  changedAt: z.string().datetime(),
});
export type OrderStatusEvent = z.infer<typeof orderStatusEventSchema>;

/** One business's slice of a master order — what that business's dashboard
 * would query; a business only ever sees its own rows here. */
export const storeOrderSchema = z.object({
  id: idSchema,
  orderNumber: z.string(),
  sequence: z.number().int(),
  businessId: idSchema,
  businessName: z.string(),
  businessLocation: coordinatesSchema,
  status: OrderStatus.schema,
  items: z.array(orderItemSchema),
  subtotal: moneySchema,
  statusHistory: z.array(orderStatusEventSchema),
  hasReview: z.boolean(),
});
export type StoreOrder = z.infer<typeof storeOrderSchema>;

// ── Delivery stops (the rider's pickup route + final dropoff) ──────────

export const deliveryStopSchema = z.object({
  id: idSchema,
  sequence: z.number().int(),
  type: DeliveryStopType.schema,
  label: z.string(),
  location: coordinatesSchema,
  status: DeliveryStopStatus.schema,
  storeOrderId: idSchema.nullable(),
});
export type DeliveryStop = z.infer<typeof deliveryStopSchema>;

export const orderRiderSchema = z.object({
  id: idSchema,
  fullName: z.string(),
  photoUrl: z.string().url().nullable(),
  vehicleType: z.string(),
  ratingAvg: z.number(),
  phone: z.string(),
  location: coordinatesSchema.nullable(),
});
export type OrderRider = z.infer<typeof orderRiderSchema>;

export const orderTotalsSchema = z.object({
  subtotal: moneySchema,
  deliveryFee: moneySchema,
  serviceFee: moneySchema,
  discount: moneySchema,
  total: moneySchema,
});
export type OrderTotals = z.infer<typeof orderTotalsSchema>;

export const orderPreviewSchema = z.object({
  totals: orderTotalsSchema,
  stores: z.array(z.object({ businessId: idSchema, businessName: z.string(), subtotal: moneySchema })),
});
export type OrderPreview = z.infer<typeof orderPreviewSchema>;

// ── Master order (what the customer sees — one per checkout) ───────────

export const masterOrderSchema = z.object({
  id: idSchema,
  orderNumber: z.string(),
  /** Derived: the least-advanced non-cancelled store order status, or
   * DELIVERED/CANCELLED once every store order agrees. */
  status: OrderStatus.schema,
  paymentStatus: PaymentStatus.schema,
  paymentMethod: PaymentMethod.schema,
  storeOrders: z.array(storeOrderSchema),
  totals: orderTotalsSchema,
  address: addressSchema,
  deliveryInstructions: z.string().optional(),
  rider: orderRiderSchema.nullable(),
  estimatedArrivalMinutes: z.number().int().nullable(),
  deliveryStops: z.array(deliveryStopSchema),
  deliveryPin: z.string().length(4).optional(),
  riderRating: z.number().int().nullable(),
  riderComment: z.string().nullable(),
  placedAt: z.string().datetime(),
});
export type MasterOrder = z.infer<typeof masterOrderSchema>;

export const masterOrderSummarySchema = z.object({
  id: idSchema,
  orderNumber: z.string(),
  businessNames: z.array(z.string()),
  status: OrderStatus.schema,
  itemsSummary: z.string(),
  total: moneySchema,
  placedAt: z.string().datetime(),
});
export type MasterOrderSummary = z.infer<typeof masterOrderSummarySchema>;

export const cancelOrderSchema = z.object({
  reason: z.string().min(2).max(280),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
