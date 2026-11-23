// THE EDGES — one React Flow edge type: the canvas's own line (floating ends, markers, tension points, orthogonal segments, the label) or the ERD drawing (`style.drawing === "erd"`: the cardinality written on the line).
// Brought as the first canvas drew them. No kind is named: a free end is the node whose registration says `freeEnd`.
import { BaseEdge, EdgeLabelRenderer, Position, getBezierPath, getSmoothStepPath, getStraightPath, useInternalNode, useReactFlow, type EdgeProps, type InternalNode } from "@xyflow/react";
import { useMemo, useState } from "react";
import type { Bend } from "../document";
import type { EdgeStyle, EndKind } from "../template";
import type { NodeData } from "../nodes/Node";
import { getEdgeParams } from "./floating";
import { CanvasEdgeLabel } from "./label/Label";
import type { EdgeData } from "./types";

const isFreeEnd = (n: InternalNode) => !!(n.data as NodeData | undefined)?.registration?.freeEnd;
/** an edge from the centre of one box to the centre of the other, cut at their borders (a floating edge) */
function intersection(node: InternalNode, other: InternalNode) {
  const w = (node.measured.width ?? node.width ?? 0) / 2, h = (node.measured.height ?? node.height ?? 0) / 2;
  const p = node.internals.positionAbsolute, o = other.internals.positionAbsolute;
  const x2 = p.x + w, y2 = p.y + h, x1 = o.x + (other.measured.width ?? other.width ?? 0) / 2, y1 = o.y + (other.measured.height ?? other.height ?? 0) / 2;
  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h), yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1)) || 0, xx3 = a * xx1, yy3 = a * yy1;
  return { x: w * (xx3 + yy3) + x2, y: h * (-xx3 + yy3) + y2 };
}

