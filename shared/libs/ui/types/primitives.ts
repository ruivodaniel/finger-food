// ============================================================
// PRIMITIVE TOKEN TYPES
// Colors, Typography, Spacing, Radius, Effects, Transitions, Border Widths
// Inferred from the theme schema (schema/primitives.ts): the schema is the source.
// ============================================================
import type { z } from 'zod';
import type * as S from './schema/primitives';

// ── Colors ───────────────────────────────────────────────────

export type RawColor = z.infer<typeof S.RawColor>;
export type PrimitiveColorRef = z.infer<typeof S.PrimitiveColorRef>;
export type ColorRef = z.infer<typeof S.ColorRef>;
export type Color = z.infer<typeof S.Color>;

export const BrandSlotE = {
  One: '1',
  Two: '2',
  Three: '3',
  Four: '4',
} as const;
export type BrandSlot = z.infer<typeof S.BrandSlot>;

export const StatusColorE = {
  Success: 'success',
  Info: 'info',
  Warning: 'warning',
  Error: 'error',
} as const;
export type StatusColor = z.infer<typeof S.StatusColor>;

export type ThemeColorsDerivation = z.infer<typeof S.ThemeColorsDerivation>;
export type ThemeSemanticTokens = z.infer<typeof S.ThemeSemanticTokens>;
export type ThemeColors = z.infer<typeof S.ThemeColors>;

// ── Typography ───────────────────────────────────────────────

export type FontWeight = z.infer<typeof S.FontWeight>;
export type FontStyle = z.infer<typeof S.FontStyle>;

export const FontFamilyTokenE = {
  Primary: 'primary',
  Secondary: 'secondary',
  Quote: 'quote',
  MonoPrimary: 'monoPrimary',
  MonoSecondary: 'monoSecondary',
} as const;
export type FontFamilyToken = z.infer<typeof S.FontFamilyToken>;
export type TypographyLevel = z.infer<typeof S.TypographyLevel>;

export const TypographyTypeKeyE = {
  Heading1: 'heading1',
  Heading2: 'heading2',
  Heading3: 'heading3',
  Heading4: 'heading4',
  BodyExtraLarge: 'bodyExtraLarge',
  BodyLarge: 'bodyLarge',
  Body: 'body',
  BodySmall: 'bodySmall',
  BodyExtraSmall: 'bodyExtraSmall',
  QuoteLarge: 'quoteLarge',
  Quote: 'quote',
  QuoteSmall: 'quoteSmall',
  Code: 'code',
  NumbersExtraLarge: 'numbersExtraLarge',
  NumbersLarge: 'numbersLarge',
  Numbers: 'numbers',
  NumbersSmall: 'numbersSmall',
  NumbersExtraSmall: 'numbersExtraSmall',
  Link: 'link',
} as const;
export type TypographyTypeKey = z.infer<typeof S.TypographyTypeKey>;
export type FontSourceGoogle = z.infer<typeof S.FontSourceGoogle>;
export type FontSourceLocal = z.infer<typeof S.FontSourceLocal>;
export type FontSource = z.infer<typeof S.FontSource>;
export type ThemeTypography = z.infer<typeof S.ThemeTypography>;

// ── Spacing ──────────────────────────────────────────────────
// One vocabulary for anything on the size axis: 'none' + the 9 SCALE steps.
// 'xxs' and 'xxl' are kept as deprecated aliases so the app's theme-editor
// keeps compiling until it is migrated; new authoring uses '2xs' / '2xl'.

export type SpacingToken = z.infer<typeof S.SpacingToken>;
export const SpacingTokenE = {
  None: 'none',
  _3xs: '3xs', _2xs: '2xs',
  Xs: 'xs',
  Sm: 'sm',
  Md: 'md',
  Lg: 'lg',
  Xl: 'xl',
  _2xl: '2xl', _3xl: '3xl',
  /** @deprecated use '2xs' */ Xxs: 'xxs',
  /** @deprecated use '2xl' */ Xxl: 'xxl',
} as const;

export type ThemeSpacing = z.infer<typeof S.ThemeSpacing>;

// ── Radius ───────────────────────────────────────────────────
// Same size axis + 'full' (semantically distinct: as round as possible).

export type RadiusToken = z.infer<typeof S.RadiusToken>;
export const RadiusTokenE = {
  None: 'none',
  _3xs: '3xs', _2xs: '2xs',
  Xs: 'xs',
  Sm: 'sm',
  Md: 'md',
  Lg: 'lg',
  Xl: 'xl',
  _2xl: '2xl', _3xl: '3xl',
  Full: 'full',
} as const;

// Themes may author only the tokens they use; missing ones just don't emit a css var.
export type ThemeRadius = z.infer<typeof S.ThemeRadius>;

// ── Effects ──────────────────────────────────────────────────

export type EffectToken = z.infer<typeof S.EffectToken>;
export type DropShadowEffect = z.infer<typeof S.DropShadowEffect>;
export type InnerShadowEffect = z.infer<typeof S.InnerShadowEffect>;
export type BackdropBlurEffect = z.infer<typeof S.BackdropBlurEffect>;
export type LayerBlurEffect = z.infer<typeof S.LayerBlurEffect>;
export type NoiseEffect = z.infer<typeof S.NoiseEffect>;
export type GlassEffect = z.infer<typeof S.GlassEffect>;
export type EffectLayer = z.infer<typeof S.EffectLayer>;
export type EffectLayerType = EffectLayer['type'];
export type ThemeEffects = z.infer<typeof S.ThemeEffects>;
export type TextEffectLayer = z.infer<typeof S.TextEffectLayer>;

// ── Blur · transitions · border widths · icons ───────────────

export type BlurToken = z.infer<typeof S.BlurToken>;
export type TransitionDurationToken = z.infer<typeof S.TransitionDurationToken>;
export type TransitionTimingToken = z.infer<typeof S.TransitionTimingToken>;
export type ThemeTransitions = z.infer<typeof S.ThemeTransitions>;

export const BorderWidthTokenE = {
  None: 'none',
  ExtraThin: 'extraThin',
  Thin: 'thin',
  Default: 'default',
  Thick: 'thick',
  ExtraThick: 'extraThick',
} as const;
export type BorderWidthToken = z.infer<typeof S.BorderWidthToken>;
export type ThemeBorderWidths = z.infer<typeof S.ThemeBorderWidths>;
export type BorderStyleToken = z.infer<typeof S.BorderStyleToken>;
export type IconSetId = z.infer<typeof S.IconSetId>;
export type ThemeIcons = z.infer<typeof S.ThemeIcons>;
