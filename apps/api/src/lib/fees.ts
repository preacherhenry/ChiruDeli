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
