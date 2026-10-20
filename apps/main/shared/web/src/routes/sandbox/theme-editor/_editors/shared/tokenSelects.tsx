// =============================================================================
// Token-specific selects — thin wrappers over <SelectField> with fixed options.
//
// Option arrays mirror the type system (shared/libs/ui/types/primitives.ts):
//   SpacingToken, RadiusToken, BorderWidthToken, BorderStyleToken,
//   TransitionDurationToken, TransitionTimingToken, CursorToken,
//   FontFamilyToken, FontWeight, FontStyle, TypographyTypeKey, IconSetId.
//
// Effects are theme-specific (Object.keys(theme.effects)) so EffectTokenSelect
// takes its options as a prop.
// =============================================================================

import { SelectField } from "./SelectField";
import type { InheritedProps } from "./inheritance";

type WrapperProps = InheritedProps<string> & { className?: string };

// ── Token enums (mirror primitives.ts) ──────────────────────────────────────

const SPACING = ["none", "xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const RADIUS = ["none", "xs", "sm", "md", "lg", "xl", "full"] as const;
const BORDER_WIDTH = ["none", "extraThin", "thin", "default", "thick", "extraThick"] as const;
const BORDER_STYLE = ["solid", "dashed", "dotted", "none"] as const;
const TRANSITION_DURATION = ["extraFast", "fast", "average", "slow", "extraSlow"] as const;
const TRANSITION_TIMING = ["ease", "easeIn", "easeOut", "easeInOut", "linear"] as const;

const CURSOR = [
  "auto", "default", "none", "pointer", "wait", "text",
  "move", "not-allowed", "crosshair", "grab", "grabbing",
  "help", "progress", "cell", "copy", "alias",
  "context-menu", "vertical-text", "no-drop", "all-scroll",
  "col-resize", "row-resize",
  "n-resize", "s-resize", "e-resize", "w-resize",
  "ne-resize", "nw-resize", "se-resize", "sw-resize",
  "ew-resize", "ns-resize", "nesw-resize", "nwse-resize",
  "zoom-in", "zoom-out",
] as const;

const FONT_FAMILY_TOKEN = ["primary", "secondary", "quote", "monoPrimary", "monoSecondary"] as const;
const FONT_WEIGHT = ["100", "200", "300", "400", "500", "600", "700", "800", "900"] as const;
const FONT_STYLE = ["normal", "italic"] as const;

const TYPOGRAPHY_TYPE = [
  "heading1", "heading2", "heading3", "heading4",
  "bodyExtraLarge", "bodyLarge", "body", "bodySmall", "bodyExtraSmall",
  "quoteLarge", "quote", "quoteSmall",
  "code",
  "numbersExtraLarge", "numbersLarge", "numbers", "numbersSmall", "numbersExtraSmall",
  "link",
] as const;

const ICON_SET = ["lucide", "heroicons", "phosphor", "custom"] as const;

// ── Wrappers ────────────────────────────────────────────────────────────────

export const SpacingSelect = (p: WrapperProps) => <SelectField {...p} options={SPACING} />;
export const RadiusSelect = (p: WrapperProps) => <SelectField {...p} options={RADIUS} />;
export const BorderWidthSelect = (p: WrapperProps) => <SelectField {...p} options={BORDER_WIDTH} />;
export const BorderStyleSelect = (p: WrapperProps) => <SelectField {...p} options={BORDER_STYLE} />;
export const TransitionDurationSelect = (p: WrapperProps) => (
  <SelectField {...p} options={TRANSITION_DURATION} />
);
export const TransitionTimingSelect = (p: WrapperProps) => (
  <SelectField {...p} options={TRANSITION_TIMING} />
);
export const CursorSelect = (p: WrapperProps) => <SelectField {...p} options={CURSOR} />;
export const FontFamilyTokenSelect = (p: WrapperProps) => (
  <SelectField {...p} options={FONT_FAMILY_TOKEN} />
);
export const FontWeightSelect = (p: WrapperProps) => <SelectField {...p} options={FONT_WEIGHT} />;
export const FontStyleSelect = (p: WrapperProps) => <SelectField {...p} options={FONT_STYLE} />;
export const TypographyTypeSelect = (p: WrapperProps) => (
  <SelectField {...p} options={TYPOGRAPHY_TYPE} />
);
export const IconSetSelect = (p: WrapperProps) => <SelectField {...p} options={ICON_SET} />;

/**
 * Effect token select. Options are theme-specific — driven by `Object.keys(theme.effects)`.
 */
export const EffectTokenSelect = (
  p: WrapperProps & { effectKeys: readonly string[] },
) => <SelectField value={p.value} inherited={p.inherited} onChange={p.onChange} options={p.effectKeys} className={p.className} />;
