/**
 * ChiruDeli brand palette.
 * primary.600 (#0E6E4E) and secondary.500 (#F4A425) are the two brand-defining
 * hexes named in the design brief; the rest of each ramp is derived from them
 * so every surface/state in the product stays on-brand.
 */

export const green = {
  50: '#E6F4EE',
  100: '#C2E5D5',
  200: '#99D4B9',
  300: '#6FC29C',
  400: '#4CAE85',
  500: '#2E9A70',
  600: '#0E6E4E',
  700: '#0B5A40',
  800: '#094732',
  900: '#063325',
} as const;

export const orange = {
  50: '#FFF7E8',
  100: '#FEEBC0',
  200: '#FDDC93',
  300: '#FBCC66',
  400: '#F8BB45',
  500: '#F4A425',
  600: '#DB8B1A',
  700: '#B26F14',
  800: '#89540F',
  900: '#5F3A0A',
} as const;

export const neutral = {
  0: '#FFFFFF',
  50: '#F7F8F6',
  100: '#EEF0ED',
  200: '#DEE1DB',
  300: '#C3C7BF',
  400: '#9BA097',
  500: '#767B72',
  600: '#5B6169',
  700: '#454A42',
  800: '#2E322C',
  900: '#1F2328',
} as const;

export const semantic = {
  success: green[600],
  successSurface: green[50],
  warning: orange[600],
  warningSurface: orange[50],
  error: '#D64545',
  errorSurface: '#FBEAEA',
  info: '#2E7BD6',
  infoSurface: '#EAF2FC',
} as const;

export const colors = {
  primary: green,
  secondary: orange,
  neutral,
  semantic,
  background: {
    default: neutral[0],
    surface: neutral[50],
    inverted: neutral[900],
  },
  text: {
    primary: neutral[900],
    muted: neutral[600],
    inverted: neutral[0],
    onPrimary: neutral[0],
    onSecondary: neutral[900],
  },
  border: {
    default: neutral[200],
    strong: neutral[300],
  },
} as const;

export type ColorTokens = typeof colors;
