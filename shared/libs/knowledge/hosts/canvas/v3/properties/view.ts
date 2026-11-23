// CLICK TO HIGHLIGHT, as shown: the nodes and lines React Flow draws while a focus is lit. A click on a node that has the property lights it and the nodes it connects to and dims the rest;
// a line that has it shows its label only while it touches the focused node. The property is resolved by highlight.ts (node → frame → template defaults); a line with no value takes its ends'.
import type { Edge, Node } from "@xyflow/react";
import type { CanvasDocument } from "../document";
import type { Template } from "../template";
import type { EdgeData } from "../edges/types";
import { highlightOf, modeOf } from "./highlight";

/** the result for an object, kept while the object and the way it is shown stay the same: a drag renews one node a frame, and every other node and line must stay the very same object (React Flow skips what did not change) */
const MEMO = new WeakMap<object, { key: string; out: object }>();
const memo = <T extends object>(o: T, key: string, make: () => T): T => { const m = MEMO.get(o); if (m && m.key === key) return m.out as T; const out = make(); MEMO.set(o, { key, out }); return out; };

function scope(doc: CanvasDocument, edges: Edge[], t: Template, focus: string | null) {
  const byId = new Map(doc.nodes.map((n) => [n.id, n]));
  const on = (id: string) => { const n = byId.get(id); return !!n && highlightOf(n, doc, t); };
  const active = focus && on(focus) ? focus : null;
  const spot = !!active && modeOf(byId.get(active)!, doc, t) === "spotlight";
  const near = new Set<string>(active ? [active] : []);
  if (active) for (const e of edges) { if (e.source === active) near.add(e.target); if (e.target === active) near.add(e.source); }
  return { on, active, spot, near };
}
/** the nodes as shown while `focus` is set: the ones that do not connect to it dimmed (a class): those with the property, or every one in the spotlight mode */
export function focusedNodes(nodes: Node[], edges: Edge[], doc: CanvasDocument, t: Template, focus: string | null): Node[] {
  const { on, active, spot, near } = scope(doc, edges, t, focus);
  if (!active) return nodes;
  return nodes.map((n) => ((spot || on(n.id)) && !near.has(n.id) ? memo(n, "dim", () => ({ ...n, className: `${n.className ?? ""} canvas-dim`.trim() })) : n));
}
/** the lines as shown while `focus` is set: the ones with the property that do not touch it lose their label, and dim while a focus is lit */
export function focusedEdges(edges: Edge[], doc: CanvasDocument, t: Template, focus: string | null): Edge[] {
  const { on, active, spot } = scope(doc, edges, t, focus);
  const out = edges.map((e) => {
    const d = e.data as EdgeData | undefined;
    const touches = !!active && (e.source === active || e.target === active);
    const own = !!(d?.highlight ?? (on(e.source) || on(e.target)));
    if (!own && !(spot && !touches)) return e;
    if (touches || e.selected) return e;
    return memo(e, `${own}|${!!active}`, () => ({
      ...e, className: active ? `${e.className ?? ""} canvas-dim`.trim() : e.className,
      data: own && d ? { ...d, label: undefined, erd: d.erd ? { ...d.erd, one: undefined, many: undefined } : undefined } : d,
    }));
  });
  return out.every((e, i) => e === edges[i]) ? edges : out;
}
