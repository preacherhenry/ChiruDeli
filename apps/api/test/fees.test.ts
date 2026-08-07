import { describe, it, expect } from 'vitest';
import { calculateDeliveryFee, calculateCommission } from '../src/lib/fees';
import { HaversineDistanceProvider } from '../src/lib/distance';

describe('calculateDeliveryFee', () => {
  it('uses the zone fixed fee when the zone is FIXED_ZONE', () => {
    const fee = calculateDeliveryFee({
      zone: { id: '1', isServiceArea: true, feeType: 'FIXED_ZONE', fixedFee: 30 },
      distanceKm: 12.4, // ignored for fixed zones
      feeConfig: { baseFee: 15, perKmFee: 5 },
    });
    expect(fee).toBe(30);
  });

  it('applies base + distance * perKm for DISTANCE_BASED zones', () => {
    const fee = calculateDeliveryFee({
      zone: { id: '1', isServiceArea: true, feeType: 'DISTANCE_BASED', fixedFee: null },
      distanceKm: 4,
      feeConfig: { baseFee: 15, perKmFee: 5 },
    });
    expect(fee).toBe(35); // 15 + 4*5
  });
});

describe('calculateCommission', () => {
  it('splits subtotal into commission and business payout', () => {
    const { commissionAmount, businessPayoutAmount } = calculateCommission(100, 10);
    expect(commissionAmount).toBe(10);
    expect(businessPayoutAmount).toBe(90);
  });

  it('rounds to 2 decimal places', () => {
    const { commissionAmount, businessPayoutAmount } = calculateCommission(33.33, 15);
    expect(commissionAmount).toBeCloseTo(5.0, 2);
    expect(businessPayoutAmount).toBeCloseTo(28.33, 2);
  });
});

describe('HaversineDistanceProvider', () => {
  it('returns ~0 for identical coordinates', () => {
    const provider = new HaversineDistanceProvider();
    const point = { latitude: -16.0334, longitude: 28.85 };
    expect(provider.distanceKm(point, point)).toBe(0);
  });

  it('returns a plausible distance for two nearby points in Chirundu', () => {
    const provider = new HaversineDistanceProvider();
    const a = { latitude: -16.0334, longitude: 28.85 };
    const b = { latitude: -16.09, longitude: 28.81 };
    const distance = provider.distanceKm(a, b);
    expect(distance).toBeGreaterThan(5);
    expect(distance).toBeLessThan(10);
  });
});
