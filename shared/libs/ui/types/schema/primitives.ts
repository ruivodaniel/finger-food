// ============================================================
// THEME SCHEMA — primitives
// The source of what a theme may say. The types in ../primitives.ts,
// ../derivations.ts, ../semantics.ts and ../modes.ts are inferred from here.
// ============================================================
import { z } from "zod";
import { SCALE } from "../axes";
import { RadixHueE } from "../color-system";
import { BrandSlotE, StatusColorE, FontFamilyTokenE, TypographyTypeKeyE, BorderWidthTokenE } from "../primitives";
import { DensityE, TextSizeE } from "../modes";

const values = <T extends Record<string, string>>(o: T) => Object.values(o) as [T[keyof T], ...T[keyof T][]];

// ── Colours ──────────────────────────────────────────────────

export const RawColor = z.string();
export const BrandSlot = z.enum(values(BrandSlotE));
export const StatusColor = z.enum(values(StatusColorE));
export const RadixHue = z.enum(values(RadixHueE));
export const ContentTone = z.enum(["standard", "soft"]);
export const GrayStep = z.enum(["50", "100", "150", "200", "250", "300", "400", "500", "600", "700", "800", "900", "950"]);

export const PrimitiveColorRef = z.union([
  z.templateLiteral(["main-", z.enum(["white", "black"])]),
  z.templateLiteral(["brand-", BrandSlot]),
  z.templateLiteral(["status-", StatusColor]),
  z.templateLiteral(["content-", RadixHue, "-", ContentTone]),
  z.templateLiteral(["custom-", z.string()]),
]);

export const DerivedColorRef = z.union([
  // smart-bw: mobile · smart-fb: web, the mode's foreground or background, whichever contrasts more with the fill
  z.enum(["smart-bw", "smart-fb", "tint"]),
  z.templateLiteral(["brand-", BrandSlot, "-gray-", GrayStep]),
  z.templateLiteral(["gray-", GrayStep]),
  z.templateLiteral(["gray-pure-", GrayStep]),
]);

export const SemanticColorRef = z.enum(["background", "foreground", "primary", "secondary", "muted", "accent"]);

export const ColorRef = z.union(
  [
    PrimitiveColorRef,
    DerivedColorRef,
    SemanticColorRef,
    z.enum(["transparent", "currentColor", "inherit"]),
    z.templateLiteral(["color-mix(", z.string()]),
  ],
  { error: "not a colour reference" },
);

/** a reference or a literal: any string */
export const Color = z.string();

export const ThemeColorsDerivation = z.strictObject({ grayColorMixPercentage: z.string() });

/** the roles: each its own colour (a literal), or a reference while a theme still points them at a brand colour */
export const ThemeSemanticTokens = z.strictObject({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  muted: z.string(),
});

export const AuthoredColor = z.union([
  z.string(),
  z.strictObject({ value: z.string(), modes: z.record(z.string(), z.string()).optional() }),
]);
export const ContentHue = z.strictObject({ standard: AuthoredColor, soft: AuthoredColor });

export const ThemeColors = z.strictObject({
  main: z.strictObject({ white: RawColor, black: RawColor }),
  brand: z.record(BrandSlot, RawColor),
  status: z.record(StatusColor, z.string()),
  /** 25 Radix hues × standard/soft, authored in the reference mode; the other modes are derived (theme-engine/README.md) */
  content: z.record(RadixHue, ContentHue),
  custom: z.record(z.string(), AuthoredColor).optional(),
  semanticTokens: ThemeSemanticTokens,
});

// ── Typography ───────────────────────────────────────────────

// steps of 50: variable fonts and Plex ship 450-style intermediate weights
export const FontWeight = z.literal([100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900]);
export const FontStyle = z.enum(["normal", "italic"]);
export const FontFamilyToken = z.enum(values(FontFamilyTokenE));

export const TypographyLevel = z.strictObject({
  fontFamily: FontFamilyToken,
  fontStyle: FontStyle,
  fontSizeMobile: z.number(),
  fontSizeDesktop: z.number(),
  fontWeight: FontWeight,
  lineHeight: z.number(),
  letterSpacing: z.string().optional(),
});

export const TypographyTypeKey = z.enum(values(TypographyTypeKeyE));

export const FontSourceGoogle = z.strictObject({ type: z.literal("google"), url: z.string() });
export const FontSourceLocal = z.strictObject({
  type: z.literal("local"),
  faces: z.array(z.strictObject({ weight: FontWeight, style: FontStyle.optional(), src: z.string() })),
});
export const FontSource = z.discriminatedUnion("type", [FontSourceGoogle, FontSourceLocal]);

export const ThemeTypography = z.strictObject({
  fonts: z.record(FontFamilyToken, z.string()),
  /** font loading config keyed by font family name (e.g. "Inter"): the engine emits @import for Google fonts, @font-face for local fonts.
   *  Fonts not listed are assumed to be system fonts or already loaded. A local face's `src`: the woff/woff2 path, relative to the generated CSS */
  fontSources: z.record(z.string(), FontSource).optional(),
  types: z.record(TypographyTypeKey, TypographyLevel),
});

// ── Spacing · radius · blur ──────────────────────────────────

