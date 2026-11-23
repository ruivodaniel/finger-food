import * as React from "react";
import { clsx } from "clsx";
import type { Scale } from "../../../../../types/axes";

/**
 * Stack — the part zone with no surface. One box that is a row or a column and places its children:
 * the direction, the alignment, the distribution, how close they stand. Children own only their content.
 * Nest stacks to build any non-uniform composition; a "cell" is just another Stack. It emits layout="stack"
 * so the engine knows it: it bleeds like a part and passes the container's padding through to the parts it
 * holds; the theme paints nothing on it.
 *
 * Markup says only what is relative. How close the children stand is a word (`scale`); the measure behind
 * the word is the theme's. A Stack has no padding: the part that carries it owns the padding.
 *
 * Sizing is Figma's vocabulary, set on the child:
 *   hug   — the child is as small as its content (default)
 *   fill  — the child grows to eat the leftover space
 *   fixed — the child keeps its own width and height, which are the theme's
 *
 * v3: no `gap` number and no `pad`; `scale` in their place, and no inline style. v2 before it.
 * `when` (the arrangement under a named condition of the container) is not here yet: v2 sets it with an inline
 * variable, and this version writes no inline style.
 */

export type StackDir = "row" | "col";
export type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type StackJustify = "start" | "center" | "end" | "between" | "around";
export type StackSize = "hug" | "fill" | "fixed";

const ALIGN: Record<StackAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const JUSTIFY: Record<StackJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};

// fill grows and is allowed to shrink below content size (min-*:0), the classic
// flexbox overflow fix; hug and fixed never grow or shrink.
const SIZE: Record<StackSize, string> = {
  hug: "flex-none",
  fill: "flex-1 min-w-0 min-h-0",
  fixed: "flex-none",
};

export interface StackOwnProps {
  /** row lays children horizontally, col vertically. Default col. */
  dir?: StackDir;
  /** how close the children stand: a word. The theme gives the measure. Absent: they touch. */
  scale?: Scale;
  /** cross-axis alignment. */
  align?: StackAlign;
  /** main-axis distribution. */
  justify?: StackJustify;
  /** wrap children onto multiple lines (a cluster). */
  wrap?: boolean;
  /** how THIS stack sizes inside its parent stack. */
  size?: StackSize;
  /** what it holds is cut at its edge, with an ellipsis for a text, instead of wrapping or pushing it wider. */
  clip?: boolean;
}

export type StackProps = StackOwnProps & Omit<React.ComponentProps<"div">, keyof StackOwnProps | "style">;

export function Stack({ dir = "col", scale, align, justify, wrap, size, clip, className, ...props }: StackProps) {
  return (
    <div
      layout="stack"
      data-dir={dir}
      scale={scale}
      className={clsx(
        "flex",
        dir === "row" ? "flex-row" : "flex-col",
        align && ALIGN[align],
        justify && JUSTIFY[justify],
        wrap && "flex-wrap",
        size && SIZE[size],
        clip && "[&>*]:min-w-0 [&>*]:truncate",
        className,
      )}
      {...props}
    />
  );
}
