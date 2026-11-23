// THE CANVAS component: a document in, the drawing out; in edit mode every change goes back through `onChange` (the consumer saves). React Flow lives inside, never outside. The template says
// what the canvas allows and how things are done; the registrations say what each kind is. Every behaviour here is resolved from them (properties/*): no kind is named in this file.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Background, Panel, ReactFlow, ViewportPortal, ReactFlowProvider, SelectionMode, applyNodeChanges, useReactFlow, useStore, type Connection, type Edge, type EdgeChange, type Node, type NodeChange, type Viewport } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Icon } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { ToolButton } from "./tools/ToolButton";
import { UnreadableContext } from "../../../previewer-editors/zoom";
import { PaletteProvider, type CanvasColors } from "./style/palette";
import { switchDefaultsOf, toRegistrations, type DerivedEdge, type NodeStyle, type Placement, type Reference, type Registrations, type RegistrationsInput, type Size, type Stroke, type Tool } from "./canvas-registration";
import { accept, addEdge, addNode, newId, type CanvasDocument, type CanvasEdge, type CanvasGroup, type CanvasNode, type Refusal } from "./document";
import { edgeStyleFor, registrationIn, type Template } from "./template";
import { handlesOf } from "./properties/handles";
import { layoutOf, layoutOnCanvas, sizeOf } from "./properties/size";
import { highlightOf, modeOf } from "./properties/highlight";
import { focusedEdges, focusedNodes } from "./properties/view";
import { nodeTypes, type NodeData } from "./nodes/Node";
import { edgeTypes, bendIndex, endsOf } from "./edges/EdgeView";
import type { EdgeData } from "./edges/types";
import { Derived } from "./edges/Derived";
import { Toolbox, toolsOf, type Armed, type ToolItem } from "./tools/Toolbox";
import { ContextBar, type Arrange } from "./tools/ContextBar";
import { EntityPick } from "./tools/EntityPick";
import { autoLayout } from "./layouts";
import { blocksFor, type Selection } from "./tools/rules";
import { styleOfLine } from "./style/blocks";
import { TEXT_DEFAULT } from "./style/types";

export type CanvasProps = {
  document: CanvasDocument;
  template: Template;
  /** the kinds this canvas knows: an array of registrations (keyed internally by each registration's `kind`) or the keyed-by-hand map (legacy). An array is what consumers write. */
  registrations: RegistrationsInput;
  /** read: the drawing alone; edit: the toolbox, moves, connections, the editors; every change goes back through onChange */
  mode?: "read" | "edit";
  onChange?: (next: CanvasDocument) => void;
  /** something the template refused, for the consumer to say */
  onRefuse?: (r: Refusal[]) => void;
  /** the project referenced rows read from when the node names none */
  project?: string;
  height?: number | string;
  /** the view (pan, zoom, the wheel): unlocked takes them; locked never does and shows no controls; lockable starts locked, a lock button opens it */
  viewLock?: "unlocked" | "locked" | "lockable";
  /** a file dropped on the canvas: the consumer keeps it where it keeps files and answers its url; without it, nothing can be dropped */
  onUpload?: (file: File) => Promise<string | null>;
  /** the colours the pickers offer: the canvas has a default palette; give `default`, or one for an element (text, fill, border, line, icon, drawing) to change it */
  colors?: CanvasColors;
};

/** React Flow needs a parent before its children in the list */
const parentsFirst = (nodes: CanvasNode[]): CanvasNode[] => {
  const byId = new Map(nodes.map((n) => [n.id, n])), out: CanvasNode[] = [], seen = new Set<string>();
  const visit = (n: CanvasNode) => { if (seen.has(n.id)) return; seen.add(n.id); const p = n.parentId ? byId.get(n.parentId) : undefined; if (p) visit(p); out.push(n); };
  nodes.forEach(visit);
  return out;
};
/** one value for a selection: true or false when all agree, "mixed" when they do not */
const tri = (v: boolean[]): boolean | "mixed" => (v.every((x) => x === v[0]) ? !!v[0] : "mixed");
type Callbacks = Pick<NodeData, "onData" | "onStyle" | "onSwitches" | "onNode">;
/** the size the canvas gives React Flow: the saved width and height on the axes the size says "user"; a "content" axis is measured */
const boxOf = (n: CanvasNode, size: Size) => ({ width: size.width === "user" ? n.width : undefined, height: size.height === "user" ? n.height : undefined });
const toFlow = (doc: CanvasDocument, t: Template, all: Registrations, cb: Callbacks, selected: Set<string>, project?: string, openEditorOf?: string | null): Node[] => parentsFirst(doc.nodes).map((n) => {
  const r = registrationIn(t, all, n.kind)!, size = sizeOf(n, t, all), layout = layoutOf(n, t, all);
  const data: NodeData = { node: n, registration: r, layout, switches: { ...switchDefaultsOf(r, layout), ...(n.switches ?? {}) }, onCanvas: layoutOnCanvas(n, t, all) ?? { size }, handles: handlesOf(n, t, all), multi: selected.size >= 2 && selected.has(n.id), project, ...(n.id === openEditorOf ? { openEditor: true } : {}), ...(n.locked ? {} : cb) };
  return { id: n.id, type: "canvas", position: { x: n.x, y: n.y }, parentId: n.parentId, selected: selected.has(n.id), draggable: n.locked ? false : undefined, deletable: !n.locked, ...boxOf(n, size), zIndex: n.z ?? (r.container ? -1 : undefined), data };
});
const LAST_EDGE_KEY = "canvas.lastEdgeStyle";
let lastEdgeStyle: CanvasEdge["style"] | undefined;
try { const raw = localStorage.getItem(LAST_EDGE_KEY); if (raw) lastEdgeStyle = JSON.parse(raw); } catch { /* no storage: it lives for the session */ }
const rememberEdgeStyle = (s: CanvasEdge["style"]) => { lastEdgeStyle = s; try { localStorage.setItem(LAST_EDGE_KEY, JSON.stringify(s)); } catch { /* ignore */ } };
/** the style of the last shape, text box and pen stroke touched (selected or restyled): the next one drawn takes it. Kept for the viewer, across reloads, like the connector's. */
type StyleGroup = "shape" | "text" | "drawing";
const LAST_NODE_KEY = "canvas.lastNodeStyle";
let lastNodeStyle: Partial<Record<StyleGroup, NodeStyle>> = {};
try { const raw = localStorage.getItem(LAST_NODE_KEY); if (raw) lastNodeStyle = JSON.parse(raw); } catch { /* no storage: it lives for the session */ }
const rememberNodeStyle = (g: StyleGroup, s: NodeStyle) => { lastNodeStyle = { ...lastNodeStyle, [g]: s }; try { localStorage.setItem(LAST_NODE_KEY, JSON.stringify(lastNodeStyle)); } catch { /* ignore */ } };
/** which group a kind's style belongs to, read from its registration: a kind with a border block is a shape; with a text block and no border, a text box; with a drawing block, a pen stroke; else none */
const styleGroupOf = (r: { styleBlocks?: string[] } | undefined): StyleGroup | null => (!r?.styleBlocks ? null : r.styleBlocks.includes("border") ? "shape" : r.styleBlocks.includes("text") ? "text" : r.styleBlocks.includes("drawing") ? "drawing" : null);
/** what a new node starts with: the last touched of its group, then what its own tool says on top (a labelled box keeps its thick border) */
const startStyle = (g: StyleGroup | null, own: NodeStyle | undefined): NodeStyle | undefined => {
  const last = g ? lastNodeStyle[g] : undefined;
  if (!last) return own;
  return { text: { ...last.text, ...own?.text }, shape: { ...last.shape, ...own?.shape } };
};
/** where the viewer was on a canvas (pan and zoom): kept in the viewer's storage, used on the next load when under a day old; otherwise the whole document is fitted */
const VIEW_KEY = (id: string) => `canvas.view.${id}`;
const VIEW_TTL = 24 * 60 * 60 * 1000;
const savedView = (id: string): Viewport | undefined => { try { const v = JSON.parse(localStorage.getItem(VIEW_KEY(id)) ?? "null") as (Viewport & { t?: number }) | null; return v && typeof v.t === "number" && Date.now() - v.t < VIEW_TTL ? { x: v.x, y: v.y, zoom: v.zoom } : undefined; } catch { return undefined; } };
const bendsRef: { current: (id: string, b: NonNullable<CanvasEdge["bends"]>) => void } = { current: () => undefined };
type Guides = { lines: { x1: number; y1: number; x2: number; y2: number }[]; gaps: { x1: number; y1: number; x2: number; y2: number }[]; zoom: number; dot?: { x: number; y: number } };
const toFlowEdges = (doc: CanvasDocument, t: Template, selected: Set<string>, inlineOf: (e: CanvasEdge) => EdgeData["inline"], editOf: (e: CanvasEdge) => EdgeData["edit"], edit?: boolean): Edge[] => doc.edges.map((e) => ({
  id: e.id, type: "canvas", source: e.source, target: e.target, sourceHandle: e.sourceHandle ?? "center", targetHandle: e.targetHandle ?? "center", selected: selected.has(e.id),
  data: { style: e.style ?? t.edges.default, highlight: e.highlight, highlightMode: e.highlightMode, fixed: { source: !!e.sourceHandle && e.sourceHandle !== "center", target: !!e.targetHandle && e.targetHandle !== "center" }, bends: e.bends, setBends: edit ? (b) => bendsRef.current(e.id, b) : undefined, label: e.label, labelLayout: e.labelLayout, edit: editOf(e), inline: inlineOf(e) } satisfies EdgeData,
}));

const RULES = `
@keyframes canvas-lock-pulse { from { transform: translate(-50%, -50%) scale(0.4); opacity: .55; } to { transform: translate(-50%, -50%) scale(3.2); opacity: 0; } }
.canvas-lock-pulse { position: absolute; left: 50%; top: 50%; width: 30px; height: 30px; border-radius: 50%; background: var(--color-status-error); opacity: 0; pointer-events: none; animation: canvas-lock-pulse .7s ease-out 2 forwards; }
.canvas-root, .canvas-root * { -webkit-user-select: none; user-select: none; }
.canvas-root .react-flow { background: var(--color-brand-1-gray-50); }
.canvas-root textarea, .canvas-root input { -webkit-user-select: text; user-select: text; }
.canvas-root .react-flow__node:hover .canvas-handle, .canvas-root .react-flow.connecting .canvas-handle, .canvas-root .react-flow__node.selected .canvas-handle { opacity: 1 !important; }
.canvas-root[data-tool="connector"] .canvas-handle-full, .canvas-root[data-tool="line"] .canvas-handle-full { display: block !important; }
.canvas-root[data-placing="stroke"] .react-flow__node, .canvas-root[data-placing="stroke"] .react-flow__edge { pointer-events: none !important; }
.canvas-root[data-placing="stroke"] .react-flow__pane { cursor: crosshair !important; }
.canvas-root .canvas-icon svg { width: 100% !important; height: 100% !important; stroke-width: var(--icon-sw, 2) !important; }
.canvas-root[data-dropping="yes"] { outline: 2px dashed var(--primary); outline-offset: -6px; }
.canvas-root .react-flow__node .canvas-handle-center { opacity: 0 !important; }
.canvas-root .react-flow__node.canvas-dim { opacity: .18; }
.canvas-root .react-flow__edge.canvas-dim { opacity: .08; }
.canvas-root .react-flow__edgelabel-renderer { z-index: 2000; }
.canvas-root .react-flow__resize-control.line.left, .canvas-root .react-flow__resize-control.line.right { width: 10px; background: transparent; border-color: transparent; }
.canvas-root .react-flow__resize-control.line.top, .canvas-root .react-flow__resize-control.line.bottom { height: 10px; background: transparent; border-color: transparent; }
.canvas-root .react-flow__resize-control.handle::after, .canvas-root .canvas-handle::after { content: ""; position: absolute; inset: -6px; }
.canvas-root .react-flow__edge.selected .react-flow__edgeupdater { fill: var(--background); stroke: var(--primary); stroke-width: 2; }
.canvas-root .react-flow.connecting .canvas-handle-center { opacity: 1 !important; }
.canvas-root[data-tool="connector"] .react-flow__node { cursor: crosshair; }
.canvas-root .react-flow__node.selected { outline: 2px solid var(--primary); outline-offset: 2px; border-radius: 2px; }
.canvas-root[data-cursor="crosshair"] .react-flow__pane { cursor: crosshair !important; }
.canvas-root[data-cursor="default"] .react-flow__pane, .canvas-root[data-cursor="default"] .react-flow__node { cursor: default !important; }
.canvas-root[data-cursor="grab"] .react-flow__pane { cursor: grab !important; }
.canvas-root[data-cursor="grab"] .react-flow__pane.dragging { cursor: grabbing !important; }
@keyframes canvas-find-pulse { 0% { outline-color: transparent; outline-offset: 2px; box-shadow: 0 0 0 0 color-mix(in srgb, var(--primary) 0%, transparent); } 40% { outline-color: var(--primary); outline-offset: 14px; box-shadow: 0 0 0 28px color-mix(in srgb, var(--primary) 22%, transparent); } 100% { outline-color: transparent; outline-offset: 30px; box-shadow: 0 0 0 56px color-mix(in srgb, var(--primary) 0%, transparent); } }
.canvas-root .react-flow__node.canvas-find-pulse { outline: 10px solid transparent; border-radius: 6px; animation: canvas-find-pulse .5s ease-out 3; }
.canvas-root[data-space] .react-flow__node, .canvas-root[data-space] .react-flow__edge { cursor: grab !important; }
.canvas-root[data-space]:active .react-flow__pane, .canvas-root[data-space]:active .react-flow__node, .canvas-root[data-space]:active .react-flow__edge { cursor: grabbing !important; }
`;

