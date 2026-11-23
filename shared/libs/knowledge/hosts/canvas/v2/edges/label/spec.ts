import type { Layout, Prop, Spec } from "../../../../previewer-editors/types";

const b = (name: string, def: boolean): Prop => ({ name, kind: "boolean", default: def });

/** The CANVAS EDGE LABEL: what sits on a connector between two cards. A diagram draws the line; this draws the label.
 *  - dot: a point on the line; the title, the description and the note on hover. For a diagram that reads by its cards.
 *  - title: the title on the line; the description and the note on hover. */
const layouts: Layout[] = [
  { id: "dot", name: "dot", description: "a point on the line; everything on hover", image: "none", props: [], hover: [b("tooltip", true), b("editable", true)] },
  { id: "title", name: "title", description: "the title on the line; the rest on hover", image: "none", props: [], hover: [b("tooltip", true), b("editable", true)] },
];

export const spec: Spec = { id: "canvas-edge", name: "canvas-edge", state: "draft", layouts };
