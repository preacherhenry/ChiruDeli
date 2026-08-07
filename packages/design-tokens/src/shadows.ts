/**
 * Two representations per elevation level: `web` (CSS box-shadow, for
 * business-web/admin-web) and `native` (React Native shadow* + Android
 * elevation, for customer-mobile/rider-mobile). Keep both in sync by hand —
 * there's no automatic conversion between the two shadow models.
 */

export type NativeShadow = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

export const shadows: Record<'level1' | 'level2' | 'level3', { web: string; native: NativeShadow }> = {
  level1: {
    web: '0 1px 2px rgba(31, 35, 40, 0.06), 0 1px 1px rgba(31, 35, 40, 0.04)',
    native: {
      shadowColor: '#1F2328',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 1,
    },
  },
  level2: {
    web: '0 2px 8px rgba(31, 35, 40, 0.08), 0 1px 2px rgba(31, 35, 40, 0.06)',
    native: {
      shadowColor: '#1F2328',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
  },
  level3: {
    web: '0 8px 24px rgba(31, 35, 40, 0.12), 0 2px 4px rgba(31, 35, 40, 0.06)',
    native: {
      shadowColor: '#1F2328',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
  },
};
