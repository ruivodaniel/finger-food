import { defineProps } from "../../../../lib/define-props";
import type { StackOwnProps } from "./stack";

/** the part zone with no surface: a row or a column owning the gap, the alignment and the padding between its children. Spacing from markup, structural only; the theme paints nothing on it */
export const stackSchema = defineProps<StackOwnProps & { role?: string }>("Stack", {

  dir: { kind: "enum", values: ["row", "col"], default: "col" },
  gap: { kind: "other", doc: "px between children, or a CSS length" },
  pad: { kind: "other", doc: "px of padding, or a CSS length" },
  align: { kind: "enum", values: ["start", "center", "end", "stretch", "baseline"] },
  justify: { kind: "enum", values: ["start", "center", "end", "between", "around"] },
  wrap: { kind: "boolean", default: false },
  size: { kind: "enum", values: ["hug", "fill", "fixed"], doc: "how this stack sizes inside its parent stack" },
  when: { kind: "other", doc: "the arrangement under a named condition of the nearest container: { narrow: \"col\" }" },
  role: { kind: "string", doc: "ARIA role (tablist)" },
});
