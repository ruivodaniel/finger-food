// ============================================================
// THEME PROCESS — Layout Regions (surfaces + dimensions)
// ============================================================

import type { WebTheme as Theme } from '../../../types';   // this engine emits CSS: it processes web themes
import type { EmittedDeclarations } from './emit';
import { resolveColorRef, resolveTokenRef } from './emit';
import { camelToKebab, formatRule } from './process-utils';
import { scaled } from './emit';
import { processSurfaceForSelector } from './process-cascade';

// Keys in theme.layouts that are NOT layout regions with surfaces
const LAYOUT_NON_SURFACE_KEYS = new Set(['surface', 'scrollArea', 'emphasis', 'divider']);
// a key of theme.layouts that styles something other than the region of its name
// (the scrim behind a dialog or a sheet carries the same element: the measure is the panel's, never the scrim's)
// Inside :where(): the measure is a default, so a concept that gives a sheet its own width (the navigation's sheet on a phone) wins
const SELECTOR_OF: Record<string, string> = { dialog: ':where([element*="--dialog"]:not([data-part="scrim"]))', sheet: ':where([element*="--sheet"]:not([data-part="scrim"]))' };

/** the theme's named keyframes, as @keyframes rules */
export function processKeyframes(theme: Theme): string[] {
  const frames = theme.keyframes as Record<string, Record<string, Record<string, string>>> | undefined;
  if (!frames) return [];
  return Object.entries(frames).map(([name, steps]) =>
    `@keyframes ${name} {\n${Object.entries(steps).map(([step, decls]) =>
      `  ${step} {\n${Object.entries(decls).map(([prop, value]) => `    ${camelToKebab(prop)}: ${value};`).join('\n')}\n  }`).join('\n')}\n}`);
}

