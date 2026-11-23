// ============================================================
// THEME PROCESS — L1 Primitives + L1b Modes & Derivations
// ============================================================

import type { WebTheme as Theme } from '../../../types';   // this engine emits CSS: it processes web themes
import { resolveColorRef, resolveGradient, gradientAverageColor, gradientStops, TRANSPARENT_GRADIENTS } from './emit';
import { resolveColorSystem } from '../../color/resolve';
import { parseColor, rgbToOklch } from '../../color/oklch';
import { smartPivot } from '../../color/derive';
import { camelToKebab, flattenToCssVars, typographyClamp } from './process-utils';
import type { CssVarValue } from './process-utils';

// ============================================================
// L1 — PRIMITIVES
// ============================================================

export function processColors(colors: Theme['colors']): Record<string, CssVarValue> {
  const main = flattenToCssVars(colors.main, 'color-main');
  const brand = flattenToCssVars(colors.brand, 'color-brand');
  const status: Record<string, CssVarValue> = {};
  for (const [key, value] of Object.entries(colors.status)) status[`color-status-${key}`] = resolveColorRef(String(value));
  const semantic: Record<string, CssVarValue> = {};
  for (const [key, value] of Object.entries(colors.semanticTokens)) semantic[key] = resolveColorRef(String(value));
  return { ...main, ...brand, ...status, ...semantic };
}

export function processTypography(theme: Theme): Record<string, CssVarValue> {
  const { fonts, types } = theme.typography;
  const vars: Record<string, CssVarValue> = {
    'typography-font-family-primary': fonts.primary,
    'typography-font-family-secondary': fonts.secondary,
    'typography-font-family-quote': fonts.quote,
    'typography-font-family-mono-primary': fonts.monoPrimary,
    'typography-font-family-mono-secondary': fonts.monoSecondary,
  };
  for (const [key, level] of Object.entries(types)) {
    const p = `typography-${key}`;
    vars[`${p}-font-family`] = `var(--typography-font-family-${camelToKebab(level.fontFamily)})`;
    vars[`${p}-font-style`] = level.fontStyle;
    vars[`${p}-font-size`] = typographyClamp(level.fontSizeMobile, level.fontSizeDesktop);
    vars[`${p}-font-weight`] = String(level.fontWeight);
    vars[`${p}-line-height`] = String(level.lineHeight);
    if (level.letterSpacing) vars[`${p}-letter-spacing`] = level.letterSpacing;
  }
  return vars;
}

export function generateTypographyElementRules(theme: Theme): string[] {
  const { types } = theme.typography;
  const rules: string[] = [];
  for (const key of Object.keys(types)) {
    const kebab = camelToKebab(key);
    const p = `typography-${key}`;
    const sel = `[element="type--${kebab}"]`;
    rules.push(
      `${sel} {\n` +
      `  font-family: var(--${p}-font-family);\n` +
      `  font-size: var(--${p}-font-size);\n` +
      `  font-weight: var(--${p}-font-weight);\n` +
      `  line-height: var(--${p}-line-height);\n` +
      `  font-style: var(--${p}-font-style);\n` +
      `}`,
    );
  }
  return rules;
}

// 9 SCALE steps + 'none'. 'xxs' / 'xxl' are deprecated aliases emitted alongside
// so the app's theme-editor keeps compiling until it is migrated.
export function processSpacing(spacing: Theme['spacing']): Record<string, CssVarValue> {
  const u = spacing.unit;
  const value = (mul: number) => `${u * mul}rem`;
  const scale = {
    '3xs': value(0.0625), '2xs': value(0.125),
    xs: value(0.25),      sm: value(0.5),
    md: value(1),         lg: value(1.5),
    xl: value(2),         '2xl': value(3), '3xl': value(4),
  };
  return {
    'spacing-unit': `${u}rem`,
    'spacing-none': '0',
    'spacing-3xs': scale['3xs'], 'spacing-2xs': scale['2xs'],
    'spacing-xs':  scale.xs,     'spacing-sm':  scale.sm,
    'spacing-md':  scale.md,     'spacing-lg':  scale.lg,
    'spacing-xl':  scale.xl,     'spacing-2xl': scale['2xl'], 'spacing-3xl': scale['3xl'],
    // deprecated aliases → same values as their SCALE names
    'spacing-xxs': scale['2xs'], 'spacing-xxl': scale['2xl'],
  };
}

