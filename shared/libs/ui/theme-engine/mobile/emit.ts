// ============================================================
// EMIT — a mobile theme, turned into the native theme
// ============================================================
//
// The same reading of the theme the web engine does (web/theme-engine), with a
// different result: where the web engine writes a CSS rule and its selector,
// this one writes a fragment and what the selector would have matched on.
//
// The cascade is reproduced, not reinvented. Each fragment carries the
// specificity its CSS rule has on the web and the position it is emitted at;
// sorted by the two, a list of fragments applies in the order a browser would.
//
//   family base            [element^="control--"]                    1
//   family, combined       …[emphasis="primary"]:hover               1 + one per condition
//   family, per scale      …:where([scale="sm"])                     1
//   element base           [element="control--button"]               1
//   element, combined      …[status="error"]                         1 + one per condition
//   element, per scale     …[scale="sm"]                             2
//
// Emitted: L1 primitives, the modes, L2 families, L3 elements, the layout regions.
// Not emitted yet: L4 concepts, L5 contextual, L6 rules — they need the ancestry
// of a component at run time. A theme that authors them is told so (`unsupported`).

import { resolveColorSystem } from '../color/resolve';
import type { MobileTheme } from '../../types';
import { ELEMENTS, FAMILY_KEY } from '../../types/elements';
import { formatColor, mix, parseColor, type Rgba } from './colors';
import type {
  ElementExtras, Fragment, FragmentWhen, NativeElement, NativeMode, NativeRegion, NativeTheme, NativeTypographyLevel,
} from './output';

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | undefined => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : undefined);

// ── Units ───────────────────────────────────────────────────
// The theme writes CSS lengths; React Native wants numbers (density-independent pixels).

const ROOT_FONT_SIZE = 16;   // 1rem on the web

/** "56px" → 56 · "1.5rem" → 24 · "100%" and "auto" stay as they are */
function length(value: unknown): number | string {
  if (typeof value === 'number') return value;
  const s = String(value).trim();
  if (/^-?[\d.]+px$/.test(s)) return parseFloat(s);
  if (/^-?[\d.]+rem$/.test(s)) return parseFloat(s) * ROOT_FONT_SIZE;
  if (/^-?[\d.]+$/.test(s)) return parseFloat(s);
  if (/^-?[\d.]+ms$/.test(s)) return parseFloat(s);
  return s;
}
const round = (n: number) => Math.round(n * 100) / 100;

// ── L1 — primitives ─────────────────────────────────────────

const SPACING_STEPS: Record<string, number> = {
  none: 0, '3xs': 0.0625, '2xs': 0.125, xs: 0.25, sm: 0.5, md: 1, lg: 1.5, xl: 2, '2xl': 3, '3xl': 4,
  xxs: 0.125, xxl: 3,   // the web's deprecated aliases
};
function spacingScale(theme: MobileTheme): Record<string, number> {
  const unit = theme.spacing.unit * ROOT_FONT_SIZE;
  return Object.fromEntries(Object.entries(SPACING_STEPS).map(([k, mul]) => [k, round(unit * mul)]));
}

function radiusScale(theme: MobileTheme): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(theme.radius)) { const n = length(v); if (typeof n === 'number') out[k] = n; }
  out.none = 0; out.full = 9999;   // as the web resolves them, whatever the theme writes
  return out;
}

function borderWidthScale(theme: MobileTheme): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(theme.borderWidths)) { const n = length(v); if (typeof n === 'number') out[k] = n; }
  out.none = 0;
  return out;
}

function typographyTypes(theme: MobileTheme): Record<string, NativeTypographyLevel> {
  const { fonts, types } = theme.typography;
  const out: Record<string, NativeTypographyLevel> = {};
  for (const [key, level] of Object.entries(types)) {
    const fontSize = level.fontSizeMobile;
    const ls = level.letterSpacing;
    out[key] = {
      fontFamily: fonts[level.fontFamily],
      fontSize,
      fontWeight: String(level.fontWeight),
      lineHeight: round(fontSize * level.lineHeight),   // the theme's is a multiplier; React Native's is absolute
      fontStyle: level.fontStyle,
      // the web resets letter-spacing to normal when a level has none: so does this
      letterSpacing: ls == null ? 0 : /em$/.test(ls) ? round(parseFloat(ls) * fontSize) : Number(length(ls)) || 0,
    };
  }
  return out;
}

