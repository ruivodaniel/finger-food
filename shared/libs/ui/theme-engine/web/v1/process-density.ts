// ============================================================
// DENSITY — multipliers, all the theme's (spike; a theme without `density` emits nothing here)
// Levels, outermost to innermost: the theme · the user's density mode (data-density on the root) · the element · the concept.
// Each level writes its factors as custom properties; the factors of a kind multiply into --density-<kind> on every element;
// the tokens that carry a measure (spacing, gap, icon size, font size) are written again on every element, times that product,
// so what uses a token is scaled by the density of the element it stands on. Markup knows nothing of it.
// ============================================================
import type { WebTheme as Theme } from '../../../types';
import type { CssVarValue } from './process-utils';

export const DENSITY_KINDS = ['spacing', 'gap', 'font', 'icon', 'width', 'height'] as const;
type Kind = (typeof DENSITY_KINDS)[number];
type Factors = number | ({ all?: number } & Partial<Record<Kind, number>>);

/** the factor of one kind at one level: the kind's own, else `all`, else none */
const factorOf = (f: Factors | undefined, kind: Kind): number | undefined => (f === undefined ? undefined : typeof f === 'number' ? f : f[kind] ?? f.all);

/** the custom properties of one level: `--<prefix>-<kind>: n` for each kind it sets */
const levelVars = (prefix: string, f: Factors | undefined): Record<string, CssVarValue> => {
  const out: Record<string, CssVarValue> = {};
  for (const k of DENSITY_KINDS) { const n = factorOf(f, k); if (n !== undefined) out[`${prefix}-${k}`] = String(n); }
  return out;
};
const rule = (selector: string, vars: Record<string, CssVarValue>): string =>
  Object.keys(vars).length ? `${selector} {\n${Object.entries(vars).map(([p, v]) => `  --${p}: ${v};`).join('\n')}\n}` : '';

export function processDensity(theme: Theme, primitives: Record<string, CssVarValue>): string[] {
  const d = theme.density;
  if (!d) return [];
  const rules: string[] = [];
  rules.push(rule(':root', levelVars('dt', d.theme)));
  for (const [name, f] of Object.entries(d.modes ?? {})) rules.push(rule(`:root[data-density="${name}"]`, levelVars('dm', f)));
  for (const [element, f] of Object.entries(d.elements ?? {})) rules.push(rule(`[element="${element}"]`, levelVars('de', f)));
  for (const [concept, f] of Object.entries(d.concepts ?? {})) rules.push(rule(`[concept~="${concept}"]`, levelVars('dc', f)));
  // the product of the four levels, for each kind, on every element
  const product: Record<string, CssVarValue> = {};
  for (const k of DENSITY_KINDS) product[`density-${k}`] = `calc(var(--dt-${k}, 1) * var(--dm-${k}, 1) * var(--de-${k}, 1) * var(--dc-${k}, 1))`;
  // the tokens that carry a measure, written again on every element, times the product
  const scaled: Record<string, CssVarValue> = {};
  for (const [name, value] of Object.entries(primitives)) {
    const v = String(value);
    if (/^spacing-(?!unit$|none$)/.test(name)) { scaled[name] = `calc(${v} * var(--density-spacing))`; scaled[name.replace('spacing-', 'gap-')] = `calc(${v} * var(--density-gap))`; }
    else if (/^icon-size-/.test(name)) scaled[name] = `calc(${v} * var(--density-icon))`;
    else if (/^typography-.+-font-size$/.test(name)) scaled[name] = `calc(${v} * var(--density-font))`;
  }
  rules.push(rule(':where(*)', { ...product, ...scaled }));
  return rules.filter(Boolean);
}
