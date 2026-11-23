// ============================================================
// THEME PROCESS — Cascade Processor (L2–L5) + Family Extras
// ============================================================

import type { WebTheme as Theme } from '../../../types';   // this engine emits CSS: it processes web themes
import { SCALE } from '../../../types/axes';
import type { ChainRule } from '../../../types/cascade';
import {
  FAMILY_PREFIXES,
  ELEMENT_FAMILIES,
  FAMILY_DEFAULTS,
  ELEMENT_DEFAULTS,
  familySelector,
  elementSelector,
  resolveSelector,
  PSEUDO_STATES,
} from './conventions';
import type { EmittedDeclarations } from './emit';
import {
  resolveColorRef,
  breakpointWidth,
  emitSurface,
  emitPartialSurface,
  emitOverlayExtras,
  emitFieldExtras,
  emitMediaExtras,
} from './emit';
import { formatRule, extractFamilySurface } from './process-utils';
import { registerUnder } from './process-under';
import { emitSmartBleed, emitChildrenSmartBleed, emitNoBleed, emitIconZoneBleed } from './process-smart-bleed';

// ── Constants ──────────────────────────────────────────────


// ── Surface processing ─────────────────────────────────────

export function processSurfaceForSelector(
  tokens: Record<string, unknown>,
  selector: string,
  /** how a scale is said on this selector: the attribute, or the attribute inside :where() (a family: an element's own rule then beats it) */
  scaleSelector: (scale: string) => string = (scale) => `[scale="${scale}"]`,
): { decls: EmittedDeclarations; compoundRules: string[] } {
  const decls: EmittedDeclarations = { vars: {}, props: {} };
  const compoundRules: string[] = [];

  emitSurface(tokens, decls);
  // `vars`: CSS variables a component reads by name (the charts' palette and ink); a value that names a theme colour resolves to it, any other is emitted as written
  const vars = tokens.vars as Record<string, string> | undefined;
  if (vars) for (const [k, v] of Object.entries(vars)) decls.vars[k.replace(/^--/, '')] = /^[a-z]/.test(v) && !/[\s(#]/.test(v) ? resolveColorRef(v) : v;
  const published = parentVars(decls);
  if (published) compoundRules.push(`${selector} > [element], ${selector} > [layout], ${selector} > [data-part] {\n${published}\n}`);

  const position = tokens.position as { absolute?: unknown; under?: Record<string, string[]> } | undefined;
  // absolute: its container is the reference it is placed from
  if (position?.absolute) compoundRules.push(`:where(:has(> ${selector})) {\n  position: relative;\n}`);
  // under: said here, written once every surface has said its own (process-under.ts)
  if (position?.under) registerUnder(selector, position.under);

  const POSITION_PSEUDO: Record<string, string> = {
    first:  ':first-child',
    last:   ':last-child',
    only:   ':only-child',
    middle: ':not(:first-child):not(:last-child)',
    even:   ':nth-child(even)',
    odd:    ':nth-child(odd)',
  };

  type Entry = { where: { state?: string; status?: string; emphasis?: string; position?: string; scale?: string; breakpoint?: string }; partialSurface?: Record<string, unknown>; icon?: { size?: string; weight?: number } };
  const combined = tokens.combined as Entry[] | undefined;
  /** what an entry says for a scale alone: one rule per scale, with the dimensions of that scale */
  const forScale: Record<string, Entry> = {};
  const late: string[] = [];
  for (const entry of combined ?? []) {
    if (!entry?.where) continue;
    const { state, status, emphasis, position: sibling, scale, breakpoint } = entry.where;
    let suffix = '';
    if (state) {
      suffix += (PSEUDO_STATES as readonly string[]).includes(state)
        ? `:${state === 'focus' ? 'focus-visible' : state}`
        // collapsed: a state some components say as an attribute of its own
        : state === 'collapsed' ? ':is([state="collapsed"], [collapsed])' : `[state="${state}"]`;
    }
    if (status) suffix += `[status="${status}"]`;
    if (emphasis) suffix += `[emphasis="${emphasis}"]`;
    if (sibling && POSITION_PSEUDO[sibling]) suffix += POSITION_PSEUDO[sibling];
    if (scale && !suffix && !breakpoint) { forScale[scale] = entry; continue; }
    if (scale) suffix += scaleSelector(scale);

    const d: EmittedDeclarations = { vars: {}, props: {} };
    emitPartialSurface(entry, d);
    if (Object.keys(d.vars).length + Object.keys(d.props).length === 0) continue;
    if (breakpoint) {
      // a breakpoint the theme names: at or below that width
      const width = breakpointWidth(breakpoint);
      const rule = formatRule(`${selector}${suffix}`, d);
      if (width && rule) late.push(`@media (max-width: ${width}) {\n${rule.replace(/^/gm, '  ')}\n}`);
      continue;
    }
    if (!suffix) continue;
    compoundRules.push(formatRule(`${selector}${suffix}`, d));
  }

  // The scales. A dimension written for several scales (or not for md) is said for every scale: each takes its own, else the closest
  // declared. A dimension written for md alone is the surface's own rule and needs no rule per scale.
  const dims = (tokens.dimensions ?? {}) as Record<string, Record<string, string>>;
  const byScale = Object.fromEntries(Object.entries(dims).filter(([, by]) => by && (Object.keys(by).length > 1 || by.md == null)));
  const several = Object.keys(byScale).length > 0;
  for (const scale of SCALE) {
    const entry = forScale[scale];
    if (!entry && (!several || scale === 'md')) continue;
    const d: EmittedDeclarations = { vars: {}, props: {} };
    emitSurface({ ...(entry?.partialSurface ?? {}), dimensions: { ...byScale, ...((entry?.partialSurface?.dimensions as object | undefined) ?? {}) } }, d, scale);
    if (entry?.icon) {
      if (entry.icon.size != null) d.vars['icon-size'] = entry.icon.size === 'inherit' ? 'var(--icon-size)' : `var(--icon-size-${entry.icon.size})`;
      if (entry.icon.weight != null) d.vars['icon-weight'] = String(entry.icon.weight);
    }
    const rule = formatRule(`${selector}${scaleSelector(scale)}`, d);
    if (rule) compoundRules.push(rule);
  }
  compoundRules.push(...late);

  return { decls, compoundRules };
}


// ── Parent geometry, published to the children ────────────
// A child that bleeds (smart bleed) needs its parent's padding, radius and border width. The theme never knows the
// parent (the cascade decides its padding, the markup decides who the parent is), so the engine does not resolve it at
// build time: every rule that sets a padding, a radius or a border width also emits, on the element's direct children,
// the same values as --parent-pad-x, --parent-pad-y, --parent-radius-*, --parent-border-width. A child never writes
// those for itself (it writes them for its own children, another element), so on any element they are its parent's.
function parentVars(decls: EmittedDeclarations): string {
  const p = decls.props;
  const out: string[] = [];
  const pad = p['padding'];
  let px: string | undefined, py: string | undefined;
  if (pad != null) { const parts = pad.trim().split(/\s+/); py = parts[0]; px = parts[1] ?? parts[0]; }
  if (p['padding-left'] != null) px = p['padding-left'];
  if (p['padding-top'] != null) py = p['padding-top'];
  if (px != null) out.push(`  --parent-pad-x: ${px};`);
  if (py != null) out.push(`  --parent-pad-y: ${py};`);
  const all = p['border-radius'];
  for (const [prop, name] of [['border-top-left-radius', 'tl'], ['border-top-right-radius', 'tr'], ['border-bottom-right-radius', 'br'], ['border-bottom-left-radius', 'bl']] as const) {
    const v = p[prop] ?? all;
    if (v != null) out.push(`  --parent-radius-${name}: ${v};`);
  }
  if (p['border-width'] != null) out.push(`  --parent-border-width: ${p['border-width']};`);
  // a gap of none is written 0, and a length with no unit breaks the calc() the list separator does with it (the line then sits mid-row)
  if (p['gap'] != null) out.push(`  --parent-gap: ${String(p['gap']) === '0' ? '0px' : p['gap']};`);
  return out.join('\n');
}

/** the bleed a surface asks for its children (childrenSmartBleed), and the opt-out of a child (smartBleed: false) */
/** the bleed tokens of a surface: under interior.padding (childrenSmartBleed, smartBleed); the surface-level smartBleed is read while deprecated */
export function bleedTokensOf(raw: Record<string, unknown>): { children?: boolean; own?: boolean } {
  const surface = (raw.surface as Record<string, unknown> | undefined) ?? raw;
  const padding = ((surface.interior as Record<string, unknown> | undefined)?.padding as Record<string, unknown> | undefined) ?? {};
  // a boolean; the old mode names (normal, rounded, border, border-rounded) are read as true, 'false' as false
  const bool = (v: unknown): boolean | undefined => (v == null ? undefined : v === false || v === 'false' ? false : true);
  return { children: bool(padding.childrenSmartBleed), own: bool(padding.smartBleed ?? surface.smartBleed) };
}
function emitBleedTokens(raw: Record<string, unknown>, selector: string, rules: string[]): void {
  const { children, own } = bleedTokensOf(raw);
  if (children) rules.push(...emitChildrenSmartBleed(selector));
  if (own === false) rules.push(...emitNoBleed(selector));
}

// ── Breakpoints ───────────────────────────────────────────
// A surface with `breakpoints` is a query container: its named widths become container queries on the
// Stacks inside it that name the condition (`<Stack when={{ narrow: "col" }}>` sets the attribute `narrow`
// and the variable --stack-narrow-dir). The markup owns the arrangement, the theme owns the width.
export function emitBreakpoints(tokens: Record<string, unknown>, selector: string): string[] {
  const bps = tokens.breakpoints as Record<string, string> | undefined;
  if (!bps || !Object.keys(bps).length) return [];
  const out: string[] = [`${selector} {\n  container-type: inline-size;\n}`];
  for (const [name, width] of Object.entries(bps)) {
    out.push(`@container (max-width: ${width}) {\n  ${selector} [layout="stack"][${name}] {\n    flex-direction: var(--stack-${name}-dir);\n  }\n}`);
  }
  return out;
}

// ── Family extras ──────────────────────────────────────────

function emitFamilyExtras(
  familyKey: string,
  tokens: Record<string, unknown>,
  out: EmittedDeclarations,
): void {
  if (familyKey === 'elevatedOverlay') emitOverlayExtras(tokens, out);
  if (familyKey === 'field') emitFieldExtras(tokens, out);
  if (familyKey === 'media') emitMediaExtras(tokens, out);
  const defaults = FAMILY_DEFAULTS[familyKey];
  if (defaults) {
    for (const [key, value] of Object.entries(defaults)) {
      if (!(key in out.props)) out.props[key] = value;
    }
  }
}

// ── List children ──────────────────────────────────────────

function emitListChildren(
  tokens: Record<string, unknown>,
  parentSelector: string,
  rules: string[],
): void {
  const rowSel = 'li';
  const cellSel = '> * > *';
  const alternatingSel = 'li:nth-child(even)';
  const separatorSel = 'li:not(:last-child)';

  const childMap: [string, string][] = [
    ['row', rowSel],
    ['cell', cellSel],
    ['alternating', alternatingSel],
  ];

  for (const [childKey, childSel] of childMap) {
    const child = tokens[childKey] as Record<string, unknown> | undefined;
    if (child) {
      const sel = `${parentSelector} ${childSel}`;
      const result = processSurfaceForSelector(child, sel);
      const rule = formatRule(sel, result.decls);
      if (rule) rules.push(rule);
      rules.push(...result.compoundRules);
    }
  }

  // the separator: a line between two rows, drawn by the row before the gap, centred in the gap (--parent-gap, published by the list); its
  // height and its surface are the token's. The row is positioned so the line can hang below it; the line takes no space
  const separator = tokens.separator as Record<string, unknown> | undefined;
  if (separator?.surface) {
    const d: EmittedDeclarations = { vars: {}, props: {} };
    emitSurface(separator.surface as Record<string, unknown>, d);
    const h = separator.height != null ? String(separator.height) : '1px';
    const line = [...Object.entries(d.vars).map(([k, v]) => `  --${k}: ${v};`), ...Object.entries(d.props).map(([k, v]) => `  ${k}: ${v};`)].join('\n');
    // the row holds the separator outside its own box, so it must not clip (a control clips by default)
    rules.push(`${parentSelector} ${separatorSel} {\n  position: relative;\n  overflow: visible;\n}`);
    rules.push(`${parentSelector} ${separatorSel}::after {\n  content: '';\n  position: absolute;\n  left: 0;\n  right: 0;\n  bottom: calc(-1 * (var(--parent-gap, 0px) + ${h}) / 2);\n  height: ${h};\n  box-sizing: border-box;\n  pointer-events: none;\n${line}\n  background: var(--bg, transparent);\n  border-color: var(--border-color, transparent);\n}`);
  }
}

// ── Main cascade processor ─────────────────────────────────

export function processCascadeRules(theme: Theme): string[] {
  const rules: string[] = [];

  // ── L2: Families ──────────────────────────────────────────
  for (const [familyKey, tokens] of Object.entries(theme.families ?? {})) {
    if (!tokens) continue;
    const selector = familySelector(familyKey);
    if (!selector) continue;

    const raw = tokens as Record<string, unknown>;
    const surface = extractFamilySurface(familyKey, raw);
    if (surface) {
      const result = processSurfaceForSelector(surface, selector, (scale) => `:where([scale="${scale}"])`);
      emitFamilyExtras(familyKey, raw, result.decls);
      const rule = formatRule(selector, result.decls);
      if (rule) rules.push(rule);
      rules.push(...result.compoundRules);
    }
    if (familyKey === 'listContainer') emitListChildren(raw, selector, rules);
    emitBleedTokens(raw, selector, rules);

    for (const zone of ['startIcon', 'endIcon'] as const) {
      const zoneTokens = raw[zone] as Record<string, unknown> | undefined;
      if (!zoneTokens) continue;
      const direction = zone === 'startIcon' ? 'start' : 'end';
      const zoneSel = `${selector} [data-part="${direction}-icon"]`;
      const result = processSurfaceForSelector(zoneTokens, zoneSel);
      const rule = formatRule(zoneSel, result.decls);
      if (rule) rules.push(rule);
      rules.push(...result.compoundRules);
    }
  }

  // ── L3: Elements ──────────────────────────────────────────
  if (theme.elements) {
    for (const [key, tokens] of Object.entries(theme.elements)) {
      if (!tokens) continue;
      const elSel = elementSelector(key);
      if (!elSel) continue;

      const familyKey = ELEMENT_FAMILIES[key];
      const raw = tokens as Record<string, unknown>;

      // Switch: two-surface element (track + thumb)
      if (key === 'switch') {
        const track = raw.track as Record<string, unknown> | undefined;
        const thumb = raw.thumb as Record<string, unknown> | undefined;
        if (track) {
          const result = processSurfaceForSelector(track, elSel);
          emitFamilyExtras(familyKey, raw, result.decls);
          const rule = formatRule(elSel, result.decls);
          if (rule) rules.push(rule);
          rules.push(...result.compoundRules);
        }
        if (thumb) {
          const thumbSel = `${elSel} [data-part="thumb"]`;
          const result = processSurfaceForSelector(thumb, thumbSel);
          const rule = formatRule(thumbSel, result.decls);
          if (rule) rules.push(rule);
          rules.push(...result.compoundRules);
        }
        continue;
      }

      const surface = extractFamilySurface(familyKey, raw);
      if (surface) {
        const result = processSurfaceForSelector(surface, elSel);
        emitFamilyExtras(familyKey, raw, result.decls);
        const elDefaults = ELEMENT_DEFAULTS[key];
        if (elDefaults) {
          for (const [k, v] of Object.entries(elDefaults)) {
            if (!(k in result.decls.props)) result.decls.props[k] = v;
          }
        }
        const rule = formatRule(elSel, result.decls);
        if (rule) rules.push(rule);
        rules.push(...result.compoundRules);
        rules.push(...emitBreakpoints(raw, elSel));
      } else {
        // No surface sub-object but family may still have extras to emit
        // (e.g. media: objectFit, overlay, filter without a full surface).
        const extraDecls: EmittedDeclarations = { vars: {}, props: {} };
        emitFamilyExtras(familyKey, raw, extraDecls);
        const rule = formatRule(elSel, extraDecls);
        if (rule) rules.push(rule);
      }
      if (familyKey === 'listContainer') emitListChildren(raw, elSel, rules);
      emitBleedTokens(raw, elSel, rules);

      // Table row alternating — emitted as :nth-child(even) compound rule
      if (familyKey === 'tableElement' && raw.alternating) {
        const altSel = `${elSel}:nth-child(even)`;
        const result = processSurfaceForSelector(raw.alternating as Record<string, unknown>, altSel);
        const rule = formatRule(altSel, result.decls);
        if (rule) rules.push(rule);
        rules.push(...result.compoundRules);
      }

      for (const zone of ['startIcon', 'endIcon'] as const) {
        const zoneTokens = raw[zone] as Record<string, unknown> | undefined;
        if (!zoneTokens) continue;
        const direction = zone === 'startIcon' ? 'start' : 'end';
        const zoneSel = `${elSel} [data-part="${direction}-icon"]`;
        const result = processSurfaceForSelector(zoneTokens, zoneSel);
        const rule = formatRule(zoneSel, result.decls);
        if (rule) rules.push(rule);
        rules.push(...result.compoundRules);
        if (zoneTokens.smartBleed !== false) rules.push(...emitIconZoneBleed(direction, zoneSel));
      }

    }
  }

  // ── L4: Concepts ──────────────────────────────────────────
  if (theme.concepts) {
    for (const [conceptName, targets] of Object.entries(theme.concepts)) {
      if (!targets) continue;
      for (const [targetName, tokens] of Object.entries(targets)) {
        if (!tokens) continue;
        // `self` is the element carrying the concept; any other target is an element inside it
        const targetSel = targetName === 'self' ? '' : resolveSelector(targetName);
        if (targetSel === undefined) continue;

        const conceptSel = targetName === 'self' ? `[concept~="${conceptName}"]` : `[concept~="${conceptName}"] ${targetSel}`;
        const raw = tokens as Record<string, unknown>;
        const surface = (raw.surface as Record<string, unknown> | undefined) ?? raw;
        const result = processSurfaceForSelector(surface, conceptSel);
        if (raw.accent != null) result.decls.vars['tint'] = resolveColorRef(String(raw.accent));

        const familyKey = ELEMENT_FAMILIES[targetName] ?? targetName;
        emitFamilyExtras(familyKey, raw, result.decls);

        const rule = formatRule(conceptSel, result.decls);
        if (rule) rules.push(rule);
        rules.push(...result.compoundRules);
        rules.push(...emitBreakpoints(raw, conceptSel));

        if (familyKey === 'listContainer') emitListChildren(raw, conceptSel, rules);
        emitBleedTokens(raw, conceptSel, rules);

        const ownBleed = bleedTokensOf(raw).own;
        if (ownBleed) rules.push(...emitSmartBleed(conceptSel));

        const ctx = raw.contextual as Record<string, Record<string, unknown>> | undefined;
        if (ctx) {
          for (const [childName, childTokens] of Object.entries(ctx)) {
            if (!childTokens) continue;
            const childSel = resolveSelector(childName);
            if (!childSel) continue;
            const compoundSel = `${conceptSel} ${childSel}`;
            const childResult = processSurfaceForSelector(childTokens, compoundSel);
            const childRule = formatRule(compoundSel, childResult.decls);
            if (childRule) rules.push(childRule);
            rules.push(...childResult.compoundRules);

            const bleedMode = bleedTokensOf(childTokens).own;
            if (bleedMode) rules.push(...emitSmartBleed(compoundSel));
            emitBleedTokens(childTokens, compoundSel, rules);
          }
        }
      }
    }
  }

  // ── L5: Contextual ────────────────────────────────────────
  if (theme.contextual) {
    for (const [parentName, children] of Object.entries(theme.contextual)) {
      if (!children) continue;
      const parentSel = resolveSelector(parentName);
      if (!parentSel) continue;
      for (const [childName, tokens] of Object.entries(children)) {
        if (!tokens) continue;
        const childSel = resolveSelector(childName);
        if (!childSel) continue;
        const compoundSel = `${parentSel} ${childSel}`;
        const raw = tokens as Record<string, unknown>;
        const result = processSurfaceForSelector(raw, compoundSel);
        const rule = formatRule(compoundSel, result.decls);
        if (rule) rules.push(rule);
        rules.push(...result.compoundRules);

        const bleedMode = bleedTokensOf(raw).own;
        if (bleedMode) rules.push(...emitSmartBleed(compoundSel));
      }
    }
  }

  // ── L6: Rules (arbitrary-depth chains) ────────────────────
  if (theme.rules) {
    // a grouped rule (a condition, then `self` and `children`) is the chain rules it stands for
    const chainRules: ChainRule[] = [];
    for (const r of theme.rules) {
      if ('chain' in r) { chainRules.push(r); continue; }
      if (r.self) chainRules.push({ chain: [r.when], tokens: r.self });
      for (const [child, tokens] of Object.entries(r.children ?? {})) {
        chainRules.push({ chain: [r.when, resolveSelector(child) ? { key: child } : { concept: child }], tokens });
      }
    }
    for (const rule of chainRules) {
      if (!rule?.chain?.length) continue;

      // Build compound selector: each segment resolves to its base selector,
      // optionally prefixed with [concept="X"] when concept is set.
      const parts: string[] = [];
      for (const seg of rule.chain) {
        // a segment is a key, a concept, or both; a concept alone matches any element carrying it
        if (!seg.key && !seg.concept) { parts.length = 0; break; }
        const baseSel = seg.key ? resolveSelector(seg.key) : '';
        if (baseSel === undefined || (seg.key && !baseSel)) { parts.length = 0; break; } // unknown key — skip rule
        // a state the browser knows (hover, active, focus) holds when the browser says so, or when the markup says it as an attribute
        const stateOf = (v: string) => ((PSEUDO_STATES as readonly string[]).includes(v) ? `:is(:${v === 'focus' ? 'focus-visible' : v}, [state="${v}"])` : `[state="${v}"]`);
        const axes = Object.entries(seg.where ?? {}).map(([axis, v]) => (axis === 'flag' ? `[flag~="${v}"]` : axis === 'state' ? stateOf(String(v)) : `[${axis}="${v}"]`)).join('');
        parts.push((seg.concept ? `[concept~="${seg.concept}"]${baseSel}` : baseSel) + axes);
      }
      if (parts.length < 1) continue;

      const compoundSel = parts.join(' ');
      const tokens = rule.tokens as Record<string, unknown>;
      const result = processSurfaceForSelector(tokens, compoundSel);
      const cssRule = formatRule(compoundSel, result.decls);
      if (cssRule) rules.push(cssRule);
      rules.push(...result.compoundRules);

      const bleedMode = bleedTokensOf(tokens).own;
      if (bleedMode) rules.push(...emitSmartBleed(compoundSel));
    }
  }

  return rules;
}

// ============================================================
// FAMILY-SPECIFIC CSS (scrim, placeholder, scrollbar, icons)
// ============================================================

export function generateFamilyExtrasCSS(theme: Theme): string[] {
  const rules: string[] = [];
  const overlayPfx = FAMILY_PREFIXES.elevatedOverlay;
  const fieldPfx = FAMILY_PREFIXES.field;

  if (theme.families?.elevatedOverlay || Object.keys(theme.elements ?? {}).some(k => ELEMENT_FAMILIES[k] === 'elevatedOverlay')) {
    const scrimDecls = [
      'background: color-mix(in srgb, var(--scrim-color, var(--foreground)) var(--scrim-opacity-pct, 50%), transparent);',
      'backdrop-filter: blur(var(--scrim-blur, 0px));',
      '-webkit-backdrop-filter: blur(var(--scrim-blur, 0px));',
    ].map(d => `  ${d}`).join('\n');
    rules.push(`[element^="${overlayPfx}--"][data-part="scrim"] {\n${scrimDecls}\n}`);
  }

  if (theme.families?.field || Object.keys(theme.elements ?? {}).some(k => ELEMENT_FAMILIES[k] === 'field')) {
    rules.push(`:where([element^="${fieldPfx}--"])::placeholder {\n  color: var(--placeholder-color, var(--color-gray-400));\n  opacity: var(--placeholder-opacity, 1);\n}`);
    rules.push(`:where([element^="${fieldPfx}--"]) input,\n:where([element^="${fieldPfx}--"]) textarea {\n  caret-color: var(--caret-color, currentColor);\n}`);
    rules.push(`:where([element^="${fieldPfx}--"]) > input,\n:where([element^="${fieldPfx}--"]) > textarea {\n  background: transparent;\n  border: none;\n  outline: none;\n  color: inherit;\n}`);
  }

  rules.push(`[element]::-webkit-scrollbar { width: var(--scrollbar-width, auto); }`);
  rules.push(`[element]::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb, var(--color-gray-300)); }`);
  rules.push(`[element]::-webkit-scrollbar-track { background: var(--scrollbar-track, transparent); }`);

  rules.push(`:where([element])[state="disabled"] { pointer-events: none; cursor: not-allowed; }`);
  rules.push(`:where([element]):disabled, :where([element])[aria-disabled="true"] { pointer-events: none; cursor: not-allowed; }`);

  if (theme.elements?.button) rules.push(`[element="control--button"] { white-space: nowrap; user-select: none; }`);

  if (theme.elements?.icon || theme.families?.shape) {
    rules.push(`[element="shape--icon"] { display: inline-flex; width: var(--icon-size, var(--icon-size-md, 24px)); height: var(--icon-size, var(--icon-size-md, 24px)); color: currentColor; }`);
    for (const s of SCALE) rules.push(`[element="shape--icon"][scale="${s}"] { width: var(--icon-size-${s}); height: var(--icon-size-${s}); }`);
    rules.push(`[element="shape--icon"] > svg { width: 100%; height: 100%; stroke-width: var(--icon-weight, 2); }`);
  }

  rules.push(`.icon-left, .icon-right { display: inline-flex; align-items: center; justify-content: center; }`);
  rules.push(`.icon-left svg, .icon-right svg { width: var(--icon-size, 1em); height: var(--icon-size, 1em); stroke-width: var(--icon-weight, 2); }`);

  // ── Media family structural rules ─────────────────────────
  // The [element^="media--"] wrapper is a relative container; the inner
  // img/video fills it via object-fit. The ::after pseudo-element renders
  // the optional color overlay on top without touching the markup.
  const mediaPfx = FAMILY_PREFIXES.media;
  rules.push(`[element^="${mediaPfx}--"] { position: relative; overflow: hidden; }`);
  rules.push(`[element^="${mediaPfx}--"] img,\n[element^="${mediaPfx}--"] video {\n  display: block;\n  width: 100%;\n  height: 100%;\n  object-fit: var(--media-object-fit, cover);\n  object-position: var(--media-object-position, center);\n}`);
  rules.push(`[element^="${mediaPfx}--"]::after {\n  content: '';\n  position: absolute;\n  inset: 0;\n  background: color-mix(in srgb, var(--media-overlay-color, transparent) var(--media-overlay-opacity, 0%), transparent);\n  backdrop-filter: blur(var(--media-overlay-blur, 0px));\n  pointer-events: none;\n}`);

  return rules;
}
