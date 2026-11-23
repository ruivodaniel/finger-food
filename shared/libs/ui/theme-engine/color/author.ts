// Authoring aid: generates a theme's 50 content colours from a criterion. Every hue starts from its canonical colour
// (the Radix step-9 swatch, so a red is a red and a yellow is a yellow); the theme only decides how far it goes:
//   standard  chroma × a factor, lightness shifted by dL
//   soft      from the standard: lightness lifted toward white by `lift`, chroma × `chroma` (so soft is always closer to the background)
// The output is pasted into the theme as literals; after that the literals are the source and can be tuned by hand.
import { oklchToRgb, parseColor, rgbToOklch, toHex } from './oklch';
import { RADIX_HUES, type RadixHue, type ContentHue } from '../../types/color-system';

export const CANON: Record<RadixHue, string> = {
  tomato: '#E54D2E', red: '#E5484D', ruby: '#E54666', crimson: '#E93D82',
  pink: '#D6409F', plum: '#AB4ABA',
  purple: '#8E4EC6', violet: '#6E56CF', iris: '#5B5BD6',
  indigo: '#3E63DD', blue: '#0090FF', sky: '#7CE2FE',
  cyan: '#00A2C7', teal: '#12A594',
  jade: '#29A383', green: '#30A46C', grass: '#46A758', mint: '#86EAD4', lime: '#BDEE63',
  yellow: '#FFE629', amber: '#FFC53D',
  orange: '#F76B15',
  brown: '#AD7F58', bronze: '#A18072', gold: '#978365',
};

export type Criterion = {
  standard: { chroma: number; dL: number };
  soft: { lift: number; chroma: number };
};

export function authorContent(criterion: Criterion): Record<RadixHue, ContentHue> {
  return Object.fromEntries(RADIX_HUES.map((h) => {
    const o = rgbToOklch(parseColor(CANON[h])!);
    const std = { l: Math.min(0.97, Math.max(0.15, o.l + criterion.standard.dL)), c: o.c * criterion.standard.chroma, h: o.h };
    const standard = oklchToRgb(std);
    const stdFinal = rgbToOklch(standard);          // after the gamut clamp
    const soft = oklchToRgb({ l: stdFinal.l + (1 - stdFinal.l) * criterion.soft.lift, c: stdFinal.c * criterion.soft.chroma, h: o.h });
    return [h, { standard: toHex(standard), soft: toHex(soft) }];
  })) as Record<RadixHue, ContentHue>;
}

export const toSource = (content: Record<RadixHue, ContentHue>, indent = '      ') =>
  RADIX_HUES.map((h) => `${indent}${h}: { standard: "${(content[h].standard as string).toUpperCase()}", soft: "${(content[h].soft as string).toUpperCase()}" },`).join('\n');
