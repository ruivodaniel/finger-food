import type { Layout, Prop, Spec } from "../types";

const b = (name: string, def: boolean): Prop => ({ name, kind: "boolean", default: def });
const u = (name: string, values: string[], def: string): Prop => ({ name, kind: "union", values, default: def });

/** The CANVAS CARD: a node of a diagram, readable zoomed out: a large title and little else, the text most of the card's height. The colour is the card's data (one of ten of the theme);
 *  `color` says how it shows: a stroke on the left, a tint of the whole card, or none.
 *  - title: the title alone (the default); the description and the note come on hover, in a tooltip, when there are any.
 *  - title-description: the title and the description; the note on hover.
 *  - picture: the icon or the image above the title, for a diagram that reads by pictures.
 *  `width` is fixed (220) or hug; a hugging card never passes 320: a long title wraps. */
const COLOR = ["stroke", "tint", "none"];
const layouts: Layout[] = [
  { id: "title", name: "title", description: "the title alone; description and note on hover", image: "none", props: [u("width", ["fixed", "hug"], "fixed"), u("color", COLOR, "stroke"), b("showPicture", true)], hover: [b("tooltip", true), b("editable", true)] },
  { id: "title-description", name: "title and description", description: "the title and the description; the note on hover", image: "none", props: [u("width", ["fixed", "hug"], "fixed"), u("color", COLOR, "stroke"), b("showPicture", true)], hover: [b("tooltip", true), b("editable", true)] },
  { id: "picture", name: "picture", description: "the icon or the image above the title", image: "none", props: [u("color", COLOR, "stroke"), b("showDescription", false)], hover: [b("tooltip", true), b("editable", true)] },
];

export const spec: Spec = { id: "canvas-card", name: "canvas-card", state: "draft", layouts };
