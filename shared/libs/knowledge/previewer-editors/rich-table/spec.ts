import type { Spec } from "../types";
/** The RICH TABLE: the library's rich-table as an authored dataset on the canvas. One layout; what it holds is its data (columns, rows); its box is the person's (width and height), the grid scrolls inside it and the header stays. */
export const spec: Spec = { id: "rich-table", name: "rich table", state: "draft", layouts: [{ id: "table", name: "table", description: "an editable grid inside a box the person sizes: sticky header, horizontal and vertical scroll, rows and columns added, moved and deleted", image: "none", props: [], hover: [] }] };
