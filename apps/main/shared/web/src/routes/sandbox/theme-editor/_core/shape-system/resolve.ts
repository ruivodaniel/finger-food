// =============================================================================
// Shape resolver — given an absolute theme path, return the shape at that
// position (or `null` if no shape is registered for it).
//
// This v1 implementation is hand-written. A subsequent commit will replace
// it with a `ts-morph` codegen step that walks the type tree from `Theme`
// and emits an exhaustive map keyed by path-pattern. Until then, paths not
// matched here fall through to <UnsupportedShape />.
// =============================================================================

import { ELEMENT_FAMILIES } from "../../../../../../../../../../shared/libs/ui/web/theme-engine/conventions";
import type { Theme } from "../../../../../../../../../../shared/libs/ui/types";
import type { NavSelection } from "../types";
import type { ShapeId } from "./ShapeId";

/**
 * Convert a navigator selection (category + sub-path) to an absolute theme
 * path that can be resolved by `resolveShape`.
 *
 *   { category: "primitives", path: ["colors"] }            → ["colors"]
 *   { category: "families",   path: ["surfaceContainer"] }  → ["families", "surfaceContainer"]
 *   { category: "elements",   path: ["card"] }              → ["elements", "card"]
 *   { category: "contextual", path: ["sidebar", "navItem"]} → ["contextual", "sidebar", "navItem"]
 *   { category: "layouts",    path: ["dialog"] }            → ["layouts", "dialog"]
 *   { category: "rules",      path: ["3"] }                 → ["rules", "3", "tokens"]
 *     (selection points at the rule index; data lives at rule.tokens)
 */
export function selectionToPath(selection: NavSelection): string[] {
  switch (selection.category) {
    case "primitives":
      return [...selection.path];
    case "families":
      return ["families", ...selection.path];
    case "elements":
      return ["elements", ...selection.path];
    case "contextual":
      return ["contextual", ...selection.path];
    case "layouts":
      return ["layouts", ...selection.path];
    case "rules":
      return ["rules", ...selection.path, "tokens"];
  }
}

// Theme-root primitive paths → shape ids.
const PRIMITIVE_SHAPES: Record<string, ShapeId> = {
  colors: "themeColors",
  typography: "themeTypography",
  spacing: "themeSpacing",
  radius: "themeRadius",
  borderWidths: "themeBorderWidths",
  effects: "themeEffects",
  transitions: "themeTransitions",
  icons: "themeIcons",
  modes: "themeModes",
  gradients: "themeGradients",
};

// Family key → its own shape id. Mirror of the L2 family types in families.ts.
const FAMILY_SHAPES: Record<string, ShapeId> = {
  surfaceContainer: "surfaceContainer",
  elevatedOverlay: "elevatedOverlay",
  interactiveControl: "interactiveControl",
  interactiveControlGroup: "interactiveControlGroup",
  field: "field",
  switch: "switch",
  listContainer: "listContainer",
  media: "media",
  shape: "shape",
  inlineSurface: "inlineSurface",
  // Table elements all live under a shared `tableElement` family in
  // ELEMENT_FAMILIES; 9 of 10 are plain surfaces, only tableRow has the
  // `alternating` slot — handled via ELEMENT_SHAPE_OVERRIDES below.
  tableElement: "surfaceContainer",
};

// Per-element shape overrides — take precedence over the family default.
// Used when a single element under a generic family needs a richer shape.
const ELEMENT_SHAPE_OVERRIDES: Record<string, ShapeId> = {
  tableRow: "tableRow",
};