// ── the ERD explorer's edge (app/erd/graph.tsx FloatingEdge, getNodeIntersection, getEdgePosition, EdgeEnds: brought as they are, the line style from the edge's `path`) ──
function getEdgePosition(node: InternalNode, pt: { x: number; y: number }) {
  const n = node.internals.positionAbsolute;
  if (Math.round(pt.x) <= Math.round(n.x) + 1) return Position.Left;
  if (Math.round(pt.x) >= Math.round(n.x) + (node.measured.width ?? 0) - 1) return Position.Right;
  if (Math.round(pt.y) <= Math.round(n.y) + 1) return Position.Top;
  return Position.Bottom;
}
/** The cardinality of a line, written ON it right next to each end: the line is interrupted by it. */
function EdgeEnds({ d, one, many, color, opacity }: { d: string; one?: string; many?: string; color: string; opacity?: number }) {
  const ends = useMemo(() => {
    if (!one && !many) return null;
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d);
    const len = p.getTotalLength();
    const reach = (text: string | undefined, fromStart: boolean) => {
      const at = (l: number) => p.getPointAtLength(fromStart ? l : len - l);
      const p0 = at(0), p1 = at(Math.min(8, len / 3));
      const dx = p1.x - p0.x, dy = p1.y - p0.y, n = Math.hypot(dx, dy) || 1;
      const w = text ? text.length * 6.6 + 8 : 0;
      return Math.min(Math.max(12, (Math.abs(dx) / n) * (w / 2) + (Math.abs(dy) / n) * 8 + 6), len / 3);
    };
    const a = p.getPointAtLength(reach(one, true)), b = p.getPointAtLength(len - reach(many, false));
    return { one: { x: a.x, y: a.y }, many: { x: b.x, y: b.y } };
  }, [d, one, many]);
  if (!ends) return null;
  const label = (text: string, at: { x: number; y: number }) => {
    const w = text.length * 6.6 + 8;
    return (
      <g opacity={opacity}>
        <rect x={at.x - w / 2} y={at.y - 8} width={w} height={16} rx={4} style={{ fill: "var(--bg, #fff)" }} />
        <text x={at.x} y={at.y} style={{ fontSize: 11, fontFamily: "'SF Mono', Menlo, monospace", fontWeight: 600, fill: color, textAnchor: "middle", dominantBaseline: "central" }}>{text}</text>
      </g>
    );
  };
  return <>{one && label(one, ends.one)}{many && label(many, ends.many)}</>;
}
function ErdEdge({ id, source, target, data }: EdgeProps) {
  const sn = useInternalNode(source), tn = useInternalNode(target);
  const d = data as EdgeData;
  if (!sn || !tn) return null;
  const sp = intersection(sn, tn), tp = intersection(tn, sn);
  const sPos = getEdgePosition(sn, sp), tPos = getEdgePosition(tn, tp);
  const es = d.style.path ?? "bezier";
  let path: string;
  if (es === "step") [path] = getSmoothStepPath({ sourceX: sp.x, sourceY: sp.y, sourcePosition: sPos, targetX: tp.x, targetY: tp.y, targetPosition: tPos });
  else if (es === "straight") [path] = getStraightPath({ sourceX: sp.x, sourceY: sp.y, targetX: tp.x, targetY: tp.y });
  else [path] = getBezierPath({ sourceX: sp.x, sourceY: sp.y, sourcePosition: sPos, targetX: tp.x, targetY: tp.y, targetPosition: tPos });
  const color = d.style.color ?? d.erd?.color ?? "#3b82f6";
  return (
    <>
      <path id={id} className="react-flow__edge-path" d={path} strokeWidth={2} style={{ stroke: color }} />
      <EdgeEnds d={path} one={d.erd?.one} many={d.erd?.many} color={color} />
    </>
  );
}
/** the drawing by the edge's style: the ERD's, or the canvas's own line */
function CanvasEdgeView(props: EdgeProps) { return ((props.data ?? { style: {} }) as EdgeData).style.drawing === "erd" ? <ErdEdge {...props} /> : <LineEdge {...props} />; }
/** what an end draws: from the style's start and end; a line with no end said draws an arrow at its end */
export const endsOf = (st: EdgeStyle): { start: EndKind; end: EndKind } => ({ start: st.start ?? "none", end: st.end ?? "arrow" });
/** a marker per end kind, in a 10 by 10 box pointing right; it scales with the line's thickness and turns at the start (auto-start-reverse) */
function Marker({ id, kind, color }: { id: string; kind: EndKind; color: string }) {
  if (kind === "none") return null;
  // an open end is filled with a light tint of the line's own colour, never a theme variable (it read as blue inside a marker)
  // fill and stroke as inline styles: a stylesheet of the theme paints svg paths with its primary colour, and an attribute loses to it (seen in Daniel's browser, not in a bare one)
  const solid = { style: { fill: color, stroke: color, strokeWidth: 1 } }, open = { style: { fill: `color-mix(in srgb, ${color} 22%, white)`, stroke: color, strokeWidth: 1.4 } };
  const lineOnly = (w: number) => ({ style: { fill: "none", stroke: color, strokeWidth: w, strokeLinecap: "round" as const, strokeLinejoin: "round" as const } });
  const shape = kind === "arrow" ? <path d="M1 1 L9 5 L1 9 Z" {...solid} />
    : kind === "arrow-open" ? <path d="M1 1 L9 5 L1 9" {...lineOnly(1.4)} />
    : kind === "triangle" ? <path d="M1 1 L9 5 L1 9 Z" {...open} />
    : kind === "circle" ? <circle cx="5" cy="5" r="3.6" {...solid} />
    : kind === "circle-open" ? <circle cx="5" cy="5" r="3.6" {...open} />
    : kind === "diamond" ? <path d="M1 5 L5 1.5 L9 5 L5 8.5 Z" {...solid} />
    : kind === "diamond-open" ? <path d="M1 5 L5 1.5 L9 5 L5 8.5 Z" {...open} />
    : <path d="M8 1 L8 9" {...lineOnly(1.6)} />;
  return <marker id={id} viewBox="0 0 10 10" refX={kind === "bar" ? 8 : 8.5} refY="5" markerWidth="5" markerHeight="5" markerUnits="strokeWidth" orient="auto-start-reverse">{shape}</marker>;
}
/** the two ends of a floating line between two boxes, a free point being its own centre */
function endsBetween(s: InternalNode, t: InternalNode) {
  const centre = (n: InternalNode) => ({ x: n.internals.positionAbsolute.x + (n.measured.width ?? 0) / 2, y: n.internals.positionAbsolute.y + (n.measured.height ?? 0) / 2 });
  return { a: isFreeEnd(s) ? centre(s) : intersection(s, t), b: isFreeEnd(t) ? centre(t) : intersection(t, s) };
}
/** a line through its tension points: straight segments, or a curve through them (bezier); step lines go through orthoThrough; the label on the middle point or segment */
const throughBends = (pts: { x: number; y: number }[], kind: EdgeStyle["path"]): [string, number, number] => {
  const k = Math.floor((pts.length - 1) / 2), m = pts.length % 2 ? pts[k] : { x: (pts[k].x + pts[k + 1].x) / 2, y: (pts[k].y + pts[k + 1].y) / 2 };
  if (kind === "bezier") {
    // Catmull-Rom through every point, as cubic segments
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2; d += ` C ${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`; }
    return [d, m.x, m.y];
  }
  return [pts.map((p, i) => `${i ? "L" : "M"} ${p.x},${p.y}`).join(" "), m.x, m.y];
};
type Box = { x: number; y: number; w: number; h: number };
const boxOf = (n: InternalNode): Box => ({ x: n.internals.positionAbsolute.x, y: n.internals.positionAbsolute.y, w: n.measured.width ?? 0, h: n.measured.height ?? 0 });
/** an orthogonal line, Miro's way, between React Flow's two ends (a, leaving along sPos; b, entering along tPos).
 *  With no held point it is React Flow's own step route (getSmoothStepPath, square corners read back as points).
 *  Each held point (white) holds one segment, horizontal ("h", at its y) or vertical ("v", at its x); the line goes through them in order at right angles.
 *  Returns the corners and, per segment, the held point it lies on (null: a free segment, drawn blue) */
