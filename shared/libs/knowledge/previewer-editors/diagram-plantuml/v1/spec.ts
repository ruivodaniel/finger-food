import type { Spec } from "../../types";

/** The PlantUML diagram: a diagram written as text and drawn by the PlantUML engine, in the browser. One layout. The text is the entity's.
 *  Editable (the consumer gives an `edit`): the text on the left, the drawing on the right follows it. Not editable: the drawing alone.
 *  `stickyHeader`: the participants of a sequence diagram stay at the top while the drawing scrolls. */
export const spec: Spec = {
  id: "diagram-plantuml", name: "diagram-plantuml", state: "draft",
  layouts: [{ id: "diagram", name: "diagram", description: "the drawing, with the text beside it when editable", image: "none", props: [{ name: "stickyHeader", kind: "boolean", default: true }], hover: [] }],
};