// Layout key → its own shape id. Mirror of ThemeLayouts in layouts.ts.
const LAYOUT_SHAPES: Record<string, ShapeId> = {
  surface: "surfaceContainer",        // family-level default
  shell: "layoutSurface",
  shellNone: "layoutSurface",
  page: "layoutSurface",
  pageBody: "layoutSurface",
  main: "layoutSurface",
  mainBody: "layoutSurface",
  section: "layoutSurface",
  rowSection: "layoutSurface",
  colSection: "layoutSurface",
  pageHeader: "layoutHeaderScale",
  mainHeader: "layoutHeaderScale",
  leftSidebar: "layoutLeftSidebar",
  rightSidebar: "layoutSidebar",
  contextPanel: "layoutSidebar",
  container: "layoutContainerScale",
  scrollArea: "layoutScrollArea",
  dialog: "layoutDialogScale",
  sheet: "layoutSheetScale",
};

/**
 * Resolve the shape at an absolute theme path.
 *
 * Currently registered:
 *   - <primitive>                 → "theme<Primitive>"
 *   - families.<family>           → family-specific shape (10 families)
 *   - elements.<id>               → resolved family shape (via ELEMENT_FAMILIES)
 */
export function resolveShape(path: string[]): ShapeId | null {
  if (path.length === 0) return null;
  const head = path[0];
  const sub = path[1];

  // Theme-root primitives (single-segment paths)
  if (path.length === 1 && head && head in PRIMITIVE_SHAPES) {
    return PRIMITIVE_SHAPES[head]!;
  }

  // families.<family> (entity root)
  if (head === "families" && path.length === 2 && sub && sub in FAMILY_SHAPES) {
    return FAMILY_SHAPES[sub]!;
  }

  // elements.<id> — element-specific override wins; otherwise resolve via
  // ELEMENT_FAMILIES to the family's shape.
  if (head === "elements" && path.length === 2 && sub) {
    if (sub in ELEMENT_SHAPE_OVERRIDES) return ELEMENT_SHAPE_OVERRIDES[sub]!;
    const familyKey = ELEMENT_FAMILIES[sub];
    if (familyKey && familyKey in FAMILY_SHAPES) {
      return FAMILY_SHAPES[familyKey]!;
    }
  }

  // contextual.<parent>.<child> — child type matches the child element's family
  // (per ContextualOverrides = Record<parent, Partial<ElementTypes>>)
  if (head === "contextual" && path.length === 3 && path[2]) {
    const childKey = path[2];
    if (childKey in ELEMENT_SHAPE_OVERRIDES) return ELEMENT_SHAPE_OVERRIDES[childKey]!;
    const familyKey = ELEMENT_FAMILIES[childKey];
    if (familyKey && familyKey in FAMILY_SHAPES) {
      return FAMILY_SHAPES[familyKey]!;
    }
  }

  // layouts.<key> — each layout key has its own shape
  if (head === "layouts" && path.length === 2 && sub && sub in LAYOUT_SHAPES) {
    return LAYOUT_SHAPES[sub]!;
  }

  // rules.<i>.tokens — every rule's body is SurfaceContainerTokens
  if (head === "rules" && path.length === 3 && path[2] === "tokens") {
    return "surfaceContainer";
  }

  return null;
}

/**
 * For a given path, return the path at which to read the inherited (cascade
 * fallback) value, or `null` if there is no inherited source.
 *
 *   elements.<id>            → families.<id's family>
 *   contextual.<p>.<c>       → elements.<c>   (concept overrides element)
 *   families.<*>             → null (families ARE the source)
 *   primitives.<*>           → null
 */
export function resolveInheritedPath(path: string[]): string[] | null {
  if (path.length === 0) return null;
  const head = path[0];
  const sub = path[1];

  if (head === "elements" && path.length === 2 && sub) {
    const familyKey = ELEMENT_FAMILIES[sub];
    if (familyKey) return ["families", familyKey];
  }

  if (head === "contextual" && path.length === 3 && path[2]) {
    return ["elements", path[2]];
  }

  // Rules: tokens have no inherited fallback (the chain itself is the scope).
  // Future: derive from the chain's terminal element's family if useful.

  return null;
}

/**
 * Walk a path on the theme and return the value at that location, or
 * `undefined` if any segment is missing.
 */
export function readPath(theme: Theme, path: string[]): unknown {
  let cur: unknown = theme;
  for (const seg of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}
