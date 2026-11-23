import { defineProps } from "../../../../lib/define-props";
import { SCALE } from "../../../../../types/axes";
import type { StackOwnProps } from "./stack";

/** the part zone with no surface: a row or a column that places its children. Markup says what is relative; the measure behind `scale` is the theme's */
export const stackSchema = defineProps<StackOwnProps & { role?: string }>("Stack", {
  dir: { kind: "enum", values: ["row", "col"], default: "col" },
  scale: { kind: "enum", values: SCALE, doc: "how close the children stand: a word; the theme gives the measure" },
  align: { kind: "enum", values: ["start", "center", "end", "stretch", "baseline"] },
  justify: { kind: "enum", values: ["start", "center", "end", "between", "around"] },
  wrap: { kind: "boolean", default: false },
  size: { kind: "enum", values: ["hug", "fill", "fixed"], doc: "how this stack sizes inside its parent stack" },
  clip: { kind: "boolean", default: false, doc: "what it holds is cut at its edge, a text with an ellipsis, instead of wrapping" },
  dividers: { kind: "boolean", default: false, doc: "a divider between its children; what a divider is, is the theme's" },
  divider: { kind: "string", doc: "a divider on an edge of the stack: top, bottom, left, right; several separated by a space" },
  vars: { kind: "other", doc: "a value only the render knows, as custom properties (--name): a colour the user chose" },
  role: { kind: "string", doc: "ARIA role (tablist)" },
});
