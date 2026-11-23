// ============================================================
// RESOLVE — the cascade, at run time
// ============================================================
// The engine wrote an element's rules as fragments, in the order the cascade
// applies them. Here: keep the ones whose axes match, merge them in that order,
// then compose the colours the way the web's stylesheet does.

import type { TextStyle, ViewStyle } from "react-native";
import type { Emphasis, MobileState, Sibling, Scale, Status } from "../../../../types/axes";
import { TRANSPARENT, formatColor, mix, parseColor, smartBw, type Rgba } from "../../../../theme-engine/mobile/colors";
import type { Fragment, FragmentWhen, NativeMode } from "./native";

/** what a component is, right now, on each axis */
export type Axes = {
  emphasis?: Emphasis;
  status?: Status;
  scale?: Scale;
  /** every state that is on; several can be at once (focused and disabled) */
  states?: readonly MobileState[];
  /** where it stands among its siblings */
  positions?: readonly Sibling[];
};

export type Resolved = {
  /** the container's style */
  view: ViewStyle;
  /** the style of the text inside, colour included */
  text: TextStyle;
  /** the foreground colour, for an icon or a spinner */
  color?: string;
  icon: { size?: number; weight?: number };
};

function matches(when: FragmentWhen | undefined, axes: Axes): boolean {
  if (!when) return true;
  if (when.emphasis && when.emphasis !== axes.emphasis) return false;
  if (when.status && when.status !== axes.status) return false;
  if (when.scale && when.scale !== axes.scale) return false;
  if (when.state) {
    const on = axes.states ?? [];
    if (when.state === "default" ? on.length > 0 : !on.includes(when.state)) return false;
  }
  if (when.position && !(axes.positions ?? []).includes(when.position)) return false;
  return true;
}

/** the positions of the item at `index` among `count` siblings, as the theme names them */
export function positionsOf(index: number, count: number): Sibling[] {
  const out: Sibling[] = [];
  if (count === 1) out.push("only");
  if (index === 0) out.push("first");
  if (index === count - 1) out.push("last");
  if (index > 0 && index < count - 1) out.push("middle");
  out.push((index + 1) % 2 === 0 ? "even" : "odd");
  return out;
}

const SIDES = ["Top", "Right", "Bottom", "Left"] as const;

export function resolve(fragments: readonly Fragment[] | undefined, axes: Axes, mode: NativeMode): Resolved {
  const vars: NonNullable<Fragment["vars"]> = {};
  const view: Record<string, number | string> = {};
  const viewColors: Record<string, string> = {};
  const text: Record<string, number | string> = {};
  const icon: Resolved["icon"] = {};
  let shadow: string | undefined;

  for (const f of fragments ?? []) {
    if (!matches(f.when, axes)) continue;
    if (f.vars) Object.assign(vars, f.vars);
    if (f.view) Object.assign(view, f.view);
    if (f.viewColors) Object.assign(viewColors, f.viewColors);
    if (f.text) Object.assign(text, f.text);
    if (f.icon) Object.assign(icon, f.icon);
    if (f.shadow !== undefined) shadow = f.shadow;
  }

  // a colour reference → a colour. `tint` and `smart-bw` need the other colours first.
  const named = (ref: string | undefined): Rgba | undefined => {
    if (ref == null || ref === "currentColor" || ref === "inherit" || ref === "tint" || ref === "smart-bw") return undefined;
    if (ref === "transparent") return TRANSPARENT;
    const hit = mode.palette[ref];
    return parseColor(hit ?? ref) ?? undefined;
  };
  const tint = named(vars.tint);
  const of = (ref: string | undefined): Rgba | undefined => (ref === "tint" ? tint : named(ref));

  // the composition, as the web's stylesheet writes it:
  //   background    mix(tint else bg, 20%, bg), then at bg-alpha over transparent
  //   border-color  mix(tint else border, 30%, border)
  //   color         fg; smart-bw reads the fill
  const bg = of(vars.bg);
  const fill = mix(mix(tint ?? bg ?? TRANSPARENT, 0.2, bg ?? TRANSPARENT), vars.bgAlpha ?? 1, TRANSPARENT);
  view.backgroundColor = formatColor(fill);

  const border = of(vars.borderColor);
  const borderColor = formatColor(mix(tint ?? border ?? TRANSPARENT, 0.3, border ?? TRANSPARENT));
  for (const s of SIDES) view[`border${s}Color`] = borderColor;
  for (const [key, ref] of Object.entries(viewColors)) {
    const c = of(ref);
    if (c) view[key] = formatColor(c);
  }

  const fg = vars.fg === "smart-bw" ? (bg ? smartBw(bg) : undefined) : of(vars.fg);
  const color = fg ? formatColor(fg) : undefined;
  if (color) text.color = color;

  if (shadow && shadow !== "none" && mode.shadows[shadow] && mode.shadows[shadow] !== "none") view.boxShadow = mode.shadows[shadow];

  return { view: view as ViewStyle, text: text as TextStyle, color, icon };
}

/** one colour of the theme, by its name in the palette (or a raw colour) */
export function colorOf(ref: string | undefined, mode: NativeMode): string | undefined {
  if (!ref) return undefined;
  const c = parseColor(mode.palette[ref] ?? ref);
  return c ? formatColor(c) : undefined;
}
