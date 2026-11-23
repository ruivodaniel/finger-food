import type * as React from "react";
import type { ElementProps } from "../../../../../types/elements";
import { defineProps } from "../../../../lib/define-props";
import type { AxisName } from "../../../../lib/axes";
import { axesSchema } from "../../../../lib/axes-schema";

// The three parts of a container: one Header, one Content, one Footer. A card, a sheet, a dialog, an alert dialog put them inside;
// none has a copy of its own. The container owns the height; the content grows to fill what the header and the footer leave.
// Decided on UI & THEME structure v91, 5 Nov 2026.

/** where the content places what it holds, per axis: the theme's childAlign values */
export type ChildAlignValue = "start" | "center" | "end" | "stretch" | "baseline";

/** how an axis of the content meets what overflows it: visible lets it out, clip cuts it, scroll scrolls it */
export type Overflow = "visible" | "clip" | "scroll";

export interface HeaderOwnProps extends ElementProps<"header"> {}
export interface FooterOwnProps extends ElementProps<"footer"> {}
export interface ContentOwnProps extends ElementProps<"content"> {
  /** per axis; one word sets both. Unset: visible */
  overflow?: Overflow | { x?: Overflow; y?: Overflow };
  /** how the content places what it holds: the theme's childAlign, as a prop of the instance */
  align?: { horizontal?: ChildAlignValue; vertical?: ChildAlignValue };
}

type Div = React.ComponentProps<"div">;
export type HeaderProps = HeaderOwnProps & Omit<Div, keyof HeaderOwnProps | AxisName>;
export type ContentProps = ContentOwnProps & Omit<Div, keyof ContentOwnProps | AxisName | "style">;
export type FooterProps = FooterOwnProps & Omit<Div, keyof FooterOwnProps | AxisName>;

export const headerSchema = defineProps<HeaderOwnProps>("Header", { ...axesSchema("header") });
export const footerSchema = defineProps<FooterOwnProps>("Footer", { ...axesSchema("footer") });
export const contentSchema = defineProps<ContentOwnProps>("Content", {
  ...axesSchema("content"),
  overflow: { kind: "other", doc: "visible | clip | scroll, one word for both axes or { x, y }" },
  align: { kind: "other", doc: "{ horizontal, vertical }: start | center | end | stretch | baseline" },
});
