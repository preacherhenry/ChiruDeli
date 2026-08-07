/**
 * Single source of truth for the ChiruDeli mark's geometry (not a component —
 * RN and DOM render SVG through different APIs, so each platform builds its
 * own tiny <Logo> using these primitives via react-native-svg / plain <svg>).
 *
 * Mark: a deep-green circle badge containing two offset white chevrons
 * pointing right — reads as motion/speed without leaning on a generic
 * fork-and-plate or scooter cliché. Wordmark: "Chiru" in charcoal/primary,
 * "Deli" in secondary orange, set in Manrope Bold/ExtraBold.
 */
export const brandMark = {
  viewBox: '0 0 100 100',
  circle: { cx: 50, cy: 50, r: 50 },
  chevrons: [
    { points: '32,22 54,50 32,78 42,78 64,50 42,22', opacity: 1 },
    { points: '48,22 70,50 48,78 58,78 80,50 58,22', opacity: 0.55 },
  ],
} as const;

export const wordmark = {
  parts: [
    { text: 'Chiru', colorToken: 'text.primary' as const },
    { text: 'Deli', colorToken: 'secondary.500' as const },
  ],
  fontFamily: 'Manrope',
  fontWeight: '800',
} as const;

export const tagline = 'Anything You Need. Delivered.';
