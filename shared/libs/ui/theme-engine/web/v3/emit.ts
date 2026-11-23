import { SCALE } from '../../../types/axes';
// ============================================================
// EMIT — Token-to-CSS emitters
// ============================================================
//
// Converts theme token objects into CSS declarations.
//
// Color composition uses CSS custom properties set and consumed
// on the same selector ([element], [layout], [data-part]).
// The consuming formula lives on those selectors via generatePropertyApplication().
// State overrides just change the vars — the formula re-evaluates automatically.
// Children (span, svg, etc.) are unaffected: they don't match [element].
//
// Vars emitted here:
//   --bg, --fg, --tint, --bg-alpha, --border-color  → composition vars
//   --scrollbar-*, --placeholder-*, --caret-color   → pseudo-element vars
//   --scrim-*, --obfuscation-*                      → family-specific vars
//

// ── Types ───────────────────────────────────────────────────

export type EmittedDeclarations = {
  vars: Record<string, string>;
  props: Record<string, string>;
};

// ── Utilities ───────────────────────────────────────────────

function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// ── Color Resolution ────────────────────────────────────────

const SEMANTIC_COLOR_TOKENS = new Set([
  'background', 'foreground',
  'primary', 'secondary', 'muted', 'accent',
]);

const GRAY_PURE_HEX: Record<string, string> = {
  '50': '#FAFAFA', '100': '#F2F2F2', '150': '#ECECEC', '200': '#E6E6E6',
  '250': '#DBDBDB', '300': '#D1D1D1', '400': '#A3A3A3', '500': '#737373',
  '600': '#545454', '700': '#3D3D3D', '800': '#242424', '900': '#121212',
  '950': '#0A0A0A',
};

function resolveGradientLayer(def: Record<string, unknown>): string {
  const stops = (def.stops as Array<{ color: string; position?: string }> | undefined) ?? [];
  const resolvedStops = stops.map(s => {
    const color = resolveColorRef(String(s.color));
    return s.position ? `${color} ${s.position}` : color;
  }).join(', ');

  if (def.type === 'linear') {
    const angle = def.angle ?? '180deg';
    const angleStr = typeof angle === 'number' ? `${angle}deg` : String(angle);
    return `linear-gradient(${angleStr}, ${resolvedStops})`;
  }
  if (def.type === 'radial') {
    const shape = def.shape ?? 'ellipse';
    const pos = def.position ? ` at ${def.position}` : '';
    return `radial-gradient(${shape}${pos}, ${resolvedStops})`;
  }
  if (def.type === 'conic') {
    const angle = def.angle != null ? `from ${def.angle}deg ` : '';
    const pos = def.position ? `at ${def.position} ` : '';
    return `conic-gradient(${angle}${pos}${resolvedStops})`;
  }
  return resolvedStops;
}

// Handles both a single GradientLayer and a stacked GradientLayer[].
// Stacked layers emit as comma-separated CSS background values.
export function resolveGradient(def: unknown): string {
  if (Array.isArray(def)) {
    return (def as Record<string, unknown>[]).map(resolveGradientLayer).join(', ');
  }
  return resolveGradientLayer(def as Record<string, unknown>);
}

/** the names of the theme's gradients that have a transparent stop: such a fill tells its children nothing (set by processGradients before the cascade is emitted) */
export const TRANSPARENT_GRADIENTS = new Set<string>();

/** the colours of a gradient's stops (the first layer's, when stacked) */
export function gradientStops(def: unknown): string[] {
  const layer = (Array.isArray(def) ? def[0] : def) as { stops?: Array<{ color?: string }> } | undefined;
  return (layer?.stops ?? []).map((s) => s.color).filter((c): c is string => !!c);
}
/** the average colour of a gradient (its average lightness among it): the stops mixed in equal parts, in oklab. What a fill's smart-fb reads. */
export function gradientAverageColor(def: unknown): string | null {
  const stops = gradientStops(def).map((c) => resolveColorRef(c));
  if (!stops.length) return null;
  let acc = stops[0];
  for (let i = 1; i < stops.length; i++) acc = `color-mix(in oklab, ${stops[i]} ${(100 / (i + 1)).toFixed(2)}%, ${acc})`;
  return acc;
}

