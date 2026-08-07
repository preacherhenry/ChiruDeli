/**
 * Manrope for headings gives ChiruDeli a distinctive, geometric brand voice;
 * Inter for body copy stays legible at small sizes on low-end Android screens.
 * Both are variable/static fonts available on Google Fonts and via Expo's
 * expo-font / expo-google-fonts packages, and next/font on the web apps.
 */

export const fontFamily = {
  heading: 'Manrope',
  body: 'Inter',
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const typography = { fontFamily, fontSize, fontWeight, lineHeight } as const;

export type TypographyTokens = typeof typography;
