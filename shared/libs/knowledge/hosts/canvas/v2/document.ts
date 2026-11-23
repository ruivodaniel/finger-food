// DOCUMENT — one drawing: a row in the database, read and written through the API by whoever instantiates the canvas (a page, an exploration, a tab template, a UI-as-code screen).
// The document never holds what its template refuses: every change passes `accept`, whoever writes (the toolbox, an agent through the API: the server runs the same check).
import type { HandleId, HighlightMode, KindId, LayoutId, NodeStyle, Registrations, Switches } from "./canvas-registration";
import type { EdgeStyle, Template, TemplateId } from "./template";
import { allowsKind } from "./template";

export type Label = { id?: string; title?: string; description?: string; note?: string };
/** a tension point the line passes through; on an orthogonal line, the segment it holds (horizontal or vertical) */
export type Bend = { x: number; y: number; axis?: "h" | "v" };

export type CanvasNode<D = unknown> = {
  id: string;
  /** → a canvas registration */
  kind: KindId;
  /** position, in the drawing */
  x: number; y: number;
  /** saved on the axes the size says "user"; a "content" axis is measured, never saved */
  width?: number; height?: number;
  /** inside a container or a frame */
  parentId?: string;
  /** the layer */
  z?: number;
  /** arrange never moves it */
  pinned?: boolean;
  /** no move, resize, edit, delete */
  locked?: boolean;
  /** [N] over the registration's layout and the spec's switch defaults */
  layout?: LayoutId; switches?: Switches;
  /** [N] over the registration's for its layout */
  handles?: HandleId[];
  /** [N] over the template's defaults; on a frame or a container, the value of every node inside */
  highlight?: boolean; highlightMode?: HighlightMode;
  /** by the registration's `data`: the row's fields (owned_by_node), or the reference of the row (referenced) */
  data: D;
  style?: NodeStyle;
};
export type CanvasEdge = {
  id: string;
  /** → CanvasNode */
  source: string; target: string;
  /** a side, or floating from the centre */
  sourceHandle?: HandleId; targetHandle?: HandleId;
  /** else the template's for the pair */
  style?: EdgeStyle;
  /** tension points the line passes through */
  bends?: Bend[];
  label?: Label; labelLayout?: "title" | "dot";
  /** else its ends', else the template's */
  highlight?: boolean; highlightMode?: HighlightMode;
};
export type Camera = { x: number; y: number; zoom: number };
/** a group: nodes that select and move together, with no box of their own (⌘G; ⌘⇧G ungroups; a double click on a member enters it) */
export type CanvasGroup = { id: string; ids: string[] };
export type CanvasDocument = {
  id: string;
  /** → Template */
  template: TemplateId;
  /** where the camera was */
  viewport?: Camera;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  /** nodes that select and move together */
  groups: CanvasGroup[];
};

export type Refusal = { what: "node" | "edge"; id: string; why: string };
/** every node and edge the template refuses; an empty list is a valid document */
export function check(doc: CanvasDocument, t: Template, all: Registrations): Refusal[] {
  const out: Refusal[] = [];
  const byId = new Map(doc.nodes.map((n) => [n.id, n]));
  for (const n of doc.nodes) {
    if (!(n.kind in all)) out.push({ what: "node", id: n.id, why: `no canvas registration for ${n.kind}` });
    else if (!allowsKind(t, all, n.kind)) out.push({ what: "node", id: n.id, why: `the template ${t.name} does not allow a ${n.kind}` });
    if (n.parentId && !byId.has(n.parentId)) out.push({ what: "node", id: n.id, why: `its parent ${n.parentId} is not in the document` });
  }
  for (const e of doc.edges) if (!byId.has(e.source) || !byId.has(e.target)) out.push({ what: "edge", id: e.id, why: "one of its ends is not in the document" });
  return out;
}
/** a change applied to the document, refused where the template says no */
export function accept(next: CanvasDocument, t: Template, all: Registrations): { doc: CanvasDocument; refused: Refusal[] } {
  const refused = check(next, t, all);
  if (!refused.length) return { doc: next, refused };
  const badNodes = new Set(refused.filter((r) => r.what === "node").map((r) => r.id)), badEdges = new Set(refused.filter((r) => r.what === "edge").map((r) => r.id));
  return { doc: { ...next, nodes: next.nodes.filter((n) => !badNodes.has(n.id)), edges: next.edges.filter((e) => !badEdges.has(e.id) && !badNodes.has(e.source) && !badNodes.has(e.target)) }, refused };
}
export const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));
export const addNode = (doc: CanvasDocument, n: CanvasNode) => ({ ...doc, nodes: [...doc.nodes, n] });
export const addEdge = (doc: CanvasDocument, e: CanvasEdge) => ({ ...doc, edges: [...doc.edges, e] });
