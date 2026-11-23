// ERD: the tables of a project and the keys between them. Only ERD nodes; no toolbox beyond select and pan; the lines are the foreign keys, derived from the data, never drawn by hand.
import type { Template } from "../template";
import { BASE } from "./base";
/** the ERD explorer's line: bezier, animated, floating, no arrow head, the cardinality at the ends */
const fk = { path: "bezier" as const, animated: true, end: "none" as const, drawing: "erd" as const };
export const erd: Template = {
  ...BASE, id: "erd", name: "ERD",
  allow: ["erd_node"],
  tools: { allow: ["select", "pan"] },
  edges: { default: fk, byPair: { "erd_node>erd_node": fk }, derived: true, connection: "loose" },
  arrange: "none",
  viewport: { ...BASE.viewport, snap: false, guides: false },
  /** how an ERD node is instantiated here: lit, in spotlight, no handles, a bar with align and distribute only; the page may say otherwise per node at runtime */
  overrides: { erd_node: { highlight: true, highlightMode: "spotlight", handles: [], contextBar: ["align", "distribute"], contextBarAt: "top" } },
};