/** a tint: a colour reference, or `{color, opacity}` written as the colour at that strength */
export function resolveTint(tint: unknown): string {
  if (tint && typeof tint === 'object') {
    const { color, opacity } = tint as { color: string; opacity?: number };
    const c = resolveColorRef(String(color));
    return opacity === undefined || opacity >= 1 ? c : `color-mix(in srgb, ${c} ${Math.round(opacity * 1000) / 10}%, transparent)`;
  }
  return resolveColorRef(String(tint));
}

export function resolveColorRef(value: string): string {
  if (value === 'transparent' || value === 'currentColor' || value === 'inherit') return value;
  // smart-fb: the mode's foreground or background, whichever contrasts more with the fill (--bg). The mode's two anchors are published as numbers (--smart-*, OKLCH),
  // so a fill lighter than their midpoint reads the darker anchor and any other fill reads the lighter one.
  if (value === 'smart-fb') {
    const s = 'clamp(0, (l - var(--smart-mid-l)) * 1000, 1)';
    // the fill is read over the nearest filled ancestor (--surface-bg), else the mode's background (a transparent fill reads as what is behind it), and the result is opaque
    return `oklch(from color-mix(in srgb, var(--bg) 99.99%, var(--surface-bg, var(--background))) calc(var(--smart-light-l) + (var(--smart-dark-l) - var(--smart-light-l)) * ${s}) calc(var(--smart-light-c) + (var(--smart-dark-c) - var(--smart-light-c)) * ${s}) calc(var(--smart-light-h) + (var(--smart-dark-h) - var(--smart-light-h)) * ${s}) / 1)`;
  }
  if (value === 'tint') return 'var(--tint)';
  if (value.startsWith('#') || value.startsWith('color-mix(') || value.startsWith('rgb') || value.startsWith('hsl') || value.startsWith('oklch') || value.startsWith('var(')) return value;
  if (value.startsWith('gray-pure-')) return GRAY_PURE_HEX[value.slice(10)] ?? '#000000';
  if (SEMANTIC_COLOR_TOKENS.has(value)) return `var(--${value})`;
  return `var(--color-${value})`;
}

// ── Token Resolution (spacing, radius, etc.) ────────────────

/** density is on for the theme being built: the gap and the heights are written to be scaled (set by themeToCSS) */
/** the breakpoints the theme names: a combined entry says `where: {breakpoint}` */
let BREAKPOINTS: Record<string, string> = {};
export const setBreakpoints = (b: Record<string, string> | undefined): void => { BREAKPOINTS = b ?? {}; };
export const breakpointWidth = (name: string): string | undefined => BREAKPOINTS[name];
let DENSITY_ON = false;
export const setDensityOn = (on: boolean): void => { DENSITY_ON = on; };
/** a static measure (a literal in px or rem) times the density of the element it stands on, when the theme has density; anything else (auto, a percentage, a var) as it is */
export const scaled = (kind: 'width' | 'height', value: unknown): string => {
  const v = String(value);
  return DENSITY_ON && /^[\d.]+(px|rem)$/.test(v) ? `calc(${v} * var(--density-${kind}, 1))` : v;
};

export function resolveTokenRef(value: string, type: 'spacing' | 'gap' | 'radius' | 'shadow' | 'border-width' | 'transition-duration' | 'transition-timing'): string {
  if (value === 'none') {
    if (type === 'shadow') return 'none';
    return '0';
  }
  if (type === 'spacing') return `var(--spacing-${value})`;
  if (type === 'gap') return DENSITY_ON ? `var(--gap-${value})` : `var(--spacing-${value})`;
  if (type === 'radius') {
    if (value === 'full') return '9999px';
    return `var(--radius-${value})`;
  }
  if (type === 'shadow') return `var(--shadow-${value})`;
  if (type === 'border-width') return `var(--border-width-${camelToKebab(value)})`;
  if (type === 'transition-duration') return `var(--transition-duration-${camelToKebab(value)})`;
  if (type === 'transition-timing') return `var(--transition-timing-${camelToKebab(value)})`;
  return value;
}

