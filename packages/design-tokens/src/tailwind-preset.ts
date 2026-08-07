import { colors } from './colors';
import { fontFamily, fontSize } from './typography';
import { spacing, radius } from './spacing';

/**
 * Shared Tailwind preset consumed by business-web, admin-web (tailwindcss)
 * and customer-mobile, rider-mobile (NativeWind uses the same Tailwind
 * config shape). This is the one place the brand palette/type-scale is
 * translated into utility-class form — every app extends this preset rather
 * than redefining colors.
 */
export const chirudeliTailwindPreset = {
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        neutral: colors.neutral,
        success: colors.semantic.success,
        warning: colors.semantic.warning,
        error: colors.semantic.error,
        info: colors.semantic.info,
        background: colors.background.default,
        surface: colors.background.surface,
      },
      fontFamily: {
        heading: [fontFamily.heading, 'sans-serif'],
        body: [fontFamily.body, 'sans-serif'],
      },
      fontSize: Object.fromEntries(
        Object.entries(fontSize).map(([key, value]) => [key, `${value}px`]),
      ),
      spacing: Object.fromEntries(
        Object.entries(spacing).map(([key, value]) => [key, `${value}px`]),
      ),
      borderRadius: {
        sm: `${radius.sm}px`,
        md: `${radius.md}px`,
        lg: `${radius.lg}px`,
        xl: `${radius.xl}px`,
        pill: `${radius.pill}px`,
      },
    },
  },
};
