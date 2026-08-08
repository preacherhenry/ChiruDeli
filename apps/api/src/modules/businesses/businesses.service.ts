import type { Prisma } from '@prisma/client';
import type {
  RegisterStoreInput,
  UpdateStoreProfileInput,
  AdminUpdateStoreInput,
  UploadStoreDocumentInput,
  ReviewStoreDocumentInput,
  ReassignStoreManagerInput,
  OpeningHours,
} from '@chirudeli/shared-types';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ConflictError, ValidationError } from '../../lib/errors';
import { distanceProvider } from '../../lib/distance';
import { calculateDeliveryFee, getActiveFeeConfig, resolveZoneForCoordinates } from '../../lib/fees';
import { hashPassword } from '../../lib/password';
import { recordAudit } from '../../lib/audit';
import { getManagedBusinessId, getPrimaryManagerUserId } from '../../lib/storeAccess';
import { documentStorageProvider, toDataUri } from '../../lib/documentStorage';
import { createNotification } from '../notifications/notifications.service';

const businessWithStoreClass = { include: { storeClass: true } } satisfies Prisma.BusinessFindManyArgs;

function isOpenNow(openingHours: Prisma.JsonValue): boolean {
  const hours = openingHours as Record<string, { open: string; close: string; closed: boolean }>;
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  const today = hours[days[new Date().getDay()] as string];
  if (!today || today.closed) return false;
  const now = new Date();
  const [openH = 0, openM = 0] = today.open.split(':').map(Number);
  const [closeH = 23, closeM = 59] = today.close.split(':').map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= openH * 60 + openM && nowMinutes <= closeH * 60 + closeM;
}

/** Approved + activated + not suspended/deactivated + (via zone) inside the
 * service area — the only statuses a customer should ever see (spec §10). */
const CUSTOMER_VISIBLE_WHERE = { status: 'APPROVED', isActivated: true } as const;

async function estimateDeliveryFeeAndTime(
  business: { latitude: number; longitude: number },
  customerCoords?: { latitude: number; longitude: number },
) {
  const feeConfig = await getActiveFeeConfig();
  if (!customerCoords) {
    return { deliveryFee: feeConfig.baseFee, estimatedDeliveryMinutes: 30 };
  }
  const zone = await resolveZoneForCoordinates(customerCoords);
  const distanceKm = distanceProvider.distanceKm(business, customerCoords);
  const deliveryFee = zone
    ? calculateDeliveryFee({ zone, distanceKm, feeConfig })
    : feeConfig.baseFee + distanceKm * feeConfig.perKmFee;
  const estimatedDeliveryMinutes = Math.round(15 + distanceKm * 3);
  return { deliveryFee, estimatedDeliveryMinutes };
}

function mapStoreClassSummary(sc: { id: string; name: string; slug: string; icon: string | null }) {
  return { id: sc.id, name: sc.name, slug: sc.slug, icon: sc.icon };
}

// ── Customer-facing browse ───────────────────────────────────────────────

export async function listBusinesses(params: { category?: string; search?: string; lat?: number; lng?: number }) {
  const where: Prisma.BusinessWhereInput = {
    ...CUSTOMER_VISIBLE_WHERE,
    ...(params.category ? { storeClass: { slug: params.category } } : {}),
    ...(params.search ? { name: { contains: params.search, mode: 'insensitive' as const } } : {}),
  };

  const businesses = await prisma.business.findMany({ where, ...businessWithStoreClass });
  const customerCoords =
    params.lat !== undefined && params.lng !== undefined ? { latitude: params.lat, longitude: params.lng } : undefined;

  return Promise.all(
    businesses.map(async (b) => {
      const { deliveryFee, estimatedDeliveryMinutes } = await estimateDeliveryFeeAndTime(b, customerCoords);
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        logoUrl: b.logoUrl,
        storeClass: mapStoreClassSummary(b.storeClass),
        ratingAvg: b.ratingAvg,
        ratingCount: b.ratingCount,
        estimatedDeliveryMinutes,
        deliveryFee,
        storeState: b.storeState,
        isOpenNow: b.storeState === 'OPEN' && isOpenNow(b.openingHours),
      };
    }),
  );
}