export const orthoRoute = (a: { x: number; y: number }, sPos: Position, held: Bend[], b: { x: number; y: number }, tPos: Position) => {
  if (!held.length) {
    const [d] = getSmoothStepPath({ sourceX: a.x, sourceY: a.y, sourcePosition: sPos, targetX: b.x, targetY: b.y, targetPosition: tPos, borderRadius: 0 });
    const nums = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number), pts: { x: number; y: number }[] = [];
    for (let k = 0; k + 1 < nums.length; k += 2) { const q = { x: nums[k], y: nums[k + 1] }, l = pts[pts.length - 1]; if (!l || Math.abs(l.x - q.x) > 0.5 || Math.abs(l.y - q.y) > 0.5) pts.push(q); }
    // one point per corner: a point on a straight run between its neighbours goes
    const corners = pts.filter((q, k) => k === 0 || k === pts.length - 1 || !((Math.abs(pts[k - 1].x - q.x) < 0.5 && Math.abs(q.x - pts[k + 1].x) < 0.5) || (Math.abs(pts[k - 1].y - q.y) < 0.5 && Math.abs(q.y - pts[k + 1].y) < 0.5)));
    return { pts: corners, owner: corners.slice(1).map(() => null as number | null) };
  }
  const off = 20, out = (p: { x: number; y: number }, pos: Position) => ({ x: p.x + (pos === Position.Right ? off : pos === Position.Left ? -off : 0), y: p.y + (pos === Position.Bottom ? off : pos === Position.Top ? -off : 0) });
  const vert = (pos: Position) => pos === Position.Top || pos === Position.Bottom;
  const sa = out(a, sPos), eb = out(b, tPos);
  const pts: { x: number; y: number }[] = [a, sa];
  let cur = sa, last: "h" | "v" = vert(sPos) ? "v" : "h";
  for (const c of held) {
    const ax = c.axis ?? "h";
    // onto the held line: a vertical move to its y (h), or a horizontal move to its x (v)
    cur = ax === "h" ? { x: cur.x, y: c.y } : { x: c.x, y: cur.y };
    pts.push(cur); last = ax;
  }
  // into b: along the last line to b's stub, then in
  if (last === "h") pts.push({ x: eb.x, y: cur.y }, eb); else pts.push({ x: cur.x, y: eb.y }, eb);
  pts.push(b);
  const clean = pts.filter((q, k) => !k || Math.abs(q.x - pts[k - 1].x) > 0.5 || Math.abs(q.y - pts[k - 1].y) > 0.5);
  // a segment is held when it lies on a held point's line
  const owner = clean.slice(0, -1).map((p, k) => { const q = clean[k + 1], hz = Math.abs(p.y - q.y) < 0.5; const i = held.findIndex((c) => (c.axis ?? "h") === (hz ? "h" : "v") && Math.abs((hz ? c.y - p.y : c.x - p.x)) < 0.5); return i >= 0 ? i : null; });
  return { pts: clean, owner };
};
/** where a new tension point goes in the list: on the segment nearest to it */
export const bendIndex = (pts: { x: number; y: number }[], q: { x: number; y: number }) => {
  let best = 0, bd = Infinity;
  for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], r = pts[i + 1], dx = r.x - p.x, dy = r.y - p.y, l = dx * dx + dy * dy || 1, u = Math.max(0, Math.min(1, ((q.x - p.x) * dx + (q.y - p.y) * dy) / l)), dd = Math.hypot(p.x + u * dx - q.x, p.y + u * dy - q.y); if (dd < bd) { bd = dd; best = i; } }
  return best;
};
/** the last press on a tension handle (kept outside the edge: React Flow may remount it between two presses) */
let LAST_PRESS = { id: "", k: -1, t: 0 };
function LineEdge(props: EdgeProps) {
  const d = (props.data ?? { style: {} }) as EdgeData;
  const { id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected } = props;
  const flow = useReactFlow();
  const s = useInternalNode(source), t = useInternalNode(target);
  // an end on a side handle: React Flow's own position for it; an end on the centre handle floats: React Flow's floating edge (getEdgeParams)
  let a = { x: sourceX, y: sourceY }, b = { x: targetX, y: targetY }, sPos = sourcePosition, tPos = targetPosition;
  if (s && t) { const f = getEdgeParams(s, t), fx = d.fixed ?? { source: false, target: false }; if (!fx.source) { a = { x: f.sx, y: f.sy }; sPos = f.sourcePos; } if (!fx.target) { b = { x: f.tx, y: f.ty }; tPos = f.targetPos; } }
  // a tension point being dragged: its index and where it is now
  const [bending, setBending] = useState<{ i: number; x: number; y: number } | null>(null);
  // an orthogonal line: the held points (a segment being dragged: the list as it will be)
  const [holding, setHolding] = useState<Bend[] | null>(null);
  const ortho = d.style.path === "step" && s && t ? orthoRoute(a, sPos, holding ?? d.bends ?? [], b, tPos) : null;
  /** drag a segment of an orthogonal line across: a free one (blue) becomes held (white), a held one moves */
  const grabSegment = (k: number) => (e: React.PointerEvent) => {
    if (!ortho) return;
    e.stopPropagation(); e.preventDefault();
    // a second press on the same held handle within 350ms lets it go (the browser's dblclick does not fire after a prevented press)
    const now = Date.now(), own0 = ortho.owner[k];
    if (own0 !== null && LAST_PRESS.id === id && LAST_PRESS.k === k && now - LAST_PRESS.t < 400) { LAST_PRESS = { id: "", k: -1, t: 0 }; d.setBends?.((d.bends ?? []).filter((_, i) => i !== own0)); return; }
    LAST_PRESS = { id, k, t: now };
    const p = ortho.pts[k], q = ortho.pts[k + 1], axis: "h" | "v" = Math.abs(p.y - q.y) < 0.5 ? "h" : "v", own = ortho.owner[k];
    const held = d.bends ?? [];
    // a free segment goes in among the held ones in the order along the line; with none held, it is the first
    const at = own ?? ortho.owner.slice(0, k).filter((o) => o !== null).reduce((n, o, i, arr) => (arr.indexOf(o) === i ? n + 1 : n), 0);
    const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
    let next: Bend[] = held;
    const move = (ev: PointerEvent) => {
      const m = flow.screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
      const b: Bend = axis === "h" ? { x: mid.x, y: m.y, axis } : { x: m.x, y: mid.y, axis };
      next = own !== null ? held.map((x, i) => (i === own ? b : x)) : [...held.slice(0, at), b, ...held.slice(at)];
      setHolding(next);
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); setHolding(null); if (next !== held) d.setBends?.(next); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  const bends = (d.bends ?? []).map((p, i) => (bending?.i === i ? { x: bending.x, y: bending.y } : p));
  const grabBend = (i: number) => (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    let last: { x: number; y: number } | null = null;
    const move = (ev: PointerEvent) => { last = flow.screenToFlowPosition({ x: ev.clientX, y: ev.clientY }); setBending({ i, ...last }); };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); setBending(null); if (last) d.setBends?.((d.bends ?? []).map((p, k) => (k === i ? last! : p))); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  const args = { sourceX: a.x, sourceY: a.y, targetX: b.x, targetY: b.y, sourcePosition: sPos, targetPosition: tPos };
  const [rawPath, lx, ly] = ortho && !(holding ?? d.bends ?? []).length ? getSmoothStepPath(args) : ortho ? [ortho.pts.map((v, i) => `${i ? "L" : "M"} ${v.x},${v.y}`).join(" "), (ortho.pts[1].x + ortho.pts[2]?.x) / 2 || ortho.pts[1].x, (ortho.pts[1].y + ortho.pts[2]?.y) / 2 || ortho.pts[1].y] as [string, number, number] : bends.length ? throughBends([a, ...bends, b], d.style.path) : d.style.path === "bezier" ? getBezierPath(args) : d.style.path === "step" ? getSmoothStepPath(args) : getStraightPath(args);
  let path = rawPath;
  const color = d.style.color ?? "#8a8a8a", ends = endsOf(d.style), mk = `${id}-${color.replace(/[^a-z0-9]/gi, "")}`;
  const [draft, setDraft] = useState("");
  return (
    <>
      <defs><Marker id={`m-${mk}-s`} kind={ends.start} color={color} /><Marker id={`m-${mk}-e`} kind={ends.end} color={color} /></defs>
      <BaseEdge id={id} path={path} markerStart={ends.start !== "none" ? `url(#m-${mk}-s)` : undefined} markerEnd={ends.end !== "none" ? `url(#m-${mk}-e)` : undefined} interactionWidth={16}
        style={{ stroke: selected ? "var(--primary, #4338ca)" : color, strokeWidth: (d.style.width ?? 1.4) + (selected ? 0.8 : 0), strokeDasharray: d.style.dotted ? "1.5 4" : d.style.dashed ? "6 4" : undefined, strokeLinecap: d.style.dotted ? "round" : undefined }} />
      {selected && d.setBends ? <EdgeLabelRenderer>{ortho ? ortho.pts.slice(0, -1).map((p, k) => { const q = ortho.pts[k + 1], own = ortho.owner[k], held = own !== null; return (
        <div key={`seg-${k}`} onPointerDown={grabSegment(k)} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()} className="nodrag nopan" data-testid={`edge-segment-${k}`} title={held ? "drag; double click lets it go" : "drag to move this segment"}
          style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${(p.x + q.x) / 2}px, ${(p.y + q.y) / 2}px)`, width: held ? 12 : 9, height: held ? 12 : 9, borderRadius: 6, background: held ? "var(--bg, #fff)" : "var(--primary, #4338ca)", border: held ? "2px solid var(--primary, #4338ca)" : "1.5px solid var(--bg, #fff)", cursor: Math.abs(p.y - q.y) < 0.5 ? "ns-resize" : "ew-resize", pointerEvents: "all", zIndex: 6 }} />
      ); }) : null}{!ortho ? bends.map((p, i) => (
        <div key={`bend-${i}`} onPointerDown={grabBend(i)} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onDoubleClick={(e) => { e.stopPropagation(); d.setBends?.((d.bends ?? []).filter((_, k) => k !== i)); }} className="nodrag nopan" data-testid={`edge-bend-${i}`} title="drag; double click removes it"
          style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`, width: 10, height: 10, borderRadius: 5, background: "var(--primary, #4338ca)", border: "2px solid var(--bg, #fff)", cursor: "move", pointerEvents: "all", zIndex: 6 }} />
      )) : null}</EdgeLabelRenderer> : null}
      {d.inline?.editing ? (
        <EdgeLabelRenderer>
          <div style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)`, pointerEvents: "all" }} className="nodrag nopan">
            <input autoFocus defaultValue={d.label?.title ?? ""} onChange={(e) => setDraft(e.target.value)} onFocus={(e) => { setDraft(e.target.value); e.target.select(); }}
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") d.inline?.commit((e.target as HTMLInputElement).value); if (e.key === "Escape") d.inline?.cancel(); }}
              onBlur={() => d.inline?.commit(draft)} data-testid="edge-label-input"
              style={{ font: "12px var(--sans, system-ui)", padding: "3px 8px", border: "1px solid var(--primary, #4338ca)", borderRadius: 4, background: "var(--bg, #fff)", minWidth: 80, outline: "none" }} />
          </div>
        </EdgeLabelRenderer>
      ) : d.label?.title ? (
        <EdgeLabelRenderer>
          <div style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)`, pointerEvents: "all" }} className="nodrag nopan" onDoubleClick={(e) => { if (!d.inline) return; e.stopPropagation(); d.inline.start(); }}>
            <CanvasEdgeLabel layout={d.labelLayout ?? "title"} data={d.label} edit={d.edit} />
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const edgeTypes = { canvas: CanvasEdgeView };
