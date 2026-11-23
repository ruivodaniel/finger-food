// WHICH OPTIONS SHOW — the context bar's blocks follow from the selection, by rules, not case by case: each rule is a test on the selection and the block it adds. What a kind offers
// is read from its registration (styleBlocks, optionsBar, layouts), never from its name. Ruled by Daniel, 24 Oct:
//   anything selected → filter (when more than one kind), lock, arrange (layer order)
//   two or more nodes → group, align, distribute
//   a group in the selection → ungroup
//   nodes whose kinds all offer a style block → that block (text, fill, border, icon, drawing)
//   one node whose kind brings a block of its own → it (the code block's language, size, line numbers)
//   nodes of one kind with layouts or switches → the layout picker
//   connectors only → the line block
//   any unlocked node or any connector → click to highlight
import type { CanvasRegistration, Registrations, StyleBlock } from "../canvas-registration";
import type { CanvasEdge, CanvasGroup, CanvasNode } from "../document";

export type Selection = { nodes: CanvasNode[]; edges: CanvasEdge[]; /** the groups whose members are all selected */ groups: CanvasGroup[] };
export type Block = "filter" | StyleBlock | "line" | "group" | "ungroup" | "lock" | "arrange" | "align" | "distribute" | "layout" | "highlight" | "options";
const kinds = (s: Selection) => new Set([...s.nodes.map((n) => n.kind), ...(s.edges.length ? ["edge"] : [])]).size;
const offers = (all: Registrations, s: Selection, b: StyleBlock) => s.nodes.length > 0 && !s.edges.length && s.nodes.every((n) => !n.locked && all[n.kind]?.styleBlocks?.includes(b));
/** a selection that is exactly one group: grouping it again means nothing */
const oneGroup = (s: Selection) => s.groups.length === 1 && s.groups[0].ids.length === s.nodes.length;
const hasLayouts = (r?: CanvasRegistration) => !!r && (r.layout.editable.length > 1 || r.spec.layouts.some((l) => l.props.length + l.hover.length > 0));

export const RULES: { block: Block; when: (s: Selection, all: Registrations) => boolean }[] = [
  { block: "filter", when: (s) => kinds(s) > 1 },
  { block: "text", when: (s, all) => offers(all, s, "text") },
  { block: "fill", when: (s, all) => offers(all, s, "fill") },
  { block: "border", when: (s, all) => offers(all, s, "border") },
  { block: "icon", when: (s, all) => offers(all, s, "icon") },
  { block: "drawing", when: (s, all) => offers(all, s, "drawing") },
  { block: "layout", when: (s, all) => s.nodes.length > 0 && !s.edges.length && s.nodes.every((n) => !n.locked) && new Set(s.nodes.map((n) => n.kind)).size === 1 && hasLayouts(all[s.nodes[0].kind]) },
  { block: "options", when: (s, all) => s.nodes.length === 1 && !s.edges.length && !s.nodes[0].locked && !!all[s.nodes[0].kind]?.optionsBar },
  { block: "highlight", when: (s) => s.nodes.some((n) => !n.locked) || s.edges.length > 0 },
  { block: "line", when: (s) => s.edges.length > 0 && !s.nodes.length },
  { block: "group", when: (s) => s.nodes.length >= 2 && !oneGroup(s) },
  { block: "ungroup", when: (s) => s.groups.length > 0 },
  { block: "lock", when: (s) => s.nodes.length > 0 },
  { block: "arrange", when: (s) => s.nodes.length > 0 },
  { block: "align", when: (s) => s.nodes.length >= 2 },
  { block: "distribute", when: (s) => s.nodes.length >= 2 },
];
export const blocksFor = (s: Selection, all: Registrations): Set<Block> => new Set(RULES.filter((r) => r.when(s, all)).map((r) => r.block));
