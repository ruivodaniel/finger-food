// ============================================================
// THE RESOLVER, engine version 2 — the layers of a theme in, one whole theme out. Pure: it reads no file.
// A later layer wins. An object merges key by key; a value and a list replace; `rules` is the one list that appends, a rule with an `id`
// replacing the earlier rule with that id (or removing it, with `remove: true`); a key set to null is removed. See ../../SPEC-v2.md.
// ============================================================
import type { WebTheme } from '../../../types';

export type DeepPartial<T> = T extends readonly unknown[] ? T : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
type Bag = Record<string, unknown>;
/** a layer: its name (what the provenance says) and the keys it writes */
export type Layer = { name: string; keys: Bag };
export type Resolved = { theme: Bag; /** for each leaf, the layer that set it ("baseline@1", "palette@1", "theme") */ from: Record<string, string> };

/** what a theme that extends a baseline and wears a palette is, as authored: the identity, the two it names, and its own keys */
export type AuthoredTheme = DeepPartial<WebTheme> & { id: string; name: string; version: number; engine: 2; extends: [string, number]; palette: [string, number] };
/** a baseline: keys of a whole theme, the structure and its defaults */
export type Baseline = DeepPartial<WebTheme>;
/** a palette: the colours alone, and the gradients made of them. The colour modes are the theme's */
export type Palette = Pick<DeepPartial<WebTheme>, 'colors' | 'gradients'>;

const isBag = (x: unknown): x is Bag => !!x && typeof x === 'object' && !Array.isArray(x);
const clone = <T>(x: T): T => (x === undefined ? x : (JSON.parse(JSON.stringify(x)) as T));

/** the rules of a later layer onto the earlier ones: appended in order; with an id, in the place of the earlier one, or removed */
function mergeRules(earlier: unknown[], later: unknown[]): unknown[] {
  const out = [...earlier];
  for (const r of later) {
    const rule = r as Bag, id = isBag(rule) ? rule.id : undefined;
    const at = id === undefined ? -1 : out.findIndex((x) => isBag(x) && x.id === id);
    if (isBag(rule) && rule.remove === true) { if (at >= 0) out.splice(at, 1); continue; }
    if (at >= 0) out[at] = clone(r); else out.push(clone(r));
  }
  return out;
}

function mergeInto(target: Bag, source: Bag, layer: string, path: string, from: Record<string, string>): void {
  for (const [key, value] of Object.entries(source)) {
    const at = path ? `${path}.${key}` : key;
    if (value === null) { delete target[key]; from[at] = `${layer} (removed)`; continue; }
    if (path === '' && key === 'rules' && Array.isArray(value)) { target[key] = mergeRules(Array.isArray(target[key]) ? (target[key] as unknown[]) : [], value); continue; }
    if (isBag(value)) {
      if (!isBag(target[key])) target[key] = {};
      mergeInto(target[key] as Bag, value, layer, at, from);
      continue;
    }
    target[key] = clone(value);
    from[at] = layer;
  }
}

/** the layers, first to last, into one whole theme and where each leaf came from */
export function resolveLayers(layers: Layer[]): Resolved {
  const theme: Bag = {}, from: Record<string, string> = {};
  for (const layer of layers) mergeInto(theme, layer.keys, layer.name, '', from);
  return { theme, from };
}

/** the keys of an authored theme that are its own look, apart from what names it */
const IDENTITY = new Set(['id', 'name', 'version', 'type', 'kind', 'engine', 'extends', 'palette']);

/** an authored theme with the baseline it extends and the palette it wears: baseline, then the palette, then its own keys */
export function resolveAuthored(authored: AuthoredTheme, baseline: Baseline, palette: Palette): Resolved {
  const own: Bag = {}, identity: Bag = {};
  for (const [k, v] of Object.entries(authored)) (IDENTITY.has(k) ? identity : own)[k] = v;
  const [bn, bv] = authored.extends, [pn, pv] = authored.palette;
  const resolved = resolveLayers([
    { name: `baseline ${bn}@${bv}`, keys: baseline as Bag },
    { name: `palette ${pn}@${pv}`, keys: palette as Bag },
    { name: 'theme', keys: own },
  ]);
  const { engine: _engine, extends: _extends, palette: _palette, ...named } = identity;
  Object.assign(resolved.theme, named);
  return resolved;
}