// ── Boundary ────────────────────────────────────────────────

export function emitBoundary(
  b: Record<string, unknown> | undefined,
  out: EmittedDeclarations,
): void {
  if (!b) return;

  const border = b.border as Record<string, unknown> | undefined;
  if (border) {
    if (border.width != null) {
      out.props['border-width'] = resolveTokenRef(String(border.width), 'border-width');
      if (border.style == null) out.props['border-style'] = 'solid';
      if (border.color == null) out.vars['border-color'] = 'var(--color-gray-200)';
    }
    if (border.style != null) out.props['border-style'] = String(border.style);
    if (border.color != null) out.vars['border-color'] = resolveColorRef(String(border.color));

    for (const side of ['top', 'right', 'bottom', 'left'] as const) {
      const s = border[side] as Record<string, unknown> | undefined;
      if (!s) continue;
      if (s.width != null) out.props[`border-${side}-width`] = resolveTokenRef(String(s.width), 'border-width');
      if (s.style != null) out.props[`border-${side}-style`] = String(s.style);
      if (s.color != null) out.props[`border-${side}-color`] = resolveColorRef(String(s.color));
    }
  }

  const radius = b.radius as Record<string, unknown> | undefined;
  if (radius) {
    if (radius.all != null) out.props['border-radius'] = resolveTokenRef(String(radius.all), 'radius');
    if (radius.topLeft != null) out.props['border-top-left-radius'] = resolveTokenRef(String(radius.topLeft), 'radius');
    if (radius.topRight != null) out.props['border-top-right-radius'] = resolveTokenRef(String(radius.topRight), 'radius');
    if (radius.bottomRight != null) out.props['border-bottom-right-radius'] = resolveTokenRef(String(radius.bottomRight), 'radius');
    if (radius.bottomLeft != null) out.props['border-bottom-left-radius'] = resolveTokenRef(String(radius.bottomLeft), 'radius');
  }

  const effectRef = b.effect;
  if (effectRef != null && typeof effectRef === 'string') {
    out.props['box-shadow'] = resolveTokenRef(effectRef, 'shadow');
  }

  const margin = b.margin as Record<string, unknown> | undefined;
  if (margin) {
    const resolveMarginValue = (v: unknown) =>
      String(v) === 'auto' ? 'auto' : resolveTokenRef(String(v), 'spacing');
    if (margin.all != null) {
      out.props['margin'] = resolveMarginValue(margin.all);
    } else {
      const mx = margin.x != null ? resolveMarginValue(margin.x) : undefined;
      const my = margin.y != null ? resolveMarginValue(margin.y) : undefined;
      if (mx != null && my != null) {
        out.props['margin'] = `${my} ${mx}`;
      } else {
        if (mx != null) { out.props['margin-left'] = mx; out.props['margin-right'] = mx; }
        if (my != null) { out.props['margin-top'] = my; out.props['margin-bottom'] = my; }
      }
      if (margin.top    != null) out.props['margin-top']    = resolveMarginValue(margin.top);
      if (margin.right  != null) out.props['margin-right']  = resolveMarginValue(margin.right);
      if (margin.bottom != null) out.props['margin-bottom'] = resolveMarginValue(margin.bottom);
      if (margin.left   != null) out.props['margin-left']   = resolveMarginValue(margin.left);
    }
  }

  const outline = b.outline as Record<string, unknown> | undefined;
  if (outline) {
    if (outline.width != null) out.props['outline-width'] = resolveTokenRef(String(outline.width), 'border-width');
    if (outline.style != null) out.props['outline-style'] = String(outline.style);
    if (outline.color != null) out.props['outline-color'] = resolveColorRef(String(outline.color));
    if (outline.offset != null) out.props['outline-offset'] = String(outline.offset);
  }
}

// ── Interior ────────────────────────────────────────────────

