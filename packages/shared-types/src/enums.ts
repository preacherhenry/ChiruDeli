import { z } from 'zod';

/**
 * Every enum here has a 1:1 namesake in apps/api/prisma/schema.prisma.
 * This file is the source of truth for spelling/values — when the schema
 * changes, update here first, then mirror it into schema.prisma.
 */

function makeEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return { values, schema: z.enum(values as unknown as [T[number], ...T[number][]]) };
}

export const UserRole = makeEnum(['CUSTOMER', 'STORE_MANAGER', 'RIDER', 'SYSTEM_ADMIN'] as const);
export type UserRole = z.infer<typeof UserRole.schema>;

export const AccountStatus = makeEnum(['ACTIVE', 'SUSPENDED', 'PENDING'] as const);
export type AccountStatus = z.infer<typeof AccountStatus.schema>;

export const ApprovalStatus = makeEnum(['PENDING', 'APPROVED', 'REJECTED'] as const);
export type ApprovalStatus = z.infer<typeof ApprovalStatus.schema>;

/** Store approval/lifecycle status — separate from `isActivated` (business.ts),
 * since visibility requires "approved AND activated", two independent facts. */
export const BusinessStatus = makeEnum([
  'DRAFT',
  'SUBMITTED',
  'PENDING_APPROVAL',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'RESUBMISSION',
  'SUSPENDED',
  'DEACTIVATED',
] as const);
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

/** Overall progress of a rider's multi-stop delivery run (spec section 13). */
export const MasterDeliveryStatus = makeEnum(['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'] as const);
export type MasterDeliveryStatus = z.infer<typeof MasterDeliveryStatus.schema>;

/** One PICKUP per store visited, plus a final DROPOFF at the customer. */
export const DeliveryStopType = makeEnum(['PICKUP', 'DROPOFF'] as const);
export type DeliveryStopType = z.infer<typeof DeliveryStopType.schema>;

export const DeliveryStopStatus = makeEnum(['PENDING', 'ARRIVED', 'COMPLETED'] as const);
export type DeliveryStopStatus = z.infer<typeof DeliveryStopStatus.schema>;

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
  'STORE_APPROVED',
  'STORE_REJECTED',
  'STORE_CHANGES_REQUESTED',
  'STORE_SUSPENDED',
  'STORE_REACTIVATED',
] as const);
export type NotificationType = z.infer<typeof NotificationType.schema>;
