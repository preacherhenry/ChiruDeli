import { z } from 'zod';

/**
 * Every enum here has a 1:1 namesake in apps/api/prisma/schema.prisma.
 * This file is the source of truth for spelling/values — when the schema
 * changes, update here first, then mirror it into schema.prisma.
 */

function makeEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return { values, schema: z.enum(values as unknown as [T[number], ...T[number][]]) };
}

export const UserRole = makeEnum(['CUSTOMER', 'BUSINESS_OWNER', 'RIDER', 'ADMIN'] as const);
export type UserRole = z.infer<typeof UserRole.schema>;

export const AccountStatus = makeEnum(['ACTIVE', 'SUSPENDED', 'PENDING'] as const);
export type AccountStatus = z.infer<typeof AccountStatus.schema>;

export const ApprovalStatus = makeEnum(['PENDING', 'APPROVED', 'REJECTED'] as const);
export type ApprovalStatus = z.infer<typeof ApprovalStatus.schema>;

export const BusinessStatus = makeEnum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const);
export type BusinessStatus = z.infer<typeof BusinessStatus.schema>;

export const StoreState = makeEnum(['OPEN', 'PAUSED'] as const);
export type StoreState = z.infer<typeof StoreState.schema>;

export const RiderStatus = makeEnum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const);
export type RiderStatus = z.infer<typeof RiderStatus.schema>;

export const RiderOnlineStatus = makeEnum(['ONLINE', 'OFFLINE'] as const);
export type RiderOnlineStatus = z.infer<typeof RiderOnlineStatus.schema>;

export const VehicleType = makeEnum(['BICYCLE', 'MOTORCYCLE', 'CAR', 'ON_FOOT'] as const);
export type VehicleType = z.infer<typeof VehicleType.schema>;

export const DocumentType = makeEnum([
  'NATIONAL_ID',
  'DRIVERS_LICENSE',
  'VEHICLE_REGISTRATION',
  'PROFILE_PHOTO',
] as const);
export type DocumentType = z.infer<typeof DocumentType.schema>;

export const DocumentStatus = makeEnum(['PENDING', 'APPROVED', 'REJECTED'] as const);
export type DocumentStatus = z.infer<typeof DocumentStatus.schema>;

/** Coarse, customer-facing order lifecycle — drives the tracking screen. */
export const OrderStatus = makeEnum([
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
  'CANCELLED',
] as const);
export type OrderStatus = z.infer<typeof OrderStatus.schema>;

/** Fine-grained rider-side delivery workflow (spec section 13). */
export const DeliveryStatus = makeEnum([
  'ASSIGNED',
  'EN_ROUTE_TO_PICKUP',
  'ARRIVED_AT_PICKUP',
  'PICKED_UP',
  'EN_ROUTE_TO_DROPOFF',
  'ARRIVED_AT_DROPOFF',
  'COMPLETED',
] as const);
export type DeliveryStatus = z.infer<typeof DeliveryStatus.schema>;

/** Deliberately separate from OrderStatus/DeliveryStatus — see business rule #13. */
export const PaymentStatus = makeEnum(['UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const);
export type PaymentStatus = z.infer<typeof PaymentStatus.schema>;

export const PaymentMethod = makeEnum(['CASH_ON_DELIVERY', 'MOBILE_MONEY', 'CARD'] as const);
export type PaymentMethod = z.infer<typeof PaymentMethod.schema>;

export const TransactionType = makeEnum(['CHARGE', 'REFUND', 'PAYOUT'] as const);
export type TransactionType = z.infer<typeof TransactionType.schema>;

export const DeliveryFeeType = makeEnum(['DISTANCE_BASED', 'FIXED_ZONE'] as const);
export type DeliveryFeeType = z.infer<typeof DeliveryFeeType.schema>;

export const PromotionType = makeEnum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_DELIVERY'] as const);
export type PromotionType = z.infer<typeof PromotionType.schema>;

export const NotificationType = makeEnum([
  'ORDER_CONFIRMED',
  'ORDER_ACCEPTED',
  'ORDER_PREPARING',
  'RIDER_ASSIGNED',
  'RIDER_APPROACHING',
  'ORDER_DELIVERED',
  'ORDER_CANCELLED',
  'PROMOTION',
  'NEW_ORDER',
  'NEW_DELIVERY_REQUEST',
  'DELIVERY_INSTRUCTIONS_UPDATED',
  'ACCOUNT_STATUS_CHANGED',
] as const);
export type NotificationType = z.infer<typeof NotificationType.schema>;

export const BusinessCategorySlug = makeEnum([
  'FOOD',
  'GROCERIES',
  'PHARMACY',
  'ELECTRONICS',
  'STATIONERY',
  'HOUSEHOLD',
  'CLOTHING',
  'OTHER',
] as const);
export type BusinessCategorySlug = z.infer<typeof BusinessCategorySlug.schema>;
