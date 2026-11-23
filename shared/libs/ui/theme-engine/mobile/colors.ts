// ============================================================
// COLOURS — the arithmetic the browser does for the web theme
// ============================================================
// The web theme leaves `color-mix(in srgb, …)` to the browser. Here it is
// computed: at build time for the palette, at run time for the composition.

export type Rgba = { r: number; g: number; b: number; a: number };

export const TRANSPARENT: Rgba = { r: 0, g: 0, b: 0, a: 0 };

export function parseColor(input: string): Rgba | null {
  const s = input.trim().toLowerCase();
  if (s === 'transparent') return { ...TRANSPARENT };
  if (s.startsWith('#')) {
    const h = s.slice(1);
    const full = h.length === 3 || h.length === 4 ? [...h].map((c) => c + c).join('') : h;
    if (full.length !== 6 && full.length !== 8) return null;
    const n = (i: number) => parseInt(full.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: full.length === 8 ? n(6) / 255 : 1 };
  }
  const m = /^rgba?\(([^)]+)\)$/.exec(s);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (p.length >= 3 && p.every((x) => !Number.isNaN(x))) return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
  }
  return null;
}

const hex2 = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
const round3 = (n: number) => Math.round(n * 1000) / 1000;

export function formatColor(c: Rgba): string {
  if (c.a >= 0.999) return `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;
  if (c.a <= 0.001) return 'transparent';
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${round3(c.a)})`;
}

/** color-mix(in srgb, a p%, b): interpolation on premultiplied channels, as CSS defines it. `p` is 0..1. */
export function mix(a: Rgba, p: number, b: Rgba): Rgba {
  const q = 1 - p;
  const alpha = a.a * p + b.a * q;
  if (alpha <= 0) return { ...TRANSPARENT };
  const ch = (x: number, y: number) => (x * a.a * p + y * b.a * q) / alpha;
  return { r: ch(a.r, b.r), g: ch(a.g, b.g), b: ch(a.b, b.b), a: alpha };
}

/** HSL lightness, 0..100 */
export function lightness(c: Rgba): number {
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  return ((Math.max(r, g, b) + Math.min(r, g, b)) / 2) * 100;
}

/** the web's `smart-bw`: white on a dark fill, black on a light one (the threshold is lightness 74) */
export function smartBw(bg: Rgba): Rgba {
  return lightness(bg) < 74 ? { r: 255, g: 255, b: 255, a: 1 } : { r: 0, g: 0, b: 0, a: 1 };
}
