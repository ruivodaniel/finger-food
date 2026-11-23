import type { Layout, Prop, Spec } from "../../types";

const u = (name: string, values: string[], def: string): Prop => ({ name, kind: "union", values, default: def });
const b = (name: string, def: boolean): Prop => ({ name, kind: "boolean", default: def });

/** An ERD node is a table, and the ERD page already draws it three ways: simplified (the name), compact (the name and how many fields and foreign keys) and fields (the name and one row per column). The previewer keeps those three as its layouts, instead of item, card and reference,
 *  because they are how the entity is used in its own page. The colour of the header says where the table comes from (generated or designed). Hovering a node opens the hover card of the page: the fields, the description above them and the tables it points to below.
 *  `source` says which colour: the one the data names (the default), or designed (yellow) or generated (blue) to see both. The hover card is the `tooltip` switch: on for simplified and compact, where it is the only way to see the fields, off for fields. */
const hover = (tooltip: boolean): Prop[] => [b("tooltip", tooltip)];
const layouts: Layout[] = [
  { id: "simplified", name: "simplified", description: "the table as its name in a box, the border telling where it comes from", image: "none", props: [b("showSource", true), u("source", ["data", "designed", "generated"], "data")], hover: hover(true) },
  { id: "compact", name: "compact", description: "the table as its name in a header and below it how many fields and how many foreign keys it has", image: "none", props: [b("showSource", true), u("source", ["data", "designed", "generated"], "data"), b("showForeignKeys", true)], hover: hover(true) },
  { id: "fields", name: "fields", description: "the table as its name in a header and one row per column: the key or link icon, the name (with a ? when nullable), the type (an enum shows as \"type\"), and a badge that opens the details of the column", image: "none", props: [
    b("showSource", true), u("source", ["data", "designed", "generated"], "data"), b("showDescription", false), b("showDetails", true), b("showPointsTo", false),
  ], hover: hover(false) },
];

export const spec: Spec = { id: "erd-node-previewer", name: "erd-node-previewer", state: "draft", layouts };
