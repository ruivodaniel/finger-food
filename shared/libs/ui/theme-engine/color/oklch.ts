// OKLCH arithmetic shared by web, mobile and canvas. Pure; no platform emits from here.

export type Rgb = { r: number; g: number; b: number };           // 0..255
export type Oklch = { l: number; c: number; h: number };         // l 0..1, c ≥ 0, h degrees

const lin = (v: number) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
const gam = (x: number) => 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);

export function parseColor(input: string): Rgb | null {
  const s = input.trim().toLowerCase();
  if (s.startsWith('#')) {
    const h = s.slice(1);
    const f = h.length === 3 || h.length === 4 ? [...h].map((c) => c + c).join('') : h;
    if (f.length !== 6 && f.length !== 8) return null;
    const n = (i: number) => parseInt(f.slice(i, i + 2), 16);
    const out = { r: n(0), g: n(2), b: n(4) };
    return Number.isNaN(out.r + out.g + out.b) ? null : out;
  }
  const rgb = /^rgba?\(([^)]+)\)$/.exec(s);
  if (rgb) {
    const p = rgb[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return p.length >= 3 && p.every((x) => !Number.isNaN(x)) ? { r: p[0], g: p[1], b: p[2] } : null;
  }
  const ok = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?/.exec(s);
  if (ok) return oklchToRgb({ l: ok[2] ? Number(ok[1]) / 100 : Number(ok[1]), c: Number(ok[3]), h: Number(ok[4]) }, false);
  return null;
}

export function rgbToOklch({ r, g, b }: Rgb): Oklch {
  const R = lin(r), G = lin(g), B = lin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(A, Bb);
  return { l: L, c, h: c < 1e-6 ? 0 : ((Math.atan2(Bb, A) * 180) / Math.PI + 360) % 360 };
}

function toLinear({ l, c, h }: Oklch): [number, number, number] {
  const a = c * Math.cos((h * Math.PI) / 180), b = c * Math.sin((h * Math.PI) / 180);
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

const inGamut = (v: [number, number, number]) => v.every((x) => x >= -1e-4 && x <= 1 + 1e-4);

/** `clamp`: reduce chroma until the colour fits sRGB (hue and lightness kept). */
export function oklchToRgb(color: Oklch, clamp = true): Rgb {
  let c = color.c;
  let v = toLinear({ ...color, c });
  if (clamp && !inGamut(v)) {
    let lo = 0, hi = c;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(toLinear({ ...color, c: mid }))) lo = mid; else hi = mid;
    }
    c = lo; v = toLinear({ ...color, c });
  }
  const f = (x: number) => Math.min(255, Math.max(0, gam(Math.min(1, Math.max(0, x)))));
  return { r: f(v[0]), g: f(v[1]), b: f(v[2]) };
}

const h2 = (n: number) => Math.round(n).toString(16).padStart(2, '0');
export const toHex = ({ r, g, b }: Rgb) => `#${h2(r)}${h2(g)}${h2(b)}`;