export async function getBusiness(id: string, coords?: { lat?: number; lng?: number }) {
  const business = await prisma.business.findUnique({ where: { id }, ...businessWithStoreClass });
  if (!business || business.status !== 'APPROVED' || !business.isActivated) throw new NotFoundError('Business');

  const customerCoords = coords?.lat !== undefined && coords?.lng !== undefined ? { latitude: coords.lat, longitude: coords.lng } : undefined;
  const { deliveryFee, estimatedDeliveryMinutes } = await estimateDeliveryFeeAndTime(business, customerCoords);

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    logoUrl: business.logoUrl,
    storeClass: mapStoreClassSummary(business.storeClass),
    ratingAvg: business.ratingAvg,
    ratingCount: business.ratingCount,
    estimatedDeliveryMinutes,
    deliveryFee,
    storeState: business.storeState,
    isOpenNow: business.storeState === 'OPEN' && isOpenNow(business.openingHours),
    coverImageUrl: business.coverImageUrl,
    description: business.description,
    openingHours: business.openingHours,
    status: business.status,
    address: business.address,
  };
}

export async function listProducts(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new NotFoundError('Business');

  const products = await prisma.product.findMany({
    where: { businessId },
    include: { addOns: true, category: true },
    orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
  });

  return products.map((p) => ({
    id: p.id,
    businessId: p.businessId,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    imageUrl: p.imageUrl,
    isAvailable: p.isAvailable,
    addOns: p.addOns.map((a) => ({ id: a.id, name: a.name, priceDelta: Number(a.priceDelta) })),
  }));
}

// ── Store registration (spec §2/§3/§4) ───────────────────────────────────

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function uniqueBusinessSlug(name: string): Promise<string> {
  const base = slugify(name) || 'store';
  let slug = base;
  let n = 1;
  while (await prisma.business.findFirst({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function registerStore(input: RegisterStoreInput) {
  const existingUser = await prisma.user.findUnique({ where: { phone: input.manager.phone } });
  if (existingUser) throw new ConflictError('An account with this phone number already exists.');

  const storeClass = await prisma.storeClass.findUnique({ where: { id: input.store.storeClassId } });
  if (!storeClass || !storeClass.isActive) {
    throw new ValidationError('Please choose a valid, active store class.');
  }

  const slug = await uniqueBusinessSlug(input.store.name);
  const passwordHash = await hashPassword(input.manager.password);

  const business = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        phone: input.manager.phone,
        email: input.manager.email,
        passwordHash,
        role: 'STORE_MANAGER',
        storeManager: {
          create: {
            fullName: input.manager.fullName,
            profilePhotoUrl: input.manager.profilePhotoUrl,
            nationalIdInfo: input.manager.nationalIdInfo,
          },
        },
      },
      include: { storeManager: true },
    });

    const created = await tx.business.create({
      data: {
        name: input.store.name,
        slug,
        storeClassId: input.store.storeClassId,
        description: input.store.description,
        phone: input.store.phone,
        email: input.store.email,
        address: input.store.address,
        latitude: input.store.latitude,
        longitude: input.store.longitude,
        logoUrl: input.store.logoUrl,
        coverImageUrl: input.store.coverImageUrl,
        openingHours: input.store.openingHours as unknown as Prisma.InputJsonValue,
        prepTimeMinutes: input.store.prepTimeMinutes,
        registrationNumber: input.store.registrationNumber,
        taxId: input.store.taxId,
        status: 'PENDING_APPROVAL',
        submittedAt: new Date(),
        managers: { create: { storeManagerId: user.storeManager!.id, isPrimary: true } },
      },
    });

    return created;
  }, { maxWait: 10_000, timeout: 20_000 });

  await recordAudit({
    actorUserId: null,
    action: 'STORE_SUBMITTED',
    entityType: 'Business',
    entityId: business.id,
    metadata: { name: business.name, storeClassId: business.storeClassId },
  });

  return { businessId: business.id, status: business.status };
}

// ── Store manager's own store ("my store") ───────────────────────────────

