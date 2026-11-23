// The style of a shape and of its text: what the style toolbar edits, what the rectangle and the text nodes draw. Kept on the node (`style`), saved with the document. The types are the registration's (NodeStyle).
import type { ShapeStyle, TextStyle } from "../canvas-registration";
export type { ShapeStyle, TextStyle };

export const TEXT_DEFAULT: Required<TextStyle> = { fontSize: 14, bold: false, align: "center", color: "var(--foreground)" };
export const SHAPE_DEFAULT: Required<ShapeStyle> = { fill: "transparent", fillOpacity: 100, stroke: "var(--foreground)", strokeWidth: 1, strokeStyle: "solid", radius: 0 };
export const FONT_SIZES = [10, 12, 14, 16, 18, 24, 32, 48, 64];

/** a colour at an opacity (0–1): the colour as given, mixed with transparent. The canvas never converts a colour: a theme token follows the theme's mode, a typed colour is drawn as typed. */
export const alpha = (c: string, a = 1): string => (c === "transparent" || c === "none" || a >= 1 ? c : `color-mix(in srgb, ${c} ${Math.round(a * 100)}%, transparent)`);
/** the css of a fill at its opacity */
export const fillCss = (s: Required<ShapeStyle>) => (s.fill === "transparent" ? "transparent" : alpha(s.fill, s.fillOpacity / 100));
export const textCss = (t: Required<TextStyle>): React.CSSProperties => ({ fontSize: t.fontSize, fontWeight: t.bold ? 700 : 400, textAlign: t.align, color: t.color, lineHeight: 1.3, whiteSpace: "pre-wrap", wordBreak: "break-word" });
