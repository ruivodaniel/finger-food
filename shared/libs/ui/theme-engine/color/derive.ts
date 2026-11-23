// Mode-aware derivation. Hue is kept; lightness is remapped between BG/FG intervals; chroma follows a curve.
import { parseColor, rgbToOklch, oklchToRgb, toHex, type Oklch, type Rgb } from './oklch';
import type { ChromaCurve } from '../../types/color-system';

export const GRAY_WEIGHTS: [string, number][] = [
  ['50', 2], ['100', 5], ['150', 7], ['200', 10], ['250', 14], ['300', 18], ['400', 35],
  ['500', 50], ['600', 65], ['700', 76], ['800', 86], ['900', 93], ['950', 96],
];

export type Interval = { bg: Oklch; fg: Oklch; bgRgb: () => Rgb; fgRgb: () => Rgb };

export const DEFAULT_CURVE: ChromaCurve = { saturationFactor: 1, gamma: 1 };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** The contrast curve: t in [0,1] to [0,1], symmetric around 0.5. p = 1 is the identity; p above 1 pushes t toward 0 and 1 (an exponential S), so colours stay apart when the range narrows. */
export const contrastCurve = (t: number, p: number): number => (p === 1 ? t : t ** p / (t ** p + (1 - t) ** p));

/** Where `l` sits between the source BG (0) and FG (1), curved by the contrast ratio, mapped onto the target's BG→FG; always inside the target. */
export function mapLightness(l: number, from: Interval, to: Interval, ratio = 1): number {
  const span = from.fg.l - from.bg.l;
  const t = Math.abs(span) < 1e-6 ? 0.5 : clamp01((l - from.bg.l) / span);
  return to.bg.l + contrastCurve(t, ratio) * (to.fg.l - to.bg.l);
}

/** C' = Cmax × saturationFactor × (C / Cmax) ^ gamma */
export function curveChroma(c: number, cmax: number, curve: ChromaCurve): number {
  if (cmax <= 0) return 0;
  return cmax * curve.saturationFactor * (Math.min(c, cmax) / cmax) ** curve.gamma;
}

export function intervalOf(bg: Rgb, fg: Rgb): Interval {
  return { bg: rgbToOklch(bg), fg: rgbToOklch(fg), bgRgb: () => bg, fgRgb: () => fg };
}

/** Content / custom / status: hue kept, lightness remapped, chroma curved, gamut clamped. */
export function adapt(color: Rgb, from: Interval, to: Interval, cmax: number, curve: ChromaCurve = DEFAULT_CURVE, ratio = 1): Rgb {
  const o = rgbToOklch(color);
  return oklchToRgb({ l: mapLightness(o.l, from, to, ratio), c: curveChroma(o.c, cmax, curve), h: o.h });
}

const mixRgb = (a: Rgb, p: number, b: Rgb): Rgb => ({
  r: a.r * p + b.r * (1 - p), g: a.g * p + b.g * (1 - p), b: a.b * p + b.b * (1 - p),
});

/** Existing behaviour: srgb mix of FG into BG at the step's weight. */
export function grayStep(bg: Rgb, fg: Rgb, weight: number): Rgb {
  return mixRgb(fg, weight / 100, bg);
}

/** Existing brand mixing (tint% of the brand over the gray step), then bounded to the BG/FG lightness range. */
export function brandGrayStep(brand: Rgb, tintPercent: number, gray: Rgb, bg: Rgb, fg: Rgb): Rgb {
  const mixed = rgbToOklch(mixRgb(brand, tintPercent / 100, gray));
  const lo = Math.min(rgbToOklch(bg).l, rgbToOklch(fg).l);
  const hi = Math.max(rgbToOklch(bg).l, rgbToOklch(fg).l);
  const l = Math.min(hi, Math.max(lo, mixed.l));
  return l === mixed.l ? mixRgb(brand, tintPercent / 100, gray) : oklchToRgb({ ...mixed, l });
}

/** The lightness at which text in the lighter anchor and text in the darker anchor have the same contrast against a fill: a fill lighter than this reads the darker anchor. (Luminance Y ~ L^3 on a neutral; the equal-contrast luminance is sqrt((Yl + .05)(Yd + .05)) - .05.) */
export const SMART_BIAS = 0.12;   // text in the lighter anchor is kept on mid-tone fills past the equal-contrast point (white reads better there)
export const smartPivot = (lLight: number, lDark: number, bias = SMART_BIAS): number => {
  const yl = lLight ** 3, yd = lDark ** 3;
  const equal = Math.cbrt(Math.max(0, Math.sqrt((yl + 0.05) * (yd + 0.05)) - 0.05));
  return Math.min(lLight - 0.05, equal + bias);
};

export const hex = (c: Rgb) => toHex(c);
export const parse = (s: string) => parseColor(s);
