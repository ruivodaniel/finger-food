// Text and icon contrast, enforced per mode at build time.
// Every surface rule that sets a foreground (`--fg`) is checked against the background it really sits on (its own background, the tint mixed in,
// else the mode's background). If the lightness gap is under the minimum, the foreground's lightness moves away from the background until it is met,
// hue and saturation kept, never past the mode's own tonal range. The minimum is an absolute lightness gap (default 0.40), capped at 90% of the mode's
// own range (background to foreground): a low-contrast mode asks for as much as it can give, which is nearly its foreground. The result is written as overrides under each mode: the browser does no arithmetic.
import type { WebTheme as Theme } from '../../../types';
import { resolveColorSystem } from '../../color/resolve';
import { oklchToRgb, parseColor, rgbToOklch, toHex, type Rgb } from '../../color/oklch';
import { smartPivot } from '../../color/derive';
import { resolveAnchorToHex } from './process-primitives';
import { gradientStops } from './emit';

export const DEFAULT_TEXT_CONTRAST = 0.55;  // the absolute lightness gap (OKLCH L) a mode asks for when it turns the pass on
export const RANGE_SHARE = 0.9;              // never more than this share of the mode's own range
const TINT = 0.2;   // the composition formula mixes the tint into the background at 20%

const mix = (a: Rgb, p: number, b: Rgb): Rgb => ({ r: a.r * p + b.r * (1 - p), g: a.g * p + b.g * (1 - p), b: a.b * p + b.b * (1 - p) });
const closeEnough = (a: Rgb, b: Rgb) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) < 3;

/** The foreground moved away from `bg` until their lightness gap is at least `min`, inside [lo, hi]; unchanged when the gap is enough. */
export function adjustForeground(fg: Rgb, bg: Rgb, min: number, lo: number, hi: number): Rgb {
  const f = rgbToOklch(fg), b = rgbToOklch(bg);
  if (Math.abs(f.l - b.l) >= min) return fg;
  const darker = f.l <= b.l;
  const target = Math.min(hi, Math.max(lo, darker ? b.l - min : b.l + min));
  // the move never goes the other way: a colour that cannot reach the gap inside the range goes as far as the range lets it
  const l = darker ? Math.min(f.l, target) : Math.max(f.l, target);
  return oklchToRgb({ l, c: f.c, h: f.h });
}

type Rule = { selector: string; decls: Record<string, string>; start: number; end: number };

/** the top-level rules of the CSS that are not inside an at-rule (a media query keeps its own context) */
function topRules(css: string): Rule[] {
  const rules: Rule[] = [];
  let depth = 0, i = 0;
  const n = css.length;
  while (i < n) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') { const e = css.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (depth === 0 && c !== '}' && c !== ';' && !/\s/.test(c)) {
      const open = css.indexOf('{', i); if (open < 0) break;
      const head = css.slice(i, open).trim();
      // find the matching close
      let d = 1, j = open + 1;
      while (j < n && d > 0) { if (css[j] === '{') d++; else if (css[j] === '}') d--; j++; }
      const body = css.slice(open + 1, j - 1);
      if (!head.startsWith('@') && !body.includes('{')) {
        const decls: Record<string, string> = {};
        for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) decls[m[1]] = m[2].trim();
        rules.push({ selector: head, decls, start: i, end: j });
      }
      i = j; continue;
    }
    i++;
  }
  return rules;
}

/** a selector with its trailing states stripped, nearest base first: [element="x"][state="selected"]:hover → [element="x"][state="selected"] → [element="x"] */
function bases(selector: string): string[] {
  const out: string[] = []; let s = selector.split(',')[0].trim();
  for (let k = 0; k < 6; k++) {
    const t = s.replace(/(\[(?:state|status|emphasis|position|disabled|data-[\w-]+)[^\]]*\]|:[a-z-]+(?:\([^)]*\))?)$/, '');
    if (t === s || !t) break;
    out.push(t); s = t;
  }
  return out;
}