function mapStoreDocument(doc: {
  id: string;
  requirementId: string | null;
  label: string;
  mimeType: string;
  fileData: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote: string | null;
  uploadedAt: Date;
  reviewedAt: Date | null;
}) {
  return {
    id: doc.id,
    requirementId: doc.requirementId,
    label: doc.label,
    mimeType: doc.mimeType,
    status: doc.status,
    reviewNote: doc.reviewNote,
    uploadedAt: doc.uploadedAt.toISOString(),
    reviewedAt: doc.reviewedAt?.toISOString() ?? null,
    fileData: toDataUri(doc.fileData, doc.mimeType),
  };
}

async function computeOnboarding(businessId: string, business: { description: string; phone: string | null; address: string; openingHours: Prisma.JsonValue; storeClassId: string }) {
  const [productCategoryCount, productCount, pricedAvailableCount, requiredDocs, approvedDocs] = await Promise.all([
    prisma.productCategory.count({ where: { businessId } }),
    prisma.product.count({ where: { businessId } }),
    prisma.product.count({ where: { businessId, isAvailable: true, price: { gt: 0 } } }),
    prisma.storeClassDocumentRequirement.findMany({ where: { storeClassId: business.storeClassId, isRequired: true } }),
    prisma.storeDocument.findMany({ where: { businessId, status: 'APPROVED' }, select: { requirementId: true } }),
  ]);

  const approvedRequirementIds = new Set(approvedDocs.map((d) => d.requirementId));
  const requiredDocumentsApproved = requiredDocs.every((r) => approvedRequirementIds.has(r.id));

  const hours = business.openingHours as Record<string, { closed?: boolean }> | null;
  const openingHoursSet = Boolean(hours && Object.keys(hours).length > 0 && Object.values(hours).some((d) => !d.closed));

  const profileComplete = Boolean(business.description && business.phone && business.address);
  const hasProductCategory = productCategoryCount > 0;
  const hasProduct = productCount > 0;
  const hasPricedAvailableProduct = pricedAvailableCount > 0;

  return {
    profileComplete,
    openingHoursSet,
    hasProductCategory,
    hasProduct,
    hasPricedAvailableProduct,
    requiredDocumentsApproved,
    isComplete:
      profileComplete &&
      openingHoursSet &&
      hasProductCategory &&
      hasProduct &&
      hasPricedAvailableProduct &&
      requiredDocumentsApproved,
  };
}

function effectiveIsOpen(business: { status: string; isActivated: boolean; storeState: string }): boolean {
  return business.status === 'APPROVED' && business.isActivated && business.storeState === 'OPEN';
}

export async function getMyStore(userId: string) {
  const businessId = await getManagedBusinessId(userId);
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    include: { storeClass: true, documents: { orderBy: { uploadedAt: 'desc' } } },
  });
  const onboarding = await computeOnboarding(businessId, business);

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    description: business.description,
    storeClass: mapStoreClassSummary(business.storeClass),
    logoUrl: business.logoUrl,
    coverImageUrl: business.coverImageUrl,
    phone: business.phone,
    email: business.email,
    address: business.address,
    latitude: business.latitude,
    longitude: business.longitude,
    openingHours: business.openingHours,
    prepTimeMinutes: business.prepTimeMinutes,
    status: business.status,
    isActivated: business.isActivated,
    storeState: business.storeState,
    effectiveIsOpen: effectiveIsOpen(business),
    rejectionReason: business.rejectionReason,
    ratingAvg: business.ratingAvg,
    ratingCount: business.ratingCount,
    documents: business.documents.map(mapStoreDocument),
    onboarding,
    createdAt: business.createdAt.toISOString(),
    approvedAt: business.approvedAt?.toISOString() ?? null,
    activatedAt: business.activatedAt?.toISOString() ?? null,
  };
}

export async function updateMyStoreProfile(userId: string, input: UpdateStoreProfileInput) {
  const businessId = await getManagedBusinessId(userId);
  await prisma.business.update({ where: { id: businessId }, data: input });
  return getMyStore(userId);
}

export async function updateMyStoreHours(userId: string, hours: OpeningHours) {
  const businessId = await getManagedBusinessId(userId);
  await prisma.business.update({ where: { id: businessId }, data: { openingHours: hours as unknown as Prisma.InputJsonValue } });
  return getMyStore(userId);
}

