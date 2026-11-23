// WHERE EVERYTHING IS: the diagram and the direction in, boxes and connector paths out. Pure: no DOM, no measuring, so the same diagram is drawn the same everywhere.
// Worked out with the lanes as columns and the flow going down (across = the lanes' axis, along = the flow's axis); horizontal swaps the two axes at the end.
import type { Diagram, DiagramEdge, DiagramNode, Direction, Kind } from "./types";

export type Box = { x: number; y: number; w: number; h: number };
export type Placed = { node: DiagramNode; box: Box };
export type Route = { edge: DiagramEdge; points: [number, number][]; /** where the label is written: next to the shape the connector leaves */ label: { x: number; y: number; anchor: "start" | "end" } };
export type Layout = { width: number; height: number; /** the lanes' strip that stays: its size along the flow */ header: number; lanes: { id: string; box: Box; head: Box }[]; cells: { lane: string; order: number; box: Box }[]; nodes: Placed[]; routes: Route[]; orders: number };

/** the measures, in px. A lane is as wide as it needs for one shape and the connectors that pass beside it; a step is one order along the flow */
export const MEASURE = { lane: 230, row: 124, step: 92, header: 36, pad: 22, side: 26 };
const SIZE: Record<Kind, { w: number; h: number }> = { start: { w: 44, h: 44 }, end: { w: 44, h: 44 }, action: { w: 150, h: 46 }, "only-one": { w: 56, h: 56 }, all: { w: 56, h: 56 }, note: { w: 18, h: 18 }, code: { w: 36, h: 36 } };