/** the view's controls, bottom left: zoom in, zoom out, fit, and the lock when the view is lockable */
function ViewControls({ lockable, opened, onOpen, pulse }: { lockable: boolean; opened: boolean; onOpen: (o: boolean) => void; pulse: number }) {
  const flow = useReactFlow();
  const locked = lockable && !opened;
  return (
    <Stack element="overlay--popover" dir="col" scale="3xs" className="nodrag nopan" data-testid="view-controls">
      {lockable ? (
        <ToolButton label={locked ? "unlock the view" : "lock the view"} testid="view-lock" on={locked} onClick={() => onOpen(locked)} style={{ position: "relative" }}>
          {pulse ? <span key={pulse} className="canvas-lock-pulse" aria-hidden /> : null}
          <Icon name={locked ? "lock" : "unlock"} scale="sm" />
        </ToolButton>
      ) : null}
      <ToolButton label="zoom in" disabled={locked} onClick={() => void flow.zoomIn()}><Icon name="add" scale="sm" /></ToolButton>
      <ToolButton label="zoom out" disabled={locked} onClick={() => void flow.zoomOut()}><Icon name="remove" scale="sm" /></ToolButton>
      <ToolButton label="fit" disabled={locked} onClick={() => void flow.fitView({ padding: 0.1 })}><Icon name="maximize" scale="sm" /></ToolButton>
    </Stack>
  );
}
/** a floating menu anchored to nodes: above their box, centred; below it when there is no room above; kept inside the canvas */
function AnchoredToNodes({ ids, docked, children }: { ids: string[]; docked?: boolean; children: React.ReactNode }) {
  const flow = useReactFlow();
  useStore((s) => ids.map((id) => { const n = s.nodeLookup.get(id); return n ? `${n.internals.positionAbsolute.x},${n.internals.positionAbsolute.y},${n.measured.width},${n.measured.height}` : ""; }).join("|"));
  const [tx, ty, zoom] = useStore((s) => s.transform);
  const W = useStore((s) => s.width), H = useStore((s) => s.height);
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(() => setSize({ w: el.offsetWidth, h: el.offsetHeight })); ro.observe(el); setSize({ w: el.offsetWidth, h: el.offsetHeight }); return () => ro.disconnect(); }, []);
  const b = flow.getNodesBounds(ids);
  const left = b.x * zoom + tx, top = b.y * zoom + ty, right = left + b.width * zoom, bottom = top + b.height * zoom, gap = 12, pad = 8;
  const x = Math.min(Math.max((left + right) / 2 - size.w / 2, pad), Math.max(pad, W - size.w - pad));
  const above = top - gap - size.h;
  const y = docked ? pad : above >= pad ? above : Math.min(bottom + gap, Math.max(pad, H - size.h - pad));
  return <div ref={ref} style={{ position: "absolute", left: docked ? Math.max(pad, (W - size.w) / 2) : x, top: y, zIndex: 6, visibility: size.w ? "visible" : "hidden" }} data-testid="anchored-menu">{children}</div>;
}

type StyleCopy = { node?: NodeStyle; edge?: CanvasEdge["style"] };
let STYLE: StyleCopy | null = null;
let CLIPBOARD: { nodes: CanvasNode[]; edges: CanvasEdge[]; groups: CanvasGroup[] } | null = null;
/** tension points are in canvas coordinates: when both ends of an edge moved by the same amount, its points moved with them */
const absolutes = (d: CanvasDocument) => {
  const by = new Map(d.nodes.map((n) => [n.id, n]));
  const at = (n: CanvasNode, depth = 0): { x: number; y: number } => { const p = n.parentId && depth < 50 ? by.get(n.parentId) : undefined; const o = p ? at(p, depth + 1) : { x: 0, y: 0 }; return { x: o.x + n.x, y: o.y + n.y }; };
  return new Map(d.nodes.map((n) => [n.id, at(n)]));
};
const carryBends = (prev: CanvasDocument, next: CanvasDocument): CanvasDocument => {
  if (!next.edges.some((e) => e.bends?.length)) return next;
  const before = absolutes(prev), after = absolutes(next);
  const shift = (id: string) => { const a = before.get(id), b = after.get(id); return a && b ? { x: b.x - a.x, y: b.y - a.y } : null; };
  let changed = false;
  const edges = next.edges.map((e) => {
    if (!e.bends?.length) return e;
    const s = shift(e.source), t = shift(e.target);
    if (!s || !t || (s.x === 0 && s.y === 0) || s.x !== t.x || s.y !== t.y) return e;
    changed = true;
    return { ...e, bends: e.bends.map((p) => ({ ...p, x: p.x + s.x, y: p.y + s.y })) };
  });
  return changed ? { ...next, edges } : next;
};
/** a free end no connector uses any more goes */
const prunePoints = (d: CanvasDocument, all: Registrations): CanvasDocument => {
  const used = new Set(d.edges.flatMap((e) => [e.source, e.target]));
  const free = (n: CanvasNode) => !!all[n.kind]?.freeEnd;
  return d.nodes.some((n) => free(n) && !used.has(n.id)) ? { ...d, nodes: d.nodes.filter((n) => !free(n) || used.has(n.id)) } : d;
};
/** a copy of a node with a new id: a row that carries its node's id (owned_by_node) takes the new one */
const reId = (n: CanvasNode, id: string): CanvasNode => { const d = n.data as { id?: string } | null; return { ...n, id, data: d && typeof d === "object" && d.id === n.id ? { ...d, id } : n.data }; };
/** a node's text, its size times k (resizing a selection scales its text with it): only a kind that styles text */
const scaleText = (n: CanvasNode, k: number, all: Registrations): CanvasNode | undefined => {
  if (k === 1 || !all[n.kind]?.styleBlocks?.includes("text")) return undefined;
  const size = n.style?.text?.fontSize ?? TEXT_DEFAULT.fontSize;
  return { ...n, style: { ...n.style, text: { ...n.style?.text, fontSize: Math.max(4, Math.round(size * k * 10) / 10) } } };
};
type Live = { x: number; y: number; w: number; h: number; k: number };
/** one box around several selected nodes: a drag of a corner scales them together, of a side one axis; every node moves with it, the ones whose size allows it change size on their axes */
function SelectionResizer({ ids, axes, onLive, onDone }: { ids: string[]; axes: Map<string, Size>; onLive: (m: Map<string, Live>) => void; onDone: (m: Map<string, Live>) => void }) {
  const flow = useReactFlow();
  useStore((s) => ids.map((id) => { const n = s.nodeLookup.get(id); return n ? `${n.internals.positionAbsolute.x},${n.internals.positionAbsolute.y},${n.measured.width},${n.measured.height}` : ""; }).join("|"));
  const [tx, ty, zoom] = useStore((s) => s.transform);
  const b = flow.getNodesBounds(ids);
  const L = b.x * zoom + tx, T = b.y * zoom + ty, W = b.width * zoom, H = b.height * zoom;
  type Grip = "nw" | "ne" | "sw" | "se" | "n" | "s" | "w" | "e";
  const start = (grip: Grip) => (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    const boxes = ids.map((id) => { const i = flow.getInternalNode(id)!; const pid = i.parentId; const pa = pid ? flow.getInternalNode(pid)?.internals.positionAbsolute : undefined; return { id, x: i.internals.positionAbsolute.x, y: i.internals.positionAbsolute.y, w: i.measured.width ?? 0, h: i.measured.height ?? 0, px: pa?.x ?? 0, py: pa?.y ?? 0 }; });
    const west = grip.includes("w"), east = grip.includes("e"), north = grip.includes("n"), south = grip.includes("s"), corner = grip.length === 2;
    const fx = west ? b.x + b.width : b.x, fy = north ? b.y + b.height : b.y;
    const x0 = e.clientX, y0 = e.clientY;
    let last = new Map<string, Live>();
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - x0) / zoom * (west ? -1 : 1), dy = (ev.clientY - y0) / zoom * (north ? -1 : 1);
      const k = corner ? Math.max(0.05, ((b.width + dx) / b.width + (b.height + dy) / b.height) / 2) : 1;
      const kx = corner ? k : west || east ? Math.max(0.05, (b.width + dx) / b.width) : 1, ky = corner ? k : north || south ? Math.max(0.05, (b.height + dy) / b.height) : 1;
      last = new Map(boxes.map((q) => {
        const s = axes.get(q.id), sw = s?.width === "user", sh = s?.height === "user";
        const x = sw ? fx + (q.x - fx) * kx : fx + (q.x + q.w / 2 - fx) * kx - q.w / 2, y = sh ? fy + (q.y - fy) * ky : fy + (q.y + q.h / 2 - fy) * ky - q.h / 2;
        return [q.id, { x: Math.round(x - q.px), y: Math.round(y - q.py), w: sw ? Math.max(8, Math.round(q.w * kx)) : q.w, h: sh ? Math.max(8, Math.round(q.h * ky)) : q.h, k: corner && sw && sh ? k : 1 }];
      }));
      onLive(last);
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); if (last.size) onDone(last); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  const h = (grip: "nw" | "ne" | "sw" | "se", x: number, y: number) => <div key={grip} onPointerDown={start(grip)} data-testid={`resize-${grip}`} className="nodrag nopan" style={{ position: "absolute", left: x - 5, top: y - 5, width: 10, height: 10, background: "var(--background)", border: "1.5px solid var(--primary)", borderRadius: 2, cursor: grip === "nw" || grip === "se" ? "nwse-resize" : "nesw-resize", pointerEvents: "auto" }} />;
  const side = (grip: "n" | "s" | "w" | "e", st: React.CSSProperties) => <div key={grip} onPointerDown={start(grip)} data-testid={`resize-${grip}`} className="nodrag nopan" style={{ position: "absolute", cursor: grip === "n" || grip === "s" ? "ns-resize" : "ew-resize", pointerEvents: "auto", ...st }} />;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, zIndex: 5, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: L, top: T, width: W, height: H, border: "1px solid var(--primary)", pointerEvents: "none" }} />
      {side("n", { left: L + 6, top: T - 5, width: Math.max(0, W - 12), height: 10 })}{side("s", { left: L + 6, top: T + H - 5, width: Math.max(0, W - 12), height: 10 })}
      {side("w", { left: L - 5, top: T + 6, width: 10, height: Math.max(0, H - 12) })}{side("e", { left: L + W - 5, top: T + 6, width: 10, height: Math.max(0, H - 12) })}
      {h("nw", L, T)}{h("ne", L + W, T)}{h("sw", L, T + H)}{h("se", L + W, T + H)}
    </div>
  );
}

