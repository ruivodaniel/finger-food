// HIGHLIGHT — click to highlight: a click on a node lights it and the nodes it connects to, and dims the rest. One property on nodes and lines.
// Levels: the node [N] → the frame or container it is in → the template's defaults. The kind says nothing: it does not know the drawing it will be in. A line: its own, else its ends', else the template's.
import type { HighlightMode } from "../canvas-registration";
import type { CanvasDocument, CanvasEdge, CanvasNode } from "../document";
import type { Template } from "../template";

const parentsOf = (doc: CanvasDocument) => new Map(doc.nodes.map((n) => [n.id, n]));
function upwards<K extends "highlight" | "highlightMode">(n: CanvasNode, doc: CanvasDocument, key: K): CanvasNode[K] {
  const byId = parentsOf(doc);
  for (let cur: CanvasNode | undefined = n; cur; cur = cur.parentId ? byId.get(cur.parentId) : undefined) if (cur[key] !== undefined) return cur[key];
  return undefined;
}
// Levels: the node → its frame or container → the template's override for the kind → the template's defaults
export const highlightOf = (n: CanvasNode, doc: CanvasDocument, t: Template): boolean => upwards(n, doc, "highlight") ?? t.overrides?.[n.kind]?.highlight ?? t.defaults.highlight;
export const modeOf = (n: CanvasNode, doc: CanvasDocument, t: Template): HighlightMode => upwards(n, doc, "highlightMode") ?? t.overrides?.[n.kind]?.highlightMode ?? t.defaults.highlightMode;
export function edgeHighlightOf(e: CanvasEdge, doc: CanvasDocument, t: Template): boolean {
  if (e.highlight !== undefined) return e.highlight;
  const byId = parentsOf(doc), s = byId.get(e.source), d = byId.get(e.target);
  return (s ? highlightOf(s, doc, t) : false) || (d ? highlightOf(d, doc, t) : false);
}
/** what a lit focus leaves visible: the focused node, its neighbours and the lines between; scoped keeps every node with highlight off as it is, spotlight dims it too */
export function focus(doc: CanvasDocument, t: Template, focusId: string): { lit: Set<string>; dimmed: Set<string> } {
  const lit = new Set<string>([focusId]);
  for (const e of doc.edges) { if (e.source === focusId) lit.add(e.target); if (e.target === focusId) lit.add(e.source); }
  const dimmed = new Set<string>();
  for (const n of doc.nodes) {
    if (lit.has(n.id)) continue;
    if (modeOf(n, doc, t) === "spotlight" || highlightOf(n, doc, t)) dimmed.add(n.id);
  }
  return { lit, dimmed };
}
