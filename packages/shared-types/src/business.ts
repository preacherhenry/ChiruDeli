import { z } from 'zod';
import { idSchema, moneySchema, phoneSchema } from './primitives';
import { BusinessStatus, StoreState } from './enums';
import { storeClassSummarySchema } from './store-class';
import { storeDocumentSchema } from './store-document';

export const openingHoursSchema = z.record(
  z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  z.object({ open: z.string(), close: z.string(), closed: z.boolean().default(false) }),
);
export type OpeningHours = z.infer<typeof openingHoursSchema>;

// ── Customer-facing ─────────────────────────────────────────────────────

export const businessSummarySchema = z.object({
  id: idSchema,
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().url().nullable(),
  storeClass: storeClassSummarySchema,
  ratingAvg: z.number().min(0).max(5),
  ratingCount: z.number().int().nonnegative(),
  estimatedDeliveryMinutes: z.number().int().positive(),
  deliveryFee: moneySchema,
  storeState: StoreState.schema,
  isOpenNow: z.boolean(),
});
export type BusinessSummary = z.infer<typeof businessSummarySchema>;

export const businessDetailSchema = businessSummarySchema.extend({
  coverImageUrl: z.string().url().nullable(),
  description: z.string(),
  openingHours: openingHoursSchema,
  status: BusinessStatus.schema,
  address: z.string(),
});
export type BusinessDetail = z.infer<typeof businessDetailSchema>;

// ── Store registration (spec §2/§3) ─────────────────────────────────────

export const registerStoreSchema = z.object({
  manager: z.object({
    fullName: z.string().min(2).max(80),
    phone: phoneSchema,
    email: z.string().email().optional(),
    password: z.string().min(8).max(72),
    profilePhotoUrl: z.string().url().optional(),
    nationalIdInfo: z.string().max(120).optional(),
  }),
  store: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(1000).default(''),
    storeClassId: idSchema,
    phone: phoneSchema.optional(),
    email: z.string().email().optional(),
    address: z.string().min(2).max(200),
    latitude: z.number(),
    longitude: z.number(),
    logoUrl: z.string().url().optional(),
    coverImageUrl: z.string().url().optional(),
    openingHours: openingHoursSchema,
    prepTimeMinutes: z.number().int().min(0).max(180).default(20),
    registrationNumber: z.string().max(60).optional(),
    taxId: z.string().max(60).optional(),
  }),
});
export type RegisterStoreInput = z.infer<typeof registerStoreSchema>;

export const registerStoreResultSchema = z.object({
  businessId: idSchema,
  status: BusinessStatus.schema,
});
export type RegisterStoreResult = z.infer<typeof registerStoreResultSchema>;

// ── Store manager's own store ("my store") ──────────────────────────────

export const onboardingChecklistSchema = z.object({
  profileComplete: z.boolean(),
  openingHoursSet: z.boolean(),
  hasProductCategory: z.boolean(),
  hasProduct: z.boolean(),
  hasPricedAvailableProduct: z.boolean(),
  requiredDocumentsApproved: z.boolean(),
  isComplete: z.boolean(),
});
export type OnboardingChecklist = z.infer<typeof onboardingChecklistSchema>;

export const myStoreSchema = z.object({
  id: idSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  storeClass: storeClassSummarySchema,
  logoUrl: z.string().url().nullable(),
  coverImageUrl: z.string().url().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  openingHours: openingHoursSchema,
  prepTimeMinutes: z.number().int(),
  status: BusinessStatus.schema,
  isActivated: z.boolean(),
  storeState: StoreState.schema,
  /** What the customer app would actually show right now, folding in admin
   * suspension — the manager's own OPEN/PAUSED toggle can't override this. */
  effectiveIsOpen: z.boolean(),
  rejectionReason: z.string().nullable(),
  ratingAvg: z.number(),
  ratingCount: z.number().int(),
  documents: z.array(storeDocumentSchema),
  onboarding: onboardingChecklistSchema,
  createdAt: z.string().datetime(),
  approvedAt: z.string().datetime().nullable(),
  activatedAt: z.string().datetime().nullable(),
});
export type MyStore = z.infer<typeof myStoreSchema>;

export const updateStoreProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  phone: phoneSchema.optional(),
  email: z.string().email().optional(),
  address: z.string().min(2).max(200).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  logoUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  prepTimeMinutes: z.number().int().min(0).max(180).optional(),
});
export type UpdateStoreProfileInput = z.infer<typeof updateStoreProfileSchema>;

export const updateOpeningHoursSchema = openingHoursSchema;
export type UpdateOpeningHoursInput = z.infer<typeof updateOpeningHoursSchema>;

export const setStoreOpenStatusSchema = z.object({ storeState: StoreState.schema });
export type SetStoreOpenStatusInput = z.infer<typeof setStoreOpenStatusSchema>;

export const managerDashboardStatsSchema = z.object({
  todayOrders: z.number().int(),
  todaySales: moneySchema,
  pendingOrders: z.number().int(),
  productCount: z.number().int(),
  ratingAvg: z.number(),
  ratingCount: z.number().int(),
});
export type ManagerDashboardStats = z.infer<typeof managerDashboardStatsSchema>;

// ── Admin store management (spec §6/§7/§16) ──────────────────────────────

export const adminStoreManagerSummarySchema = z.object({
  id: idSchema,
  fullName: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  accountStatus: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']),
});
export type AdminStoreManagerSummary = z.infer<typeof adminStoreManagerSummarySchema>;

export const adminBusinessListItemSchema = z.object({
  id: idSchema,
  name: z.string(),
  storeClass: storeClassSummarySchema,
  status: BusinessStatus.schema,
  isActivated: z.boolean(),
  storeState: StoreState.schema,
  managerName: z.string().nullable(),
  phone: z.string().nullable(),
  createdAt: z.string().datetime(),
  address: z.string(),
});
export type AdminBusinessListItem = z.infer<typeof adminBusinessListItemSchema>;

export const adminBusinessDetailSchema = businessDetailSchema.extend({
  status: BusinessStatus.schema,
  isActivated: z.boolean(),
  rejectionReason: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  registrationNumber: z.string().nullable(),
  taxId: z.string().nullable(),
  managers: z.array(adminStoreManagerSummarySchema),
  documents: z.array(storeDocumentSchema),
  productCount: z.number().int(),
  orderCount: z.number().int(),
  createdAt: z.string().datetime(),
  submittedAt: z.string().datetime().nullable(),
  approvedAt: z.string().datetime().nullable(),
  activatedAt: z.string().datetime().nullable(),
});
export type AdminBusinessDetail = z.infer<typeof adminBusinessDetailSchema>;

export const rejectStoreSchema = z.object({ reason: z.string().min(2).max(500) });
export type RejectStoreInput = z.infer<typeof rejectStoreSchema>;

export const requestStoreChangesSchema = z.object({ message: z.string().min(2).max(500) });
export type RequestStoreChangesInput = z.infer<typeof requestStoreChangesSchema>;

export const suspendStoreSchema = z.object({ reason: z.string().min(2).max(500) });
export type SuspendStoreInput = z.infer<typeof suspendStoreSchema>;

export const adminUpdateStoreSchema = updateStoreProfileSchema.extend({
  storeClassId: idSchema.optional(),
});
export type AdminUpdateStoreInput = z.infer<typeof adminUpdateStoreSchema>;
