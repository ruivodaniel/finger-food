import * as React from "react";
import { cn } from "../../../../lib/utils";
import { axisAttrs } from "../../../../lib/axes";
import { positionClasses } from "../../../../lib/position";
import type { ContentProps, FooterProps, HeaderProps, Overflow } from "./types";

/** the band at the top of a container: element surface--header, a column (a title over its description, or one Stack for a row); the look is the theme's */
export function Header({ position, className, emphasis, status, scale, concept, ...props }: HeaderProps) {
  return <div element="surface--header" {...axisAttrs({ emphasis, status, scale, concept, position })} className={cn("flex flex-col shrink-0", className, positionClasses(position))} {...props} />;
}

/** the band at the bottom of a container: element surface--footer, a row by default; the look is the theme's */
export function Footer({ position, className, emphasis, status, scale, concept, ...props }: FooterProps) {
  return <div element="surface--footer" {...axisAttrs({ emphasis, status, scale, concept, position })} className={cn("flex items-center shrink-0 gap-3 [&>[layout]]:flex-1", className, positionClasses(position))} {...props} />;
}

// whole class names, so the build sees them: the arrangement of a content is the library's classes, never an inline style
const OVERFLOW_X: Record<Overflow, string> = { visible: "overflow-x-visible", clip: "overflow-x-hidden", scroll: "overflow-x-auto" };
const OVERFLOW_Y: Record<Overflow, string> = { visible: "overflow-y-visible", clip: "overflow-y-hidden", scroll: "overflow-y-auto" };
const ITEMS: Record<string, string> = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch", baseline: "items-baseline" };
const JUSTIFY: Record<string, string> = { start: "justify-start", center: "justify-center", end: "justify-end", stretch: "justify-stretch", baseline: "justify-baseline" };

/** the body of a container: two boxes. The outer one, element surface--content, fills the height the header and the footer leave and is
 *  the one that scrolls (overflow, per axis): the scroll window, never padded. The inner one, data-part inner, carries the padding the
 *  theme writes on the content (the engine puts it there) and places what it holds (align), so the text scrolls with its padding and
 *  never behind it. The fill, every look: the theme's; a bleed moves the outer box, never the inside */
export function Content({ position, className, state, scale, concept, overflow, align, children, ...props }: ContentProps) {
  const o = typeof overflow === "string" ? { x: overflow, y: overflow } : overflow ?? {};
  return (
    <div element="surface--content" {...axisAttrs({ scale, concept, state, position })} className={cn("flex-1 min-h-0", o.x && OVERFLOW_X[o.x], o.y && OVERFLOW_Y[o.y], className, positionClasses(position))} {...props}>
      <div data-part="inner" className={cn("min-h-full", o.x === "scroll" && "w-max", align && "flex flex-col", align?.horizontal && ITEMS[align.horizontal], align?.vertical && JUSTIFY[align.vertical])}>{children}</div>
    </div>
  );
}
