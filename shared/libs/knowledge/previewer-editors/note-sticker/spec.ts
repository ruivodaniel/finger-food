import type { Layout, Prop, Spec } from "../types";

const b = (name: string, def: boolean): Prop => ({ name, kind: "boolean", default: def });
const u = (name: string, values: string[], def: string): Prop => ({ name, kind: "union", values, default: def });

/** The CANVAS NOTE: a sticker on a whiteboard. A square of solid pastel colour (one of the canvas colours, the note's data; yellow when none), a soft shadow, no border,
 *  no icon: text only. `size` is the sticker's side (tiny · extra-small · small · medium · large); the text is ALWAYS the same size: what does not fit is cut with an
 *  ellipsis; hovering shows the note whole in a square card at the pointer; a double click pins the card, where the title and the text are typed in place. `tiny` shows no text: it only says a note is there. */
const SIZES = ["tiny", "extra-small", "small", "medium", "large"];
const layouts: Layout[] = [
  { id: "note", name: "note", description: "a sticky note: the title, then the text, cut with an ellipsis; hovering reads it whole, a double click pins the card and types in it", image: "none", props: [u("size", SIZES, "small"), b("showTitle", true)], hover: [] },
];

export const spec: Spec = { id: "canvas-note", name: "canvas-note", state: "draft", layouts };
