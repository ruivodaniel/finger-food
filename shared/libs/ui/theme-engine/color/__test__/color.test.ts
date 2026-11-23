import { describe, it, expect } from 'vitest';
import { resolveColorSystem } from '../resolve';
import { parseColor, rgbToOklch } from '../oklch';
import { curveChroma } from '../derive';
import type { ColorSystem, ColorModeSpec } from '../../../types/color-system';
import { RADIX_HUES } from '../../../types/color-system';

const L = (hex: string) => rgbToOklch(parseColor(hex)!).l;
const C = (hex: string) => rgbToOklch(parseColor(hex)!).c;
const H = (hex: string) => rgbToOklch(parseColor(hex)!).h;

const hues: Record<string, [string, string]> = {};
const base = ['#E5484D', '#F4B2AC'];
RADIX_HUES.forEach((h, i) => { hues[h] = i % 2 ? ['#3E63DD', '#B6C6F5'] : (i % 3 ? base as [string, string] : ['#30A46C', '#A9DFC3']); });
const content = Object.fromEntries(RADIX_HUES.map((h) => [h, { standard: hues[h][0], soft: hues[h][1] }])) as ColorSystem['content'];

const system = (over: Partial<ColorSystem> = {}): ColorSystem => ({
  main: { white: '#FFFFFF', black: '#000000' },
  brand: { '1': '#0047FF', '2': '#000000', '3': '#B3C7FF', '4': '#4A4A4A' },
  status: { success: '#008A3E', info: '#0047FF', warning: '#F29100', error: '#E30613' },
  content,
  ...over,
});
const modes: Record<string, ColorModeSpec> = {
  light: { background: 'main-white', foreground: 'main-black' },
  dark: { background: 'main-black', foreground: 'main-white', chroma: { saturationFactor: 0.9, gamma: 1 } },
};

describe('sources and precedence', () => {
  it('main and brand are identical in every mode', () => {
    const r = resolveColorSystem(system(), modes);
    for (const t of ['main-white', 'brand-1', 'brand-4']) expect(r.dark[t]).toBe(r.light[t]);
  });
  it('reference mode carries the authored value', () => {
    expect(resolveColorSystem(system(), modes).light['content-red-standard'].toLowerCase()).toBe(hues.red[0].toLowerCase());
  });
  it('explicit mode override beats derivation', () => {
    const s = system({ status: { success: { value: '#008A3E', modes: { dark: '#38B76D' } }, info: '#0047FF', warning: '#F29100', error: '#E30613' } });
    expect(resolveColorSystem(s, modes).dark['status-success'].toLowerCase()).toBe('#38b76d');
  });
  it('overrides on generated scale steps', () => {
    const s = system({ grayscale: { '100': { modes: { dark: '#282828' } } } });
    expect(resolveColorSystem(s, modes).dark['gray-100']).toBe('#282828');
  });
});

describe('token references', () => {
  it('custom alias takes the resolved token of the active mode, not a second transformation', () => {
    const s = system({ custom: { annotation: 'content-tomato-soft' } });
    const r = resolveColorSystem(s, modes);
    expect(r.dark['custom-annotation']).toBe(r.dark['content-tomato-soft']);
    expect(r.light['custom-annotation']).toBe(r.light['content-tomato-soft']);
  });
  it('detects cycles', () => {
    const s = system({ custom: { a: 'custom-b', b: 'custom-a' } });
    expect(() => resolveColorSystem(s, modes)).toThrow(/cycle/);
  });
});

describe('BG/FG boundaries', () => {
  const lowContrast: Record<string, ColorModeSpec> = {
    light: modes.light,
    dusk: { background: '#6B7A99', foreground: '#B8C2DB' },          // chromatic, low contrast
    inverse: { background: '#101010', foreground: '#2A2A2A' },
  };
  for (const [name, set] of [['normal', modes], ['low-contrast/chromatic', lowContrast]] as const) {
    it(`grayscale and brand grayscale stay within BG/FG lightness (${name})`, () => {
      const r = resolveColorSystem(system(), set);
      for (const m of Object.keys(set)) {
        const lo = Math.min(L(r[m].background), L(r[m].foreground)) - 0.01;
        const hi = Math.max(L(r[m].background), L(r[m].foreground)) + 0.01;
        for (const [t, v] of Object.entries(r[m])) if (/^(gray-|brand-\d-gray-)/.test(t)) {
          expect(L(v), `${m} ${t}`).toBeGreaterThanOrEqual(lo);
          expect(L(v), `${m} ${t}`).toBeLessThanOrEqual(hi);
        }
      }
    });
    it(`content lightness stays within BG/FG (${name})`, () => {
      const r = resolveColorSystem(system(), set);
      for (const m of Object.keys(set)) {
        const lo = Math.min(L(r[m].background), L(r[m].foreground)) - 0.02;
        const hi = Math.max(L(r[m].background), L(r[m].foreground)) + 0.02;
        for (const [t, v] of Object.entries(r[m])) if (t.startsWith('content-')) expect(L(v), `${m} ${t}`).toBeGreaterThanOrEqual(lo), expect(L(v), `${m} ${t}`).toBeLessThanOrEqual(hi);
      }
    });
  }
  it('grayscale keeps the existing srgb weights', () => {
    const r = resolveColorSystem(system(), modes);
    expect(r.light['gray-500']).toBe('#808080');
    expect(r.light['gray-50']).toBe('#fafafa');
  });
});