export function processRadius(radius: Theme['radius']): Record<string, CssVarValue> {
  const vars: Record<string, CssVarValue> = {};
  for (const [key, value] of Object.entries(radius)) vars[`radius-${key}`] = value;
  return vars;
}

export function processEffects(theme: Theme): Record<string, CssVarValue> {
  const vars: Record<string, CssVarValue> = {};
  for (const [name, layers] of Object.entries(theme.effects)) {
    if (!layers || layers.length === 0) { vars[`shadow-${name}`] = 'none'; continue; }
    const shadowLayers = layers.filter((l: { type: string }) => l.type === 'drop-shadow' || l.type === 'inner-shadow');
    vars[`shadow-${name}`] = shadowLayers.length > 0
      ? shadowLayers.map((l: Record<string, unknown>) => {
          const inset = l.type === 'inner-shadow' ? 'inset ' : '';
          const resolved = resolveColorRef(String(l.color));
          const color = l.opacity != null ? `color-mix(in srgb, ${resolved} ${Math.round(Number(l.opacity) * 100)}%, transparent)` : resolved;
          return `${inset}${l.x}px ${l.y}px ${l.blur}px ${(l.spread as number) ?? 0}px ${color}`;
        }).join(', ')
      : 'none';
  }
  return vars;
}

export function processTransitions(tr: Theme['transitions']): Record<string, CssVarValue> {
  return {
    'transition-duration-extra-fast': tr.duration.extraFast,
    'transition-duration-fast': tr.duration.fast,
    'transition-duration-average': tr.duration.average,
    'transition-duration-slow': tr.duration.slow,
    'transition-duration-extra-slow': tr.duration.extraSlow,
    'transition-timing-ease': tr.timing.ease,
    'transition-timing-ease-in': tr.timing.easeIn,
    'transition-timing-ease-out': tr.timing.easeOut,
    'transition-timing-ease-in-out': tr.timing.easeInOut,
    'transition-timing-linear': tr.timing.linear,
  };
}

export function processBorderWidths(bw: Theme['borderWidths']): Record<string, CssVarValue> {
  const vars: Record<string, CssVarValue> = {};
  for (const [key, value] of Object.entries(bw)) vars[`border-width-${camelToKebab(key)}`] = value;
  return vars;
}

export function processIcons(icons: Theme['icons']): Record<string, CssVarValue> {
  if (!icons) return {};
  // icon-set is config (library name), not a CSS token — not emitted
  const vars: Record<string, CssVarValue> = { 'icon-weight': String(icons.weight) };
  for (const [size, value] of Object.entries(icons.sizes)) vars[`icon-size-${size}`] = `${value}px`;
  return vars;
}

// ============================================================
// L1b — MODES + DERIVATIONS
// ============================================================

const GRAY_STEPS: [string, number][] = [
  ['50', 2], ['100', 5], ['150', 7], ['200', 10], ['250', 14], ['300', 18], ['400', 35],
  ['500', 50], ['600', 65], ['700', 76], ['800', 86], ['900', 93], ['950', 96],
];

const GRAY_PURE_HEX: Record<string, string> = {
  '50': '#FAFAFA', '100': '#F2F2F2', '150': '#ECECEC', '200': '#E6E6E6',
  '250': '#DBDBDB', '300': '#D1D1D1', '400': '#A3A3A3', '500': '#737373',
  '600': '#545454', '700': '#3D3D3D', '800': '#242424', '900': '#121212', '950': '#0A0A0A',
};

