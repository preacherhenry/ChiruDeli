export * from './colors';
export * from './typography';
export * from './spacing';
export * from './shadows';
export * from './tailwind-preset';
export * from './brand';

import { colors } from './colors';
import { typography } from './typography';
import { spacing, radius } from './spacing';
import { shadows } from './shadows';

export const tokens = { colors, typography, spacing, radius, shadows } as const;
