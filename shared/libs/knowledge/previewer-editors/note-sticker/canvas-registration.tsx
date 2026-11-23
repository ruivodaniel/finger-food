// The note sticker on a canvas: owned by its node, typed in place (the pointer card), one layout whose sizes read as layouts on the board. Its colour is a block of the context bar:
// the ten canvas tokens, and the colours the person adds.
import { PickerMenu, type PickerSection } from "@libs/web-components";
import { register, type CanvasViewProps } from "../../hosts/canvas/v3/canvas-registration";
import { useSections } from "../../hosts/canvas/v3/style/palette";
import type { Spec } from "../types";
import { CanvasNote } from "./Previewer";
import { spec } from "./spec";
import { NOTE_DEFAULT, noteColorCss, type CanvasNote as Data } from "./types";
import { SOFT_SECTION } from "../../hosts/canvas/v3/style/palette";

/** the spec has one layout with `size` as a switch; on the board each size is a layout, the way it reads: the registration's spec says so, the previewer still takes the size as its switch */
const sizes = spec.layouts[0].props.find((p) => p.name === "size")?.values ?? [];
const boardSpec: Spec = { ...spec, layouts: sizes.map((s) => ({ ...spec.layouts[0], id: s, name: s, props: spec.layouts[0].props.filter((p) => p.name !== "size") })) };
const View = ({ data, layout, switches, editable, onChange }: CanvasViewProps<Data>) => <CanvasNote layout={spec.layouts[0].id} v={{ ...(switches as Record<string, string | boolean>), size: layout }} data={data} edit={editable && onChange ? { source: "fixture", kind: "sticky note", onSubmit: onChange } : undefined} />;

/** the note's own colours: the canvas pastels, exactly what the note is painted with; a consumer's `colors.note` replaces them */
const NOTE_COLOURS: PickerSection[] = [SOFT_SECTION];
function NoteColour({ data, onData }: { data: Data; onData: (d: Data) => void }) {
  const sections = useSections("note", false, NOTE_COLOURS);
  return <PickerMenu trigger={{ icon: "circle", solid: true }} label="note colour" sections={sections} value={noteColorCss(data.color)} onChange={(v) => { if (typeof v === "string") onData({ ...data, color: v }); }} contentClassName="nodrag nopan nowheel" />;
}

export const noteSticker = register<Data>({
  kind: "note_sticker", name: "sticky note", component: View, schema: { parse: (x) => x as Data }, spec: boardSpec,
  data: "owned_by_node", edit: "in_place",
  tools: [{ id: "note", name: "note (N)", key: "n", icon: "stickyNote", what: "drag to draw a sticker, click for the default size; hover it to read it whole, double click to type in it", placing: "drag_box", size: { width: 170, height: 170 },
    layout: "small", data: () => ({ id: crypto.randomUUID(), text: "A note", color: NOTE_DEFAULT }) }],
  layout: { default: "small", editable: sizes },
  // tiny has no centre handle: it would sit over the whole sticker and catch the hover, so the pointer card could not open. The other sizes keep the template's default.
  layouts: Object.fromEntries(sizes.map((s) => [s, { size: { width: "content", height: "content" }, ...(s === "tiny" ? { handles: ["top", "left", "bottom", "right"] as const } : {}) }])),
  optionsBar: ({ data, onData }) => <NoteColour data={data} onData={onData} />,
});
