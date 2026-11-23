import { describe, it, expect } from 'vitest';
import { resolveColorSystem } from '../resolve';
import { parseColor, rgbToOklch } from '../oklch';
import { RADIX_HUES } from '../../../types/color-system';
import { daintaTheme } from '../../../themes/wireframe-stroke/v1/theme';
import { brutalistTheme } from '../../../themes/brutalist/v1/theme';
import { swissTheme } from '../../../themes/swiss/v1/theme';
import { popTheme } from '../../../themes/pop/v1/theme';

const themes = { 'wireframe-stroke': daintaTheme, brutalist: brutalistTheme, swiss: swissTheme, pop: popTheme } as Record<string, any>;
const lab = (hex: string) => { const o = rgbToOklch(parseColor(hex)!); return [o.l, o.c * Math.cos(o.h * Math.PI / 180), o.c * Math.sin(o.h * Math.PI / 180)]; };
const dist = (a: string, b: string) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));

for (const [name, t] of Object.entries(themes)) describe(`authored content: ${name}`, () => {
  const modes = Object.fromEntries(Object.entries(t.modes.colorScheme).map(([k, p]: any) => [k, { background: p.background, foreground: p.foreground, chroma: p.chroma, contrastRatio: p.contrastRatio }]));
  const r = resolveColorSystem({ main: t.colors.main, brand: t.colors.brand, status: t.colors.status, content: t.colors.content }, modes);
  it('has all 25 hues × 2 tones', () => { for (const h of RADIX_HUES) expect(t.colors.content[h]).toBeTruthy(); });
  for (const m of Object.keys(modes)) it(`soft is closer to the background than standard (${m})`, () => {
    for (const h of RADIX_HUES) expect(dist(r[m][`content-${h}-soft`], r[m].background), `${m} ${h}`).toBeLessThan(dist(r[m][`content-${h}-standard`], r[m].background));
  });
});