export function resolveAnchorToHex(anchor: string, colors: Theme['colors']): string {
  if (anchor.startsWith('#')) return anchor;
  if (anchor.startsWith('gray-pure-')) return GRAY_PURE_HEX[anchor.slice(10)] ?? '#000000';
  if (anchor.startsWith('main-')) return (colors.main as Record<string, string>)[anchor.slice(5)] ?? '#000000';
  if (anchor.startsWith('brand-')) return colors.brand[anchor.slice(6) as keyof typeof colors.brand] ?? '#000000';
  const content = /^content-([a-z]+)-(standard|soft)$/.exec(anchor);
  if (content) { const v = (colors.content as Record<string, Record<string, unknown>>)[content[1]]?.[content[2]]; const src = typeof v === 'string' ? v : (v as { value?: string } | undefined)?.value; return src ? resolveAnchorToHex(src, colors) : '#000000'; }
  if (anchor.startsWith('status-')) {
    const ref = String(colors.status[anchor.slice(7) as keyof typeof colors.status]);
    return resolveAnchorToHex(ref, colors);
  }
  return '#000000';
}

export function processModeVars(mode: string, preset: { background: string; foreground: string; derivation: Record<string, unknown>; smartBias?: number }, colors: Theme['colors']): Record<string, CssVarValue> {
  const vars: Record<string, CssVarValue> = {};
  const bg = resolveAnchorToHex(String(preset.background), colors);
  const fg = resolveAnchorToHex(String(preset.foreground), colors);

  vars['background'] = bg;
  vars['foreground'] = fg;
  // the two anchors as OKLCH numbers, for smart-fb
  const oa = rgbToOklch(parseColor(bg) ?? { r: 255, g: 255, b: 255 }), ob = rgbToOklch(parseColor(fg) ?? { r: 0, g: 0, b: 0 });
  const [light, dark] = oa.l >= ob.l ? [oa, ob] : [ob, oa];
  for (const [k, v] of [['light', light], ['dark', dark]] as const) { vars[`smart-${k}-l`] = v.l.toFixed(4); vars[`smart-${k}-c`] = v.c.toFixed(4); vars[`smart-${k}-h`] = v.h.toFixed(1); }
  vars['smart-mid-l'] = smartPivot(light.l, dark.l, preset.smartBias).toFixed(4);   // where text in either anchor reads equally well

  for (const [step, pct] of GRAY_STEPS) vars[`color-gray-${step}`] = `color-mix(in srgb, ${fg} ${pct}%, ${bg})`;
  for (const [step, hex] of Object.entries(GRAY_PURE_HEX)) vars[`color-gray-pure-${step}`] = hex;

  const d = preset.derivation;
  const brandTint = parseInt(String(d.grayColorMixPercentage)) || 10;
  for (const brand of Object.keys(colors.brand)) {
    for (const [step] of GRAY_STEPS) vars[`color-brand-${brand}-gray-${step}`] = `color-mix(in srgb, var(--color-brand-${brand}) ${brandTint}%, var(--color-gray-${step}))`;
  }

  vars['colors-gray-color-mix-percentage'] = String(d.grayColorMixPercentage);
  vars['mode-active-color-mode'] = mode;

  return vars;
}

// ============================================================
// GRADIENTS
// ============================================================

export function processGradients(theme: Theme): Record<string, CssVarValue> {
  if (!theme.gradients) return {};
  const vars: Record<string, CssVarValue> = {};
  TRANSPARENT_GRADIENTS.clear();
  for (const [name, def] of Object.entries(theme.gradients)) {
    if (gradientStops(def).some((c) => /transparent/.test(c))) TRANSPARENT_GRADIENTS.add(name);
    vars[`gradient-${name}`] = resolveGradient(def);
    const avg = gradientAverageColor(def); if (avg) vars[`gradient-${name}-color`] = avg;
    if (avg && !gradientStops(def).some((c) => /transparent/.test(c))) vars[`gradient-${name}-surface`] = avg;   // what a gradient-filled surface tells its children; a gradient with a transparent stop tells nothing   // the gradient's average colour: what a fill's smart-fb reads
  }
  return vars;
}