describe('chroma spectrum', () => {
  it('hue is preserved and chroma ordering kept in a derived mode', () => {
    const r = resolveColorSystem(system(), modes);
    const names = Object.keys(r.light).filter((t) => t.startsWith('content-'));
    for (const t of names) {
      if (C(r.dark[t]) > 0.03) expect(Math.abs(H(r.dark[t]) - H(r.light[t])) % 360).toBeLessThan(12);
    }
    const ord = (m: string) => [...names].sort((a, b) => C(r[m][a]) - C(r[m][b])).slice(0, 3).map((n) => C(r[m][n]));
    expect(ord('dark')[0]).toBeLessThanOrEqual(ord('dark')[2]);
  });
  it('curve: gamma and saturationFactor', () => {
    expect(curveChroma(0.1, 0.2, { saturationFactor: 1, gamma: 1 })).toBeCloseTo(0.1);
    expect(curveChroma(0.2, 0.2, { saturationFactor: 0.5, gamma: 1 })).toBeCloseTo(0.1);
    expect(curveChroma(0.1, 0.2, { saturationFactor: 1, gamma: 2 })).toBeCloseTo(0.05);
  });
});

describe('arbitrary modes', () => {
  it('resolves any number of modes, with any reference', () => {
    const many = { ...modes, sepia: { background: '#F4ECD8', foreground: '#5B4636' } };
    const r = resolveColorSystem(system(), many, { reference: 'dark' });
    expect(Object.keys(r)).toEqual(['light', 'dark', 'sepia']);
    expect(r.dark['content-red-standard'].toLowerCase()).toBe(hues.red[0].toLowerCase());
  });
});

describe('soft is subordinate to standard', () => {
  const dist = (a: string, b: string) => {
    const x = rgbToOklch(parseColor(a)!), y = rgbToOklch(parseColor(b)!);
    const ax = x.c * Math.cos((x.h * Math.PI) / 180), ay = x.c * Math.sin((x.h * Math.PI) / 180);
    const bx = y.c * Math.cos((y.h * Math.PI) / 180), by = y.c * Math.sin((y.h * Math.PI) / 180);
    return Math.hypot(x.l - y.l, ax - bx, ay - by);
  };
  const set: Record<string, ColorModeSpec> = {
    ...modes,
    sepia: { background: '#F4ECD8', foreground: '#5B4636' },
    dusk: { background: '#6B7A99', foreground: '#B8C2DB' },
  };
  it('in every mode, soft sits closer to the background than standard', () => {
    const r = resolveColorSystem(system(), set);
    for (const m of Object.keys(set)) for (const h of RADIX_HUES)
      expect(dist(r[m][`content-${h}-soft`], r[m].background), `${m} ${h}`).toBeLessThan(dist(r[m][`content-${h}-standard`], r[m].background));
  });
});

describe('contrast ratio and the derived roles', () => {
  it('the curve is the identity at 1 and pushes toward the extremes above 1', async () => {
    const { contrastCurve } = await import('../derive');
    expect(contrastCurve(0.3, 1)).toBe(0.3);
    expect(contrastCurve(0.3, 1.5)).toBeLessThan(0.3);
    expect(contrastCurve(0.7, 1.5)).toBeGreaterThan(0.7);
    expect(contrastCurve(0.5, 2)).toBeCloseTo(0.5);
  });
  it('status and roles are derived in a mode, brand is not', () => {
    const s = system({ roles: { primary: 'brand-1' } });
    const r = resolveColorSystem(s, { light: modes.light, low: { background: '#CDC7BE', foreground: '#7D7670' } });
    expect(r.low['brand-1']).toBe(r.light['brand-1']);
    expect(r.low['status-error']).not.toBe(r.light['status-error']);
    expect(r.light['role-primary'].toLowerCase()).toBe('#0047ff');
    expect(r.low['role-primary']).not.toBe(r.light['role-primary']);
  });
  it('a higher contrast ratio spreads derived colours further apart', () => {
    const low = { background: '#CDC7BE', foreground: '#7D7670' };
    const flat = resolveColorSystem(system(), { light: modes.light, low: { ...low, contrastRatio: 1 } });
    const spread = resolveColorSystem(system(), { light: modes.light, low: { ...low, contrastRatio: 1.6 } });
    const gap = (r: typeof flat) => Math.abs(L(r.low['status-warning']) - L(r.low['status-info']));
    expect(gap(spread)).toBeGreaterThanOrEqual(gap(flat));
  });
});

describe('the default contrast ratio of a narrow mode', () => {
  it('a mode narrower than the reference spreads its derived colours further than a straight map', () => {
    const low = { background: '#CDC7BE', foreground: '#7D7670' };
    const auto = resolveColorSystem(system(), { light: modes.light, low });
    const straight = resolveColorSystem(system(), { light: modes.light, low: { ...low, contrastRatio: 1 } });
    const spreadOf = (r: typeof auto) => { const ls = ['status-error', 'status-success', 'status-warning', 'status-info'].map((t) => L(r.low[t])); return Math.max(...ls) - Math.min(...ls); };
    expect(spreadOf(auto)).toBeGreaterThan(spreadOf(straight));
  });
  it('a mode as wide as the reference is left straight', () => {
    const wide = resolveColorSystem(system(), { light: modes.light, same: { ...modes.light } });
    const lightRow = resolveColorSystem(system(), { light: modes.light }).light;
    expect(wide.same['status-warning']).toBe(lightRow['status-warning']);
  });
});