export function emitInterior(
  i: Record<string, unknown> | undefined,
  out: EmittedDeclarations,
): void {
  if (!i) return;

  // Colors → composition vars (consumed by formula on [element],[layout],[data-part])
  if (i.background != null) {
    if (typeof i.background === 'object') {
      out.vars['bg-gradient'] = resolveGradient(i.background);
      // a gradient fill also publishes its average colour as --bg, so what reads the fill (smart-fb) has one
      const avg = gradientAverageColor(i.background); if (avg) out.vars['bg'] = avg;
      out.vars['surface-bg'] = avg && !gradientStops(i.background).some((c) => /transparent/.test(c)) ? avg : 'inherit';
    } else if (String(i.background).startsWith('gradient-')) {
      out.vars['bg-gradient'] = `var(--${i.background})`;
      out.vars['bg'] = `var(--${i.background}-color)`;
      out.vars['surface-bg'] = TRANSPARENT_GRADIENTS.has(String(i.background).slice(9)) ? 'inherit' : `var(--${i.background}-surface)`;
    } else {
      out.vars['bg'] = resolveColorRef(String(i.background));
    }
    // a surface with a fill of its own tells what is inside it what that fill is (--surface-bg inherits): a transparent child reads the nearest filled ancestor, not the page
    // a transparent fill keeps what is behind it: it takes its parent's (a family rule that set the surface's fill earlier must not leak through)
    if (typeof i.background === 'string' && !String(i.background).startsWith('gradient-')) out.vars['surface-bg'] = i.background === 'transparent' ? 'inherit' : out.vars['bg'];
    // a rule that makes the fill transparent again gives back what an earlier rule published: the surface is whatever is behind it
    else if (i.background === 'transparent') out.vars['surface-bg'] = 'inherit';
  }
  if (i.backgroundAlpha != null) out.vars['bg-alpha'] = `${Math.round(Number(i.backgroundAlpha) * 100)}%`;
  if (i.foreground != null) out.vars['fg'] = resolveColorRef(String(i.foreground));

  // Opacity → plain CSS
  if (i.opacity != null) out.props['opacity'] = String(i.opacity);

  // Padding → plain CSS
  const p = i.padding as Record<string, unknown> | undefined;   // childrenSmartBleed and smartBleed live here too: the cascade reads them, not the padding
  if (p) {
    if (p.all != null) {
      out.props['padding'] = resolveTokenRef(String(p.all), 'spacing');
    } else {
      const px = p.x != null ? resolveTokenRef(String(p.x), 'spacing') : undefined;
      const py = p.y != null ? resolveTokenRef(String(p.y), 'spacing') : undefined;
      if (px != null && py != null) {
        out.props['padding'] = `${py} ${px}`;
      } else {
        if (px != null) { out.props['padding-left'] = px; out.props['padding-right'] = px; }
        if (py != null) { out.props['padding-top'] = py; out.props['padding-bottom'] = py; }
      }
      if (p.top != null) out.props['padding-top'] = resolveTokenRef(String(p.top), 'spacing');
      if (p.right != null) out.props['padding-right'] = resolveTokenRef(String(p.right), 'spacing');
      if (p.bottom != null) out.props['padding-bottom'] = resolveTokenRef(String(p.bottom), 'spacing');
      if (p.left != null) out.props['padding-left'] = resolveTokenRef(String(p.left), 'spacing');
    }
  }

  // Gap → plain CSS
  const g = i.gap as Record<string, unknown> | undefined;
  if (g) {
    if (g.all != null) out.props['gap'] = resolveTokenRef(String(g.all), 'gap');
    if (g.h != null) out.props['column-gap'] = resolveTokenRef(String(g.h), 'gap');
    if (g.v != null) out.props['row-gap'] = resolveTokenRef(String(g.v), 'gap');
  }

  // Scrollbar → CSS vars (used in ::-webkit-scrollbar pseudo-elements)
  const sb = i.scrollbar as Record<string, unknown> | undefined;
  if (sb) {
    if (sb.thumbColor != null) out.vars['scrollbar-thumb'] = resolveColorRef(String(sb.thumbColor));
    if (sb.trackColor != null) out.vars['scrollbar-track'] = resolveColorRef(String(sb.trackColor));
    if (sb.width != null) out.vars['scrollbar-width'] = String(sb.width);
  }

  // Child align → works for flex (justify-content / align-items) AND block text (text-align).
  // Inspired by the pr-layout pattern: same token, correct property per context.
  // horizontal → justify-content (flex-row main axis) + text-align (block)
  // vertical   → align-items (flex-row cross axis)
  // For flex-col containers the axes are swapped — handled by the component's flex-direction.
  const ca = i.childAlign as Record<string, unknown> | undefined;
  if (ca) {
    if (ca.horizontal != null) {
      const h = String(ca.horizontal);
      out.props['justify-content'] = h;
      out.props['text-align'] = h;
    }
    if (ca.vertical != null) {
      out.props['align-items'] = String(ca.vertical);
    }
  }
}

