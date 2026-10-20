// =============================================================================
// ALL option arrays for dropdown/select fields in the theme editor.
// =============================================================================

export const SPACING_OPTS = [
  "none",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
] as const;

export const RADIUS_OPTS = [
  "none",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "full",
] as const;

export const BORDER_WIDTH_OPTS = [
  "none",
  "extraThin",
  "thin",
  "default",
  "thick",
  "extraThick",
] as const;

export const BORDER_STYLE_OPTS = ["solid", "dashed", "dotted", "none"] as const;

export const CURSOR_OPTS = [
  "auto", "default", "none", "pointer", "wait", "text",
  "move", "not-allowed", "crosshair", "grab", "grabbing",
  "help", "progress", "cell", "copy", "alias",
  "col-resize", "row-resize", "zoom-in", "zoom-out",
] as const;

export const TYPO_OPTS = [
  "heading1", "heading2", "heading3", "heading4",
  "bodyExtraLarge", "bodyLarge", "body", "bodySmall", "bodyExtraSmall",
  "quoteLarge", "quote", "quoteSmall",
  "code",
  "numbersExtraLarge", "numbersLarge", "numbers", "numbersSmall", "numbersExtraSmall",
  "link",
] as const;

export const EMPHASIS_OPTS = [
  "hero", "primary", "secondary", "tertiary", "quiet",
] as const;

export const STATE_OPTS = [
  "default", "hover", "active", "focus", "selected", "disabled", "loading",
] as const;

export const STATUS_OPTS = [
  "neutral", "info", "success", "warning", "error", "destructive",
] as const;

export const SMART_BLEED_OPTS = [
  "normal", "rounded", "border", "border-rounded", "false",
] as const;

export const TRANSITION_DURATION_OPTS = [
  "extraFast", "fast", "average", "slow", "extraSlow",
] as const;

export const TRANSITION_TIMING_OPTS = [
  "ease", "easeIn", "easeOut", "easeInOut", "linear",
] as const;

export const ICON_SIZE_OPTS = [
  "xs", "sm", "md", "lg", "xl", "inherit",
] as const;

export const ICON_SET_OPTS = [
  "lucide", "heroicons", "phosphor", "custom",
] as const;

export const FONT_FAMILY_TOKEN_OPTS = [
  "primary", "secondary", "quote", "monoPrimary", "monoSecondary",
] as const;

export const FONT_STYLE_OPTS = ["normal", "italic"] as const;

export const FONT_WEIGHT_OPTS = [
  "100", "200", "300", "400", "500", "600", "700", "800", "900",
] as const;

export const TEXT_TRANSFORM_OPTS = [
  "none", "uppercase", "lowercase", "capitalize",
] as const;

export const TEXT_DECORATION_OPTS = [
  "none", "underline", "line-through",
] as const;

export const CHILD_ALIGN_OPTS = [
  "start", "center", "end", "stretch", "baseline",
] as const;

export const COLOR_GROUPS = [
  { label: "Special", tokens: ["transparent", "currentColor", "inherit", "tint", "smart-bw"] },
  { label: "Semantic", tokens: ["background", "foreground", "primary", "secondary", "accent", "muted"] },
  { label: "Main", tokens: ["main-white", "main-black"] },
  {
    label: "Brand",
    tokens: ["brand-1", "brand-1-light", "brand-1-dark", "brand-2", "brand-2-light", "brand-2-dark",
             "brand-3", "brand-3-light", "brand-3-dark", "brand-4", "brand-4-light", "brand-4-dark"],
  },
  {
    label: "Status",
    tokens: ["status-success", "status-success-light", "status-success-dark",
             "status-info", "status-info-light", "status-info-dark",
             "status-warning", "status-warning-light", "status-warning-dark",
             "status-error", "status-error-light", "status-error-dark"],
  },
  {
    label: "Gray",
    tokens: ["gray-50", "gray-100", "gray-200", "gray-300", "gray-400",
             "gray-500", "gray-600", "gray-700", "gray-800", "gray-900", "gray-950"],
  },
  {
    label: "Gray Pure",
    tokens: ["gray-pure-50", "gray-pure-100", "gray-pure-200", "gray-pure-300", "gray-pure-400",
             "gray-pure-500", "gray-pure-600", "gray-pure-700", "gray-pure-800", "gray-pure-900", "gray-pure-950"],
  },
  {
    label: "Flat",
    tokens: ["flat-red", "flat-orange", "flat-yellow", "flat-lime", "flat-green",
             "flat-mint", "flat-turquoise", "flat-blue", "flat-violet", "flat-purple", "flat-pink"],
  },
] as const;

export const FONT_GROUPS = [
  { label: "Sans Serif", fonts: ["Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Nunito", "Poppins"] },
  { label: "Serif", fonts: ["Playfair Display", "Merriweather", "Lora", "DM Serif Display", "Crimson Text"] },
  { label: "Monospace", fonts: ["JetBrains Mono", "Fira Code", "Source Code Pro", "IBM Plex Mono"] },
] as const;