// ── L1b — the modes: every colour the theme can name, resolved ──

const GRAY_STEPS: [string, number][] = [
  ['50', 2], ['100', 5], ['150', 7], ['200', 10], ['250', 14], ['300', 18], ['400', 35],
  ['500', 50], ['600', 65], ['700', 76], ['800', 86], ['900', 93], ['950', 96],
];
const GRAY_PURE_HEX: Record<string, string> = {
  '50': '#FAFAFA', '100': '#F2F2F2', '150': '#ECECEC', '200': '#E6E6E6',
  '250': '#DBDBDB', '300': '#D1D1D1', '400': '#A3A3A3', '500': '#737373',
  '600': '#545454', '700': '#3D3D3D', '800': '#242424', '900': '#121212', '950': '#0A0A0A',
};
const BLACK: Rgba = { r: 0, g: 0, b: 0, a: 1 };

/** a colour reference as a literal, in the reference mode: what the shared resolver takes as an anchor or a status */
function literalOf(theme: MobileTheme, ref: string, depth = 0): string {
  if (parseColor(ref) || depth > 5) return ref;
  const col = theme.colors as unknown as Record<string, Record<string, Record<string, unknown> | string>>;
  const m = /^(main|brand)-(.+)$/.exec(ref); if (m) return String(col[m[1]]?.[m[2]] ?? '#000000');
  const c = /^content-([a-z]+)-(standard|soft)$/.exec(ref);
  if (c) { const v = (col.content?.[c[1]] as Record<string, unknown> | undefined)?.[c[2]]; return literalOf(theme, typeof v === 'string' ? v : String((v as { value?: string } | undefined)?.value ?? '#000000'), depth + 1); }
  if (ref.startsWith('gray-pure-')) return GRAY_PURE_HEX[ref.slice(10)] ?? '#000000';
  const st = /^status-(.+)$/.exec(ref); if (st) return literalOf(theme, String(col.status?.[st[1]] ?? '#000000'), depth + 1);
  return ref;
}
/** the content colours of every mode, from the shared resolver (theme-engine/color) */
function contentOf(theme: MobileTheme): Record<string, Record<string, string>> {
  const scheme = theme.modes.colorScheme as unknown as Record<string, { background: string; foreground: string; chroma?: { saturationFactor: number; gamma: number } }>;
  const modes = Object.fromEntries(Object.entries(scheme).map(([m, p]) => [m, { background: literalOf(theme, String(p.background)), foreground: literalOf(theme, String(p.foreground)), chroma: p.chroma }]));
  const status = Object.fromEntries(Object.entries(theme.colors.status).map(([k, v]) => [k, literalOf(theme, String(v))]));
  const all = resolveColorSystem({ main: theme.colors.main, brand: theme.colors.brand, status, content: theme.colors.content, custom: theme.colors.custom } as never, modes);
  return Object.fromEntries(Object.entries(all).map(([m, t]) => [m, Object.fromEntries(Object.entries(t).filter(([k]) => k.startsWith('content-') || k.startsWith('custom-')))]));
}