export const Scale = z.enum(SCALE);
// one vocabulary for anything on the size axis: 'none' + the 9 SCALE steps. 'xxs' and 'xxl' are deprecated aliases of '2xs' and '2xl'
export const SpacingToken = z.enum(["none", ...SCALE, "xxs", "xxl"]);
export const ThemeSpacing = z.strictObject({ unit: z.number() });
// the same size axis + 'full' (as round as possible). A theme authors only the tokens it uses
export const RadiusToken = z.enum(["none", "full", ...SCALE]);
export const ThemeRadius = z.partialRecord(RadiusToken, z.string());
export const BlurToken = z.enum(["none", ...SCALE]);

// ── Effects ──────────────────────────────────────────────────

export const EffectToken = z.string();

const shadow = { x: z.number(), y: z.number(), blur: z.number(), spread: z.number().optional(), color: Color, opacity: z.number().optional() };
export const DropShadowEffect = z.strictObject({ type: z.literal("drop-shadow"), ...shadow });
export const InnerShadowEffect = z.strictObject({ type: z.literal("inner-shadow"), ...shadow });
export const BackdropBlurEffect = z.strictObject({
  type: z.literal("backdrop-blur"),
  blur: z.string(),
  saturation: z.string().optional(),
  brightness: z.string().optional(),
  contrast: z.string().optional(),
});
export const LayerBlurEffect = z.strictObject({ type: z.literal("layer-blur"), blur: z.string() });
export const NoiseEffect = z.strictObject({
  type: z.literal("noise"),
  opacity: z.number().optional(),
  density: z.number().optional(),
  blend: z.string().optional(),
});
export const GlassEffect = z.strictObject({
  type: z.literal("glass"),
  blur: z.string(),
  saturation: z.string().optional(),
  tint: ColorRef.optional(),
  tintOpacity: z.number().optional(),
});
export const EffectLayer = z.discriminatedUnion("type", [
  DropShadowEffect, InnerShadowEffect, BackdropBlurEffect, LayerBlurEffect, NoiseEffect, GlassEffect,
]);
export const ThemeEffects = z.record(z.string(), z.array(EffectLayer));

export const TextEffectLayer = z.strictObject({
  type: z.literal("text-shadow"),
  x: z.number(),
  y: z.number(),
  blur: z.number(),
  color: Color,
  opacity: z.number().optional(),
});

// ── Transitions ──────────────────────────────────────────────

export const TransitionDurationToken = z.enum(["extraFast", "fast", "average", "slow", "extraSlow"]);
export const TransitionTimingToken = z.enum(["ease", "easeIn", "easeOut", "easeInOut", "linear"]);
export const ThemeTransitions = z.strictObject({
  duration: z.record(TransitionDurationToken, z.string()),
  timing: z.record(TransitionTimingToken, z.string()),
});

// ── Border widths ────────────────────────────────────────────

export const BorderWidthToken = z.enum(values(BorderWidthTokenE));
export const ThemeBorderWidths = z.record(BorderWidthToken, z.string());
export const BorderStyleToken = z.enum(["solid", "dashed", "dotted", "none"]);

// ── Icons ────────────────────────────────────────────────────

export const IconSetId = z.enum(["lucide", "heroicons", "phosphor", "custom"]);
export const ThemeIcons = z.strictObject({
  set: IconSetId,
  sizes: z.strictObject({ xs: z.number(), sm: z.number(), md: z.number(), lg: z.number(), xl: z.number() }),
  weight: z.number(),
});

// ── Modes ────────────────────────────────────────────────────

/** `C' = Cmax × saturationFactor × (C / Cmax) ^ gamma` */
export const ChromaCurve = z.strictObject({ saturationFactor: z.number(), gamma: z.number() });

// only tokens that do NOT depend on --background/--foreground: the derived grays are computed from these anchors. Raw hex is allowed
export const ColorModeAnchorRef = z.union(
  [PrimitiveColorRef, z.templateLiteral(["gray-pure-", GrayStep]), z.templateLiteral(["#", z.string()])],
  { error: "not a colour a mode may anchor on: a primitive colour, gray-pure-N or a hex" },
);

export const ColorModePreset = z.strictObject({
  background: ColorModeAnchorRef,
  foreground: ColorModeAnchorRef,
  derivation: ThemeColorsDerivation,
  /** how chroma behaves when this mode is derived from the reference mode (theme-engine/README.md) */
  chroma: ChromaCurve.optional(),
  /** the exponent of the curve that spreads the derived colours between this mode's background and foreground lightness: 1 is straight (default), above 1 pushes them toward the extremes */
  contrastRatio: z.number().optional(),
  /** the least lightness gap between a text or an icon and what it sits on (OKLCH lightness, default 0.55), capped at 90% of this mode's own range */
  minTextContrast: z.number().optional(),
  /** how far past the equal-contrast point `smart-fb` keeps the lighter text on a mid-tone fill (lightness, default 0.12) */
  smartBias: z.number().optional(),
});
export const ThemeColorScheme = z.record(z.string(), ColorModePreset);
export const Density = z.enum(values(DensityE));
export const TextSize = z.enum(values(TextSizeE));
export const ThemeModes = z.strictObject({
  colorScheme: ThemeColorScheme,
  density: Density.optional(),
  textSize: TextSize.optional(),
});