export function layout(d: Diagram, direction: Direction, extraOrders = 0): Layout {
  const M = MEASURE, flip = direction === "horizontal", LA = flip ? M.row : M.lane;
  const flow = d.nodes.filter((n) => n.kind !== "note" && n.kind !== "code");
  const orders = Math.max(0, ...flow.map((n) => n.order + 1)) + extraOrders;
  const laneAt = new Map(d.lanes.map((l, i) => [l.id, i]));
  // in the working frame: a = across (the lanes), l = along (the flow)
  type F = { a: number; l: number; wa: number; wl: number };
  const frame = new Map<string, F>();
  for (const n of flow) {
    const s = SIZE[n.kind], wa = flip ? s.h : s.w, wl = flip ? s.w : s.h, i = laneAt.get(n.lane) ?? 0;
    frame.set(n.id, { a: i * LA + (LA - wa) / 2, l: M.header + M.pad + n.order * step(flip) + (cell(flip) - wl) / 2, wa, wl });
  }
  // a note or a code snippet sits at the corner of its shape, outside it; several queue along the shape
  const notes = new Map<string, number>();
  for (const n of d.nodes.filter((x) => x.kind === "note" || x.kind === "code")) {
    const host = n.attachedTo ? frame.get(n.attachedTo) : undefined; if (!host) continue;
    const k = notes.get(n.attachedTo!) ?? 0; notes.set(n.attachedTo!, k + 1); const s = SIZE[n.kind];
    frame.set(n.id, flip ? { a: host.a - 10, l: host.l + host.wl + 6 + k * 40, wa: s.w, wl: s.h } : { a: host.a + host.wa + 6 + k * 40, l: host.l - 8, wa: s.w, wl: s.h });
  }
  const across = d.lanes.length * LA, along = M.header + M.pad * 2 + Math.max(1, orders) * step(flip) - (step(flip) - cell(flip));
  const out = (a: number, l: number, wa: number, wl: number): Box => (flip ? { x: l, y: a, w: wl, h: wa } : { x: a, y: l, w: wa, h: wl });
  const pt = (a: number, l: number): [number, number] => (flip ? [l, a] : [a, l]);

  const routes: Route[] = [];
  for (const e of d.edges) {
    const A = frame.get(e.from), B = frame.get(e.to); if (!A || !B) continue;
    const a = d.nodes.find((n) => n.id === e.from)!, b = d.nodes.find((n) => n.id === e.to)!;
    const ac = A.a + A.wa / 2, bc = B.a + B.wa / 2, al = A.l + A.wl / 2, bl = B.l + B.wl / 2;
    const gate = a.kind === "only-one" || a.kind === "all", sameLane = a.lane === b.lane, d0 = b.order - a.order;
    let p: [number, number][], lab: [number, number], anchor: "start" | "end" = "start";
    if (d0 > 0 && sameLane && d0 === 1) { p = [[ac, A.l + A.wl], [bc, B.l]]; lab = [ac + 6, A.l + A.wl + 14]; }
    else if (d0 > 0 && sameLane) { // past shapes of its own lane: around them, by the lane's side
      const i = laneAt.get(a.lane) ?? 0, left = e.side === "left", side = left ? i * LA + M.side : i * LA + LA - M.side;
      p = left ? [[A.a, al], [side, al], [side, bl], [B.a, bl]] : [[A.a + A.wa, al], [side, al], [side, bl], [B.a + B.wa, bl]];
      lab = left ? [A.a - 6, al - 6] : [A.a + A.wa + 6, al - 6]; if (left) anchor = "end";
    } else if (d0 > 0 && gate) { // a decision leaves by the side that faces the lane it goes to, then turns into the shape
      const right = bc > ac, from = right ? A.a + A.wa : A.a; p = [[from, al], [bc, al], [bc, B.l]]; lab = [from + (right ? 6 : -6), al - 6]; anchor = right ? "start" : "end";
    } else if (d0 > 0) { const mid = B.l - (step(flip) - cell(flip)) / 2 - (cell(flip) - B.wl) / 2; p = [[ac, A.l + A.wl], [ac, mid], [bc, mid], [bc, B.l]]; lab = [ac + 6, A.l + A.wl + 14]; }
    else if (d0 === 0) { const right = bc > ac; p = [[right ? A.a + A.wa : A.a, al], [right ? B.a : B.a + B.wa, bl]]; lab = [(right ? A.a + A.wa : A.a) + (right ? 6 : -6), al - 6]; anchor = right ? "start" : "end"; }
    else { // back: out by the far side of its lane, up the lane's edge, into the shape's side
      const i = laneAt.get(a.lane) ?? 0, j = laneAt.get(b.lane) ?? 0, edge = Math.min(i, j) * LA + M.side - 8;
      p = [[A.a, al], [edge, al], [edge, bl], [B.a, bl]]; lab = [A.a - 6, al - 6]; anchor = "end";
    }
    const [lx, ly] = pt(lab[0], lab[1]);
    routes.push({ edge: e, points: p.map(([x, y]) => pt(x, y)), label: { x: lx, y: ly, anchor: flip ? "start" : anchor } });
  }
  const cells: Layout["cells"] = [];
  d.lanes.forEach((ln, i) => { for (let o = 0; o < Math.max(1, orders); o++) cells.push({ lane: ln.id, order: o, box: out(i * LA, M.header + M.pad + o * step(flip) - (step(flip) - cell(flip)) / 2, LA, step(flip)) }); });
  return {
    width: flip ? along : across, height: flip ? across : along, header: M.header, orders,
    lanes: d.lanes.map((ln, i) => ({ id: ln.id, box: out(i * LA, 0, LA, along), head: out(i * LA, 0, LA, M.header) })),
    cells, nodes: d.nodes.filter((n) => frame.has(n.id)).map((n) => { const f = frame.get(n.id)!; return { node: n, box: out(f.a, f.l, f.wa, f.wl) }; }),
    routes,
  };
}
/** one order along the flow: taller when the flow goes down, wider when it goes right (an action is wider than tall) */
const cell = (flip: boolean) => (flip ? 150 : 56);
const step = (flip: boolean) => (flip ? 150 + 44 : MEASURE.step);