function buildMode(theme: MobileTheme, preset: { background: string; foreground: string; derivation: Obj }, content: Record<string, string>): NativeMode {
  const colors = theme.colors;
  const c: Record<string, Rgba> = {};
  const put = (key: string, value: Rgba | null | undefined) => { if (value) c[key] = value; };

  for (const [k, v] of Object.entries(colors.main)) put(`main-${k}`, parseColor(v));
  for (const [k, v] of Object.entries(colors.brand)) put(`brand-${k}`, parseColor(String(v)));
  // the content colours, resolved by the shared engine (the same semantics as the web)
  for (const [k, v] of Object.entries(content)) put(k, parseColor(v));
  for (const [k, hex] of Object.entries(GRAY_PURE_HEX)) put(`gray-pure-${k}`, parseColor(hex));

  const anchor = (ref: string): Rgba => parseColor(ref) ?? c[ref] ?? BLACK;
  // a status colour may name a primitive ("status-info" = "content-blue-standard"); resolved once the primitives are in
  for (const [k, v] of Object.entries(colors.status)) put(`status-${k}`, anchor(String(v)));

  const bg = anchor(String(preset.background));
  const fg = anchor(String(preset.foreground));
  c.background = bg; c.foreground = fg;

  for (const [step, pct] of GRAY_STEPS) c[`gray-${step}`] = mix(fg, pct / 100, bg);

  const d = preset.derivation;
  const brandTint = (parseInt(String(d.grayColorMixPercentage)) || 10) / 100;
  for (const brand of Object.keys(colors.brand)) {
    const b = c[`brand-${brand}`]; if (!b) continue;
    for (const [step] of GRAY_STEPS) c[`brand-${brand}-gray-${step}`] = mix(b, brandTint, c[`gray-${step}`]);
  }
  // the semantic names, last: they point at anything above
  for (const [k, v] of Object.entries(colors.semanticTokens)) put(k, anchor(String(v)));

  const palette = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, formatColor(v)]));

  const shadows: Record<string, string> = { none: 'none' };
  for (const [name, layers] of Object.entries(theme.effects)) {
    const parts = (layers ?? [])
      .filter((l) => l.type === 'drop-shadow' || l.type === 'inner-shadow')
      .map((l) => {
        const layer = l as unknown as { type: string; x: number; y: number; blur: number; spread?: number; color: string; opacity?: number };
        const base = anchor(String(layer.color));
        const color = layer.opacity != null ? mix(base, layer.opacity, { r: 0, g: 0, b: 0, a: 0 }) : base;
        return `${layer.type === 'inner-shadow' ? 'inset ' : ''}${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread ?? 0}px ${formatColor(color)}`;
      });
    shadows[name] = parts.length ? parts.join(', ') : 'none';
  }
  return { palette, shadows };
}

// ── A surface → a fragment ──────────────────────────────────

type Ctx = {
  spacing: Record<string, number>;
  radius: Record<string, number>;
  borderWidths: Record<string, number>;
  types: Record<string, NativeTypographyLevel>;
  icons: Record<string, number>;
  unsupported: Set<string>;
};

const ALIGN: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch', baseline: 'baseline' };
const TEXT_ALIGN: Record<string, string> = { start: 'left', center: 'center', end: 'right', left: 'left', right: 'right', justify: 'justify' };
const SIDES = ['Top', 'Right', 'Bottom', 'Left'] as const;

/** One surface's tokens as a fragment. Mirrors web emitSurface: boundary, interior, dimension, typography, tint.
 *  Lengths that the web writes as a shorthand are written per side, so a later fragment overrides exactly what CSS would. */
