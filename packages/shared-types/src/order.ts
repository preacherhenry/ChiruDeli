import { z } from 'zod';
import { idSchema, moneySchema, coordinatesSchema } from './primitives';
import { OrderStatus, PaymentStatus, PaymentMethod, DeliveryStatus } from './enums';
import { addressSchema } from './address';

export const createOrderItemSchema = z.object({
  productId: idSchema,
  quantity: z.number().int().positive().max(50),
  addOnIds: z.array(idSchema).default([]),
  specialInstructions: z.string().max(280).optional(),
});
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;

export const createOrderSchema = z.object({
  idempotencyKey: z.string().uuid(),
  businessId: idSchema,
  items: z.array(createOrderItemSchema).min(1),
  addressId: idSchema,
  deliveryInstructions: z.string().max(280).optional(),
  paymentMethod: PaymentMethod.schema,
  promoCode: z.string().max(30).optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

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

export const orderTotalsSchema = z.object({
  subtotal: moneySchema,
  deliveryFee: moneySchema,
  serviceFee: moneySchema,
  discount: moneySchema,
  total: moneySchema,
});
export type OrderTotals = z.infer<typeof orderTotalsSchema>;

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

export const orderStatusEventSchema = z.object({
  status: OrderStatus.schema,
  changedAt: z.string().datetime(),
});
export type OrderStatusEvent = z.infer<typeof orderStatusEventSchema>;

export const orderSchema = z.object({
  id: idSchema,
  orderNumber: z.string(),
  businessId: idSchema,
  businessName: z.string(),
  businessLocation: coordinatesSchema,
  status: OrderStatus.schema,
  deliveryStatus: DeliveryStatus.schema.nullable(),
  paymentStatus: PaymentStatus.schema,
  paymentMethod: PaymentMethod.schema,
  items: z.array(orderItemSchema),
  totals: orderTotalsSchema,
  address: addressSchema,
  deliveryInstructions: z.string().optional(),
  rider: orderRiderSchema.nullable(),
  estimatedArrivalMinutes: z.number().int().nullable(),
  statusHistory: z.array(orderStatusEventSchema),
  placedAt: z.string().datetime(),
  deliveryPin: z.string().length(4).optional(),
  hasReview: z.boolean(),
});
export type Order = z.infer<typeof orderSchema>;

export const orderSummarySchema = z.object({
  id: idSchema,
  orderNumber: z.string(),
  businessName: z.string(),
  status: OrderStatus.schema,
  itemsSummary: z.string(),
  total: moneySchema,
  placedAt: z.string().datetime(),
});
export type OrderSummary = z.infer<typeof orderSummarySchema>;

export const cancelOrderSchema = z.object({
  reason: z.string().min(2).max(280),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