export async function setMyStoreOpenStatus(userId: string, storeState: 'OPEN' | 'PAUSED') {
  const businessId = await getManagedBusinessId(userId);
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  if (business.status === 'SUSPENDED' || business.status === 'DEACTIVATED') {
    throw new ConflictError('This store has been suspended by ChiruDeli and cannot be reopened from here.', 'STORE_SUSPENDED');
  }
  await prisma.business.update({ where: { id: businessId }, data: { storeState } });
  return getMyStore(userId);
}

export async function activateMyStore(userId: string) {
  const businessId = await getManagedBusinessId(userId);
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  if (business.status !== 'APPROVED') {
    throw new ConflictError('Your store must be approved by ChiruDeli before it can be activated.', 'NOT_APPROVED');
  }
  const onboarding = await computeOnboarding(businessId, business);
  if (!onboarding.isComplete) {
    throw new ValidationError('Finish the onboarding checklist before activating your store.', onboarding);
  }
  await prisma.business.update({ where: { id: businessId }, data: { isActivated: true, activatedAt: new Date() } });
  await recordAudit({ actorUserId: userId, action: 'STORE_ACTIVATED', entityType: 'Business', entityId: businessId });
  return getMyStore(userId);
}

export async function getManagerDashboardStats(userId: string) {
  const businessId = await getManagedBusinessId(userId);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [todayOrders, pendingOrders, productCount, business, todaySalesAgg] = await Promise.all([
    prisma.order.count({ where: { businessId, masterOrder: { placedAt: { gte: startOfToday } } } }),
    prisma.order.count({ where: { businessId, status: { in: ['PENDING_CONFIRMATION', 'CONFIRMED', 'PREPARING'] } } }),
    prisma.product.count({ where: { businessId } }),
    prisma.business.findUniqueOrThrow({ where: { id: businessId } }),
    prisma.order.aggregate({
      where: { businessId, status: { not: 'CANCELLED' }, masterOrder: { placedAt: { gte: startOfToday } } },
      _sum: { subtotal: true },
    }),
  ]);

  return {
    todayOrders,
    todaySales: Number(todaySalesAgg._sum.subtotal ?? 0),
    pendingOrders,
    productCount,
    ratingAvg: business.ratingAvg,
    ratingCount: business.ratingCount,
  };
}

