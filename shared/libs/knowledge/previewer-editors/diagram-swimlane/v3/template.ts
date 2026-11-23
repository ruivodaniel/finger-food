// A TEMPLATE of the swimlane: the shapes an instance may place, the rules of the flow and of the connections, the default colours. BPMN is the one template today.
// A rule answers with the reason it refuses, or null when it allows: the surface shows the reason.
import type { Diagram, DiagramNode, ElementColors, Kind } from "./types";

export type ShapeRule = { kind: Kind; name: string; /** how it is drawn */ form: "circle" | "box" | "diamond" | "note" | "code"; mark?: string; /** how many connectors may come in and go out; null: any number */ maxIn: number | null; maxOut: number | null; /** it carries a text the person types */ text: boolean };
export type Template = {
  id: string; name: string; shapes: ShapeRule[];
  /** the lanes' colours, taken in order */
  laneColors: string[];
  elementColors: Required<ElementColors>;
  /** may this shape be placed (a new one, or a move)? */
  canPlace: (d: Diagram, node: DiagramNode) => string | null;
  /** may a connector go from one shape to the other? */
  canConnect: (d: Diagram, from: string, to: string) => string | null;
};

const shapes: ShapeRule[] = [
  { kind: "start", name: "start", form: "circle", maxIn: 0, maxOut: 1, text: false },
  { kind: "action", name: "action", form: "box", maxIn: null, maxOut: 1, text: true },
  { kind: "only-one", name: "only one happens", form: "diamond", mark: "✕", maxIn: null, maxOut: null, text: false },
  { kind: "all", name: "all happen", form: "diamond", mark: "+", maxIn: null, maxOut: null, text: false },
  { kind: "note", name: "note", form: "note", maxIn: 0, maxOut: 0, text: false },
  { kind: "code", name: "code", form: "code", maxIn: 0, maxOut: 0, text: false },
  { kind: "end", name: "end", form: "circle", maxIn: null, maxOut: 0, text: false },
];
const rule = (k: Kind) => shapes.find((s) => s.kind === k)!;

export const bpmn: Template = {
  id: "bpmn", name: "BPMN", shapes,
  // no colour by position: the lanes take turns between the background and a light grey (the theme's gray-100, as its light value: the swimlane draws itself light whatever the theme).
  // A consumer that wants a lane in a colour sets it on the lane or in `laneColors`.
  laneColors: ["#ffffff", "#f3f4f6"],
  elementColors: { start: "#ffffff", end: "#1a1a1a", action: "#ffffff", "only-one": "#f4c6c6", all: "#c9eed4", note: "#fdf3c4", code: "#1f2430", connector: "#5a5a5a" },
  canPlace: (d, node) => {
    if (!d.lanes.some((l) => l.id === node.lane)) return "there is no such lane";
    if (node.kind === "note" || node.kind === "code") return node.attachedTo && d.nodes.some((n) => n.id === node.attachedTo && n.kind !== "note" && n.kind !== "code") ? null : `a ${node.kind === "note" ? "note" : "code snippet"} sits next to an action or a decision: drop it on one`;
    if (node.kind === "start" && d.nodes.some((n) => n.kind === "start" && n.id !== node.id)) return "a diagram has one start";
    if (d.nodes.some((n) => n.id !== node.id && n.kind !== "note" && n.kind !== "code" && n.lane === node.lane && n.order === node.order)) return "there is already a shape there";
    return null;
  },
  canConnect: (d, from, to) => {
    const a = d.nodes.find((n) => n.id === from), b = d.nodes.find((n) => n.id === to);
    if (!a || !b) return "there is no such shape";
    if (a.id === b.id) return "a shape does not connect to itself";
    if (d.edges.some((e) => e.from === from && e.to === to)) return "they are already connected";
    const ra = rule(a.kind), rb = rule(b.kind);
    const out = d.edges.filter((e) => e.from === from).length, into = d.edges.filter((e) => e.to === to).length;
    if (ra.maxOut === 0) return a.kind === "note" || a.kind === "code" ? `a ${ra.name} has no connectors` : `${ra.name === "end" ? "an end" : "a " + ra.name} has no connector out`;
    if (rb.maxIn === 0) return b.kind === "note" || b.kind === "code" ? `a ${rb.name} has no connectors` : "nothing goes into a start";
    if (ra.maxOut !== null && out >= ra.maxOut) return a.kind === "action" ? "an action has one connector out: to go to several, put an all happen after it" : `a ${ra.name} has one connector out`;
    if (rb.maxIn !== null && into >= rb.maxIn) return `a ${rb.name} takes no more connectors`;
    return null;
  },
};
export const TEMPLATES: Record<string, Template> = { bpmn };