// ── Typography ──────────────────────────────────────────────

export function emitTypography(
  t: Record<string, unknown> | undefined,
  out: EmittedDeclarations,
): void {
  if (!t) return;
  if (t.typographyType != null) {
    const key = String(t.typographyType);
    out.props['font-family'] = `var(--typography-${key}-font-family)`;
    out.props['font-size'] = `var(--typography-${key}-font-size)`;
    out.props['font-weight'] = `var(--typography-${key}-font-weight)`;
    out.props['line-height'] = `var(--typography-${key}-line-height)`;
    out.props['font-style'] = `var(--typography-${key}-font-style, normal)`;
    out.props['letter-spacing'] = `var(--typography-${key}-letter-spacing, normal)`;
  }
  if (t.textAlign != null) out.props['text-align'] = String(t.textAlign);
  if (t.verticalAlign != null) out.props['vertical-align'] = String(t.verticalAlign);
  if (t.textTransform != null) out.props['text-transform'] = String(t.textTransform);
  if (t.textDecoration != null) out.props['text-decoration'] = String(t.textDecoration);

  const textEffects = t.textEffect as Array<Record<string, unknown>> | undefined;
  if (textEffects && textEffects.length > 0) {
    out.props['text-shadow'] = textEffects.map(te => {
      const resolved = resolveColorRef(String(te.color));
      const color = te.opacity != null
        ? `color-mix(in srgb, ${resolved} ${Math.round(Number(te.opacity) * 100)}%, transparent)`
        : resolved;
      return `${te.x}px ${te.y}px ${te.blur}px ${color}`;
    }).join(', ');
  }
}

// ── Transition ──────────────────────────────────────────────

export function emitTransition(
  tr: Record<string, unknown> | undefined,
  out: EmittedDeclarations,
): void {
  if (!tr) return;
  if (tr.property != null) out.props['transition-property'] = String(tr.property);
  if (tr.duration != null) out.props['transition-duration'] = resolveTokenRef(String(tr.duration), 'transition-duration');
  if (tr.timing != null) out.props['transition-timing-function'] = resolveTokenRef(String(tr.timing), 'transition-timing');
}

// ── Animation ───────────────────────────────────────────────

export function emitAnimation(
  an: Record<string, unknown> | undefined,
  out: EmittedDeclarations,
): void {
  if (!an) return;
  if (an.name != null) out.props['animation-name'] = String(an.name);
  if (an.duration != null) out.props['animation-duration'] = String(an.duration);
  if (an.timing != null) out.props['animation-timing-function'] = String(an.timing);
  if (an.iterationCount != null) out.props['animation-iteration-count'] = String(an.iterationCount);
  if (an.direction != null) out.props['animation-direction'] = String(an.direction);
  if (an.fillMode != null) out.props['animation-fill-mode'] = String(an.fillMode);
}

// ── Full surface ────────────────────────────────────────────