function surfaceFragment(tokens: Obj, ctx: Ctx, path: string): Fragment {
  const f: Fragment = {};
  const vars: NonNullable<Fragment['vars']> = {};
  const view: NonNullable<Fragment['view']> = {};
  const viewColors: NonNullable<Fragment['viewColors']> = {};
  const text: NonNullable<Fragment['text']> = {};
  const no = (what: string) => ctx.unsupported.add(`${path}: ${what}`);
  const space = (v: unknown): number | string => (String(v) === 'auto' ? 'auto' : ctx.spacing[String(v)] ?? length(v));
  const width = (v: unknown): number => ctx.borderWidths[String(v)] ?? (Number(length(v)) || 0);
  const corner = (v: unknown): number => ctx.radius[String(v)] ?? (Number(length(v)) || 0);

  // boundary
  const b = obj(tokens.boundary);
  if (b) {
    const border = obj(b.border);
    if (border) {
      if (border.width != null) {
        const w = width(border.width);
        for (const s of SIDES) view[`border${s}Width`] = w;
        if (border.style == null) view.borderStyle = 'solid';
        if (border.color == null) vars.borderColor = 'gray-200';   // the web's default when a width is set
      }
      if (border.style != null) {
        if (String(border.style) === 'none') for (const s of SIDES) view[`border${s}Width`] = 0;
        else view.borderStyle = String(border.style);
      }
      if (border.color != null) vars.borderColor = String(border.color);
      for (const s of SIDES) {
        const side = obj(border[s.toLowerCase()]);
        if (!side) continue;
        if (side.width != null) view[`border${s}Width`] = width(side.width);
        if (side.color != null) viewColors[`border${s}Color`] = String(side.color);
        if (side.style != null && String(side.style) === 'none') view[`border${s}Width`] = 0;
      }
    }
    const radius = obj(b.radius);
    if (radius) {
      if (radius.all != null) for (const k of ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft']) view[`border${k}Radius`] = corner(radius.all);
      for (const k of ['topLeft', 'topRight', 'bottomRight', 'bottomLeft']) {
        if (radius[k] != null) view[`border${k[0].toUpperCase()}${k.slice(1)}Radius`] = corner(radius[k]);
      }
    }
    if (b.effect != null) {
      if (typeof b.effect === 'string') f.shadow = b.effect;
      else no('boundary.effect written inline (name it in theme.effects)');
    }
    const margin = obj(b.margin);
    if (margin) {
      if (margin.all != null) for (const s of SIDES) view[`margin${s}`] = space(margin.all);
      else {
        if (margin.x != null) { view.marginLeft = space(margin.x); view.marginRight = space(margin.x); }
        if (margin.y != null) { view.marginTop = space(margin.y); view.marginBottom = space(margin.y); }
        for (const s of SIDES) if (margin[s.toLowerCase()] != null) view[`margin${s}`] = space(margin[s.toLowerCase()]);
      }
    }
    if (b.outline != null) no('boundary.outline (web only)');
  }

  // interior
  const i = obj(tokens.interior);
  if (i) {
    if (i.background != null) {
      if (typeof i.background === 'object' || String(i.background).startsWith('gradient-')) no('interior.background as a gradient');
      else vars.bg = String(i.background);
    }
    if (i.backgroundAlpha != null) vars.bgAlpha = Number(i.backgroundAlpha);
    if (i.foreground != null) vars.fg = String(i.foreground);
    if (i.opacity != null) view.opacity = Number(i.opacity);
    const p = obj(i.padding);
    if (p) {
      if (p.all != null) for (const s of SIDES) view[`padding${s}`] = space(p.all);
      else {
        if (p.x != null) { view.paddingLeft = space(p.x); view.paddingRight = space(p.x); }
        if (p.y != null) { view.paddingTop = space(p.y); view.paddingBottom = space(p.y); }
        for (const s of SIDES) if (p[s.toLowerCase()] != null) view[`padding${s}`] = space(p[s.toLowerCase()]);
      }
    }
    const g = obj(i.gap);
    if (g) {
      if (g.all != null) { view.rowGap = space(g.all); view.columnGap = space(g.all); }
      if (g.h != null) view.columnGap = space(g.h);
      if (g.v != null) view.rowGap = space(g.v);
    }
    const ca = obj(i.childAlign);
    if (ca) {
      if (ca.horizontal != null) {
        view.justifyContent = ALIGN[String(ca.horizontal)] ?? String(ca.horizontal);
        if (TEXT_ALIGN[String(ca.horizontal)]) text.textAlign = TEXT_ALIGN[String(ca.horizontal)];
      }
      if (ca.vertical != null) view.alignItems = ALIGN[String(ca.vertical)] ?? String(ca.vertical);
    }
    if (i.scrollbar != null) no('interior.scrollbar (web only)');
  }

  // dimension and position
  const dp = obj(tokens.dimensionPosition);
  if (dp) {
    if (dp.width != null) view.width = length(dp.width);
    if (dp.height != null) view.height = length(dp.height);
    if (dp.translateX != null || dp.translateY != null) no('dimensionPosition.translate');
  }

  // typography
  const t = obj(tokens.defaultTypography);
  if (t) {
    if (t.typographyType != null) {
      const level = ctx.types[String(t.typographyType)];
      if (level) Object.assign(text, level);
      else no(`defaultTypography.typographyType "${String(t.typographyType)}" is not a type of this theme`);
    }
    if (t.textAlign != null) text.textAlign = TEXT_ALIGN[String(t.textAlign)] ?? String(t.textAlign);
    if (t.textTransform != null) text.textTransform = String(t.textTransform);
    if (t.textDecoration != null) text.textDecorationLine = String(t.textDecoration);
    if (t.verticalAlign != null) no('defaultTypography.verticalAlign');
    if (t.textEffect != null) no('defaultTypography.textEffect');
  }

  if (tokens.tint != null) vars.tint = String(typeof tokens.tint === 'object' ? (tokens.tint as { color: string }).color : tokens.tint);
  if (tokens.transition != null) no('transition (React Native has no CSS transitions; a component animates with theme.transitions)');
  if (tokens.smartBleed != null && tokens.smartBleed !== false) no('smartBleed');
  if (tokens.cursor != null) no('cursor (web only)');

  if (Object.keys(vars).length) f.vars = vars;
  if (Object.keys(view).length) f.view = view;
  if (Object.keys(viewColors).length) f.viewColors = viewColors;
  if (Object.keys(text).length) f.text = text;
  return f;
}

const isEmpty = (f: Fragment) => !f.vars && !f.view && !f.viewColors && !f.text && !f.shadow && !f.icon;

// ── The cascade, as ordered fragments ───────────────────────

type Ranked = Fragment & { spec: number; order: number };
type Emitter = { ctx: Ctx; next: () => number };

/** a surface with its `combined` entries: the base rule, then one rule per entry */
function surfaceRules(tokens: Obj, em: Emitter, path: string, baseSpec: number, baseWhen?: FragmentWhen): Ranked[] {
  const out: Ranked[] = [];
  const base = surfaceFragment(tokens, em.ctx, path);
  if (baseWhen) base.when = baseWhen;
  out.push({ ...base, spec: baseSpec, order: em.next() });   // kept even when empty: it holds the position of the rule

  const combined = tokens.combined as Array<{ where?: Obj; partialSurface?: Obj }> | undefined;
  for (const [n, entry] of (combined ?? []).entries()) {
    if (!entry?.where) continue;
    const f = entry.partialSurface ? surfaceFragment(entry.partialSurface, em.ctx, `${path}.combined[${n}]`) : {};
    if (isEmpty(f)) continue;
    const { state, status, emphasis, position } = entry.where as { state?: string; status?: string; emphasis?: string; position?: string };
    const when: FragmentWhen = { ...baseWhen };
    let conditions = 0;
    if (state) { when.state = state as FragmentWhen['state']; conditions++; }
    if (status) { when.status = status as FragmentWhen['status']; conditions++; }
    if (emphasis) { when.emphasis = emphasis as FragmentWhen['emphasis']; conditions++; }
    if (position) { when.position = position as FragmentWhen['position']; conditions += position === 'middle' ? 2 : 1; }
    if (!conditions) continue;
    out.push({ ...f, when, spec: baseSpec + conditions, order: em.next() });
  }
  return out;
}

/** the per-scale rules of a family (spec 1, as :where() keeps them) or of an element (spec 2) */
function sizeRules(sizes: unknown, em: Emitter, path: string, spec: number): Ranked[] {
  const out: Ranked[] = [];
  for (const [scale, entry] of Object.entries(obj(sizes) ?? {})) {
    const e = obj(entry); if (!e) continue;
    const f = obj(e.partialSurface) ? surfaceFragment(e.partialSurface as Obj, em.ctx, `${path}.sizes.${scale}`) : {};
    const icon = obj(e.icon);
    if (icon) {
      const size = icon.size != null && icon.size !== 'inherit' ? em.ctx.icons[String(icon.size)] : undefined;
      const weight = icon.weight != null ? Number(icon.weight) : undefined;
      if (size != null || weight != null) f.icon = { ...(size != null ? { size } : {}), ...(weight != null ? { weight } : {}) };
    }
    if (isEmpty(f)) continue;
    out.push({ ...f, when: { scale: scale as FragmentWhen['scale'] }, spec, order: em.next() });
  }
  return out;
}

type Emitted = { fragments: Ranked[]; parts: Record<string, Ranked[]>; extras: ElementExtras };

const familySurface = (familyKey: string, tokens: Obj): Obj | undefined =>
  familyKey === 'surfaceContainer' ? (obj(tokens.surface) ?? tokens) : obj(tokens.surface);

function extrasOf(familyKey: string, tokens: Obj, ctx: Ctx, path: string): ElementExtras {
  const x: ElementExtras = {};
  if (familyKey === 'field') {
    if (tokens.placeholderColor != null) x.placeholderColor = String(tokens.placeholderColor);
    if (tokens.placeholderOpacity != null) x.placeholderOpacity = Number(tokens.placeholderOpacity);
    if (tokens.caretColor != null) x.caretColor = String(tokens.caretColor);
    const o = obj(tokens.obfuscation);
    if (o?.character != null) x.obfuscationCharacter = String(o.character);
  }
  if (familyKey === 'elevatedOverlay') {
    const o = obj(tokens.overlay);
    if (o?.scrimColor != null) x.scrimColor = String(o.scrimColor);
    if (o?.scrimOpacity != null) x.scrimOpacity = Number(o.scrimOpacity);
    if (o?.scrimBlur != null && String(o.scrimBlur) !== 'none') ctx.unsupported.add(`${path}: overlay.scrimBlur`);
  }
  if (familyKey === 'media') {
    if (tokens.objectFit != null) x.objectFit = String(tokens.objectFit);
    if (tokens.aspectRatio != null) x.aspectRatio = String(tokens.aspectRatio);
    if (tokens.filter != null) ctx.unsupported.add(`${path}: media filter`);
    if (tokens.overlay != null) ctx.unsupported.add(`${path}: media overlay`);
  }
  return x;
}

/** every rule one family or one element authors, in the order the web engine emits them */
function emitTokens(familyKey: string, tokens: Obj, em: Emitter, path: string, level: 'family' | 'element'): Emitted {
  const out: Emitted = { fragments: [], parts: {}, extras: extrasOf(familyKey, tokens, em.ctx, path) };
  const part = (name: string, rules: Ranked[]) => { if (rules.length) (out.parts[name] ??= []).push(...rules); };

  // the switch is two surfaces: the track is the element, the thumb a part
  if (path.endsWith('elements.switch')) {
    if (obj(tokens.track)) out.fragments.push(...surfaceRules(tokens.track as Obj, em, `${path}.track`, 1));
    if (obj(tokens.thumb)) part('thumb', surfaceRules(tokens.thumb as Obj, em, `${path}.thumb`, 2));
    return out;
  }

  const surface = familySurface(familyKey, tokens);
  if (surface) out.fragments.push(...surfaceRules(surface, em, path, 1));

  if (familyKey === 'listContainer') {
    if (obj(tokens.row)) part('row', surfaceRules(tokens.row as Obj, em, `${path}.row`, 2));
    if (obj(tokens.cell)) part('cell', surfaceRules(tokens.cell as Obj, em, `${path}.cell`, 1));
    if (obj(tokens.alternating)) part('row', surfaceRules(tokens.alternating as Obj, em, `${path}.alternating`, 3, { position: 'even' }));
    const sep = obj(tokens.separator);
    if (sep) {
      if (obj(sep.surface)) part('separator', surfaceRules(sep.surface as Obj, em, `${path}.separator`, 2));
      if (sep.height != null) out.extras.separatorHeight = length(sep.height);
      if (sep.width != null) out.extras.separatorWidth = length(sep.width);
    }
  }

  out.fragments.push(...sizeRules(tokens.sizes, em, path, level === 'family' ? 1 : 2));

  for (const zone of ['startIcon', 'endIcon'] as const) {
    if (obj(tokens[zone])) part(zone, surfaceRules(tokens[zone] as Obj, em, `${path}.${zone}`, 2));
  }
  if (tokens.widthExpanded != null || tokens.widthCollapsed != null) em.ctx.unsupported.add(`${path}: widthExpanded / widthCollapsed`);
  return out;
}

const byCascade = (a: Ranked, b: Ranked) => a.spec - b.spec || a.order - b.order;
const strip = (rules: Ranked[]): Fragment[] =>
  rules.slice().sort(byCascade).filter((r) => !isEmpty(r)).map(({ spec: _s, order: _o, ...f }) => f);

// ── The theme ───────────────────────────────────────────────

export function emitNativeTheme(theme: MobileTheme): NativeTheme {
  const unsupported = new Set<string>();
  const ctx: Ctx = {
    spacing: spacingScale(theme),
    radius: radiusScale(theme),
    borderWidths: borderWidthScale(theme),
    types: typographyTypes(theme),
    icons: theme.icons?.sizes ?? {},
    unsupported,
  };
  let position = 0;
  const em: Emitter = { ctx, next: () => position++ };

  // L2 — families, in the theme's own order
  const families: Record<string, Emitted> = {};
  for (const [familyKey, tokens] of Object.entries(theme.families ?? {})) {
    if (tokens) families[familyKey] = emitTokens(familyKey, tokens as Obj, em, `families.${familyKey}`, 'family');
  }

  // L3 — elements, in the theme's own order (after every family, as on the web)
  const own: Record<string, Emitted> = {};
  for (const [key, tokens] of Object.entries(theme.elements ?? {})) {
    const row = (ELEMENTS as Record<string, { family: keyof typeof FAMILY_KEY; platform: readonly string[] }>)[key];
    if (!row || !tokens) continue;
    own[key] = emitTokens(FAMILY_KEY[row.family], tokens as Obj, em, `elements.${key}`, 'element');
  }

  // every element mobile has, whether the theme names it or not: its family's rules, then its own
  const elements: NativeTheme['elements'] = {};
  for (const [key, row] of Object.entries(ELEMENTS as Record<string, { family: keyof typeof FAMILY_KEY; platform: readonly string[] }>)) {
    if (!row.platform.includes('mobile')) continue;
    const familyKey = FAMILY_KEY[row.family];
    const fam = families[familyKey];
    const el = own[key];
    const parts: Record<string, Fragment[]> = {};
    for (const name of new Set([...Object.keys(fam?.parts ?? {}), ...Object.keys(el?.parts ?? {})])) {
      parts[name] = strip([...(fam?.parts[name] ?? []), ...(el?.parts[name] ?? [])]);
    }
    const extras = { ...fam?.extras, ...el?.extras };
    const element: NativeElement = { family: familyKey, fragments: strip([...(fam?.fragments ?? []), ...(el?.fragments ?? [])]) };
    if (Object.keys(parts).length) element.parts = parts;
    if (Object.keys(extras).length) element.extras = extras;
    (elements as Record<string, NativeElement>)[key] = element;
  }

  // the layout regions: the default surface of every region, then the region's own
  const layouts: Record<string, NativeRegion> = {};
  const L = (theme.layouts ?? {}) as Obj;
  for (const name of ['screen', 'appBar', 'body', 'actionBar', 'tabBar', 'drawer']) {
    const region = obj(L[name]) ?? {};
    const rules: Ranked[] = [];
    if (obj(L.surface)) rules.push(...surfaceRules(L.surface as Obj, em, 'layouts.surface', 1));
    if (obj(region.surface)) rules.push(...surfaceRules(region.surface as Obj, em, `layouts.${name}`, 1));
    const out: NativeRegion = { fragments: strip(rules) };
    if (region.height != null) out.height = length(region.height);
    if (region.width != null) out.width = length(region.width);
    for (const s of ['sm', 'md', 'lg'] as const) {
      const entry = obj(region[s]);
      if (entry?.height != null) (out.sizes ??= {})[s] = { height: length(entry.height) };
    }
    if (Array.isArray(region.safeArea)) out.safeArea = region.safeArea as NativeRegion['safeArea'];
    layouts[name] = out;
  }
  const scaleMap = <K extends string>(src: unknown, key: K) => {
    const o = obj(src); if (!o) return undefined;
    const out: Record<string, Record<K, number | string>> = {};
    for (const [k, v] of Object.entries(o)) { const e = obj(v); if (e?.[key] != null) out[k] = { [key]: length(e[key]) } as Record<K, number | string>; }
    return Object.keys(out).length ? out : undefined;
  };

  if (theme.concepts && Object.keys(theme.concepts).length) unsupported.add('concepts (L4): not emitted for mobile yet');
  if (theme.contextual && Object.keys(theme.contextual).length) unsupported.add('contextual (L5): not emitted for mobile yet');
  if (theme.rules?.length) unsupported.add('rules (L6): not emitted for mobile yet');
  if (theme.gradients && Object.keys(theme.gradients).length) unsupported.add('gradients: not emitted for mobile yet');

  const modes: Record<string, NativeMode> = {};
  const resolved = contentOf(theme);
  for (const [name, preset] of Object.entries(theme.modes.colorScheme)) {
    modes[name] = buildMode(theme, preset as unknown as { background: string; foreground: string; derivation: Obj }, resolved[name] ?? {});
  }

  const durations = Object.fromEntries(Object.entries(theme.transitions.duration).map(([k, v]) => [k, Number(length(v)) || 0]));

  return {
    id: theme.id,
    name: theme.name,
    version: theme.version,
    platform: 'mobile',
    modes,
    spacing: ctx.spacing,
    radius: ctx.radius,
    borderWidths: ctx.borderWidths,
    typography: { fonts: { ...theme.typography.fonts }, types: ctx.types },
    icons: theme.icons ? { set: theme.icons.set, sizes: { ...theme.icons.sizes }, weight: theme.icons.weight } : undefined,
    transitions: { duration: durations, timing: { ...theme.transitions.timing } },
    elements,
    layouts,
    dialog: scaleMap(L.dialog, 'maxWidth'),
    sheet: scaleMap(L.sheet, 'size'),
    press: {
      opacityDim: theme.press?.opacityDim ?? 1,
      ripple: { color: String(theme.press?.ripple?.color ?? 'gray-300'), borderless: theme.press?.ripple?.borderless ?? false },
    },
    unsupported: [...unsupported].sort(),
  };
}