// ============================================================
// PROPERTY APPLICATION (composition plumbing)
// ============================================================

export function generatePropertyApplication(): string {
  return `/* Reset composition vars at UI node boundaries */
[element], [layout], [data-part] {
  --bg: initial;
  --fg: initial;
  --tint: initial;
  --tint-state: initial;
  --bg-alpha: initial;
  --bg-gradient: initial;
  --border-color: initial;
  /* the parent's geometry, published to direct children only (smart bleed): never inherited further down */
  --parent-pad-x: initial;
  --parent-pad-y: initial;
  --parent-radius-tl: initial;
  --parent-radius-tr: initial;
  --parent-radius-br: initial;
  --parent-radius-bl: initial;
  --parent-border-width: initial;
  --parent-gap: initial;
}

/* Composition formula — scoped to UI nodes and the document body, never bleeds into children */
body, [element], [layout], [data-part] {
  /* the fill at its alpha; the tint of the element (a status) washes it at 20%, then the tint of a state washes that at 20%: the washes are not scaled by the alpha */
  --fill: color-mix(in srgb, var(--bg, transparent) var(--bg-alpha, 100%), transparent);
  --fill-tinted: color-mix(in srgb, var(--tint, var(--fill)) 20%, var(--fill));
  --line: var(--border-color, transparent);
  --line-tinted: color-mix(in srgb, var(--tint, var(--line)) 30%, var(--line));
  background: var(--bg-gradient, color-mix(in srgb, var(--tint-state, var(--fill-tinted)) 20%, var(--fill-tinted)));
  color: var(--fg, inherit);
  border-color: color-mix(in srgb, var(--tint-state, var(--line-tinted)) 30%, var(--line-tinted));
  transition-property: background, border-color, box-shadow, opacity, color, outline-color;
}`;
}

// ============================================================
// L1b — CONTENT COLOURS (the new colour system; see theme-engine/README.md)
// One resolver for every platform; the web only emits. A theme with no `content` emits nothing here.
// ============================================================

/** `color-content-<hue>-<tone>` and `color-custom-<name>` per mode, plus the mode's chroma curve. */
export function processContentVars(theme: Theme): Record<string, Record<string, CssVarValue>> {
  const content = theme.colors.content;
  if (!content) return {};
  const scheme = theme.modes.colorScheme;
  const hex = (v: string) => resolveAnchorToHex(String(v), theme.colors);
  const modes = Object.fromEntries(Object.entries(scheme).map(([m, p]) => [m, { background: hex(String(p.background)), foreground: hex(String(p.foreground)), chroma: p.chroma, contrastRatio: p.contrastRatio }]));
  const status = Object.fromEntries(Object.entries(theme.colors.status).map(([k, v]) => [k, hex(String(v))]));
  const roles = Object.fromEntries(Object.entries(theme.colors.semanticTokens).map(([k, v]) => [k, String(v)]));
  const resolved = resolveColorSystem({ main: theme.colors.main, brand: theme.colors.brand, status, content, roles, custom: theme.colors.custom } as never, modes);
  const first = Object.keys(scheme)[0];
  const out: Record<string, Record<string, CssVarValue>> = {};
  for (const [mode, tokens] of Object.entries(resolved)) {
    const vars: Record<string, CssVarValue> = {};
    for (const [name, value] of Object.entries(tokens)) if (name.startsWith('content-') || name.startsWith('custom-')) vars[`color-${name}`] = value;
    // status and the roles are derived in every mode but the reference (its values are the authored ones, already emitted); brand is never derived
    if (mode !== first) for (const [name, value] of Object.entries(tokens)) { if (name.startsWith('status-')) vars[`color-${name}`] = value; else if (name.startsWith('role-')) vars[name.slice(5)] = value; }
    const curve = scheme[mode]?.chroma;
    vars['colors-chroma-saturation-factor'] = String(curve?.saturationFactor ?? 1);
    vars['colors-chroma-gamma'] = String(curve?.gamma ?? 1);
    out[mode] = vars;
  }
  return out;
}
