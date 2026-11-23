// ============================================================
// MODES — cross-cutting modifiers
// Transform resolved values across all cascade levels. Inferred from the theme schema.
// ============================================================
import type { z } from 'zod';
import type * as S from './schema/primitives';

export type ColorModeAnchorRef = z.infer<typeof S.ColorModeAnchorRef>;
export type ColorModePreset = z.infer<typeof S.ColorModePreset>;
export type ThemeColorScheme = z.infer<typeof S.ThemeColorScheme>;

export const DensityE = {
  Compact: 'compact',
  Default: 'default',
  Spacious: 'spacious',
} as const;
export type Density = z.infer<typeof S.Density>;

export const TextSizeE = {
  Small: 'small',
  Default: 'default',
  Large: 'large',
} as const;
export type TextSize = z.infer<typeof S.TextSize>;

export type ThemeModes = z.infer<typeof S.ThemeModes>;
