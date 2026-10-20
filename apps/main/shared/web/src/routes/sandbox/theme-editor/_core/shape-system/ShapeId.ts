// =============================================================================
// Shape system — type definitions
//
// A "shape" is a recurring data-shape in the Theme tree. It can appear at
// many paths (e.g. SurfaceContainerTokens lives at families.surfaceContainer,
// families.field.surface, families.switch.track, families.field.startIcon, …).
//
// The editor dispatches by SHAPE, not by category — so one editor handles
// every occurrence of that shape across the tree.
// =============================================================================

import type { ReactNode } from "react";
import type { OnChange } from "../types";

/**
 * Universe of shapes the editor knows about. Add to this union as new shape
 * editors land. Shapes not in this union resolve to `null` and render
 * `<UnsupportedShape />` in the panel.
 */
export type ShapeId =
  // ── Surfaces ─────────────────────────────────────────────────
  | "surfaceContainer"
  | "partialSurface"

  // ── Theme-root primitives ────────────────────────────────────
  | "themeColors"
  | "themeTypography"
  | "themeSpacing"
  | "themeRadius"
  | "themeBorderWidths"
  | "themeEffects"
  | "themeTransitions"
  | "themeIcons"
  | "themeModes"
  | "themeGradients"

  // ── L2 family-level shapes ───────────────────────────────────
  // Single-surface families (just `{ surface }` envelope):
  | "interactiveControlGroup"
  | "shape"
  | "inlineSurface"
  // Multi-shape families:
  | "elevatedOverlay"      // surface + overlay
  | "interactiveControl"   // surface + startIcon + endIcon
  | "field"                // surface + startIcon + endIcon + loose primitives
  | "switch"               // track + thumb
  | "listContainer"        // surface + separator
  | "media"                // surface + objectFit/aspectRatio/overlay/filter
  | "tableRow"             // surface + alternating (only tableRow has alternating)

  // ── Layout shapes ────────────────────────────────────────────
  | "layoutSurface"        // { surface } — shell, page, main, etc.
  | "layoutHeaderScale"    // surface + height + sm/md/lg
  | "layoutLeftSidebar"    // surface + collapsed surface + width + sm/md/lg
  | "layoutSidebar"        // surface + width + sm/md/lg
  | "layoutContainerScale" // xs/sm/md/lg/xl maxWidth
  | "layoutDialogScale"    // sm/md/lg maxWidth (same shape as container)
  | "layoutSheetScale"     // sm/md/lg/full size
  | "layoutScrollArea";    // { scrollbar }

export type ShapeEditorProps = {
  data: unknown;
  inherited: unknown;
  onChange: OnChange;
  effectKeys: readonly string[];
};

export type ShapeEditor = (props: ShapeEditorProps) => ReactNode;
