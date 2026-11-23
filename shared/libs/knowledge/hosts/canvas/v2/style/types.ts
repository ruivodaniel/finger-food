// The style of a shape and of its text: what the style toolbar edits, what the rectangle and the text nodes draw. Kept on the node (`style`), saved with the document. The types are the registration's (NodeStyle).
import type { ShapeStyle, TextStyle } from "../canvas-registration";
export type { ShapeStyle, TextStyle };

export const TEXT_DEFAULT: Required<TextStyle> = { fontSize: 14, bold: false, align: "center", color: "#1a1a1a" };
export const SHAPE_DEFAULT: Required<ShapeStyle> = { fill: "transparent", fillOpacity: 100, stroke: "#1a1a1a", strokeWidth: 1, strokeStyle: "solid", radius: 0 };
/** the swatches the toolbar offers, as Miro's board does: none, the pastels, the strong ones, the neutrals */
export const PALETTE = [
  "transparent", "#fef5c3", "#f7d5b2", "#f4c6c6", "#c9eed4", "#cfe0fb", "#e0dcfa", "#f8d867",
  "#f2a35d", "#ef6f6c", "#68c46f", "#7aa2ec", "#9585ea", "#b08a2e", "#8a4a1d", "#a8261f",
  "#2f6f33", "#2f4fa0", "#6236cf", "#dc8fb4", "#ffffff", "#e6e6e6", "#b0b0b0", "#5a5a5a", "#1a1a1a",
];
export const FONT_SIZES = [10, 12, 14, 16, 18, 24, 32, 48, 64];

/** the css of a fill at its opacity */
export const fillCss = (s: Required<ShapeStyle>) => (s.fill === "transparent" ? "transparent" : s.fillOpacity >= 100 ? s.fill : `color-mix(in srgb, ${s.fill} ${s.fillOpacity}%, transparent)`);
export const textCss = (t: Required<TextStyle>): React.CSSProperties => ({ fontSize: t.fontSize, fontWeight: t.bold ? 700 : 400, textAlign: t.align, color: t.color, lineHeight: 1.3, whiteSpace: "pre-wrap", wordBreak: "break-word" });
