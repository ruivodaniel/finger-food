// ============================================================
// COLOR SYSTEM — palettes, content vocabulary, mode derivation
// Proposed evolution; see theme-engine/README.md.
// Additive: the legacy ThemeColors in primitives.ts is untouched until migration.
// ============================================================

import type { z } from 'zod';
import type * as S from './schema/primitives';
import type { BrandSlot, StatusColor } from './primitives';
import type { GrayStep } from './derivations';

/** A literal ("#E30613", "rgb(...)", "oklch(...)") or a token reference ("brand-1", "content-tomato-soft"). */
export type ColorValue = string;

export type ModeOverrides = Partial<Record<string, ColorValue>>;

export type AuthoredColor = z.infer<typeof S.AuthoredColor>;

export type GeneratedColor = { value?: ColorValue; modes?: ModeOverrides };

export const RadixHueE = {
  Tomato: 'tomato', Red: 'red', Ruby: 'ruby', Crimson: 'crimson',
  Pink: 'pink', Plum: 'plum',
  Purple: 'purple', Violet: 'violet', Iris: 'iris',
  Indigo: 'indigo', Blue: 'blue', Sky: 'sky',
  Cyan: 'cyan', Teal: 'teal',
  Jade: 'jade', Green: 'green', Grass: 'grass', Mint: 'mint', Lime: 'lime',
  Yellow: 'yellow', Amber: 'amber',
  Orange: 'orange',
  Brown: 'brown', Bronze: 'bronze', Gold: 'gold',
} as const;
export type RadixHue = (typeof RadixHueE)[keyof typeof RadixHueE];
export const RADIX_HUES = Object.values(RadixHueE) as RadixHue[];

/** the content vocabulary's families, as the cockpit and the docs group the hues */
export const RADIX_FAMILIES: Record<string, RadixHue[]> = {
  red: ['tomato', 'red', 'ruby', 'crimson'],
  pink: ['pink', 'plum'],
  purple: ['purple', 'violet', 'iris'],
  blue: ['indigo', 'blue', 'sky'],
  cyan: ['cyan', 'teal'],
  green: ['jade', 'green', 'grass', 'mint', 'lime'],
  yellow: ['yellow', 'amber'],
  orange: ['orange'],
  earth: ['brown', 'bronze', 'gold'],
};

export type ContentTone = z.infer<typeof S.ContentTone>;
export type ContentHue = z.infer<typeof S.ContentHue>;

export type MainKey = 'white' | 'black';

export type ColorSystem = {
  main: Record<MainKey, ColorValue>;
  brand: Record<BrandSlot, ColorValue>;
  status: Record<StatusColor, AuthoredColor>;
  grayscale?: Partial<Record<GrayStep, GeneratedColor>>;
  brandGrayscale?: Partial<Record<BrandSlot, Partial<Record<GrayStep, GeneratedColor>>>>;
  content: Record<RadixHue, ContentHue>;
  custom?: Record<string, AuthoredColor>;
  /** the roles (primary, secondary, accent, muted): each a source colour, derived per mode like status. A token reference is read for its source colour, never aliased. */
  roles?: Record<string, ColorValue>;
};

/** `C' = Cmax × saturationFactor × (C / Cmax) ^ gamma` */
export type ChromaCurve = z.infer<typeof S.ChromaCurve>;

/** A mode's tonal boundaries (any colour value or reference, chromatic allowed) and its chroma curve. */
export type ColorModeSpec = {
  background: ColorValue;
  foreground: ColorValue;
  chroma?: ChromaCurve;
  /** the contrast ratio of this mode: the exponent of the curve that spreads the derived colours between the mode's background and foreground lightness (1 = straight, above 1 = toward the extremes) */
  contrastRatio?: number;
};
