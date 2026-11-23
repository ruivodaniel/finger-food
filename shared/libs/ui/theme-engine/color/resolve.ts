// The one resolver: token references, per-mode overrides and derivation, for every platform.
// Web, mobile and canvas consume this output; each only decides how to emit it.
import type { AuthoredColor, ColorModeSpec, ColorSystem, GeneratedColor } from '../../types/color-system';
import { parseColor, rgbToOklch, toHex, type Rgb } from './oklch';
import { adapt, brandGrayStep, grayStep, GRAY_WEIGHTS, intervalOf, DEFAULT_CURVE, type Interval } from './derive';

export type ResolveOptions = {
  /** the mode the sources are authored in (default: the first mode) */
  reference?: string;
  /** brand tint of the brand grayscale, percent (default 10, as before) */
  brandTint?: number;
};

export type ResolvedModes = Record<string, Record<string, string>>;

type Authored = { value?: string; modes?: Partial<Record<string, string>> };
const norm = (c: AuthoredColor | GeneratedColor | undefined): Authored =>
  c == null ? {} : typeof c === 'string' ? { value: c } : c;

type Def = { auth: Authored; adaptive: boolean; spectrum: 'status' | 'content' | 'none'; make?: (mode: string) => Rgb };

export function resolveColorSystem(system: ColorSystem, modes: Record<string, ColorModeSpec>, opts: ResolveOptions = {}): ResolvedModes {
  const modeNames = Object.keys(modes);
  if (!modeNames.length) return {};
  const reference = opts.reference ?? modeNames[0];
  if (!modes[reference]) throw new Error(`reference mode "${reference}" is not a mode`);
  const tint = opts.brandTint ?? 10;

  // sources
  const defs = new Map<string, Def>();
  const add = (name: string, auth: Authored, spectrum: Def['spectrum'], adaptive = true, make?: Def['make']) =>
    defs.set(name, { auth, adaptive, spectrum, make });

  for (const [k, v] of Object.entries(system.main)) add(`main-${k}`, { value: v }, 'none', false);
  for (const [k, v] of Object.entries(system.brand)) add(`brand-${k}`, { value: v }, 'none', false);   // immutable
  for (const [k, v] of Object.entries(system.status)) add(`status-${k}`, norm(v), 'status');
  // a role is derived from its source colour (a reference to main or brand is read for its colour, never aliased)
  for (const [k, v] of Object.entries(system.roles ?? {})) add(`role-${k}`, { value: defs.get(v)?.auth.value ?? v }, 'status');
  for (const [hue, tones] of Object.entries(system.content))
    for (const tone of ['standard', 'soft'] as const) add(`content-${hue}-${tone}`, norm(tones[tone]), 'content');
  for (const [k, v] of Object.entries(system.custom ?? {})) add(`custom-${k}`, norm(v), 'content');

  const out: ResolvedModes = {};
  const sourceRgb = new Map<string, Rgb>();          // literal sources, as authored
  const isToken = (s: string) => defs.has(s) || /^(gray|bg|fg)/.test(s) || /^brand-\d-gray-/.test(s);

  for (const mode of modeNames) {
    const memo = new Map<string, Rgb>();
    const stack: string[] = [];

    const literal = (name: string, d: Def): Rgb => {
      const v = d.auth.value!; const rgb = parseColor(v);
      if (!rgb) throw new Error(`"${name}": "${v}" is not a colour`);
      return rgb;
    };
    // anchors: a literal, or main/brand (immutable) — never a derived token (circular)
    const anchorIn = (v: string): Rgb => {
      const lit = parseColor(v); if (lit) return lit;
      const d = defs.get(v);
      if (!d || d.adaptive) throw new Error(`anchor "${v}" must be a colour, a main or a brand`);
      return literal(v, d);
    };
    const spec = modes[mode];
    const to: Interval = intervalOf(anchorIn(spec.background), anchorIn(spec.foreground));
    // a mode narrower than the reference spreads its derived colours toward the extremes of its range, so they stay apart: p = (range of the reference / range of this mode) ^ 0.5, between 1 and 3; the mode's own `contrastRatio` wins
    const rangeOf = (i: Interval) => Math.abs(i.fg.l - i.bg.l);
    const from: Interval = mode === reference
      ? to
      : intervalOf(anchorIn(modes[reference].background), anchorIn(modes[reference].foreground));
    const autoRatio = mode === reference ? 1 : Math.min(3, Math.max(1, Math.sqrt(rangeOf(from) / Math.max(rangeOf(to), 1e-6))));

    const sourceOf = (name: string): Rgb | null => {
      const d = defs.get(name)!; if (!d.auth.value) return null;
      if (parseColor(d.auth.value)) return sourceRgb.get(name) ?? (sourceRgb.set(name, literal(name, d)), sourceRgb.get(name)!);
      return null;
    };
    const cmax = (kind: 'status' | 'content') => {
      let m = 0;
      for (const [n, d] of defs) if (d.spectrum === kind) { const s = sourceOf(n); if (s) m = Math.max(m, rgbToOklch(s).c); }
      return m;
    };

    const token = (name: string): Rgb => {
      const hit = memo.get(name); if (hit) return hit;
      if (stack.includes(name)) throw new Error(`colour reference cycle: ${[...stack, name].join(' → ')}`);
      stack.push(name);
      const rgb = compute(name);
      stack.pop(); memo.set(name, rgb);
      return rgb;
    };

    const fromValue = (name: string, v: string, d: Def, explicit: boolean): Rgb => {
      const lit = parseColor(v);
      if (!lit) {                                          // a reference: resolved in this mode, never transformed twice
        if (!defs.has(v) && !isToken(v)) throw new Error(`"${name}": "${v}" is neither a colour nor a token`);
        return token(v);
      }
      if (explicit || !d.adaptive || mode === reference) return lit;
      return adapt(lit, from, to, d.spectrum === 'none' ? 0 : cmax(d.spectrum), spec.chroma ?? DEFAULT_CURVE, spec.contrastRatio ?? autoRatio);
    };

    const compute = (name: string): Rgb => {
      if (name === 'background') return anchorIn(spec.background);
      if (name === 'foreground') return anchorIn(spec.foreground);
      const g = /^gray-(\d+)$/.exec(name);
      if (g) {
        const a = norm(system.grayscale?.[g[1] as keyof NonNullable<ColorSystem['grayscale']>]);
        const ov = a.modes?.[mode]; if (ov) return fromValue(name, ov, { auth: a, adaptive: false, spectrum: 'none' }, true);
        if (a.value) return fromValue(name, a.value, { auth: a, adaptive: true, spectrum: 'none' }, false);
        return grayStep(to.bgRgb(), to.fgRgb(), GRAY_WEIGHTS.find(([s]) => s === g[1])![1]);
      }
      const bg = /^brand-(\d)-gray-(\d+)$/.exec(name);
      if (bg) {
        const a = norm(system.brandGrayscale?.[bg[1] as '1']?.[bg[2] as '50']);
        const ov = a.modes?.[mode]; if (ov) return fromValue(name, ov, { auth: a, adaptive: false, spectrum: 'none' }, true);
        if (a.value) return fromValue(name, a.value, { auth: a, adaptive: true, spectrum: 'none' }, false);
        const w = GRAY_WEIGHTS.find(([s]) => s === bg[2]); if (!w) throw new Error(`unknown token ${name}`);
        return brandGrayStep(token(`brand-${bg[1]}`), tint, token(`gray-${bg[2]}`), token('background'), token('foreground'));
      }
      const d = defs.get(name); if (!d) throw new Error(`unknown token "${name}"`);
      const ov = d.auth.modes?.[mode];
      if (ov) return fromValue(name, ov, d, true);
      if (!d.auth.value) throw new Error(`"${name}" has no value`);
      return fromValue(name, d.auth.value, d, false);
    };

    const row: Record<string, string> = {};
    const names = [
      'background', 'foreground', ...defs.keys(),
      ...GRAY_WEIGHTS.map(([s]) => `gray-${s}`),
      ...Object.keys(system.brand).flatMap((b) => GRAY_WEIGHTS.map(([s]) => `brand-${b}-gray-${s}`)),
    ];
    for (const n of names) row[n] = toHex(token(n));
    out[mode] = row;
  }
  return out;
}
