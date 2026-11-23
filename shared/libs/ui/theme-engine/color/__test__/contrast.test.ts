import { describe, it, expect } from 'vitest';
import { adjustForeground } from '../../web/contrast';
import { parseColor, rgbToOklch } from '../oklch';

const L = (hex: string) => rgbToOklch(parseColor(hex)!).l;

describe('adjustForeground', () => {
  it('leaves a foreground that already has the gap', () => {
    const fg = parseColor('#1a1823')!;
    expect(adjustForeground(fg, parseColor('#ffffff')!, 0.4, 0.1, 1)).toBe(fg);
  });
  it('moves a too-close foreground away from the background, hue kept', () => {
    const out = adjustForeground(parseColor('#c99b2a')!, parseColor('#faf9fc')!, 0.45, 0.1, 0.99);
    const l = rgbToOklch(out);
    expect(L('#faf9fc') - l.l).toBeGreaterThanOrEqual(0.44);
    expect(Math.abs(l.h - rgbToOklch(parseColor('#c99b2a')!).h)).toBeLessThan(6);
  });
  it('never goes past the mode range', () => {
    const out = adjustForeground(parseColor('#c99b2a')!, parseColor('#faf9fc')!, 0.9, 0.5, 0.99);
    expect(rgbToOklch(out).l).toBeGreaterThanOrEqual(0.49);
  });
  it('goes lighter on a dark background', () => {
    const out = adjustForeground(parseColor('#3a3a4a')!, parseColor('#1a1823')!, 0.4, 0.05, 0.98);
    expect(rgbToOklch(out).l - L('#1a1823')).toBeGreaterThanOrEqual(0.39);
  });
});