function Inner({ document: doc, template: t, registrations: regsInput, mode = "read", onChange, onRefuse, project, height = "100%", onUpload, viewLock = "unlocked" }: CanvasProps) {
  const edit = mode === "edit";
  const flow = useReactFlow();
  // normalise the registrations: an array becomes a map keyed by each registration's own `kind`; a map passes through
  const all = useMemo(() => toRegistrations(regsInput), [regsInput]);
  const items = useMemo(() => toolsOf(all, t), [all, t]);
  const toolOf = useCallback((id: Tool | null): ToolItem | undefined => (id ? items.find((x) => x.id === id) : undefined), [items]);
  // the tool: null is no tool, the hand (V again, or Escape, lets a tool go); what its ask picked travels with it
  const [armed, setArmed] = useState<Armed>({ tool: "select" });
  const tool = armed?.tool ?? null;
  const setTool = (id: Tool | null) => setArmed(id ? { tool: id } : null);
  const current = toolOf(tool);
  const placing = current?.entry?.placing;
  const [entityPick, setEntityPick] = useState<{ x: number; y: number } | null>(null);
  // the node whose editor opens as it is drawn: the one just made from the picker, when its creation says so
  const [openEditorOf, setOpenEditorOf] = useState<string | null>(null);
  // two browser gestures the canvas must keep: the two-finger swipe that goes back in history, and the pinch that zooms the whole page
  useEffect(() => {
    const el = root.current; if (!el) return;
    const docs: Document[] = [document];
    try { let w: Window = window; while (w.parent && w.parent !== w) { w = w.parent; docs.push(w.document); } } catch { /* a parent of another origin */ }
    const was = docs.map((d) => [d.documentElement.style.overscrollBehaviorX, d.body.style.overscrollBehaviorX]);
    for (const d of docs) { d.documentElement.style.overscrollBehaviorX = "none"; d.body.style.overscrollBehaviorX = "none"; }
    const wheel = (e: WheelEvent) => { if (e.ctrlKey || !(e.target as HTMLElement | null)?.closest?.(".nowheel")) e.preventDefault(); };
    const gesture = (e: Event) => e.preventDefault();
    el.addEventListener("wheel", wheel, { passive: false });
    for (const g of ["gesturestart", "gesturechange", "gestureend"]) el.addEventListener(g, gesture);
    return () => { docs.forEach((d, i) => { d.documentElement.style.overscrollBehaviorX = was[i][0]; d.body.style.overscrollBehaviorX = was[i][1]; }); el.removeEventListener("wheel", wheel); for (const g of ["gesturestart", "gesturechange", "gestureend"]) el.removeEventListener(g, gesture); };
  }, []);
  // a change: the template checks it; what it refuses is dropped and told
  const commit = useCallback((next: CanvasDocument) => { const { doc: ok, refused } = accept(prunePoints(carryBends(doc, next), all), t, all); if (refused.length) onRefuse?.(refused); onChange?.(ok); }, [doc, t, all, onChange, onRefuse]);
  const patchNode = useCallback((id: string, f: (n: CanvasNode) => CanvasNode) => commit({ ...doc, nodes: doc.nodes.map((n) => (n.id === id ? f(n) : n)) }), [doc, commit]);
  // the node's callbacks, in edit mode: its row changed in place, its style, its layout and switches, the node itself (a measured width)
  const cb = useMemo<Callbacks>(() => (edit ? {
    onData: (id, data) => patchNode(id, (n) => ({ ...n, data })),
    onStyle: (id, style) => patchNode(id, (n) => ({ ...n, style })),
    onSwitches: (id, layout, switches) => patchNode(id, (n) => ({ ...n, layout, switches })),
    onNode: (id, p) => patchNode(id, (n) => ({ ...n, ...p })),
  } : {}), [edit, patchNode]);
  const editOfEdge = useCallback((e: CanvasEdge): EdgeData["edit"] => (edit ? { source: "fixture", kind: "edge label", onSubmit: (d) => commit({ ...doc, edges: doc.edges.map((x) => (x.id === e.id ? { ...x, label: d } : x)) }) } : undefined), [edit, doc, commit]);
  // the selection is the canvas's: it survives every change of the document, and the menus read it
  const [sel, setSel] = useState<{ nodes: Set<string>; edges: Set<string> }>({ nodes: new Set(), edges: new Set() });
  const nodes = useMemo(() => toFlow(doc, t, all, cb, sel.nodes, project, openEditorOf), [doc, t, all, cb, sel.nodes, project, openEditorOf]);
  const [typing, setTyping] = useState<string | null>(null);
  const inlineOf = useCallback((e: CanvasEdge): EdgeData["inline"] => (edit ? {
    editing: typing === e.id, start: () => setTyping(e.id), cancel: () => setTyping(null),
    commit: (title: string) => { setTyping(null); const tt = title.trim(); if ((e.label?.title ?? "") === tt) return; commit({ ...doc, edges: doc.edges.map((x) => (x.id === e.id ? { ...x, label: tt ? { ...(x.label ?? { id: x.id }), title: tt } : undefined } : x)) }); },
  } : undefined), [edit, typing, doc, commit]);
  const bendClick = useRef<number | undefined>(undefined);
  bendsRef.current = (id: string, b: NonNullable<CanvasEdge["bends"]>) => commit({ ...doc, edges: doc.edges.map((x) => (x.id === id ? { ...x, bends: b.length ? b : undefined } : x)) });
  const addBend = (id: string, q: { x: number; y: number }) => {
    const e = doc.edges.find((x) => x.id === id), s = e && flow.getInternalNode(e.source), tn = e && flow.getInternalNode(e.target);
    if (!e || !s || !tn) return;
    const c = (n: typeof s) => ({ x: n.internals.positionAbsolute.x + (n.measured.width ?? 0) / 2, y: n.internals.positionAbsolute.y + (n.measured.height ?? 0) / 2 });
    const b = e.bends ?? [], i = bendIndex([c(s), ...b, c(tn)], q);
    bendsRef.current(id, [...b.slice(0, i), q, ...b.slice(i)]);
  };
  // the lines the data draws (template.edges.derived): each registration that brings a hook is asked with its nodes; drawn with the template's style for the pair
  const [derived, setDerived] = useState<Record<string, DerivedEdge[]>>({});
  const onDerived = useCallback((kind: string, es: DerivedEdge[]) => setDerived((d) => (d[kind] === es ? d : { ...d, [kind]: es })), []);
  const derivedRegs = useMemo(() => (t.edges.derived ? Object.values(all).filter((r) => r.useDerivedEdges && doc.nodes.some((n) => n.kind === r.kind)) : []), [t.edges.derived, all, doc.nodes]);
  const derivedEdges = useMemo<Edge[]>(() => Object.entries(derived).flatMap(([kind, es]) => { const base = edgeStyleFor(t, kind, kind); return es.map((e) => { const style = e.style ? { ...base, ...e.style } : base; return ({ id: e.id, type: "canvas", source: e.source, target: e.target, sourceHandle: "center", targetHandle: "center", selectable: false, deletable: false, animated: !!style.animated, data: { style, erd: { color: e.color ?? style.color ?? "var(--primary)", one: e.one, many: e.many } } satisfies EdgeData }); }); }), [derived, t]);
  const edges = useMemo(() => [...toFlowEdges(doc, t, sel.edges, inlineOf, editOfEdge, edit), ...derivedEdges], [doc, t, sel.edges, inlineOf, editOfEdge, edit, derivedEdges]);
  // moves and resizes while dragging stay in React Flow's own state; the document takes the result when the drag ends
  const [live, setLive] = useState<Node[] | null>(null);
  useEffect(() => setLive(null), [doc]);
  // click to highlight: the node whose neighbourhood is lit; a click on it again, or on the canvas, clears it
  const [focus, setFocus] = useState<string | null>(null);
  const viewEdges = useMemo(() => focusedEdges(edges, doc, t, focus), [edges, doc, t, focus]);
  const view = { nodes: useMemo(() => focusedNodes(live ?? nodes, edges, doc, t, focus), [live, nodes, edges, doc, t, focus]), edges: viewEdges };
  const [entered, setEntered] = useState<string | null>(null);
  const groupOf = useCallback((id: string): CanvasGroup | undefined => (doc.groups ?? []).find((g) => g.ids.includes(id)), [doc.groups]);
  const mods = useRef({ shift: false, alt: false });
  const [space, setSpace] = useState(false);
  useEffect(() => {
    const typing = (e: KeyboardEvent) => { const t = e.target as HTMLElement | null; return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable); };
    const down = (e: KeyboardEvent) => { if (e.code === "Space" && !typing(e)) setSpace(true); if (e.key === "Escape" && (!typing(e) || (e.target as HTMLElement).hasAttribute("data-canvas-text"))) setSel({ nodes: new Set(), edges: new Set() }); };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") setSpace(false); };
    const off = () => setSpace(false);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", off);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", off); };
  }, []);
  useEffect(() => { const on = (e: KeyboardEvent | PointerEvent) => { mods.current = { shift: e.shiftKey, alt: e.altKey }; }; window.addEventListener("keydown", on); window.addEventListener("keyup", on); window.addEventListener("pointermove", on, true); window.addEventListener("pointerdown", on, true); return () => { window.removeEventListener("keydown", on); window.removeEventListener("keyup", on); window.removeEventListener("pointermove", on, true); window.removeEventListener("pointerdown", on, true); }; }, []);
  const dragStart = useRef(new Map<string, { x: number; y: number }>());
  const dragLast = useRef(new Map<string, { x: number; y: number }>());
  const [dragging, setDragging] = useState(false);
  const [guides, setGuides] = useState<Guides | null>(null);
  const resizeStart = useRef(new Map<string, { x: number; y: number; w: number; h: number }>());
  const resizeLast = useRef(new Map<string, { x: number; y: number; w: number; h: number }>());
  const onNodesChange = useCallback((rawChanges: NodeChange[]) => {
    let changes = rawChanges;
    const picked = rawChanges.filter((c) => c.type === "select" && c.selected).map((c) => (c as { id: string }).id);
    const extra = new Set<string>();
    const dropped = rawChanges.filter((c) => c.type === "select" && !c.selected).map((c) => (c as { id: string }).id);
    const droppedGroups = new Set(dropped.map((id) => groupOf(id)).filter((g): g is CanvasGroup => !!g && g.id !== entered).map((g) => g.id));
    const goneExtra = new Set<string>();
    for (const gid of droppedGroups) (doc.groups ?? []).find((g) => g.id === gid)?.ids.forEach((m) => { if (!dropped.includes(m)) goneExtra.add(m); });
    for (const id of picked) { const g = groupOf(id); if (g && g.id !== entered && !droppedGroups.has(g.id)) g.ids.forEach((m) => { if (!picked.includes(m)) extra.add(m); }); }
    if (extra.size || goneExtra.size) {
      const touched = (c: NodeChange) => c.type === "select" && (extra.has(c.id) || goneExtra.has(c.id) || (c.selected && droppedGroups.has(groupOf(c.id)?.id ?? "")));
      changes = [...rawChanges.filter((c) => !touched(c)), ...[...extra].map((id) => ({ type: "select" as const, id, selected: true })), ...[...goneExtra].map((id) => ({ type: "select" as const, id, selected: false }))];
    }
    const picks = changes.filter((c) => c.type === "select");
    if (picks.length) setSel((s) => { const ns = new Set(s.nodes); for (const c of picks) { if (c.type !== "select") continue; if (c.selected) ns.add(c.id); else ns.delete(c.id); } return { ...s, nodes: ns }; });
    if (!edit) { if (picks.length) setLive((l) => applyNodeChanges(picks, l ?? nodes)); return; }
    const removed = changes.filter((c) => c.type === "remove").map((c) => c.id);
    if (removed.length) { commit({ ...doc, nodes: doc.nodes.filter((n) => !removed.includes(n.id)), edges: doc.edges.filter((e) => !removed.includes(e.source) && !removed.includes(e.target)), groups: (doc.groups ?? []).map((g) => ({ ...g, ids: g.ids.filter((x) => !removed.includes(x)) })).filter((g) => g.ids.length > 1) }); setSel((s) => ({ ...s, nodes: new Set([...s.nodes].filter((x) => !removed.includes(x))) })); return; }
    const cur = live ?? nodes;
    {
      const at = (id: string) => cur.find((n) => n.id === id);
      const out: NodeChange[] = [];
      const posOverride = new Map<string, { x: number; y: number }>();
      let shiftGuide: Guides | null = null;
      const unionAt = (pos: Map<string, { x: number; y: number }>) => {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const [id, p] of pos) { const i = flow.getInternalNode(id); if (!i) continue; const pa = i.parentId ? flow.getInternalNode(i.parentId)?.internals.positionAbsolute ?? { x: 0, y: 0 } : { x: 0, y: 0 };
          const x = p.x + pa.x, y = p.y + pa.y; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + (i.measured.width ?? 0)); y1 = Math.max(y1, y + (i.measured.height ?? 0)); }
        return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      };
      for (const c of changes) {
        if (c.type === "dimensions" && c.resizing && c.dimensions) {
          const n = at(c.id);
          if (n && !resizeStart.current.has(c.id)) resizeStart.current.set(c.id, { x: n.position.x, y: n.position.y, w: n.measured?.width ?? n.width ?? c.dimensions.width, h: n.measured?.height ?? n.height ?? c.dimensions.height });
          const st = resizeStart.current.get(c.id);
          if (st && mods.current.alt) {
            const w = Math.max(10, st.w + 2 * (c.dimensions.width - st.w)), h = Math.max(10, st.h + 2 * (c.dimensions.height - st.h));
            posOverride.set(c.id, { x: st.x - (w - st.w) / 2, y: st.y - (h - st.h) / 2 });
            resizeLast.current.set(c.id, { x: st.x - (w - st.w) / 2, y: st.y - (h - st.h) / 2, w, h });
            out.push({ ...c, dimensions: { width: w, height: h } });
            continue;
          }
          resizeLast.current.delete(c.id);
        } else if (c.type === "dimensions" && c.resizing === false) {
          const last = resizeLast.current.get(c.id);
          resizeStart.current.delete(c.id); resizeLast.current.delete(c.id);
          if (last) { posOverride.set(c.id, { x: last.x, y: last.y }); out.push({ ...c, dimensions: { width: last.w, height: last.h } }); continue; }
        }
        if (c.type === "position" && c.position && c.dragging) {
          const n = at(c.id);
          if (n && !dragStart.current.has(c.id)) dragStart.current.set(c.id, { x: n.position.x, y: n.position.y });
          const st = dragStart.current.get(c.id);
          if (st && mods.current.shift) {
            const dx = c.position.x - st.x, dy = c.position.y - st.y, ax = Math.abs(dx), ay = Math.abs(dy);
            const p = ax > ay * 2.414 ? { x: c.position.x, y: st.y } : ay > ax * 2.414 ? { x: st.x, y: c.position.y } : { x: st.x + Math.sign(dx) * (ax + ay) / 2, y: st.y + Math.sign(dy) * (ax + ay) / 2 };
            if (!shiftGuide) { const starts = new Map<string, { x: number; y: number }>(); for (const d of changes) if (d.type === "position" && d.dragging) { const s0 = dragStart.current.get(d.id) ?? (cur.find((n) => n.id === d.id)?.position); if (s0) starts.set(d.id, s0); }
              const U = unionAt(starts), o = { x: U.x + U.w / 2, y: U.y + U.h / 2 }, ux = p.x === c.position.x && p.y === st.y ? 1 : p.x === st.x ? 0 : Math.sign(dx), uy = p.y === st.y ? 0 : p.x === st.x ? 1 : Math.sign(dy), far = 1e5;
              shiftGuide = { lines: [{ x1: o.x - ux * far, y1: o.y - uy * far, x2: o.x + ux * far, y2: o.y + uy * far }], gaps: [], zoom: flow.getZoom(), dot: o }; }
            out.push({ ...c, position: p }); continue;
          }
        } else if (c.type === "position" && c.dragging === false) {
          dragStart.current.delete(c.id);
          const last = dragLast.current.get(c.id); dragLast.current.delete(c.id);
          if (last) { out.push({ ...c, position: last }); continue; }
        }
        out.push(c);
      }
      const drags = out.filter((c): c is NodeChange & { type: "position"; position: { x: number; y: number }; dragging: true } => c.type === "position" && !!c.position && !!c.dragging);
      if (drags.length && !mods.current.shift) {
        const U = unionAt(new Map(drags.map((c) => [c.id, c.position])));
        if (Number.isFinite(U.x) && t.viewport.guides !== false) {
          const z = flow.getZoom(), thr = 6 / z, w = U.w, h = U.h;
          const L = { x: U.x, y: U.y, w, h };
          const el = root.current?.getBoundingClientRect(), tl = el ? flow.screenToFlowPosition({ x: el.left, y: el.top }) : { x: -Infinity, y: -Infinity }, br = el ? flow.screenToFlowPosition({ x: el.right, y: el.bottom }) : { x: Infinity, y: Infinity };
          const moving = new Set(drags.map((c) => c.id));
          const boxes = cur.filter((n) => !moving.has(n.id) && !n.hidden).map((n) => { const i = flow.getInternalNode(n.id); return i ? { x: i.internals.positionAbsolute.x, y: i.internals.positionAbsolute.y, w: i.measured.width ?? 0, h: i.measured.height ?? 0 } : null; })
            .filter((b): b is { x: number; y: number; w: number; h: number } => !!b && b.w > 0 && b.x + b.w >= tl.x && b.x <= br.x && b.y + b.h >= tl.y && b.y <= br.y);
          const lx = [L.x, L.x + w / 2, L.x + w], ly = [L.y, L.y + h / 2, L.y + h];
          let bx: { d: number; at: number } | null = null, by: { d: number; at: number } | null = null;
          for (const b of boxes) {
            for (const v of [b.x, b.x + b.w / 2, b.x + b.w]) for (const u of lx) { const d = v - u; if (Math.abs(d) <= thr && (!bx || Math.abs(d) < Math.abs(bx.d))) bx = { d, at: v }; }
            for (const v of [b.y, b.y + b.h / 2, b.y + b.h]) for (const u of ly) { const d = v - u; if (Math.abs(d) <= thr && (!by || Math.abs(d) < Math.abs(by.d))) by = { d, at: v }; }
          }
          let sx = bx?.d ?? 0, sy = by?.d ?? 0;
          const row = (S: { x: number; y: number }) => { const r = boxes.filter((b) => b.y < S.y + h && b.y + b.h > S.y); return { l: r.filter((b) => b.x + b.w <= S.x + 0.5).sort((a, b) => b.x + b.w - (a.x + a.w))[0], r: r.filter((b) => b.x >= S.x + w - 0.5).sort((a, b) => a.x - b.x)[0] }; };
          const col = (S: { x: number; y: number }) => { const c = boxes.filter((b) => b.x < S.x + w && b.x + b.w > S.x); return { u: c.filter((b) => b.y + b.h <= S.y + 0.5).sort((a, b) => b.y + b.h - (a.y + a.h))[0], d: c.filter((b) => b.y >= S.y + h - 0.5).sort((a, b) => a.y - b.y)[0] }; };
          { const S0 = { x: L.x + sx, y: L.y + sy }, { l, r } = row(S0); if (!bx && l && r) { const gl = S0.x - (l.x + l.w), gr = r.x - (S0.x + w); if (Math.abs(gl - gr) <= 2 * thr) sx += (gr - gl) / 2; } }
          { const S0 = { x: L.x + sx, y: L.y + sy }, { u, d } = col(S0); if (!by && u && d) { const gu = S0.y - (u.y + u.h), gd = d.y - (S0.y + h); if (Math.abs(gu - gd) <= 2 * thr) sy += (gd - gu) / 2; } }
          const beyondX = (n: { x: number; y: number; w: number; h: number }, side: -1 | 1) => boxes.filter((b) => b !== n && b.y < n.y + n.h && b.y + b.h > n.y && (side < 0 ? b.x + b.w <= n.x + 0.5 : b.x >= n.x + n.w - 0.5)).sort((a, b) => (side < 0 ? b.x + b.w - (a.x + a.w) : a.x - b.x))[0];
          const beyondY = (n: { x: number; y: number; w: number; h: number }, side: -1 | 1) => boxes.filter((b) => b !== n && b.x < n.x + n.w && b.x + b.w > n.x && (side < 0 ? b.y + b.h <= n.y + 0.5 : b.y >= n.y + n.h - 0.5)).sort((a, b) => (side < 0 ? b.y + b.h - (a.y + a.h) : a.y - b.y))[0];
          const sib: { x1: number; y1: number; x2: number; y2: number }[] = [];
          { const S0 = { x: L.x + sx, y: L.y + sy }, { l, r } = row(S0);
            const la = l && beyondX(l, -1), ra = r && beyondX(r, 1);
            if (l && la) { const want = l.x - (la.x + la.w), have = S0.x - (l.x + l.w); if (!bx && Math.abs(have - want) <= thr) sx += want - have; const my = (Math.max(la.y, l.y) + Math.min(la.y + la.h, l.y + l.h)) / 2; sib.push({ x1: la.x + la.w, y1: my, x2: l.x, y2: my }); }
            if (r && ra) { const want = ra.x - (r.x + r.w), have = r.x - (S0.x + w); if (!bx && Math.abs(have - want) <= thr) sx -= want - have; const my = (Math.max(ra.y, r.y) + Math.min(ra.y + ra.h, r.y + r.h)) / 2; sib.push({ x1: r.x + r.w, y1: my, x2: ra.x, y2: my }); } }
          { const S0 = { x: L.x + sx, y: L.y + sy }, { u, d } = col(S0);
            const ua = u && beyondY(u, -1), da = d && beyondY(d, 1);
            if (u && ua) { const want = u.y - (ua.y + ua.h), have = S0.y - (u.y + u.h); if (!by && Math.abs(have - want) <= thr) sy += want - have; const mx = (Math.max(ua.x, u.x) + Math.min(ua.x + ua.w, u.x + u.w)) / 2; sib.push({ x1: mx, y1: ua.y + ua.h, x2: mx, y2: u.y }); }
            if (d && da) { const want = da.y - (d.y + d.h), have = d.y - (S0.y + h); if (!by && Math.abs(have - want) <= thr) sy -= want - have; const mx = (Math.max(da.x, d.x) + Math.min(da.x + da.w, d.x + d.w)) / 2; sib.push({ x1: mx, y1: d.y + d.h, x2: mx, y2: da.y }); } }
          const S = { x: L.x + sx, y: L.y + sy, w, h };
          const g: Guides = { lines: [], gaps: [], zoom: z };
          if (bx) g.lines.push({ x1: bx.at, y1: tl.y, x2: bx.at, y2: br.y });
          if (by) g.lines.push({ x1: tl.x, y1: by.at, x2: br.x, y2: by.at });
          const { l, r } = row(S), { u, d } = col(S), my = S.y + h / 2, mx = S.x + w / 2;
          if (l) g.gaps.push({ x1: l.x + l.w, y1: my, x2: S.x, y2: my }); if (r) g.gaps.push({ x1: S.x + w, y1: my, x2: r.x, y2: my });
          if (u) g.gaps.push({ x1: mx, y1: u.y + u.h, x2: mx, y2: S.y }); if (d) g.gaps.push({ x1: mx, y1: S.y + h, x2: mx, y2: d.y });
          g.gaps.push(...sib);
          setGuides(g.lines.length || g.gaps.length ? g : null);
          if (sx || sy) for (let k = 0; k < out.length; k++) { const c = out[k]; if (c.type === "position" && c.position && c.dragging) out[k] = { ...c, position: { x: c.position.x + sx, y: c.position.y + sy } }; }
        }
      } else if (out.some((c) => c.type === "position" && c.dragging === false)) setGuides(null);
      for (const c of out) if (c.type === "position" && c.position && c.dragging) dragLast.current.set(c.id, c.position);
      if (shiftGuide) setGuides(shiftGuide);
      changes = out.map((c) => (c.type === "position" && posOverride.has(c.id) ? { ...c, position: posOverride.get(c.id)! } : c));
      for (const [id, p] of posOverride) if (!changes.some((c) => c.type === "position" && c.id === id)) changes.push({ type: "position", id, position: p });
      if (changes.some((c) => c.type === "dimensions" && c.resizing)) setDragging(true);
      if (changes.some((c) => c.type === "dimensions" && c.resizing === false)) setDragging(false);
      {
        const rz = changes.find((c): c is NodeChange & { type: "dimensions"; dimensions: { width: number; height: number } } => c.type === "dimensions" && !!c.resizing && !!c.dimensions);
        if (rz && !mods.current.alt) {
          const i = flow.getInternalNode(rz.id), st = resizeStart.current.get(rz.id);
          if (i && st) {
            const pa = i.parentId ? flow.getInternalNode(i.parentId)?.internals.positionAbsolute ?? { x: 0, y: 0 } : { x: 0, y: 0 };
            const pc = changes.find((c) => c.type === "position" && c.id === rz.id) as (NodeChange & { type: "position"; position?: { x: number; y: number } }) | undefined;
            const rel = pc?.position ?? i.position;
            let x = rel.x + pa.x, y = rel.y + pa.y, w = rz.dimensions.width, h = rz.dimensions.height;
            const leftMoves = Math.abs(rel.x - st.x) > 0.5, rightMoves = !leftMoves && Math.abs(w - st.w) > 0.5, topMoves = Math.abs(rel.y - st.y) > 0.5, bottomMoves = !topMoves && Math.abs(h - st.h) > 0.5;
            const z = flow.getZoom(), thr = 6 / z, el = root.current?.getBoundingClientRect();
            const tl = el ? flow.screenToFlowPosition({ x: el.left, y: el.top }) : { x: -Infinity, y: -Infinity }, br = el ? flow.screenToFlowPosition({ x: el.right, y: el.bottom }) : { x: Infinity, y: Infinity };
            const boxes = cur.filter((n) => n.id !== rz.id && !n.hidden).map((n) => { const k = flow.getInternalNode(n.id); return k ? { x: k.internals.positionAbsolute.x, y: k.internals.positionAbsolute.y, w: k.measured.width ?? 0, h: k.measured.height ?? 0 } : null; })
              .filter((b): b is { x: number; y: number; w: number; h: number } => !!b && b.w > 0 && b.x + b.w >= tl.x && b.x <= br.x && b.y + b.h >= tl.y && b.y <= br.y);
            const near = (e: number, vs: (b: { x: number; y: number; w: number; h: number }) => number[]) => { let best: number | null = null; for (const b of boxes) for (const v of vs(b)) if (Math.abs(v - e) <= thr && (best === null || Math.abs(v - e) < Math.abs(best - e))) best = v; return best; };
            const xs = (b: { x: number; w: number }) => [b.x, b.x + b.w / 2, b.x + b.w], ys = (b: { y: number; h: number }) => [b.y, b.y + b.h / 2, b.y + b.h];
            const g: Guides = { lines: [], gaps: [], zoom: z };
            if (leftMoves) { const v = near(x, xs); if (v !== null) { w += x - v; x = v; g.lines.push({ x1: v, y1: tl.y, x2: v, y2: br.y }); } }
            if (rightMoves) { const v = near(x + w, xs); if (v !== null) { w = v - x; g.lines.push({ x1: v, y1: tl.y, x2: v, y2: br.y }); } }
            if (topMoves) { const v = near(y, ys); if (v !== null) { h += y - v; y = v; g.lines.push({ x1: tl.x, y1: v, x2: br.x, y2: v }); } }
            if (bottomMoves) { const v = near(y + h, ys); if (v !== null) { h = v - y; g.lines.push({ x1: tl.x, y1: v, x2: br.x, y2: v }); } }
            let sized = false;
            const cx = x + w / 2, cy = y + h / 2, two = (f: (b: { x: number; y: number; w: number; h: number }) => boolean, d: (b: { x: number; y: number; w: number; h: number }) => number) => boxes.filter(f).sort((a, b) => d(a) - d(b)).slice(0, 2);
            const sizeBoxes = [...new Set([
              ...two((b) => b.x + b.w <= x + 0.5, (b) => cx - (b.x + b.w / 2) + Math.abs(cy - (b.y + b.h / 2))),
              ...two((b) => b.x >= x + w - 0.5, (b) => b.x + b.w / 2 - cx + Math.abs(cy - (b.y + b.h / 2))),
              ...two((b) => b.y + b.h <= y + 0.5, (b) => cy - (b.y + b.h / 2) + Math.abs(cx - (b.x + b.w / 2))),
              ...two((b) => b.y >= y + h - 0.5, (b) => b.y + b.h / 2 - cy + Math.abs(cx - (b.x + b.w / 2))),
            ])];
            if ((leftMoves || rightMoves) && !g.lines.some((l) => l.x1 === l.x2)) { const m = sizeBoxes.find((b) => Math.abs(b.w - w) <= thr); if (m) { if (leftMoves) x += w - m.w; w = m.w; sized = true; } }
            if ((topMoves || bottomMoves) && !g.lines.some((l) => l.y1 === l.y2)) { const m = sizeBoxes.find((b) => Math.abs(b.h - h) <= thr); if (m) { if (topMoves) y += h - m.h; h = m.h; sized = true; } }
            const off = 10 / z;
            if (leftMoves || rightMoves) { g.gaps.push({ x1: x, y1: y - off, x2: x + w, y2: y - off }); for (const b of sizeBoxes) g.gaps.push({ x1: b.x, y1: b.y - off, x2: b.x + b.w, y2: b.y - off }); }
            if (topMoves || bottomMoves) { g.gaps.push({ x1: x - off, y1: y, x2: x - off, y2: y + h }); for (const b of sizeBoxes) g.gaps.push({ x1: b.x - off, y1: b.y, x2: b.x - off, y2: b.y + b.h }); }
            setGuides(g.lines.length || g.gaps.length ? g : null);
            if (g.lines.length || sized) {
              resizeLast.current.set(rz.id, { x: x - pa.x, y: y - pa.y, w, h });
              changes = changes.map((c) => (c === rz ? { ...rz, dimensions: { width: w, height: h } } : c.type === "position" && c.id === rz.id ? { ...c, position: { x: x - pa.x, y: y - pa.y } } : c));
              if (!pc) changes.push({ type: "position", id: rz.id, position: { x: x - pa.x, y: y - pa.y } });
            } else resizeLast.current.delete(rz.id);
          }
        }
        if (changes.some((c) => c.type === "dimensions" && c.resizing === false)) setGuides(null);
      }
    }
    const follows: NodeChange[] = [];
    for (const c of changes) {
      if (c.type !== "position") continue;
      const g = groupOf(c.id);
      if (!g || g.id === entered) continue;
      const me = cur.find((n) => n.id === c.id);
      const dx = c.position && me ? c.position.x - me.position.x : 0, dy = c.position && me ? c.position.y - me.position.y : 0;
      for (const m of g.ids) {
        if (m === c.id || changes.some((x) => x.type === "position" && x.id === m) || follows.some((x) => x.type === "position" && x.id === m)) continue;
        const mn = cur.find((n) => n.id === m), md = doc.nodes.find((n) => n.id === m);
        if (!mn || md?.locked) continue;
        follows.push({ type: "position", id: m, position: { x: mn.position.x + dx, y: mn.position.y + dy }, dragging: c.dragging });
      }
    }
    if (follows.length) changes = [...changes, ...follows];
    const next = applyNodeChanges(changes, cur);
    setLive(next);
    const done = changes.filter((c) => (c.type === "position" && c.dragging === false) || (c.type === "dimensions" && c.resizing === false));
    if (done.length) {
      const by = new Map(next.map((n) => [n.id, n]));
      commit({ ...doc, nodes: doc.nodes.map((n) => {
        const f = by.get(n.id); if (!f) return n;
        if (!done.some((c) => "id" in c && c.id === n.id)) return n;
        const size = sizeOf(n, t, all);
        // the size is saved on the axes the registration says "user"; a "content" axis stays measured
        const at = { ...n, x: f.position.x, y: f.position.y, width: size.width === "user" ? f.width ?? f.measured?.width ?? n.width : undefined, height: size.height === "user" ? f.height ?? f.measured?.height ?? n.height : undefined, pinned: true };
        // where it was dropped decides its home: the smallest adopting box under its centre adopts it (a box that is not nestable never goes inside anything; a box never inside itself or what it holds); dropped outside any it is on the canvas again
        if (all[n.kind]?.container?.nestable === false) return at;
        const abs = (id: string) => flow.getInternalNode(id)?.internals.positionAbsolute ?? { x: 0, y: 0 };
        const oldHome = n.parentId ? abs(n.parentId) : { x: 0, y: 0 };
        const me = { x: at.x + oldHome.x, y: at.y + oldHome.y, w: at.width ?? f.measured?.width ?? 0, h: at.height ?? f.measured?.height ?? 0 };
        const cx = me.x + me.w / 2, cy = me.y + me.h / 2;
        const inside = (id: string): boolean => { let p = doc.nodes.find((x) => x.id === id)?.parentId; while (p) { if (p === n.id) return true; p = doc.nodes.find((x) => x.id === p)?.parentId; } return false; };
        const homes = doc.nodes.filter((x) => all[x.kind]?.container?.adopts && x.id !== n.id && !inside(x.id)).map((x) => { const i = flow.getInternalNode(x.id); const q = abs(x.id); return { id: x.id, x: q.x, y: q.y, w: i?.measured.width ?? x.width ?? 0, h: i?.measured.height ?? x.height ?? 0 }; })
          .filter((b) => cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h).sort((p, q) => p.w * p.h - q.w * q.h);
        const home = homes[0];
        if (!home) return { ...at, parentId: undefined, x: me.x, y: me.y };
        return { ...at, parentId: home.id, x: me.x - home.x, y: me.y - home.y };
      }) });
    }
  }, [edit, nodes, live, doc, commit, flow, groupOf, entered, t, all]);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const picks = changes.filter((c) => c.type === "select");
    if (picks.length) setSel((s) => { const es = new Set(s.edges); for (const c of picks) { if (c.type !== "select") continue; if (c.selected) es.add(c.id); else es.delete(c.id); } return { ...s, edges: es }; });
    if (!edit) return; const removed = changes.filter((c) => c.type === "remove").map((c) => c.id); if (removed.length) commit({ ...doc, edges: doc.edges.filter((e) => !removed.includes(e.id)) }); }, [edit, doc, commit]);
  // touching an edge is selecting it: its style is the one to draw the next with (template.edges.rememberLast)
  // a shape or a text box touched (selected, or restyled while selected): its style is what the next of its group starts with
  useEffect(() => {
    if (!t.defaults.rememberLastStyle || sel.nodes.size !== 1) return;
    const n = doc.nodes.find((x) => sel.nodes.has(x.id)); const g = n ? styleGroupOf(all[n.kind]) : null;
    if (n && g && n.style) rememberNodeStyle(g, n.style);
  }, [sel.nodes, doc.nodes, t.defaults.rememberLastStyle, all]);
  useEffect(() => { if (!t.edges.rememberLast) return; const id = [...sel.edges].pop(); const e = id ? doc.edges.find((x) => x.id === id) : undefined; if (e?.style) rememberEdgeStyle(e.style); }, [sel.edges, doc.edges, t.edges.rememberLast]);
  const edgeFor = useCallback((c: Connection): CanvasEdge | null => {
    if (!c.source || !c.target || c.source === c.target) return null;
    const s = doc.nodes.find((n) => n.id === c.source), d = doc.nodes.find((n) => n.id === c.target);
    if (!s || !d) return null;
    const byPair = edgeStyleFor(t, s.kind, d.kind);
    const style = t.edges.rememberLast && byPair === t.edges.default && lastEdgeStyle ? lastEdgeStyle : byPair;
    const side = (h?: string | null) => (h && h !== "center" ? (h as CanvasEdge["sourceHandle"]) : undefined);
    return { id: newId(), source: c.source, target: c.target, sourceHandle: side(c.sourceHandle), targetHandle: side(c.targetHandle), style };
  }, [doc, t]);
  const onConnect = useCallback((c: Connection) => { if (!edit) return; const e = edgeFor(c); if (!e) return; commit(addEdge(doc, tool === "line" ? { ...e, style: { ...e.style, start: "none", end: "none" } } : e)); if (tool === "connector" || tool === "line") setTool("select"); }, [edit, edgeFor, doc, commit, tool]);
  const onReconnect = useCallback((old: Edge, c: Connection) => { if (!edit) return; const e = edgeFor(c); if (e) commit({ ...doc, edges: doc.edges.map((x) => (x.id === old.id ? { ...x, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle } : x)) }); }, [edit, edgeFor, doc, commit]);
  // the placing tools: press on the pane, drag the box, release; a click alone places the tool's size
  const drawing = useRef<{ x: number; y: number } | null>(null);
  const [preview, setPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  /** a new node of the armed tool's kind at a place, with a box; the registration's layout says which axes keep the box */
  const newNode = useCallback((item: ToolItem, tl: { x: number; y: number }, w: number, h: number, stroke?: Stroke): CanvasNode | null => {
    const r = item.registration, e = item.entry;
    if (!r || !e) return null;
    const id = newId(), layout = e.layout ?? r.layout.default, size = (registrationIn(t, all, r.kind) ?? r).layouts[layout]?.size ?? { width: "content", height: "content" };
    return { id, kind: r.kind, x: tl.x, y: tl.y, ...(r.container ? { z: Math.min(0, ...doc.nodes.map((x) => x.z ?? 0)) - 1 } : {}), pinned: true, layout: e.layout, width: size.width === "user" ? w : undefined, height: size.height === "user" ? h : undefined, data: e.data({ width: w, height: h }, armed?.asked as Partial<unknown> | undefined, stroke), style: t.defaults.rememberLastStyle ? startStyle(styleGroupOf(r), e.style) : e.style };
  }, [t, all, armed, doc.nodes]);
  const place = useCallback((tl: { x: number; y: number }, w: number, h: number) => { if (!current) return; const n = newNode(current, tl, w, h); if (!n) return; commit(addNode(doc, n)); setTool("select"); }, [current, newNode, doc, commit]);
  const [line, setLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const lineFrom = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (edit && placing === "stroke") { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); stroke.current = [[e.clientX, e.clientY]]; setInk([[e.clientX, e.clientY]]); return; }
    if (!edit || placing !== "drag_box" || !(e.target as HTMLElement).classList.contains("react-flow__pane")) return;
    drawing.current = { x: e.clientX, y: e.clientY };
    setPreview(null);
  };
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const drawEnd = (a: { x: number; y: number }, e: { clientX: number; clientY: number; shiftKey: boolean }) => {
    if (!e.shiftKey) return { x: e.clientX, y: e.clientY };
    const dx = e.clientX - a.x, dy = e.clientY - a.y, m = Math.max(Math.abs(dx), Math.abs(dy));
    return { x: a.x + Math.sign(dx || 1) * m, y: a.y + Math.sign(dy || 1) * m };
  };
  const boxFrom = useRef<{ x: number; y: number } | null>(null);
  const stroke = useRef<[number, number][] | null>(null);
  const [ink, setInk] = useState<[number, number][] | null>(null);
  const onPointerMove = (e: React.PointerEvent) => {
    pointer.current = { x: e.clientX, y: e.clientY };
    if (stroke.current) { stroke.current.push([e.clientX, e.clientY]); setInk([...stroke.current]); return; }
    if (lineFrom.current && root.current) { const r = root.current.getBoundingClientRect(); setLine({ x1: lineFrom.current.x - r.left, y1: lineFrom.current.y - r.top, x2: e.clientX - r.left, y2: e.clientY - r.top }); return; }
    if (!drawing.current || !root.current) return;
    const r = root.current.getBoundingClientRect(), a = drawing.current, q = drawEnd(a, e);
    setPreview({ x: Math.min(a.x, q.x) - r.left, y: Math.min(a.y, q.y) - r.top, w: Math.abs(q.x - a.x), h: Math.abs(q.y - a.y) });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (stroke.current) {
      const pts = stroke.current; stroke.current = null; setInk(null);
      if (pts.length < 2 || !current) return;
      const fp = pts.map(([x, y]) => flow.screenToFlowPosition({ x, y }));
      const minX = Math.min(...fp.map((p) => p.x)), minY = Math.min(...fp.map((p) => p.y)), maxX = Math.max(...fp.map((p) => p.x)), maxY = Math.max(...fp.map((p) => p.y));
      const w0 = Math.max(4, maxX - minX), h0 = Math.max(4, maxY - minY);
      const n = newNode(current, { x: minX, y: minY }, w0, h0, { points: fp.map((p) => [Math.round((p.x - minX) * 10) / 10, Math.round((p.y - minY) * 10) / 10]), w0, h0 });
      if (n) commit(addNode(doc, n));
      return;
    }
    if (!drawing.current || !current) return;
    const a = drawing.current; drawing.current = null; setPreview(null);
    const q = drawEnd(a, e);
    const p1 = flow.screenToFlowPosition({ x: Math.min(a.x, q.x), y: Math.min(a.y, q.y) }), p2 = flow.screenToFlowPosition({ x: Math.max(a.x, q.x), y: Math.max(a.y, q.y) });
    const w = p2.x - p1.x, h = p2.y - p1.y;
    if (w < 8 && h < 8) { const s = current.entry?.size ?? { width: 200, height: 120 }; place(p1, s.width, s.height); } else place(p1, Math.round(w), Math.round(h));
  };
  const [dropping, setDropping] = useState(false);
  const dropKind = useMemo(() => Object.values(all).find((r) => r.dropsFile), [all]);
  const onDragOver = (e: React.DragEvent) => { if (!edit || !onUpload || !dropKind || ![...e.dataTransfer.types].includes("Files")) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; if (!dropping) setDropping(true); };
  const onDrop = async (e: React.DragEvent) => {
    setDropping(false);
    if (!edit || !onUpload || !dropKind?.dropsFile) return;
    const d = dropKind.dropsFile;
    const files = [...e.dataTransfer.files].filter(d.accept);
    if (!files.length) return;
    e.preventDefault();
    let at = flow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const added: CanvasNode[] = [];
    for (const f of files) {
      const src = await onUpload(f);
      if (!src) continue;
      const natural = await new Promise<{ width: number; height: number }>((res) => { const im = new Image(); im.onload = () => res({ width: im.naturalWidth || 240, height: im.naturalHeight || 180 }); im.onerror = () => res({ width: 240, height: 180 }); im.src = src; });
      const box = d.size(natural);
      added.push({ id: newId(), kind: dropKind.kind, data: d.data(src, f), x: at.x, y: at.y, ...box, pinned: true });
      at = { x: at.x + 24, y: at.y + 24 };
    }
    if (added.length) commit({ ...doc, nodes: [...doc.nodes, ...added] });
  };
  const onPaneClick = useCallback((e: React.MouseEvent) => {
    setEntered(null); setFocus(null);
    if (!edit || !current || !placing || placing === "drag_box" || placing === "stroke") return;
    const p = flow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    if (placing === "pick") { setEntityPick(p); return; }
    const s = current.entry?.size ?? { width: 0, height: 0 };
    place(p, s.width, s.height);
  }, [edit, current, placing, flow, place]);
  const placeReference = (ref: Reference, placement?: Placement, created?: boolean) => { if (!entityPick || !current?.registration) return; const r = current.registration;
    // the placement says the layout and the switches the node starts with; else the tool's layout
    const layout = placement?.layout ?? current.entry?.layout;
    // the box the tool declares (its `size`) is the picked node's first one, on the axes its layout says are the person's; an axis that follows the content takes none
    const first = current.entry?.size, on = r.layouts[layout ?? r.layout.default]?.size;
    const box = first && on ? { ...(on.width === "user" ? { width: first.width } : {}), ...(on.height === "user" ? { height: first.height } : {}) } : {};
    const id = newId();
    commit(addNode(doc, { id, kind: r.kind, data: ref, x: entityPick.x, y: entityPick.y, pinned: true, layout, ...(placement?.switches ? { switches: placement.switches } : {}), ...box }));
    if (created && current.entry?.source?.creation?.openEditor) setOpenEditorOf(id);
    setEntityPick(null); setTool("select"); };
  const lastView = useRef<{ at: number; timer?: number }>({ at: 0 });
  const onMoveEnd = useCallback((_: unknown, vp: Viewport) => {
    const write = () => { lastView.current.at = Date.now(); try { localStorage.setItem(VIEW_KEY(doc.id), JSON.stringify({ ...vp, t: Date.now() })); } catch { /* no storage */ } };
    window.clearTimeout(lastView.current.timer);
    const wait = 3000 - (Date.now() - lastView.current.at);
    if (wait <= 0) write(); else lastView.current.timer = window.setTimeout(write, wait);
  }, [doc.id]);
  const vpRef = useRef(savedView(doc.id));
  const [opened, setOpened] = useState(false);
  const viewLocked = viewLock === "locked" || (viewLock === "lockable" && !opened);
  const [pulse, setPulse] = useState(0);
  const onLockedWheel = () => { if (viewLock === "lockable" && !opened) setPulse((p) => p + 1); };
  const hand = tool === null || tool === "pan";
  const draws = placing === "drag_box" || placing === "stroke";
  const cursor = hand ? "grab" : tool === "select" ? "default" : "crosshair";
  const selNodes = doc.nodes.filter((n) => sel.nodes.has(n.id)), selEdges = doc.edges.filter((e) => sel.edges.has(e.id));
  const selection: Selection = { nodes: selNodes, edges: selEdges, groups: (doc.groups ?? []).filter((g) => g.ids.length > 0 && g.ids.every((id) => sel.nodes.has(id))) };
  const pickOnly = (key: string) => { setSel({ nodes: new Set(selNodes.filter((n) => n.kind === key).map((n) => n.id)), edges: new Set(key === "edge" ? selEdges.map((e) => e.id) : []) }); setLive(null); };
  const lock = (locked: boolean) => commit({ ...doc, nodes: doc.nodes.map((n) => (sel.nodes.has(n.id) ? { ...n, locked } : n)) });
  const group = () => { if (selNodes.length < 2) return; const ids = selNodes.map((n) => n.id); commit({ ...doc, groups: [...(doc.groups ?? []).map((g) => ({ ...g, ids: g.ids.filter((x) => !ids.includes(x)) })).filter((g) => g.ids.length > 1), { id: newId(), ids }] }); };
  const ungroup = () => { const gone = new Set(selection.groups.map((g) => g.id)); if (gone.size) commit({ ...doc, groups: (doc.groups ?? []).filter((g) => !gone.has(g.id)) }); };
  // the style blocks write the selected nodes' style: only a kind that offers style blocks
  const restyle = (p: NodeStyle) => commit({ ...doc, nodes: doc.nodes.map((n) => (sel.nodes.has(n.id) && all[n.kind]?.styleBlocks?.length && !n.locked ? { ...n, style: { text: { ...n.style?.text, ...p.text }, shape: { ...n.style?.shape, ...p.shape } } } : n)) });
  const reverse = () => commit({ ...doc, edges: doc.edges.map((e) => { if (!sel.edges.has(e.id)) return e; const st = e.style ?? {}; const ends = endsOf(st); return { ...e, source: e.target, target: e.source, sourceHandle: e.targetHandle, targetHandle: e.sourceHandle, style: { ...st, start: ends.end, end: ends.start } }; }) });
  const reline = (p: Parameters<typeof styleOfLine>[0]) => commit({ ...doc, edges: doc.edges.map((e) => (sel.edges.has(e.id) ? { ...e, style: { ...e.style, ...styleOfLine(p) } } : e)) });
  /** the boxes of the given nodes as the arrange actions see them: a selected group is one box, every other node its own */
  const unitBoxes = (ids: string[]) => {
    const nodeBoxes = ids.map((id) => { const i = flow.getInternalNode(id); const n = doc.nodes.find((x) => x.id === id)!; const pa = n.parentId ? flow.getInternalNode(n.parentId)?.internals.positionAbsolute : undefined; return i ? { id, x: i.internals.positionAbsolute.x, y: i.internals.positionAbsolute.y, w: i.measured.width ?? 0, h: i.measured.height ?? 0, px: pa?.x ?? 0, py: pa?.y ?? 0 } : null; }).filter((b): b is NonNullable<typeof b> => !!b);
    const byNode = new Map(nodeBoxes.map((b) => [b.id, b]));
    const units: { id: string; members: string[] }[] = [];
    const taken = new Set<string>();
    for (const g of selection.groups) { const m = g.ids.filter((x) => byNode.has(x)); if (m.length) { units.push({ id: g.id, members: m }); m.forEach((x) => taken.add(x)); } }
    for (const b of nodeBoxes) if (!taken.has(b.id)) units.push({ id: b.id, members: [b.id] });
    const boxes = units.map((u) => { const ms = u.members.map((x) => byNode.get(x)!); const x = Math.min(...ms.map((b) => b.x)), y = Math.min(...ms.map((b) => b.y)); return { id: u.id, x, y, w: Math.max(...ms.map((b) => b.x + b.w)) - x, h: Math.max(...ms.map((b) => b.y + b.h)) - y }; });
    return { nodeBoxes, byNode, units, boxes };
  };
  const arrange = (a: Arrange, gap?: { axis: "h" | "v"; px: number }) => {
    const ids = selNodes.filter((n) => !n.locked).map((n) => n.id);
    if (a === "forward" || a === "backward" || a === "front" || a === "back") {
      const zs = doc.nodes.map((n) => n.z ?? 0), top = Math.max(0, ...zs), bottom = Math.min(0, ...zs);
      commit({ ...doc, nodes: doc.nodes.map((n) => (ids.includes(n.id) ? { ...n, z: a === "forward" ? (n.z ?? 0) + 1 : a === "backward" ? (n.z ?? 0) - 1 : a === "front" ? top + 1 : bottom - 1 } : n)) });
      return;
    }
    const { byNode, units, boxes } = unitBoxes(ids);
    if (boxes.length < 2) return;
    const L = Math.min(...boxes.map((b) => b.x)), R = Math.max(...boxes.map((b) => b.x + b.w)), T = Math.min(...boxes.map((b) => b.y)), B = Math.max(...boxes.map((b) => b.y + b.h));
    const to = new Map<string, { x: number; y: number }>();
    if (a === "left") boxes.forEach((b) => to.set(b.id, { x: L, y: b.y }));
    if (a === "right") boxes.forEach((b) => to.set(b.id, { x: R - b.w, y: b.y }));
    if (a === "hcenter") boxes.forEach((b) => to.set(b.id, { x: (L + R) / 2 - b.w / 2, y: b.y }));
    if (a === "top") boxes.forEach((b) => to.set(b.id, { x: b.x, y: T }));
    if (a === "bottom") boxes.forEach((b) => to.set(b.id, { x: b.x, y: B - b.h }));
    if (a === "vmiddle") boxes.forEach((b) => to.set(b.id, { x: b.x, y: (T + B) / 2 - b.h / 2 }));
    if (a === "distribute-h") { const s2 = [...boxes].sort((p, q) => p.x - q.x), gap = (R - L - s2.reduce((t2, b) => t2 + b.w, 0)) / (s2.length - 1); let x = L; s2.forEach((b) => { to.set(b.id, { x, y: b.y }); x += b.w + gap; }); }
    if (a === "distribute-v") { const s2 = [...boxes].sort((p, q) => p.y - q.y), gap = (B - T - s2.reduce((t2, b) => t2 + b.h, 0)) / (s2.length - 1); let y = T; s2.forEach((b) => { to.set(b.id, { x: b.x, y }); y += b.h + gap; }); }
    if (a === "space" && gap) {
      const h = gap.axis === "h", lo = (b: (typeof boxes)[number]) => (h ? b.x : b.y), hi = (b: (typeof boxes)[number]) => (h ? b.x + b.w : b.y + b.h);
      const bands: { lo: number; hi: number; ids: string[] }[] = [];
      for (const b of [...boxes].sort((p, q) => lo(p) - lo(q))) { const last = bands[bands.length - 1]; if (last && lo(b) < last.hi) { last.hi = Math.max(last.hi, hi(b)); last.ids.push(b.id); } else bands.push({ lo: lo(b), hi: hi(b), ids: [b.id] }); }
      let at = bands[0].lo;
      for (const band of bands) { const d = at - band.lo; band.ids.forEach((id) => { const b = boxes.find((x) => x.id === id)!; to.set(id, h ? { x: b.x + d, y: b.y } : { x: b.x, y: b.y + d }); }); at += band.hi - band.lo + gap.px; }
    }
    if (a === "grid") {
      const cols = Math.ceil(Math.sqrt(boxes.length)), gap = t.distances.x, s2 = [...boxes].sort((p, q) => p.y - q.y || p.x - q.x);
      const cw = Math.max(...s2.map((b) => b.w)), rows: (typeof s2)[] = [];
      s2.forEach((b, i) => { (rows[Math.floor(i / cols)] ??= []).push(b); });
      let y = T; rows.forEach((row) => { row.forEach((b, c) => to.set(b.id, { x: L + c * (cw + gap), y })); y += Math.max(...row.map((b) => b.h)) + t.distances.y; });
    }
    const shift = new Map<string, { dx: number; dy: number }>();
    units.forEach((u, k) => { const p = to.get(u.id), b = boxes[k]; if (p) u.members.forEach((m) => shift.set(m, { dx: p.x - b.x, dy: p.y - b.y })); });
    commit({ ...doc, nodes: doc.nodes.map((n) => { const d = shift.get(n.id), b = byNode.get(n.id); return d && b ? { ...n, x: b.x + d.dx - b.px, y: b.y + d.dy - b.py, pinned: true } : n; }) });
  };
  /** auto layout of the selection, once: the ERD page's layouts over the selected nodes, the connectors between them as the links. It moves nodes only (the connectors follow), keeps the selection's top-left where it was,
   *  leaves a locked node where it is (the selection never holds it), and pins nothing: the person moves them freely after. */
  const layoutSelection = async (presetId: string) => {
    const ids = selNodes.filter((n) => !n.locked).map((n) => n.id);
    const { byNode, units, boxes } = unitBoxes(ids);
    // every node placed by a tool is `pinned` (placed by hand), so pinned says nothing here: the person chose these nodes. A locked node was already left out of `ids`.
    const free = units.map((u, k) => ({ u, b: boxes[k] }));
    if (free.length < 2) return;
    const unitOf = new Map<string, string>(); units.forEach((u) => u.members.forEach((m) => unitOf.set(m, u.id)));
    const links = doc.edges.filter((e) => unitOf.has(e.source) && unitOf.has(e.target)).map((e) => ({ source: unitOf.get(e.source)!, target: unitOf.get(e.target)! })).filter((l) => l.source !== l.target);
    const got = await autoLayout(presetId, free.map(({ u, b }) => ({ id: u.id, width: b.w, height: b.h })), links);
    const L = Math.min(...free.map(({ b }) => b.x)), T = Math.min(...free.map(({ b }) => b.y));
    const gx = Math.min(...free.map(({ u }) => got.get(u.id)?.x ?? 0)), gy = Math.min(...free.map(({ u }) => got.get(u.id)?.y ?? 0));
    const shift = new Map<string, { dx: number; dy: number }>();
    free.forEach(({ u, b }) => { const p = got.get(u.id); if (p) u.members.forEach((m) => shift.set(m, { dx: L + (p.x - gx) - b.x, dy: T + (p.y - gy) - b.y })); });
    commit({ ...doc, nodes: doc.nodes.map((n) => { const d = shift.get(n.id), b = byNode.get(n.id); return d && b ? { ...n, x: b.x + d.dx - b.px, y: b.y + d.dy - b.py } : n; }) });
  };
  const copy = () => {
    if (!selNodes.length) return false;
    const ids = new Set(selNodes.map((n) => n.id));
    const nodes2 = selNodes.map((n) => { if (n.parentId && ids.has(n.parentId)) return n; const i = flow.getInternalNode(n.id); return { ...n, parentId: undefined, x: i?.internals.positionAbsolute.x ?? n.x, y: i?.internals.positionAbsolute.y ?? n.y }; });
    CLIPBOARD = { nodes: nodes2, edges: doc.edges.filter((e) => ids.has(e.source) && ids.has(e.target)), groups: (doc.groups ?? []).filter((g) => g.ids.every((x) => ids.has(x))) };
    return true;
  };
  const paste = () => {
    if (!CLIPBOARD || !CLIPBOARD.nodes.length) return;
    const tops = CLIPBOARD.nodes.filter((n) => !n.parentId);
    const L = Math.min(...tops.map((n) => n.x)), T = Math.min(...tops.map((n) => n.y));
    const r = root.current?.getBoundingClientRect();
    const at = pointer.current ?? (r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: 0, y: 0 });
    const p = flow.screenToFlowPosition(at);
    const idOf = new Map(CLIPBOARD.nodes.map((n) => [n.id, newId()]));
    const nodes2 = CLIPBOARD.nodes.map((n) => { const id = idOf.get(n.id)!; const placed = n.parentId ? { ...n, parentId: idOf.get(n.parentId) } : { ...n, x: n.x - L + p.x, y: n.y - T + p.y }; return { ...reId(placed, id), pinned: true, locked: false }; });
    const edges2 = CLIPBOARD.edges.map((e) => { const id = newId(); return { ...e, id, source: idOf.get(e.source)!, target: idOf.get(e.target)!, label: e.label ? { ...e.label, id } : undefined }; });
    const groups2 = CLIPBOARD.groups.map((g) => ({ id: newId(), ids: g.ids.map((x) => idOf.get(x)!) }));
    commit({ ...doc, nodes: [...doc.nodes, ...nodes2], edges: [...doc.edges, ...edges2], groups: [...(doc.groups ?? []), ...groups2] });
    setSel({ nodes: new Set(nodes2.map((n) => n.id)), edges: new Set(edges2.map((e) => e.id)) });
    setLive(null);
  };
  const cut = () => { if (!copy()) return; const gone = new Set(selNodes.filter((n) => !n.locked).map((n) => n.id)); commit({ ...doc, nodes: doc.nodes.filter((n) => !gone.has(n.id)), edges: doc.edges.filter((e) => !gone.has(e.source) && !gone.has(e.target)), groups: (doc.groups ?? []).map((g) => ({ ...g, ids: g.ids.filter((x) => !gone.has(x)) })).filter((g) => g.ids.length > 1) }); setSel({ nodes: new Set(), edges: new Set() }); };
  // copies the LOOK of the first node and the first connector in the selection (the node's style, the line's style); paste gives each kind its own
  const copyStyle = () => {
    const n = selNodes[0], e = selEdges[0];
    if (!n && !e) return false;
    STYLE = { node: n?.style, edge: e ? { ...t.edges.default, ...e.style, drawing: undefined } : undefined };
    return true;
  };
  const pasteStyle = () => {
    if (!STYLE) return;
    const st = STYLE;
    commit({ ...doc,
      nodes: st.node ? doc.nodes.map((n) => (sel.nodes.has(n.id) && !n.locked && all[n.kind]?.styleBlocks?.length ? { ...n, style: st.node } : n)) : doc.nodes,
      edges: st.edge ? doc.edges.map((e) => (sel.edges.has(e.id) && e.style?.drawing !== "erd" ? { ...e, style: { drawing: e.style?.drawing, ...st.edge } } : e)) : doc.edges });
  };
  const cloned = useRef(false);
  const marqueeBase = useRef<{ nodes: Set<string>; edges: Set<string> } | null>(null);
  const cloneInPlace = (dragged: string[]) => {
    const picked = doc.nodes.filter((n) => dragged.includes(n.id));
    if (!picked.length) return;
    const ids = new Set(picked.map((n) => n.id));
    const idOf = new Map(picked.map((n) => [n.id, newId()]));
    const copies = picked.map((n) => reId({ ...n, parentId: n.parentId && ids.has(n.parentId) ? idOf.get(n.parentId) : n.parentId }, idOf.get(n.id)!));
    const edges2 = doc.edges.filter((e) => ids.has(e.source) && ids.has(e.target)).map((e) => ({ ...e, id: newId(), source: idOf.get(e.source)!, target: idOf.get(e.target)! }));
    const groups2 = (doc.groups ?? []).filter((g) => g.ids.every((x) => ids.has(x))).map((g) => ({ id: newId(), ids: g.ids.map((x) => idOf.get(x)!) }));
    const kept = doc.edges.map((e) => (ids.has(e.source) !== ids.has(e.target) ? { ...e, source: ids.has(e.source) ? idOf.get(e.source)! : e.source, target: ids.has(e.target) ? idOf.get(e.target)! : e.target } : e));
    commit({ ...doc, nodes: [...doc.nodes, ...copies], edges: [...kept, ...edges2], groups: [...(doc.groups ?? []), ...groups2] });
  };
  const clip = useRef({ copy, cut, paste });
  clip.current = { copy, cut, paste };
  useEffect(() => {
    if (!edit) return;
    const typing = (e: Event) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable;
    const put = (e: ClipboardEvent) => { if (CLIPBOARD) { e.clipboardData?.setData("text/plain", JSON.stringify({ omnichord: "canvas", ...CLIPBOARD })); e.preventDefault(); } };
    const onCopy = (e: ClipboardEvent) => { if (typing(e)) return; if (clip.current.copy()) put(e); };
    const onCut = (e: ClipboardEvent) => { if (typing(e)) return; if (clip.current.copy()) { put(e); clip.current.cut(); } };
    const onPaste = (e: ClipboardEvent) => {
      if (typing(e)) return;
      try { const d = JSON.parse(e.clipboardData?.getData("text/plain") ?? ""); if (d?.omnichord === "canvas" && Array.isArray(d.nodes)) { CLIPBOARD = { nodes: d.nodes, edges: d.edges ?? [], groups: d.groups ?? [] }; e.preventDefault(); clip.current.paste(); } } catch { /* text that is not ours */ }
    };
    document.addEventListener("copy", onCopy); document.addEventListener("cut", onCut); document.addEventListener("paste", onPaste);
    return () => { document.removeEventListener("copy", onCopy); document.removeEventListener("cut", onCut); document.removeEventListener("paste", onPaste); };
  }, [edit]);
  useEffect(() => {
    if (!edit) return;
    const on = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") { const ts = selNodes.filter((n) => all[n.kind]?.styleBlocks?.includes("text")); if (ts.length) { e.preventDefault(); const allBold = ts.every((n) => n.style?.text?.bold); restyle({ text: { bold: !allBold } }); } return; }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g") { e.preventDefault(); if (e.shiftKey) ungroup(); else group(); }
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.code === "KeyC") { if (copyStyle()) e.preventDefault(); return; }
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.code === "KeyV") { e.preventDefault(); pasteStyle(); return; }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  });
  const onNodeDoubleClick = useCallback((_: React.MouseEvent, n: Node) => { const g = groupOf(n.id); if (!g) return; setEntered(g.id); setSel((s) => ({ ...s, nodes: new Set([n.id]) })); setLive(null); }, [groupOf]);
  // two or more selected nodes may be resized: one box around the whole selection; every node moves with it, the ones whose size allows it change size on the axes they allow
  const axes = new Map(selNodes.map((n) => [n.id, n.locked ? { width: "content", height: "content" } : sizeOf(n, t, all)] as [string, Size]));
  const resizables = [...axes.values()].filter((s) => s.width === "user" || s.height === "user").length >= 2 ? selNodes.map((n) => n.id) : [];
  const anchorIds = selNodes.length ? selNodes.map((n) => n.id) : [...new Set(selEdges.flatMap((e) => [e.source, e.target]))];
  // a selection whose kinds leave the bar no block (overrides[kind].contextBar): no bar
  const barless = selNodes.length > 0 && blocksFor(selection, all, t).size === 0;
  const unreadableAt = useCallback((px: number) => useStore((st) => px * st.transform[2] < t.viewport.unreadableBelowPx), [t.viewport.unreadableBelowPx]);
  const vp = t.viewport;
  return (
    <UnreadableContext.Provider value={unreadableAt}>
    <div ref={root} className="canvas-root" onPointerDownCapture={(ev) => { marqueeBase.current = ev.shiftKey ? { nodes: new Set(sel.nodes), edges: new Set(sel.edges) } : null; }} onClickCapture={(ev) => {
      if (!(ev.metaKey || ev.ctrlKey || ev.shiftKey) || !(ev.target as HTMLElement).closest?.(".react-flow__nodesselection-rect, .react-flow__nodesselection")) return;
      const at = flow.screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
      const hit = [...flow.getNodes()].reverse().find((n) => { if (!n.selected) return false; const i = flow.getInternalNode(n.id); if (!i) return false; const a = i.internals.positionAbsolute; return at.x >= a.x && at.x <= a.x + (i.measured.width ?? 0) && at.y >= a.y && at.y <= a.y + (i.measured.height ?? 0); });
      if (hit) { ev.stopPropagation(); onNodesChange([{ type: "select", id: hit.id, selected: false }]); }
    }} style={{ height, width: "100%", position: "relative" }} data-testid="canvas" data-template={t.id} data-mode={mode} data-tool={tool ?? "hand"} data-placing={placing} data-cursor={viewLocked && !edit ? undefined : space ? "grab" : cursor} data-space={space ? "1" : undefined} onWheel={viewLocked ? onLockedWheel : undefined} data-view={viewLocked ? "locked" : "open"} data-dropping={dropping ? "yes" : undefined} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onDragOver={onDragOver} onDragLeave={() => setDropping(false)} onDrop={(e) => void onDrop(e)}>
      <style>{RULES}</style>
      {derivedRegs.map((r) => <Derived key={r.kind} registration={r} nodes={doc.nodes.filter((n) => n.kind === r.kind)} onEdges={onDerived} />)}
      <ReactFlow
        nodes={view.nodes} edges={view.edges} onNodeClick={(_, n) => setFocus((f) => (f === n.id ? null : n.id))} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        onNodeDragStart={(e, _n, dragged) => { setDragging(true); cloned.current = false; if (edit && e.altKey) { cloned.current = true; cloneInPlace(dragged.map((d) => d.id)); } }} onNodeDrag={(e, _n, dragged) => { if (edit && e.altKey && !cloned.current) { cloned.current = true; cloneInPlace(dragged.map((d) => d.id)); } }} onNodeDragStop={() => { setDragging(false); cloned.current = false; }}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onReconnect={onReconnect} onEdgeClick={(ev, e) => { if (!edit || e.type !== "canvas" || (e.data as EdgeData)?.erd || !sel.edges.has(e.id) || (e.data as EdgeData)?.style.path === "step") return; const q = flow.screenToFlowPosition({ x: ev.clientX, y: ev.clientY }); window.clearTimeout(bendClick.current); bendClick.current = window.setTimeout(() => addBend(e.id, q), 250); }}
        onEdgeDoubleClick={(_, e) => { window.clearTimeout(bendClick.current); if (edit && e.type === "canvas" && !(e.data as EdgeData)?.erd) setTyping(e.id); }} edgesReconnectable={edit} elevateEdgesOnSelect onPaneClick={onPaneClick} onSelectionStart={() => { boxFrom.current = pointer.current; }} onSelectionEnd={() => { const a = boxFrom.current, b = pointer.current; boxFrom.current = null; if (!a || !b) return; const p = flow.screenToFlowPosition({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y) }), q = flow.screenToFlowPosition({ x: Math.max(a.x, b.x), y: Math.max(a.y, b.y) });
          const paths = new Map<string, SVGPathElement>();
          root.current?.querySelectorAll(".react-flow__edge").forEach((g) => { const id = g.getAttribute("data-id"), el = g.querySelector("path.react-flow__edge-path"); if (id && el) paths.set(id, el as SVGPathElement); });
          const hits = doc.edges.filter((e) => {
            const el = paths.get(e.id); if (!el) return false;
            const bb = el.getBBox(); if (bb.x > q.x || bb.x + bb.width < p.x || bb.y > q.y || bb.y + bb.height < p.y) return false;
            const L = el.getTotalLength(); for (let k = 0; k <= 40; k++) { const v = el.getPointAtLength((L * k) / 40); if (v.x >= p.x && v.x <= q.x && v.y >= p.y && v.y <= q.y) return true; } return false;
          }).map((e) => e.id); const base = marqueeBase.current; marqueeBase.current = null;
          if (!base && !hits.length) return;
          const xor = (before: Set<string>, area: Set<string>) => new Set([...before].filter((x) => !area.has(x)).concat([...area].filter((x) => !before.has(x))));
          setSel((st) => { const area = { nodes: st.nodes, edges: new Set([...st.edges, ...hits]) }; return base ? { nodes: xor(base.nodes, area.nodes), edges: xor(base.edges, area.edges) } : { ...st, edges: area.edges }; }); }} onMoveEnd={onMoveEnd} onNodeDoubleClick={onNodeDoubleClick} zoomOnDoubleClick={false}
        defaultViewport={vpRef.current} fitView={!vpRef.current && vp.fitView} fitViewOptions={{ padding: 0.1 }}
        minZoom={vp.minZoom} maxZoom={vp.maxZoom} zoomOnScroll={!viewLocked} panOnScrollSpeed={1} panOnScroll={!viewLocked} panOnDrag={!viewLocked && (hand || space)} zoomOnPinch={!viewLocked} preventScrolling={!viewLocked}
        snapToGrid={vp.snap} snapGrid={[vp.grid, vp.grid]}
        nodesDraggable={edit && tool === "select" && !space} nodesConnectable={edit && !space} elementsSelectable={!draws && !space}
        selectionOnDrag={tool === "select"} selectionMode={SelectionMode.Partial} multiSelectionKeyCode={["Shift", "Meta", "Control"]}
        connectionMode={t.edges.connection as never} connectOnClick={false} connectionRadius={40} deleteKeyCode={edit ? ["Backspace", "Delete"] : null}
        proOptions={{ hideAttribution: true }}
      >
        {viewLock !== "locked" ? <Panel position="bottom-left"><ViewControls lockable={viewLock === "lockable"} opened={opened} onOpen={setOpened} pulse={pulse} /></Panel> : null}
        {vp.background !== "none" ? <Background gap={vp.grid} size={1} variant={vp.background as never} /> : null}
        {guides ? <ViewportPortal><svg style={{ position: "absolute", left: 0, top: 0, width: 1, height: 1, overflow: "visible", pointerEvents: "none", zIndex: 3000 }}>
          {guides.lines.map((l, i) => <line key={`g${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="var(--primary)" strokeWidth={1} strokeDasharray="3 3" opacity={0.8} vectorEffect="non-scaling-stroke" />)}
          {guides.dot ? <circle cx={guides.dot.x} cy={guides.dot.y} r={3.5 / guides.zoom} fill="var(--primary)" /> : null}
          {guides.gaps.map((l, i) => {
            const z = guides.zoom, tk = 5 / z, gap = 4 / z, vert = Math.abs(l.x1 - l.x2) < 0.5;
            const a = vert ? { x: l.x1, y: Math.min(l.y1, l.y2) + gap } : { x: Math.min(l.x1, l.x2) + gap, y: l.y1 }, b = vert ? { x: l.x1, y: Math.max(l.y1, l.y2) - gap } : { x: Math.max(l.x1, l.x2) - gap, y: l.y1 };
            const bar = (p: { x: number; y: number }) => (vert ? { x1: p.x - tk, y1: p.y, x2: p.x + tk, y2: p.y } : { x1: p.x, y1: p.y - tk, x2: p.x, y2: p.y + tk });
            const n = Math.round(Math.abs(vert ? l.y2 - l.y1 : l.x2 - l.x1));
            return <g key={`d${i}`}>
              <g stroke="var(--primary)" strokeWidth={1} opacity={0.9}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} vectorEffect="non-scaling-stroke" /><line {...bar(a)} vectorEffect="non-scaling-stroke" /><line {...bar(b)} vectorEffect="non-scaling-stroke" /></g>
              <text x={vert ? l.x1 + 8 / z : (a.x + b.x) / 2} y={vert ? (a.y + b.y) / 2 : l.y1 - 8 / z} fontSize={11 / z} fill="var(--primary)" textAnchor={vert ? "start" : "middle"} dominantBaseline={vert ? "central" : "auto"}>{n}</text>
            </g>; })}
        </svg></ViewportPortal> : null}
        {edit ? <Panel position="top-left"><Toolbox items={items} tool={tool} onTool={setArmed} /></Panel> : null}
        {edit && resizables.length >= 2 ? <SelectionResizer ids={resizables} axes={axes} onLive={(m) => setLive((l) => (l ?? nodes).map((n) => { const b = m.get(n.id); if (!b) return n; const dn = doc.nodes.find((x) => x.id === n.id); const scaled = dn ? scaleText(dn, b.k, all) : undefined; return { ...n, position: { x: b.x, y: b.y }, width: b.w, height: b.h, ...(scaled ? { data: { ...(n.data as NodeData), node: scaled } } : {}) }; }))} onDone={(m) => commit({ ...doc, nodes: doc.nodes.map((n) => { const b = m.get(n.id); if (!b) return n; const s = axes.get(n.id); return { ...(scaleText(n, b.k, all) ?? n), x: b.x, y: b.y, width: s?.width === "user" ? b.w : n.width, height: s?.height === "user" ? b.h : n.height, pinned: true }; }) })} /> : null}
        {edit && !entityPick && !dragging && !barless && anchorIds.length ? <AnchoredToNodes ids={anchorIds} docked={selNodes.some((n) => t.overrides?.[n.kind]?.contextBarAt === "top") || view.nodes.some((n) => n.className?.includes("canvas-dim"))}><ContextBar sel={selection} registrations={all} template={t} state={{ highlight: tri([...selNodes.filter((n) => !n.locked).map((n) => highlightOf(n, doc, t)), ...selEdges.map((e) => e.highlight ?? t.defaults.highlight)]), spotlight: tri([...selNodes.filter((n) => !n.locked).map((n) => modeOf(n, doc, t) === "spotlight"), ...selEdges.map((e) => (e.highlightMode ?? t.defaults.highlightMode) === "spotlight")]) }} ev={{
          onSpotlight: (on) => commit({ ...doc, nodes: doc.nodes.map((n) => (sel.nodes.has(n.id) && !n.locked ? { ...n, highlightMode: on ? "spotlight" : "scoped" } : n)), edges: doc.edges.map((e) => (sel.edges.has(e.id) ? { ...e, highlightMode: on ? "spotlight" : "scoped" } : e)) }),
          onHighlight: (on) => commit({ ...doc, nodes: doc.nodes.map((n) => (sel.nodes.has(n.id) && !n.locked ? { ...n, highlight: on } : n)), edges: doc.edges.map((e) => (sel.edges.has(e.id) ? { ...e, highlight: on } : e)) }),
          onFilter: pickOnly, onLock: lock, onGroup: group, onUngroup: ungroup, onArrange: arrange, onLayout: (id) => void layoutSelection(id), onSpace: (axis, px) => arrange("space", { axis, px }), onText: (p) => restyle({ text: p }), onShape: (p) => restyle({ shape: p }), onLine: reline, onReverse: reverse,
          onLayouts: (picks) => commit({ ...doc, nodes: doc.nodes.map((x) => { const p = picks[x.id]; return p ? { ...x, layout: p.layout, switches: p.switches } : x; }) }),
          onSwitches: (id, switches) => patchNode(id, (n) => ({ ...n, switches })), onData: (id, data) => patchNode(id, (n) => ({ ...n, data })),
          onCopyStyle: () => { copyStyle(); }, onPasteStyle: pasteStyle }} /></AnchoredToNodes> : null}
        {edit && entityPick && current?.registration && current.entry ? <Panel position="top-center"><EntityPick project={project ?? ""} registration={current.registration} entry={current.entry} onPick={placeReference} onCancel={() => { setEntityPick(null); setTool("select"); }} /></Panel> : null}
      </ReactFlow>
      {ink && root.current ? (() => { const r = root.current!.getBoundingClientRect(); return <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5 }}><polyline points={ink.map(([x, y]) => `${x - r.left},${y - r.top}`).join(" ")} fill="none" stroke={lastNodeStyle.drawing?.shape?.stroke ?? "var(--foreground)"} strokeWidth={lastNodeStyle.drawing?.shape?.strokeWidth ?? 2.5} strokeLinecap="round" strokeLinejoin="round" /></svg>; })() : null}
      {line ? <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5 }}><line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="5 4" /></svg> : null}
      {preview ? <div style={{ position: "absolute", left: preview.x, top: preview.y, width: preview.w, height: preview.h, border: "1.5px dashed var(--primary)", background: "color-mix(in srgb, var(--primary) 8%, transparent)", pointerEvents: "none", zIndex: 5 }} /> : null}
    </div>
    </UnreadableContext.Provider>
  );
}
export function Canvas(props: CanvasProps) {
  return <ReactFlowProvider><PaletteProvider colors={props.colors}><Inner {...props} /></PaletteProvider></ReactFlowProvider>;
}
