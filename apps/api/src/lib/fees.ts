import { prisma } from './prisma';
import { distanceProvider, type Coordinates } from './distance';

export interface ZoneForFee {
  id: string;
  isServiceArea: boolean;
  feeType: 'DISTANCE_BASED' | 'FIXED_ZONE';
  fixedFee: number | null;
}

export interface FeeConfig {
  baseFee: number;
  perKmFee: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Delivery fee is resolved by the DESTINATION zone (spec section 18's table
 * is keyed by delivery area, e.g. "Farm Area" → K30), not the business's
 * location. Distance is still needed for DISTANCE_BASED zones and for
 * rider-earnings estimates regardless of zone type.
 */
export function calculateDeliveryFee(params: {
  zone: ZoneForFee;
  distanceKm: number;
  feeConfig: FeeConfig;
}): number {
  if (params.zone.feeType === 'FIXED_ZONE' && params.zone.fixedFee != null) {
    return round2(params.zone.fixedFee);
  }
  return round2(params.feeConfig.baseFee + params.distanceKm * params.feeConfig.perKmFee);
}

export function calculateCommission(
  subtotal: number,
  commissionPercent: number,
): { commissionAmount: number; businessPayoutAmount: number } {
  const commissionAmount = round2((subtotal * commissionPercent) / 100);
  const businessPayoutAmount = round2(subtotal - commissionAmount);
  return { commissionAmount, businessPayoutAmount };
}

/** Flat top-up per store beyond the first, to cover the rider's extra stops. */
export const MULTI_STORE_SURCHARGE_PER_EXTRA_STORE = 10;

/**
 * Same zone-based formula as a single-store order, plus a flat surcharge
 * per additional store — a multi-pickup run takes the rider meaningfully
 * longer than a single pickup, so the fee (which the rider keeps in full)
 * should reflect that.
 */
export function calculateMultiStoreDeliveryFee(params: {
  zone: ZoneForFee;
  totalDistanceKm: number;
  feeConfig: FeeConfig;
  storeCount: number;
}): number {
  const base = calculateDeliveryFee({
    zone: params.zone,
    distanceKm: params.totalDistanceKm,
    feeConfig: params.feeConfig,
  });
  const surcharge = Math.max(0, params.storeCount - 1) * MULTI_STORE_SURCHARGE_PER_EXTRA_STORE;
  return round2(base + surcharge);
}

/**
 * Orders the rider's pickups and returns the total route distance. No real
 * route optimizer here — a simple nearest-to-destination-last heuristic
 * (farthest store first) keeps the rider from backtracking past a nearby
 * store to reach a farther one after picking up nearer stores first.
 */
export function sequencePickupStops<T extends Coordinates>(
  stores: T[],
  destination: Coordinates,
): { ordered: T[]; totalDistanceKm: number } {
  const ordered = [...stores].sort(
    (a, b) => distanceProvider.distanceKm(b, destination) - distanceProvider.distanceKm(a, destination),
  );

  let totalDistanceKm = 0;
  let from: Coordinates = ordered[0] ?? destination;
  for (const stop of ordered.slice(1)) {
    totalDistanceKm += distanceProvider.distanceKm(from, stop);
    from = stop;
  }
  totalDistanceKm += distanceProvider.distanceKm(from, destination);

  return { ordered, totalDistanceKm: Math.round(totalDistanceKm * 100) / 100 };
}

/** First service zone whose radius contains the point; null = outside coverage. */
export async function resolveZoneForCoordinates(coords: Coordinates): Promise<ZoneForFee | null> {
  // Smallest radius first so a narrow "Town" zone wins over a wider catch-all
  // zone that happens to also contain the point.
  const zones = await prisma.deliveryZone.findMany({
    where: { isServiceArea: true },
    orderBy: { radiusKm: 'asc' },
  });
  const match = zones.find((zone) => {
    const d = distanceProvider.distanceKm(coords, {
      latitude: zone.centerLatitude,
      longitude: zone.centerLongitude,
    });
    return d <= zone.radiusKm;
  });
  if (!match) return null;
  return {
    id: match.id,
    isServiceArea: match.isServiceArea,
    feeType: match.feeType,
    fixedFee: match.fixedFee != null ? Number(match.fixedFee) : null,
  };
}

export async function getActiveFeeConfig(): Promise<FeeConfig> {
  const config = await prisma.deliveryFeeConfig.findFirst({
    where: { isActive: true },
    orderBy: { effectiveFrom: 'desc' },
  });
  if (!config) {
    throw new Error('No active DeliveryFeeConfig — seed the database first.');
  }
  return { baseFee: Number(config.baseFee), perKmFee: Number(config.perKmFee) };
}
