// The rich table on a canvas: owned by its node, an authored dataset; the person picks the grid's size (rows and columns), places a box, and the table starts empty. The box is the person's
// on both axes: the grid scrolls inside it and its header stays in view.
import { register } from "../../hosts/canvas/v3/canvas-registration";
import { SizePicker } from "./SizePicker";
import { Previewer, newRichTable } from "./Previewer";
import { spec } from "./spec";
import type { RichTableData } from "./types";

export const richTable = register<RichTableData>({
  kind: "rich_table", name: "rich table", component: Previewer, schema: { parse: (x) => x as RichTableData }, spec,
  data: "owned_by_node", edit: "in_place",
  tools: [{ id: "rich_table", name: "rich table", group: "complex", placing: "drag_box", size: { width: 640, height: 320 },
    what: "pick the size of the grid, then drag a box (a click gives the default size); it starts empty",
    ask: ({ onPick }) => <SizePicker onPick={(rows, cols) => onPick(newRichTable(rows, cols))} />,
    data: (_, asked) => (asked && "columns" in asked ? (asked as RichTableData) : newRichTable(3, 3)) }],
  layout: { default: "table", editable: [] },
  layouts: { table: { size: { width: "user", height: "user" }, min: { width: 240, height: 140 } } },
});
