// =============================================================================
// Shared component library for the theme editor.
//
// Section editors (ColorsEditor, TypographyEditor, etc.) compose these atoms
// and molecules. This module is the single import point — section editors
// should never reach into individual files.
// =============================================================================

// ── Popover placement hook ──────────────────────────────────────────────────
export { usePopoverPlacement } from "./usePopoverPlacement";

// ── Inheritance pattern types & helpers ─────────────────────────────────────
export type { InheritedProps, InheritedState } from "./inheritance";
export {
  inheritedState,
  inheritedTextCls,
  formatInherited,
} from "./inheritance";
export { InheritedDot } from "./InheritedDot";

// ── Color taxonomy ──────────────────────────────────────────────────────────
export type { TokenGroup } from "./colorTaxonomy";
export {
  COLOR_GROUPS,
  ANCHOR_COLOR_GROUPS,
  colorCssVar,
  isHexColor,
} from "./colorTaxonomy";

// ── Cross-cutting types ─────────────────────────────────────────────────────
export type {
  OnChange,
  EditorProps,
  RenderColorFn,
  RenderShadowLayersFn,
} from "./_types";
export { get, getObj, num, str, withPrefix } from "./_types";

// ── Atoms ───────────────────────────────────────────────────────────────────
export { HexInput } from "./HexInput";
export { TokenPicker } from "./TokenPicker";
export { ColorField } from "./ColorField";
export type { ColorFieldMode } from "./ColorField";
export { SelectField } from "./SelectField";
export { NumberField } from "./NumberField";
export { TextField } from "./TextField";
export { SegmentedSelect } from "./SegmentedSelect";
export { FontFamilySelect } from "./FontFamilySelect";

// Backwards-compat alias (prefer SelectField).
export { TokenDropdown } from "./TokenDropdown";

// ── Token-specific selects ──────────────────────────────────────────────────
export {
  SpacingSelect,
  RadiusSelect,
  BorderWidthSelect,
  BorderStyleSelect,
  TransitionDurationSelect,
  TransitionTimingSelect,
  CursorSelect,
  FontFamilyTokenSelect,
  FontWeightSelect,
  FontStyleSelect,
  TypographyTypeSelect,
  IconSetSelect,
  EffectTokenSelect,
} from "./tokenSelects";

// ── Layout primitives ───────────────────────────────────────────────────────
export { Section } from "./Section";
export { Row } from "./Row";
export { SubRow } from "./SubRow";
export { ExpandToggle } from "./ExpandToggle";
export * from "./EditorIcons";

// ── Molecules ───────────────────────────────────────────────────────────────
export { RadiusEditor } from "./RadiusEditor";
export { BorderEditor } from "./BorderEditor";
export { OutlineEditor } from "./OutlineEditor";
export { BoundaryEditor } from "./BoundaryEditor";
export { PaddingEditor } from "./PaddingEditor";
export { GapEditor } from "./GapEditor";
export { InteriorEditor } from "./InteriorEditor";
export { TypographySurfaceEditor } from "./TypographySurfaceEditor";
export { TransitionEditor } from "./TransitionEditor";
export { ShadowLayerEditor } from "./ShadowLayerEditor";

// ── Composite ───────────────────────────────────────────────────────────────
export { SurfaceEditor } from "./SurfaceEditor";
export { OverrideMetaSection } from "./OverrideMetaSection";

// ── CRUD scaffolding for keyed primitives (effects, modes, …) ───────────────
export { KeyedEntryList } from "./KeyedEntryList";
