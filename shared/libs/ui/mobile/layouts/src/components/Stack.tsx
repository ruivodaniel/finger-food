// Contract: layout="stack" · mirrors @libs/web-layouts Stack, 0.1.0 — the same props, the same vocabulary.
import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

/**
 * Stack — the auto-layout primitive. One box that is a row or a column, owning
 * the gap, the alignment and the padding between its children. Children own only
 * their content. Nest stacks to build any non-uniform composition.
 *
 * Sizing is Figma's vocabulary, set on the child:
 *   hug   — as small as its content (default)
 *   fill  — grows to eat the leftover space
 *   fixed — keeps an explicit width/height (set via style)
 *
 * Structure only — no colour, border, radius or shadow. Those stay in the theme.
 */

export type StackDir = "row" | "col";
export type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type StackJustify = "start" | "center" | "end" | "between" | "around";
export type StackSize = "hug" | "fill" | "fixed";

const ALIGN: Record<StackAlign, ViewStyle["alignItems"]> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch", baseline: "baseline" };
const JUSTIFY: Record<StackJustify, ViewStyle["justifyContent"]> = { start: "flex-start", center: "center", end: "flex-end", between: "space-between", around: "space-around" };
// fill grows and may shrink below its content's size; hug and fixed do neither
const SIZE: Record<StackSize, ViewStyle> = { hug: { flexGrow: 0, flexShrink: 0 }, fill: { flex: 1, minWidth: 0, minHeight: 0 }, fixed: { flexGrow: 0, flexShrink: 0 } };

export interface StackProps extends Omit<ViewProps, "style"> {
  /** row lays children horizontally, col vertically. Default col. */
  dir?: StackDir;
  /** space between children, in points */
  gap?: number;
  /** cross-axis alignment */
  align?: StackAlign;
  /** main-axis distribution */
  justify?: StackJustify;
  /** wrap children onto several lines (a cluster) */
  wrap?: boolean;
  /** how THIS stack sizes inside its parent stack */
  size?: StackSize;
  /** inner padding, in points */
  pad?: number;
  style?: StyleProp<ViewStyle>;
}

export function Stack({ dir = "col", gap, align, justify, wrap, size = "hug", pad, style, ...rest }: StackProps) {
  return (
    <View
      style={[
        { flexDirection: dir === "row" ? "row" : "column" },
        gap != null ? { gap } : null,
        align ? { alignItems: ALIGN[align] } : null,
        justify ? { justifyContent: JUSTIFY[justify] } : null,
        wrap ? { flexWrap: "wrap" } : null,
        SIZE[size],
        pad != null ? { padding: pad } : null,
        style,
      ]}
      {...rest}
    />
  );
}