export function processLayouts(theme: Theme): string[] {
  const rules: string[] = [];
  // what must come after the structural defaults below: a breakpoint overrides them
  const late: string[] = [];

  // ── The document body: the ground, from theme.body ───────
  if (theme.body) {
    const result = processSurfaceForSelector(theme.body.surface as Record<string, unknown>, 'body');
    const rule = formatRule('body', result.decls);
    if (rule) rules.push(rule);
    rules.push(...result.compoundRules);
  }

  const layouts = theme.layouts;
  if (!layouts) return rules;
  const raw = layouts as Record<string, unknown>;

  // ── Family default: [layout] ──────────────────────────────
  // Every region wears the theme's canvas default — except the structure-only
  // layouts. A stack owns geometry (direction, gap, alignment) and never a
  // surface: painting it would put a box behind every row and column.
  const STRUCTURE_ONLY_LAYOUTS = ['stack'];
  const FAMILY_SELECTOR = `:where([layout]${STRUCTURE_ONLY_LAYOUTS.map((k) => `:not([layout="${k}"])`).join('')})`;   // :where() zeroes specificity so per-region --bg overrides win
  const familySurface = raw.surface as Record<string, unknown> | undefined;
  if (familySurface) {
    const result = processSurfaceForSelector(familySurface, FAMILY_SELECTOR);
    const rule = formatRule(FAMILY_SELECTOR, result.decls);
    if (rule) rules.push(rule);
    rules.push(...result.compoundRules);
  }

  // ── Per-region overrides: [layout="..."] ─────────────────
  for (const [key, tokens] of Object.entries(raw)) {
    if (LAYOUT_NON_SURFACE_KEYS.has(key) || !tokens) continue;

    const attrName = camelToKebab(key);
    const selector = SELECTOR_OF[key] ?? `[layout="${attrName}"]`;
    const regionTokens = tokens as Record<string, unknown>;
    const regionSurface = regionTokens.surface as Record<string, unknown> | undefined;

    // a region is a surface: its dimensions (by scale), its states and its place are read as any surface's
    if (regionSurface) {
      const result = processSurfaceForSelector(regionSurface, selector);
      const rule = formatRule(selector, result.decls);
      if (rule) rules.push(rule);
      rules.push(...result.compoundRules);
    }

    // Breakpoints on the viewport: `hidden` (the region goes below that width) and `stack` (what it holds stands in a column below it) are applied;
    // the other region states (rail, drawer, collapsed by width) are owed.
    const bps = regionTokens.breakpoints as Record<string, string> | undefined;
    if (bps?.hidden) rules.push(`@media (max-width: ${bps.hidden}) {\n  ${selector}[hidden] {\n    display: none;\n  }\n}`);
    // `stack`: below this width what the region holds stands in a column (a shell with a side nav becomes a nav bar over the page)
    if (bps?.stack) late.push(`@media (max-width: ${bps.stack}) {\n  ${selector} {\n    flex-direction: column;\n  }\n}`);
  }

  // ── Emphasis variants: [layout][emphasis="..."] ───────────────────────
  // A region can wear an emphasis; the theme maps each to a surface (fills +
  // text). Generic across regions — the base region rule owns which edge a
  // border sits on; emphasis only re-shades. Emitted AFTER the per-region
  // rules so, at equal specificity, the emphasis wins.
  const emphasisMap = raw.emphasis as Record<string, unknown> | undefined;
  if (emphasisMap) {
    for (const [emph, entry] of Object.entries(emphasisMap)) {
      const surf = (entry as Record<string, unknown>)?.surface as Record<string, unknown> | undefined;
      if (!surf) continue;
      const sel = `:where([layout])[emphasis="${emph}"]`;
      const result = processSurfaceForSelector(surf, sel);
      const rule = formatRule(sel, result.decls);
      if (rule) rules.push(rule);
      rules.push(...result.compoundRules);
    }
  }

  // ── Structural defaults (engine-owned, not theme-overridable) ──────────
  // Shell roots — full viewport, flex direction determined by variant
  rules.push(
    `[layout="shell"],\n[layout="shell-top-nav"],\n[layout="shell-none"] {\n  display: flex;\n  flex-direction: column;\n  height: 100svh;\n  overflow: hidden;\n}`,
  );
  rules.push(
    `[layout="shell-side-nav"] {\n  display: flex;\n  flex-direction: row;\n  height: 100svh;\n  overflow: hidden;\n}`,
  );

  // No region scrolls: only a ScrollArea (or a VirtualScrollArea) does. A side region is a column as tall as its place; what it holds grows to it.
  // Shell nav — fixed-width col, full height
  rules.push(
    `[layout="shell-nav"] {\n  display: flex;\n  flex-direction: column;\n  flex-shrink: 0;\n  align-self: stretch;\n  overflow: hidden;\n}`,
  );

  // Page — fills remaining shell space, stacks header + body vertically
  rules.push(
    `[layout="page"] {\n  display: flex;\n  flex-direction: column;\n  flex: 1 1 0;\n  min-width: 0;\n  overflow: hidden;\n}`,
  );
  rules.push(`[layout="page-header"],\n[layout="second-page-header"],\n[layout="page-footer"] {\n  display: flex;\n  flex-direction: row;\n  flex-shrink: 0;\n  width: 100%;\n  overflow: hidden;\n}`);
  rules.push(
    `[layout="page-body"] {\n  display: flex;\n  flex-direction: row;\n  flex: 1 1 0;\n  min-height: 0;\n  overflow: hidden;\n}`,
  );

  // The page's sidebars — fixed-width cols, full height
  rules.push(
    `[layout="page-left-sidebar"],\n[layout="page-right-sidebar"] {\n  display: flex;\n  flex-direction: column;\n  flex-shrink: 0;\n  align-self: stretch;\n  overflow: hidden;\n}`,
  );

  // Main — fills page-body horizontally, stacks its children vertically
  rules.push(
    `[layout="main"] {\n  display: flex;\n  flex-direction: column;\n  flex: 1 1 0;\n  min-width: 0;\n  overflow: hidden;\n}`,
  );
  rules.push(`[layout="main-header"],\n[layout="second-main-header"],\n[layout="main-footer"] {\n  display: flex;\n  flex-direction: row;\n  flex-shrink: 0;\n  width: 100%;\n  overflow: hidden;\n}`);

  // Main content — invisible row holding main-body + main-right-sidebar
  rules.push(
    `[layout="main-content"] {\n  display: flex;\n  flex-direction: row;\n  flex: 1 1 0;\n  min-height: 0;\n  overflow: hidden;\n}`,
  );

  // Main right sidebar — fixed-width col inside main-content
  rules.push(
    `[layout="main-right-sidebar"] {\n  display: flex;\n  flex-direction: column;\n  flex-shrink: 0;\n  align-self: stretch;\n  overflow: hidden;\n}`,
  );

  // Main body — the centre: a column that fills the ScrollArea it stands in and grows with its content (the ScrollArea scrolls, not the body)
  rules.push(
    `[layout="main-body"] {\n  display: flex;\n  flex-direction: column;\n  flex: 1 0 auto;\n  min-width: 0;\n}`,
  );
  // Main body, fixed: it does not scroll; it is as tall as its place and its container fills it, so what is long inside scrolls in its own ScrollArea
  rules.push(`[layout="main-body"][flag~="fixed"] {\n  flex: 1 1 0;\n  min-height: 0;\n  overflow: hidden;\n}`);
  rules.push(`[layout="main-body"][flag~="fixed"] > [layout="main-container"] {\n  display: flex;\n  flex-direction: column;\n  flex: 1 1 0;\n  min-height: 0;\n}`);

  // Main container — centred, width capped by scale (max-width set below)
  rules.push(`[layout="main-container"] {\n  width: 100%;\n  margin-left: auto;\n  margin-right: auto;\n}`);
  // `align` (the Layouts doc › Main container): where the measure sits inside main-body — centered by default; `left` and `right` release the opposite margin
  rules.push(`[layout="main-container"][align="left"] {\n  margin-left: 0;\n}`);
  rules.push(`[layout="main-container"][align="right"] {\n  margin-right: 0;\n}`);

  // Content organisation
  rules.push(`[layout="row-section"] {\n  display: flex;\n  flex-direction: row;\n}`);
  rules.push(`[layout="col-section"] {\n  display: flex;\n  flex-direction: column;\n}`);

  // a main container of scale `full` has no measure
  rules.push(`[layout="main-container"][scale="full"] {\n  max-width: none;\n}`);

  // ── Scroll area scrollbar ─────────────────────────────────
  const scrollArea = raw.scrollArea as Record<string, unknown> | undefined;
  if (scrollArea) {
    const sb = scrollArea.scrollbar as Record<string, unknown> | undefined;
    if (sb) {
      if (sb.width) rules.push(`[layout="scroll-area"]::-webkit-scrollbar { width: ${sb.width}; }`);
      if (sb.thumbColor) rules.push(`[layout="scroll-area"]::-webkit-scrollbar-thumb { background: ${resolveColorRef(String(sb.thumbColor))}; }`);
      if (sb.trackColor) rules.push(`[layout="scroll-area"]::-webkit-scrollbar-track { background: ${resolveColorRef(String(sb.trackColor))}; }`);
    }
  }

  // ── Sidebar divider ───────────────────────────────────────
  // Structural defaults for the global sidebar-divider concept.
  // Color is theme-owned (wireframes chain rule); height + spacing are engine-owned.
  rules.push(
    `[concept~="sidebar-divider"][element="surface--separator"] {\n  height: 1px;\n  width: 100%;\n  margin-top: var(--space-xs);\n  margin-bottom: var(--space-xs);\n}`,
  );

  // ── Overlay dimensions ────────────────────────────────────
  // a sheet runs the whole length of the edge it comes from: one from the left or the right is as tall as the screen and takes the theme's
  // width; one from the top or the bottom is as wide as the screen and takes the theme's height (the height of its content when none is said)
  rules.push(`[element*="--sheet"][side="left"],\n[element*="--sheet"][side="right"] {\n  height: 100%;\n  max-width: 100vw;\n}`);
  rules.push(`[element*="--sheet"][side="top"],\n[element*="--sheet"][side="bottom"] {\n  width: 100%;\n  max-height: 100svh;\n}`);

  // ── Dividers ──────────────────────────────────────────────
  // Markup says where a divider is: between the children of a stack (`dividers`), or on an edge of the stack (`divider`). The theme says what a
  // divider is: the line across and the line down. A line between two children stands in the middle of the room between them.
  const divider = raw.divider as { across?: Record<string, string>; down?: Record<string, string> } | undefined;
  if (divider) {
    const line = (side: Record<string, string> | undefined) => side && `${side.width ? resolveTokenRef(side.width, 'border-width') : '1px'} ${side.style ?? 'solid'} ${side.color ? resolveColorRef(side.color) : 'currentColor'}`;
    const across = line(divider.across), down = line(divider.down);
    const S = '[layout="stack"]';
    if (across) {
      rules.push(`${S}[flag~="divider-top"] {\n  border-top: ${across};\n}`, `${S}[flag~="divider-bottom"] {\n  border-bottom: ${across};\n}`);
      rules.push(`${S}[flag~="dividers"][data-dir="col"] > * + * {\n  position: relative;\n}`);
      rules.push(`${S}[flag~="dividers"][data-dir="col"] > * + *::before {\n  content: "";\n  position: absolute;\n  left: 0;\n  right: 0;\n  top: calc(var(--parent-gap, 0px) / -2);\n  border-top: ${across};\n  pointer-events: none;\n}`);
    }
    if (down) {
      rules.push(`${S}[flag~="divider-left"] {\n  border-left: ${down};\n}`, `${S}[flag~="divider-right"] {\n  border-right: ${down};\n}`);
      rules.push(`${S}[flag~="dividers"][data-dir="row"] > * + * {\n  position: relative;\n}`);
      rules.push(`${S}[flag~="dividers"][data-dir="row"] > * + *::before {\n  content: "";\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  left: calc(var(--parent-gap, 0px) / -2);\n  border-left: ${down};\n  pointer-events: none;\n}`);
    }
  }

  return [...rules, ...late];
}
