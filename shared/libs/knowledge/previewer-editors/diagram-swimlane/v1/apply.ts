// The next diagram after an event: for a consumer that keeps the diagram and has nothing else to do with an event. Pure.
import type { Diagram, DiagramEvent } from "./types";

export function apply(d: Diagram, e: DiagramEvent): Diagram {
  switch (e.type) {
    case "node-added": return { ...d, nodes: [...d.nodes, e.node] };
    case "node-moved": return { ...d, nodes: d.nodes.map((n) => (n.id === e.id ? { ...n, lane: e.lane, order: e.order } : n)) };
    case "node-renamed": return { ...d, nodes: d.nodes.map((n) => (n.id === e.id ? { ...n, text: e.text } : n)) };
    case "note-changed": return { ...d, nodes: d.nodes.map((n) => (n.id === e.id ? { ...n, note: e.note } : n)) };
    case "code-changed": return { ...d, nodes: d.nodes.map((n) => (n.id === e.id ? { ...n, code: e.code } : n)) };
    // a shape goes with its connectors and with the notes and code snippets next to it
    case "node-deleted": { const gone = new Set([e.id, ...d.nodes.filter((n) => n.attachedTo === e.id).map((n) => n.id)]); return { ...d, nodes: d.nodes.filter((n) => !gone.has(n.id)), edges: d.edges.filter((x) => !gone.has(x.from) && !gone.has(x.to)) }; }
    case "edge-added": return { ...d, edges: [...d.edges, e.edge] };
    case "edge-renamed": return { ...d, edges: d.edges.map((x) => (x.id === e.id ? { ...x, label: e.label || undefined } : x)) };
    case "edge-deleted": return { ...d, edges: d.edges.filter((x) => x.id !== e.id) };
    case "lane-added": return { ...d, lanes: [...d.lanes, e.lane] };
    case "lane-renamed": return { ...d, lanes: d.lanes.map((l) => (l.id === e.id ? { ...l, name: e.name } : l)) };
    default: return d;
  }
}
