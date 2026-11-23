import type { Layout, Prop, Spec } from "../types";

const b = (name: string, def: boolean): Prop => ({ name, kind: "boolean", default: def });
const u = (name: string, values: string[], def: string): Prop => ({ name, kind: "union", values, default: def });

/** An exploration is what the library lists: its title, when it was made and last edited, whether it is a spike, its latest version and its tags. It has no image and nothing opens inside it: what a reader does with one is open it,
 *  so the button that opens its latest version in a new tab is always there (`showOpen`), not behind a hover. Item, card and reference, as every entity. */
const layouts: Layout[] = [
  { id: "item", name: "item", description: "the exploration as a list item: the title, a spike marker, the latest version, the tags, when it was created and last edited, and a button that opens it in a new tab", image: "none", props: [
    u("width", ["fixed", "fill"], "fixed"), b("showSpike", true), b("showVersion", true), b("showTags", true), b("showCreated", true), b("showEdited", true), b("showOpen", true),
  ], hover: [b("editable", true)] },
  { id: "card", name: "card", description: "the exploration as a card: the title, the spike marker and latest version, when it was created and last edited, the tags and the button that opens it in a new tab", image: "none", props: [
    u("width", ["fixed", "fill"], "fixed"), b("showSpike", true), b("showVersion", true), b("showTags", true), b("showCreated", true), b("showEdited", true), b("showOpen", true),
  ], hover: [b("editable", true)] },
  { id: "reference", name: "reference", description: "the exploration inside a line of text: the title, and the latest version if wanted, with the button that opens it in a new tab; no container; its size is one of the theme's text sizes", image: "none", props: [u("size", ["extra-small", "small", "medium", "large", "extra-large"], "medium"), b("showVersion", false), b("showOpen", true)], hover: [b("editable", true)] },
];

export const spec: Spec = { id: "exploration-previewer", name: "exploration-previewer", state: "draft", layouts };