export async function listMyStoreReviews(userId: string) {
  const businessId = await getManagedBusinessId(userId);
  const reviews = await prisma.review.findMany({
    where: { businessId, isHidden: false },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return reviews.map((r) => ({
    id: r.id,
    orderId: r.orderId,
    businessRating: r.businessRating,
    businessComment: r.businessComment,
    customerName: r.customer.displayName,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function uploadMyStoreDocument(userId: string, input: UploadStoreDocumentInput) {
  const businessId = await getManagedBusinessId(userId);
  const stored = await documentStorageProvider.store(input.fileData, input.mimeType);
  const doc = await prisma.storeDocument.create({
    data: {
      businessId,
      requirementId: input.requirementId,
      label: input.label,
      mimeType: input.mimeType,
      fileData: stored,
      status: 'PENDING',
    },
  });
  return mapStoreDocument(doc);
}

// ── Admin store management (spec §6/§7/§16) ──────────────────────────────

type AdminBusinessRow = Prisma.BusinessGetPayload<{
  include: {
    storeClass: true;
    managers: { include: { storeManager: { include: { user: true } } } };
  };
}>;

function primaryManagerName(business: AdminBusinessRow): string | null {
  const primary = business.managers.find((m) => m.isPrimary) ?? business.managers[0];
  return primary?.storeManager.fullName ?? null;
}

function mapAdminBusinessListItem(business: AdminBusinessRow) {
  return {
    id: business.id,
    name: business.name,
    storeClass: mapStoreClassSummary(business.storeClass),
    status: business.status,
    isActivated: business.isActivated,
    storeState: business.storeState,
    managerName: primaryManagerName(business),
    phone: business.phone,
    createdAt: business.createdAt.toISOString(),
    address: business.address,
  };
}

function mapAdminBusinessDetail(
  business: AdminBusinessRow & {
    documents: Array<Parameters<typeof mapStoreDocument>[0]>;
    _count: { products: number; orders: number };
  },
) {
  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    logoUrl: business.logoUrl,
    storeClass: mapStoreClassSummary(business.storeClass),
    ratingAvg: business.ratingAvg,
    ratingCount: business.ratingCount,
    estimatedDeliveryMinutes: 30,
    deliveryFee: 0,
    storeState: business.storeState,
    isOpenNow: effectiveIsOpen(business),
    coverImageUrl: business.coverImageUrl,
    description: business.description,
    openingHours: business.openingHours,
    status: business.status,
    address: business.address,
    isActivated: business.isActivated,
    rejectionReason: business.rejectionReason,
    phone: business.phone,
    email: business.email,
    registrationNumber: business.registrationNumber,
    taxId: business.taxId,
    managers: business.managers.map((m) => ({
      id: m.storeManager.id,
      fullName: m.storeManager.fullName,
      phone: m.storeManager.user.phone,
      email: m.storeManager.user.email,
      accountStatus: m.storeManager.user.status,
    })),
    documents: business.documents.map(mapStoreDocument),
    productCount: business._count.products,
    orderCount: business._count.orders,
    createdAt: business.createdAt.toISOString(),
    submittedAt: business.submittedAt?.toISOString() ?? null,
    approvedAt: business.approvedAt?.toISOString() ?? null,
    activatedAt: business.activatedAt?.toISOString() ?? null,
  };
}

const adminBusinessInclude = {
  storeClass: true,
  managers: { include: { storeManager: { include: { user: true } } } },
} satisfies Prisma.BusinessInclude;

export async function listAdminBusinesses(filters: { status?: string; storeClassId?: string; search?: string }) {
  const where: Prisma.BusinessWhereInput = {
    ...(filters.status ? { status: filters.status as Prisma.EnumBusinessStatusFilter['equals'] } : {}),
    ...(filters.storeClassId ? { storeClassId: filters.storeClassId } : {}),
    ...(filters.search ? { name: { contains: filters.search, mode: 'insensitive' as const } } : {}),
  };
  const businesses = await prisma.business.findMany({ where, include: adminBusinessInclude, orderBy: { createdAt: 'desc' } });
  return businesses.map(mapAdminBusinessListItem);
}

export async function getAdminBusinessDetail(id: string) {
  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      ...adminBusinessInclude,
      documents: { orderBy: { uploadedAt: 'desc' } },
      _count: { select: { products: true, orders: true } },
    },
  });
  if (!business) throw new NotFoundError('Business');
  return mapAdminBusinessDetail(business);
}

async function loadBusinessOrThrow(id: string) {
  const business = await prisma.business.findUnique({ where: { id } });
  if (!business) throw new NotFoundError('Business');
  return business;
}

async function notifyManager(businessId: string, params: Parameters<typeof createNotification>[0] extends infer P ? Omit<P, 'userId'> : never) {
  const managerUserId = await getPrimaryManagerUserId(businessId);
  if (managerUserId) await createNotification({ ...params, userId: managerUserId });
}

const REVIEWABLE_STATUSES = ['PENDING_APPROVAL', 'UNDER_REVIEW', 'RESUBMISSION'];

export async function approveStore(id: string, actorUserId: string) {
  const business = await loadBusinessOrThrow(id);
  if (!REVIEWABLE_STATUSES.includes(business.status)) {
    throw new ConflictError(`Cannot approve a store with status ${business.status}.`);
  }
  await prisma.business.update({
    where: { id },
    data: { status: 'APPROVED', approvedAt: new Date(), approvedById: actorUserId, rejectionReason: null },
  });
  await recordAudit({ actorUserId, action: 'STORE_APPROVED', entityType: 'Business', entityId: id, metadata: { name: business.name } });
  await notifyManager(id, {
    type: 'STORE_APPROVED',
    title: '🎉 Your store has been approved!',
    body: 'Your store is now ready to be activated on ChiruDeli.',
    data: { businessId: id },
  });
  return getAdminBusinessDetail(id);
}

export async function rejectStore(id: string, reason: string, actorUserId: string) {
  const business = await loadBusinessOrThrow(id);
  if (!REVIEWABLE_STATUSES.includes(business.status)) {
    throw new ConflictError(`Cannot reject a store with status ${business.status}.`);
  }
  await prisma.business.update({ where: { id }, data: { status: 'REJECTED', rejectionReason: reason } });
  await recordAudit({ actorUserId, action: 'STORE_REJECTED', entityType: 'Business', entityId: id, metadata: { reason } });
  await notifyManager(id, {
    type: 'STORE_REJECTED',
    title: 'Your store registration could not be approved.',
    body: reason,
    data: { businessId: id },
  });
  return getAdminBusinessDetail(id);
}

export async function requestStoreChanges(id: string, message: string, actorUserId: string) {
  const business = await loadBusinessOrThrow(id);
  if (!REVIEWABLE_STATUSES.includes(business.status)) {
    throw new ConflictError(`Cannot request changes for a store with status ${business.status}.`);
  }
  await prisma.business.update({ where: { id }, data: { status: 'RESUBMISSION', rejectionReason: message } });
  await recordAudit({ actorUserId, action: 'STORE_CHANGES_REQUESTED', entityType: 'Business', entityId: id, metadata: { message } });
  await notifyManager(id, {
    type: 'STORE_CHANGES_REQUESTED',
    title: 'Your store registration requires additional information.',
    body: message,
    data: { businessId: id },
  });
  return getAdminBusinessDetail(id);
}

export async function suspendStore(id: string, reason: string, actorUserId: string) {
  const business = await loadBusinessOrThrow(id);
  await prisma.business.update({ where: { id }, data: { status: 'SUSPENDED', rejectionReason: reason } });
  await recordAudit({ actorUserId, action: 'STORE_SUSPENDED', entityType: 'Business', entityId: id, metadata: { reason, previousStatus: business.status } });
  await notifyManager(id, { type: 'STORE_SUSPENDED', title: 'Your store has been suspended', body: reason, data: { businessId: id } });
  return getAdminBusinessDetail(id);
}

export async function reactivateStore(id: string, actorUserId: string) {
  const business = await loadBusinessOrThrow(id);
  if (business.status !== 'SUSPENDED') throw new ConflictError('Only a suspended store can be reactivated.');
  await prisma.business.update({ where: { id }, data: { status: 'APPROVED', rejectionReason: null } });
  await recordAudit({ actorUserId, action: 'STORE_REACTIVATED', entityType: 'Business', entityId: id });
  await notifyManager(id, {
    type: 'STORE_REACTIVATED',
    title: 'Your store has been reactivated',
    body: 'Your store is visible to customers again.',
    data: { businessId: id },
  });
  return getAdminBusinessDetail(id);
}

export async function deactivateStore(id: string, actorUserId: string) {
  await loadBusinessOrThrow(id);
  await prisma.business.update({ where: { id }, data: { status: 'DEACTIVATED' } });
  await recordAudit({ actorUserId, action: 'STORE_DEACTIVATED', entityType: 'Business', entityId: id });
  return getAdminBusinessDetail(id);
}

export async function adminUpdateStore(id: string, input: AdminUpdateStoreInput, actorUserId: string) {
  await loadBusinessOrThrow(id);
  await prisma.business.update({ where: { id }, data: input });
  await recordAudit({ actorUserId, action: 'STORE_EDITED', entityType: 'Business', entityId: id, metadata: { changes: input } });
  return getAdminBusinessDetail(id);
}

export async function reviewStoreDocument(businessId: string, docId: string, input: ReviewStoreDocumentInput, actorUserId: string) {
  const doc = await prisma.storeDocument.findFirst({ where: { id: docId, businessId } });
  if (!doc) throw new NotFoundError('Document');
  const updated = await prisma.storeDocument.update({
    where: { id: docId },
    data: { status: input.status, reviewNote: input.reviewNote, reviewedAt: new Date(), reviewedById: actorUserId },
  });
  await recordAudit({
    actorUserId,
    action: input.status === 'APPROVED' ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED',
    entityType: 'StoreDocument',
    entityId: docId,
    metadata: { businessId },
  });
  return mapStoreDocument(updated);
}

// ── Admin store manager management (spec §20) ────────────────────────────

type StoreManagerRow = Prisma.StoreManagerGetPayload<{
  include: { user: true; assignments: { include: { business: true } } };
}>;

function mapStoreManagerListItem(sm: StoreManagerRow) {
  return {
    id: sm.id,
    fullName: sm.fullName,
    phone: sm.user.phone,
    email: sm.user.email,
    accountStatus: sm.user.status,
    stores: sm.assignments.map((a) => ({ id: a.business.id, name: a.business.name, isPrimary: a.isPrimary })),
    createdAt: sm.createdAt.toISOString(),
  };
}

const storeManagerInclude = { user: true, assignments: { include: { business: true } } } satisfies Prisma.StoreManagerInclude;

export async function listAdminStoreManagers() {
  const managers = await prisma.storeManager.findMany({ include: storeManagerInclude, orderBy: { createdAt: 'desc' } });
  return managers.map(mapStoreManagerListItem);
}

export async function getAdminStoreManagerDetail(id: string) {
  const sm = await prisma.storeManager.findUnique({ where: { id }, include: storeManagerInclude });
  if (!sm) throw new NotFoundError('Store manager');
  return { ...mapStoreManagerListItem(sm), nationalIdInfo: sm.nationalIdInfo, lastLoginAt: sm.user.lastLoginAt?.toISOString() ?? null };
}

export async function suspendStoreManager(id: string, actorUserId: string) {
  const sm = await prisma.storeManager.findUnique({ where: { id } });
  if (!sm) throw new NotFoundError('Store manager');
  await prisma.user.update({ where: { id: sm.userId }, data: { status: 'SUSPENDED' } });
  await recordAudit({ actorUserId, action: 'MANAGER_SUSPENDED', entityType: 'StoreManager', entityId: id });
  return getAdminStoreManagerDetail(id);
}

export async function reactivateStoreManager(id: string, actorUserId: string) {
  const sm = await prisma.storeManager.findUnique({ where: { id } });
  if (!sm) throw new NotFoundError('Store manager');
  await prisma.user.update({ where: { id: sm.userId }, data: { status: 'ACTIVE' } });
  await recordAudit({ actorUserId, action: 'MANAGER_REACTIVATED', entityType: 'StoreManager', entityId: id });
  return getAdminStoreManagerDetail(id);
}

function generateTemporaryPassword(): string {
  return `Chiru${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 90 + 10)}!`;
}

export async function resetStoreManagerPassword(id: string, actorUserId: string) {
  const sm = await prisma.storeManager.findUnique({ where: { id } });
  if (!sm) throw new NotFoundError('Store manager');
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  await prisma.user.update({ where: { id: sm.userId }, data: { passwordHash } });
  await recordAudit({ actorUserId, action: 'MANAGER_PASSWORD_RESET', entityType: 'StoreManager', entityId: id });
  return { temporaryPassword };
}

export async function reassignStoreManager(id: string, input: ReassignStoreManagerInput, actorUserId: string) {
  const sm = await prisma.storeManager.findUnique({ where: { id } });
  if (!sm) throw new NotFoundError('Store manager');
  const business = await prisma.business.findUnique({ where: { id: input.businessId } });
  if (!business) throw new NotFoundError('Business');

  await prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.storeManagerAssignment.updateMany({ where: { businessId: input.businessId }, data: { isPrimary: false } });
    }
    await tx.storeManagerAssignment.upsert({
      where: { businessId_storeManagerId: { businessId: input.businessId, storeManagerId: id } },
      create: { businessId: input.businessId, storeManagerId: id, isPrimary: input.isPrimary },
      update: { isPrimary: input.isPrimary },
    });
  }, { maxWait: 10_000, timeout: 20_000 });
  await recordAudit({
    actorUserId,
    action: 'MANAGER_REASSIGNED',
    entityType: 'StoreManager',
    entityId: id,
    metadata: { businessId: input.businessId, isPrimary: input.isPrimary },
  });
  return getAdminStoreManagerDetail(id);
}