export function enforceTextContrast(css: string, theme: Theme): string {
  const scheme = theme.modes.colorScheme as Record<string, { background: string; foreground: string; minTextContrast?: number; smartBias?: number }>;
  const modeNames = Object.keys(scheme);
  if (!theme.colors.content || !modeNames.length) return css;

  const hex = (v: string) => resolveAnchorToHex(String(v), theme.colors);
  const status = Object.fromEntries(Object.entries(theme.colors.status).map(([k, v]) => [k, hex(String(v))]));
  const specs = Object.fromEntries(modeNames.map((m) => [m, { background: hex(scheme[m].background), foreground: hex(scheme[m].foreground), chroma: (scheme[m] as { chroma?: never }).chroma }]));
  const tokens = resolveColorSystem({ main: theme.colors.main, brand: theme.colors.brand, status, content: theme.colors.content } as never, specs);
  const semantic = theme.colors.semanticTokens as Record<string, string>;
  // brand and main are emitted as they are in every mode (the CSS holds one value), so a check reads them as they are; status and the roles are derived per mode, so a check reads the derived ones
  const raw: Record<string, string> = {
    ...Object.fromEntries(Object.entries(theme.colors.main).map(([k, v]) => [`main-${k}`, hex(String(v))])),
    ...Object.fromEntries(Object.entries(theme.colors.brand).map(([k, v]) => [`brand-${k}`, hex(String(v))])),
  };

  const rules = topRules(css);
  const byAll = new Map<string, Record<string, string>>();
  for (const r of rules) byAll.set(r.selector, { ...(byAll.get(r.selector) ?? {}), ...r.decls });
  // every rule that sets a foreground is restated (the cascade among them must keep its order), a gradient-filled one included; only those with a plain fill of their own are checked
  const fgRules = rules.filter((r) => r.decls['--fg'] && !r.selector.includes('@'));
  if (!fgRules.length) return css;

  const sections: string[] = [];
  for (const mode of modeNames) {
    const t = tokens[mode];
    const bgMode = parseColor(t.background)!, fgMode = parseColor(t.foreground)!;
    const lb = rgbToOklch(bgMode).l, lf = rgbToOklch(fgMode).l;
    const [lightAnchor, darkAnchor] = lb >= lf ? [t.background, t.foreground] : [t.foreground, t.background];
    const lo = Math.min(lb, lf), hi = Math.max(lb, lf);
    const min = Math.min(scheme[mode].minTextContrast ?? DEFAULT_TEXT_CONTRAST, RANGE_SHARE * (hi - lo));
    if (min <= 0) continue;

    /** a declared colour as RGB in this mode; `bg` is what a smart-bw reads */
    const rgb = (value: string | undefined, bgForSmart?: Rgb): Rgb | null => {
      if (!value) return null;
      const v = value.trim();
      if (/^(transparent|inherit|currentColor|initial)$/i.test(v)) return null;
      const lit = parseColor(v); if (lit) return lit;
      if (v.includes('var(--smart-light-l)')) { if (!bgForSmart) return null; const lt = parseColor(lightAnchor)!, dk = parseColor(darkAnchor)!; return rgbToOklch(bgForSmart).l > smartPivot(Math.max(lb, lf), Math.min(lb, lf), scheme[mode].smartBias) ? dk : lt; }
      const cm = /^color-mix\(in srgb,\s*(.+?)\s+(\d+(?:\.\d+)?)%,\s*(.+)\)$/.exec(v);
      if (cm) { const a = rgb(cm[1], bgForSmart), b = rgb(cm[3], bgForSmart); return a && b ? mix(a, Number(cm[2]) / 100, b) : null; }
      const m = /^var\((--[\w-]+)\)$/.exec(v); if (!m) return null;
      const name = m[1];
      if (name === '--background') return parseColor(t.background);
      if (name === '--foreground') return parseColor(t.foreground);
      const token = (k: string) => { const s = raw[k] ?? t[k]; return s ? parseColor(s) : null; };
      // a gradient fill's representative colour (--gradient-<name>-color): its first stop
      const g = /^--gradient-(.+)-color$/.exec(name);
if (g) {
        const stops = gradientStops((theme.gradients as Record<string, unknown> | undefined)?.[g[1]]);
        const cols = stops.map((stop) => rgb(/^(#|color-mix\(|rgb)/.test(stop) ? stop : (['primary', 'secondary', 'accent', 'muted', 'background', 'foreground'].includes(stop) ? `var(--${stop})` : `var(--color-${stop})`), bgForSmart)).filter((c): c is Rgb => !!c);
        if (!cols.length) return null;
        // the average colour: the stops averaged in OKLab (so their lightness averages)
        const lab = cols.map((c) => { const o = rgbToOklch(c); return [o.l, o.c * Math.cos((o.h * Math.PI) / 180), o.c * Math.sin((o.h * Math.PI) / 180)]; });
        const m = [0, 1, 2].map((k) => lab.reduce((a, v) => a + v[k], 0) / lab.length);
        return oklchToRgb({ l: m[0], c: Math.hypot(m[1], m[2]), h: ((Math.atan2(m[2], m[1]) * 180) / Math.PI + 360) % 360 });
      }
      const role = name.slice(2);
      if (semantic[role]) { const d = t[`role-${role}`]; return d ? parseColor(d) : (parseColor(semantic[role]) ?? token(semantic[role])); }
      if (name.startsWith('--color-')) return token(name.slice(8));
      return null;
    };
    const pick = (r: Rule, key: string): string | undefined => {
      if (r.decls[key] != null) return r.decls[key];
      for (const b of bases(r.selector)) { const d = byAll.get(b); if (d?.[key] != null) return d[key]; }
      return undefined;
    };

    const changed = new Map<Rule, string>();
    for (const r of fgRules) {
      // a check needs the real pair: a rule that sets a foreground without its own background (the fill comes from another rule) is left alone
      const bgDecl = r.decls['--bg'];
      // a transparent fill sits on something this rule cannot see (a hero, a card): not checked
      if (bgDecl === undefined || bgDecl.trim() === 'transparent' || r.decls['--bg-gradient']) continue;
      const base = rgb(bgDecl) ?? bgMode;
      const tintDecl = pick(r, '--tint'); const tint = tintDecl && tintDecl !== 'transparent' ? rgb(tintDecl) : null;
      const eff = tint ? mix(tint, TINT, base) : base;
      const fg = rgb(r.decls['--fg'], base); if (!fg) continue;
      const next = adjustForeground(fg, eff, min, lo, hi);
      if (!closeEnough(next, fg)) changed.set(r, toHex(next));
    }
    if (!changed.size) continue;
    // every rule that sets a foreground is restated in this mode (the adjusted ones with their new value, the others as they were), so the cascade among them keeps its order
    const scope = mode === modeNames[0] ? (s: string) => `:root:not([data-mode]) ${s}, [data-mode="${mode}"] ${s}` : (s: string) => `[data-mode="${mode}"] ${s}`;
    const lines: string[] = [];
    for (const r of fgRules) {
      const adj = changed.get(r);
      const sel = r.selector.split(',').map((p) => scope(p.trim())).join(', ');
      lines.push(`${sel} { --fg: ${adj ?? r.decls['--fg']}; }`);
    }
    sections.push(`/* ${mode}: ${changed.size} foreground${changed.size === 1 ? '' : 's'} adjusted (minimum gap ${(min).toFixed(2)} of lightness) */\n${lines.join('\n')}`);
  }
  if (!sections.length) return css;
  return `${css}\n\n/* === Text contrast: foregrounds that sit too close to their background in a mode, moved away from it === */\n${sections.join('\n\n')}\n`;
}
