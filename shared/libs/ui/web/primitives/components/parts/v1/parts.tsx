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

const OVERFLOW: Record<Overflow, string> = { visible: "visible", clip: "hidden", scroll: "auto" };
const ALIGN: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch", baseline: "baseline" };

/** the body of a container: two boxes. The outer one, element surface--content, fills the height the header and the footer leave and is
 *  the one that scrolls (overflow, per axis): the scroll window, never padded. The inner one, data-part inner, carries the padding the
 *  theme writes on the content (the engine puts it there) and places what it holds (align), so the text scrolls with its padding and
 *  never behind it. The fill, every look: the theme's; a bleed moves the outer box, never the inside */
export function Content({ position, className, state, scale, concept, overflow, align, style, children, ...props }: ContentProps) {
  const o = typeof overflow === "string" ? { x: overflow, y: overflow } : overflow ?? {};
  const own: React.CSSProperties = { ...style };
  if (o.x) own.overflowX = OVERFLOW[o.x] as React.CSSProperties["overflowX"];
  if (o.y) own.overflowY = OVERFLOW[o.y] as React.CSSProperties["overflowY"];
  const inner: React.CSSProperties = { minHeight: "100%" };
  if (o.x === "scroll") inner.width = "max-content";
  if (align) { inner.display = "flex"; inner.flexDirection = "column"; if (align.horizontal) inner.alignItems = ALIGN[align.horizontal]; if (align.vertical) inner.justifyContent = ALIGN[align.vertical]; }
  return (
    <div element="surface--content" {...axisAttrs({ scale, concept, state, position })} className={cn("flex-1 min-h-0", className, positionClasses(position))} style={own} {...props}>
      <div data-part="inner" style={inner}>{children}</div>
    </div>
  );
}
