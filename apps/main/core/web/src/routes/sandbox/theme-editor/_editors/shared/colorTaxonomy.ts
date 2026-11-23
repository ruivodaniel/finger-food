// =============================================================================
// Color & font token taxonomy for the TokenPicker.
//
// All groupings are derived from the type system (shared/libs/ui/types/*)
// and explicitly mirrored here as plain arrays — types alone don't survive
// to runtime, so we mirror them literally. Keep this in lockstep with:
//   - primitives.ts (BrandSlot, StatusColor, FlatColor, FontFamilyToken)
//   - derivations.ts (GrayStep, DerivedColorRef)
//   - semantics.ts (SemanticColorRef)
//   - modes.ts (ColorModeAnchorRef)
// =============================================================================

export type TokenGroup = { label: string; tokens: string[] };

const BRAND_SLOTS = ["1", "2", "3", "4"] as const;
const STATUSES = ["success", "info", "warning", "error"] as const;
const FLAT_COLORS = [
  "red", "orange", "yellow", "lime", "green", "mint",
  "turquoise", "blue", "violet", "purple", "pink",
] as const;
const GRAY_STEPS = [
  "50", "100", "150", "200", "250", "300",
  "400", "500", "600", "700", "800", "900", "950",
] as const;

const SEMANTIC_TOKENS = [
  "background", "foreground",
  "primary", "secondary", "muted", "accent",
] as const;

const SPECIAL_TOKENS = [
  "transparent", "currentColor", "inherit", "tint", "smart-bw",
] as const;

const MAIN_TOKENS = ["main-white", "main-black"] as const;

const BRAND_TOKENS: string[] = BRAND_SLOTS.flatMap((s) => [
  `brand-${s}`,
  `brand-${s}-light`,
  `brand-${s}-dark`,
]);

/** Per `DerivedColorRef`: brand-tinted gray scales — every brand × every gray step. */
const BRAND_GRAY_TOKENS: string[] = BRAND_SLOTS.flatMap((b) =>
  GRAY_STEPS.map((g) => `brand-${b}-gray-${g}`),
);

const STATUS_TOKENS: string[] = STATUSES.flatMap((s) => [
  `status-${s}`,
  `status-${s}-light`,
  `status-${s}-dark`,
]);

const GRAY_TINTED: string[] = GRAY_STEPS.map((s) => `gray-${s}`);
const GRAY_PURE: string[] = GRAY_STEPS.map((s) => `gray-pure-${s}`);

/** Per `PrimitiveColorRef`: `flat-${FlatColor | 'white' | 'black'}`. */
const FLAT_TOKENS: string[] = [
  ...FLAT_COLORS.map((c) => `flat-${c}`),
  "flat-white",
  "flat-black",
];

/**
 * Full token universe — for ColorRef fields used inside families/elements/contextual.
 * Used by `mode === 'token'` and `mode === 'hex-or-token'` (the token half).
 */
export const COLOR_GROUPS: TokenGroup[] = [
  { label: "Special", tokens: [...SPECIAL_TOKENS] },
  { label: "Semantic", tokens: [...SEMANTIC_TOKENS] },
  { label: "Main", tokens: [...MAIN_TOKENS] },
  { label: "Brand", tokens: BRAND_TOKENS },
  { label: "Brand Gray", tokens: BRAND_GRAY_TOKENS },
  { label: "Status", tokens: STATUS_TOKENS },
  { label: "Gray", tokens: GRAY_TINTED },
  { label: "Gray Pure", tokens: GRAY_PURE },
  { label: "Flat", tokens: FLAT_TOKENS },
];

/**
 * Anchor token universe — for `modes.colorScheme.*.background/foreground`.
 * Excludes derived tokens that depend on --background/--foreground (would be circular).
 * Per modes.ts ColorModeAnchorRef = PrimitiveColorRef | gray-pure-* | hex.
 */
export const ANCHOR_COLOR_GROUPS: TokenGroup[] = [
  { label: "Main", tokens: [...MAIN_TOKENS] },
  { label: "Brand", tokens: BRAND_SLOTS.map((s) => `brand-${s}`) },
  { label: "Status", tokens: STATUSES.map((s) => `status-${s}`) },
  { label: "Flat", tokens: FLAT_TOKENS },
  { label: "Gray Pure", tokens: GRAY_PURE },
];

// =============================================================================
// Live CSS-var swatch resolution.
// The theme engine emits all token values as CSS custom props (--token-name).
// =============================================================================

export function colorCssVar(token: string): string {
  if (!token) return "transparent";
  if (token.startsWith("#")) return token;
  return `var(--color-${token}, var(--${token}, transparent))`;
}

const HEX_RE = /^#([0-9a-fA-F]{3,8})$/;
export function isHexColor(v: string): boolean {
  return HEX_RE.test(v);
}