/** the value a scale takes: its own, else the closest declared one (the smaller of two at the same distance) */
export function atScale(by: Record<string, string> | undefined, scale: string): string | undefined {
  if (!by) return undefined;
  if (by[scale] != null) return by[scale];
  const order = SCALE as readonly string[], at = order.indexOf(scale);
  let best: string | undefined, far = Infinity;
  for (const s of order) {
    if (by[s] == null) continue;
    const d = Math.abs(order.indexOf(s) - at);
    if (d < far) { best = s; far = d; }
  }
  return best ? by[best] : undefined;
}

/** the six dimensions a surface may say, with the CSS property of each and the density kind it scales by */
export const DIMENSIONS = [
  ['width', 'width', 'width'], ['height', 'height', 'height'],
  ['minWidth', 'min-width', 'width'], ['maxWidth', 'max-width', 'width'],
  ['minHeight', 'min-height', 'height'], ['maxHeight', 'max-height', 'height'],
] as const;

/** `dimensions`: each is written by scale; here, what each is at one scale (md when none is named) */
export function emitDimensions(dims: Record<string, Record<string, string>> | undefined, out: EmittedDeclarations, scale = 'md'): void {
  if (!dims) return;
  for (const [key, prop, kind] of DIMENSIONS) {
    const v = atScale(dims[key], scale);
    if (v != null) out.props[prop] = scaled(kind, v);
  }
}

/** a distance: a spacing token (sm, -sm), or a length or a percentage as written */
export const distance = (value: unknown): string => {
  const v = String(value);
  if (/^-?[\d.]+(px|rem|em|%)?$/.test(v) || v === 'auto') return v;
  return v.startsWith('-') ? `calc(var(--spacing-${v.slice(1)}) * -1)` : `var(--spacing-${v})`;
};

/** `position`: a shift (drawn moved, nothing else moves) and absolute (out of the flow, placed from the edges of its container).
 *  `under` is not a declaration of the surface alone: process-under.ts writes it, from every surface that says it */
export function emitPosition(position: Record<string, unknown> | undefined, out: EmittedDeclarations): void {
  if (!position) return;
  const shift = position.shift as { x?: string; y?: string } | undefined;
  if (shift) {
    const parts: string[] = [];
    if (shift.x != null) parts.push(`translateX(${shift.x})`);
    if (shift.y != null) parts.push(`translateY(${shift.y})`);
    if (parts.length) out.props['transform'] = parts.join(' ');
  }
  const a = position.absolute as Record<string, string> | undefined;
  if (a) {
    out.props['position'] = 'absolute';
    for (const side of ['top', 'right', 'bottom', 'left'] as const) if (a[side] != null) out.props[side] = distance(a[side]);
    // centred on an axis: placed at the middle of the container, then moved back by half its own size. `translate`, so a shift keeps its `transform`
    if (a.center) {
      if (a.center !== 'y' && a.left == null && a.right == null) out.props['left'] = '50%';
      if (a.center !== 'x' && a.top == null && a.bottom == null) out.props['top'] = '50%';
      out.props['translate'] = `${a.center === 'y' ? '0' : '-50%'} ${a.center === 'x' ? '0' : '-50%'}`;
    }
  }
}

export function emitSurface(
  tokens: Record<string, unknown>,
  out: EmittedDeclarations,
  /** the scale its dimensions are read at */
  scale = 'md',
): void {
  emitBoundary(tokens.boundary as Record<string, unknown> | undefined, out);
  emitInterior(tokens.interior as Record<string, unknown> | undefined, out);
  emitDimensions(tokens.dimensions as Record<string, Record<string, string>> | undefined, out, scale);
  emitPosition(tokens.position as Record<string, unknown> | undefined, out);
  emitTypography(tokens.defaultTypography as Record<string, unknown> | undefined, out);
  emitTransition(tokens.transition as Record<string, unknown> | undefined, out);
  emitAnimation(tokens.animation as Record<string, unknown> | undefined, out);

  if (tokens.tint != null) out.vars['tint'] = resolveTint(tokens.tint);
  if (tokens.cursor != null) out.props['cursor'] = String(tokens.cursor);
}

