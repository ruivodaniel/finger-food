// TEMPLATE — a kind of canvas: what it allows and how things are done in it. One file per template, in the slice (canvas/templates/<name>.ts). Config only; every line that honours it is in the canvas.
import type { CanvasRegistration, HandleId, HighlightMode, KindId, LayoutId, LayoutOnCanvas, Registrations, Tool } from "./canvas-registration";

/** the id of a template: "free", "erd", "sitemap" */
export type TemplateId = string;
export type EndKind = "none" | "arrow" | "arrow-open" | "triangle" | "circle" | "circle-open" | "diamond" | "diamond-open" | "bar";
export type EdgeStyle = { path?: "bezier" | "straight" | "step"; dashed?: boolean; /** the line: dotted beats dashed */ dotted?: boolean; width?: number; color?: string; start?: EndKind; end?: EndKind; animated?: boolean; /** erd: the cardinality marks the ends read from the data */ drawing?: "line" | "erd" };
export const END_KINDS: EndKind[] = ["none", "arrow", "arrow-open", "triangle", "circle", "circle-open", "diamond", "diamond-open", "bar"];
/** the pair key of a byPair entry: "a>b"; "*" on either side matches any kind */
export type PairKey = `${KindId}>${KindId}`;
export type Viewport = { minZoom: number; maxZoom: number; fitView: boolean; background: "dots" | "lines" | "cross" | "none"; /** the background's gap and the snapping grid */ grid: number; snap: boolean; /** below this many screen pixels of a text's size, the registration's farAway applies */ unreadableBelowPx: number };

export type Template = {
  id: TemplateId;
  name: string;
  /** only these kinds; ERD: table and note */
  allow?: KindId[];
  /** every kind but these. Neither allow nor disallow: every registration the canvas was given. Both: an error */
  disallow?: KindId[];
  /** the same rule for the toolbox */
  tools?: { allow?: Tool[]; disallow?: Tool[] };
  /** per kind, the [T] fields set otherwise for this canvas: the layout it opens in, and per layout its box, handles, satellites, far-away view */
  overrides?: Partial<Record<KindId, { layout?: Partial<CanvasRegistration["layout"]>; layouts?: Partial<Record<LayoutId, Partial<LayoutOnCanvas>>> }>>;
  /** the line between two kinds; derived: lines from the data (ERD keys); loose: any handle is either end */
  edges: { default: EdgeStyle; byPair: Partial<Record<PairKey, EdgeStyle>>; derived?: boolean; connection: "strict" | "loose"; /** the next line drawn takes the style of the last one touched, when the pair has no style of its own */ rememberLast?: boolean };
  /** how a new drawing is laid out */
  arrange: "grid" | "dagre" | "none";
  /** the gaps arrange keeps */
  distances: { x: number; y: number };
  viewport: Viewport;
  /** for every node that says nothing, at any level */
  defaults: { highlight: boolean; highlightMode: HighlightMode; handles: HandleId[] };
};

/** the registrations this template lets on the canvas: its allow list, or every one but its disallow list. Both set is an error, said once at the template */
export function allowedKinds(t: Template, all: Registrations): KindId[] {
  if (t.allow && t.disallow) throw new Error(`template ${t.id}: allow and disallow are both set`);
  const kinds = Object.keys(all);
  if (t.allow) return t.allow.filter((k) => k in all);
  if (t.disallow) return kinds.filter((k) => !t.disallow!.includes(k));
  return kinds;
}
export const allowsKind = (t: Template, all: Registrations, kind: KindId) => allowedKinds(t, all).includes(kind);
export function allowsTool(t: Template, tool: Tool): boolean {
  if (t.tools?.allow && t.tools?.disallow) throw new Error(`template ${t.id}: tools.allow and tools.disallow are both set`);
  if (t.tools?.allow) return t.tools.allow.includes(tool);
  if (t.tools?.disallow) return !t.tools.disallow.includes(tool);
  return true;
}
/** the registration as this template sees it: the [T] fields overridden, per layout */
export function registrationIn(t: Template, all: Registrations, kind: KindId): CanvasRegistration | undefined {
  const r = all[kind];
  if (!r) return undefined;
  const o = t.overrides?.[kind];
  if (!o) return r;
  const layouts = { ...r.layouts };
  for (const [id, over] of Object.entries(o.layouts ?? {})) if (over && layouts[id]) layouts[id] = { ...layouts[id], ...over };
  return { ...r, layout: { ...r.layout, ...(o.layout ?? {}) }, layouts };
}
/** the edge style for a pair of kinds: by pair, a wildcard on either side, else the default */
export const edgeStyleFor = (t: Template, source: KindId, target: KindId): EdgeStyle => t.edges.byPair[`${source}>${target}`] ?? t.edges.byPair[`*>${target}`] ?? t.edges.byPair[`${source}>*`] ?? t.edges.default;
