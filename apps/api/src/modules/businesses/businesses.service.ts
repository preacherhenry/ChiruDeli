import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { distanceProvider } from '../../lib/distance';
import { calculateDeliveryFee, getActiveFeeConfig, resolveZoneForCoordinates } from '../../lib/fees';

const businessWithCategory = { include: { category: true } } satisfies Prisma.BusinessFindManyArgs;

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

export async function listBusinesses(params: {
  category?: string;
  search?: string;
  lat?: number;
  lng?: number;
}) {
  const where: Prisma.BusinessWhereInput = {
    status: 'APPROVED',
    ...(params.category ? { category: { slug: params.category as never } } : {}),
    ...(params.search
      ? { name: { contains: params.search, mode: 'insensitive' as const } }
      : {}),
  };

  const businesses = await prisma.business.findMany({ where, ...businessWithCategory });
  const customerCoords =
    params.lat !== undefined && params.lng !== undefined
      ? { latitude: params.lat, longitude: params.lng }
      : undefined;

  return Promise.all(
    businesses.map(async (b) => {
      const { deliveryFee, estimatedDeliveryMinutes } = await estimateDeliveryFeeAndTime(
        b,
        customerCoords,
      );
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        logoUrl: b.logoUrl,
        category: {
          id: b.category.id,
          name: b.category.name,
          slug: b.category.slug,
          icon: b.category.icon,
        },
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
  const business = await prisma.business.findUnique({ where: { id }, ...businessWithCategory });
  if (!business || business.status !== 'APPROVED') throw new NotFoundError('Business');

  const customerCoords =
    coords?.lat !== undefined && coords?.lng !== undefined
      ? { latitude: coords.lat, longitude: coords.lng }
      : undefined;
  const { deliveryFee, estimatedDeliveryMinutes } = await estimateDeliveryFeeAndTime(
    business,
    customerCoords,
  );

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    logoUrl: business.logoUrl,
    coverImageUrl: business.coverImageUrl,
    description: business.description,
    category: {
      id: business.category.id,
      name: business.category.name,
      slug: business.category.slug,
      icon: business.category.icon,
    },
    ratingAvg: business.ratingAvg,
    ratingCount: business.ratingCount,
    estimatedDeliveryMinutes,
    deliveryFee,
    storeState: business.storeState,
    isOpenNow: business.storeState === 'OPEN' && isOpenNow(business.openingHours),
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

export async function listCategories() {
  return prisma.businessCategory.findMany({ orderBy: { sortOrder: 'asc' } });
}