// ── Partial surface (for state/status/emphasis) ─────────────

export function emitPartialSurface(
  entry: Record<string, unknown>,
  out: EmittedDeclarations,
): void {
  const ps = entry.partialSurface as Record<string, unknown> | undefined;
  if (ps) emitSurface(ps, out);
  // the tint of a state stacks over the tint of a status: it goes to its own variable
  if (((entry.where as Record<string, unknown> | undefined)?.state) && out.vars['tint'] !== undefined) { out.vars['tint-state'] = out.vars['tint']; delete out.vars['tint']; }
  emitTransition(entry.transition as Record<string, unknown> | undefined, out);
}

// ── Family-specific extras ──────────────────────────────────

const BLUR_TOKEN_MAP: Record<string, string> = {
  none: '0px',
  xs:   '2px',
  sm:   '4px',
  md:   '8px',
  lg:   '12px',
  xl:   '20px',
};

export function emitOverlayExtras(
  tokens: Record<string, unknown>,
  out: EmittedDeclarations,
): void {
  const overlay = tokens.overlay as Record<string, unknown> | undefined;
  if (overlay) {
    if (overlay.scrimColor != null) out.vars['scrim-color'] = resolveColorRef(String(overlay.scrimColor));
    if (overlay.scrimOpacity != null) {
      // Precompute as a percentage so color-mix can use it without calc()
      const pct = Math.round(Number(overlay.scrimOpacity) * 100);
      out.vars['scrim-opacity-pct'] = `${pct}%`;
    }
    if (overlay.scrimBlur != null) {
      const raw = String(overlay.scrimBlur);
      out.vars['scrim-blur'] = BLUR_TOKEN_MAP[raw] ?? raw;
    }
  }
}

export function emitMediaExtras(
  tokens: Record<string, unknown>,
  out: EmittedDeclarations,
): void {
  if (tokens.objectFit != null) out.vars['media-object-fit'] = String(tokens.objectFit);
  if (tokens.objectPosition != null) out.vars['media-object-position'] = String(tokens.objectPosition);
  if (tokens.aspectRatio != null) out.props['aspect-ratio'] = String(tokens.aspectRatio);

  const filter = tokens.filter as Record<string, unknown> | undefined;
  if (filter) {
    const parts: string[] = [];
    if (filter.grayscale != null) parts.push(`grayscale(${filter.grayscale})`);
    if (filter.brightness != null) parts.push(`brightness(${filter.brightness})`);
    if (filter.contrast != null) parts.push(`contrast(${filter.contrast})`);
    if (filter.blur != null) parts.push(`blur(${filter.blur})`);
    if (parts.length) out.props['filter'] = parts.join(' ');
  }

  const overlay = tokens.overlay as Record<string, unknown> | undefined;
  if (overlay) {
    if (overlay.color != null) out.vars['media-overlay-color'] = resolveColorRef(String(overlay.color));
    if (overlay.opacity != null) out.vars['media-overlay-opacity'] = `${Math.round(Number(overlay.opacity) * 100)}%`;
    if (overlay.blur != null) out.vars['media-overlay-blur'] = String(overlay.blur);
  }
}

export function emitFieldExtras(
  tokens: Record<string, unknown>,
  out: EmittedDeclarations,
): void {
  if (tokens.placeholderColor != null) out.vars['placeholder-color'] = resolveColorRef(String(tokens.placeholderColor));
  if (tokens.placeholderOpacity != null) out.vars['placeholder-opacity'] = String(tokens.placeholderOpacity);
  if (tokens.caretColor != null) out.vars['caret-color'] = resolveColorRef(String(tokens.caretColor));

  const obf = tokens.obfuscation as Record<string, unknown> | undefined;
  if (obf) {
    if (obf.character != null) out.vars['obfuscation-char'] = `"${String(obf.character)}"`;
    if (obf.letterSpacing != null) out.vars['obfuscation-letter-spacing'] = String(obf.letterSpacing);
    if (obf.fontSize != null) out.vars['obfuscation-font-size'] = String(obf.fontSize);
  }
}
