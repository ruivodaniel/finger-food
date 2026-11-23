// THE SWIMLANE: lanes, shapes placed by the swimlane itself (layout.ts), connectors routed by it. Data in, events out; it never saves.
// It fills the box the consumer gives and scrolls inside it; the lanes' headers stay (at the top when the flow goes down, at the left when it goes right). `stickyHeader={false}` where staying makes no sense (a canvas).
// Editable: a toolbox with the template's shapes, collapsible; a shape is dragged into a lane at an order, a connector is drawn from a shape's dot to another shape; the template's rules refuse
// what they do not allow and the reason shows. A double click types a shape's text or a connector's label in place; Delete removes what is selected. Not editable: the drawing alone.
// Exception to the library rules, named here: the shapes and the lanes are drawn here, with the template's and the instance's colours, not with the library's components.
import { useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type PointerEvent as RPointerEvent } from "react";
import { CanvasNote as NoteSticker } from "../../note-sticker/Previewer";
import { Previewer as CodeChip } from "../../code-block/Previewer";
import type { Diagram, DiagramEvent, DiagramNode, Direction, ElementColors, Kind } from "./types";
import { TEMPLATES, type ShapeRule, type Template } from "./template";
import { layout, type Box } from "./layout";

const INK = "#1a1a1a", LINE = "#5a5a5a", FONT = "12px/1.25 var(--font-sans, system-ui, sans-serif)";
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7));
/** a readable ink on a fill: white on a dark one */
const on = (fill: string) => { const m = /^#([0-9a-f]{6})$/i.exec(fill); if (!m) return INK; const n = parseInt(m[1], 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 128 ? "#ffffff" : INK; };

/** one shape, as the template says it is drawn; the same drawing in the toolbox and in a lane */
function Shape({ rule, fill, text, size }: { rule: ShapeRule; fill: string; text?: string; size: { w: number; h: number } }) {
  const base: CSSProperties = { width: size.w, height: size.h, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", font: FONT, color: on(fill), userSelect: "none" };
  if (rule.form === "circle") return <div style={{ ...base, borderRadius: "50%", background: fill, border: rule.kind === "start" ? `3px solid ${LINE}` : `1px solid ${INK}`, fontSize: 10 }}>{rule.name}</div>;
  if (rule.form === "diamond") return <div style={{ ...base, position: "relative" }}><div style={{ position: "absolute", inset: "14.6%", background: fill, transform: "rotate(45deg)", borderRadius: 3 }} /><span style={{ position: "relative", fontSize: 15, fontWeight: 600 }}>{rule.mark}</span></div>;
  if (rule.form === "note") return <div style={{ ...base, background: fill, boxShadow: "0 1px 2px rgba(0,0,0,.25)" }} />;
  if (rule.form === "code") return <div style={{ ...base, background: fill, color: "#ffffff", borderRadius: 8, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 15, fontWeight: 700 }}>{"{ }"}</div>;
  return <div style={{ ...base, background: fill, border: `1px solid ${LINE}`, borderRadius: 4, padding: "2px 8px", textAlign: "center", overflow: "hidden" }}>{text}</div>;
}

export type SwimlaneProps = {
  data: Diagram;
  /** which template: its shapes, its rules, its default colours */
  template?: string;
  direction?: Direction;
  /** the colour of each lane, by lane id; unset: the lane's own, else the template's */
  laneColors?: Record<string, string>;
  /** the colour of the shapes by kind, and of the connectors; unset: the template's */
  elementColors?: ElementColors;
  /** false is the view mode: no toolbox, no drag, no connect */
  editable?: boolean;
  /** the toolbox's state, the consumer's to keep (told back by `toolbox-toggled`); unset: the swimlane keeps it */
  toolbox?: "expanded" | "collapsed";
  stickyHeader?: boolean;
  onEvent?: (e: DiagramEvent) => void;
};

export function Swimlane({ data, template = "bpmn", direction = "vertical", laneColors, elementColors, editable = false, toolbox, stickyHeader = true, onEvent }: SwimlaneProps) {
  const T: Template = TEMPLATES[template] ?? TEMPLATES.bpmn;
  const flip = direction === "horizontal";
  const L = useMemo(() => layout(data, direction, editable ? 1 : 0), [data, direction, editable]);
  const rule = (k: Kind) => T.shapes.find((s) => s.kind === k)!;
  const fillOf = (k: Kind) => elementColors?.[k] ?? T.elementColors[k];
  const lineColor = elementColors?.connector ?? T.elementColors.connector;
  const laneFill = (id: string, i: number) => laneColors?.[id] ?? data.lanes[i].color ?? T.laneColors[i % T.laneColors.length];

  const [own, setOwn] = useState<"expanded" | "collapsed">("expanded");
  const box = toolbox ?? own;
  const [selected, setSelected] = useState<{ what: "node" | "edge"; id: string } | null>(null);
  const [typing, setTyping] = useState<{ what: "node" | "edge" | "lane"; id: string; value: string } | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [refused, setRefused] = useState<string | null>(null);
  const [wire, setWire] = useState<{ from: string; x: number; y: number } | null>(null);
  const plane = useRef<HTMLDivElement>(null);
  const emit = (e: DiagramEvent) => onEvent?.(e);
  const refuse = (why: string | null) => { setRefused(why); };
  useEffect(() => { if (!refused) return; const t = window.setTimeout(() => setRefused(null), 3200); return () => window.clearTimeout(t); }, [refused]);

  // DROP: a new shape from the toolbox, or a shape moved; the template says if it may go there
  const drop = (e: DragEvent, lane: string, order: number, onNode?: string) => {
    e.preventDefault(); setOver(null);
    const kind = e.dataTransfer.getData("swimlane/kind") as Kind | "", moved = e.dataTransfer.getData("swimlane/node");
    if (kind) {
      const node: DiagramNode = kind === "note" ? { id: uid(), kind, lane, order, attachedTo: onNode, note: { id: uid(), text: "" } } : kind === "code" ? { id: uid(), kind, lane, order, attachedTo: onNode, code: { id: uid(), code: "// code" } } : { id: uid(), kind, lane, order, ...(rule(kind).text ? { text: "Action" } : {}) };
      const why = T.canPlace(data, node); if (why) return refuse(why);
      emit({ type: "node-added", node }); if (rule(kind).text) setTyping({ what: "node", id: node.id, value: node.text ?? "" });
    } else if (moved) {
      const n = data.nodes.find((x) => x.id === moved); if (!n || (n.lane === lane && n.order === order)) return;
      const why = T.canPlace(data, { ...n, lane, order }); if (why) return refuse(why);
      emit({ type: "node-moved", id: moved, lane, order });
    }
  };
  // CONNECT: from a shape's dot to the shape under the pointer when it is released
  const local = (e: { clientX: number; clientY: number }) => { const r = plane.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const startWire = (e: RPointerEvent, from: string) => { e.stopPropagation(); e.preventDefault(); (e.target as Element).setPointerCapture(e.pointerId); setWire({ from, ...local(e) }); };
  const moveWire = (e: RPointerEvent) => { if (wire) setWire({ ...wire, ...local(e) }); };
  const endWire = (e: RPointerEvent) => {
    if (!wire) return; setWire(null);
    const to = (document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-node]") as HTMLElement | null)?.dataset.node;
    if (!to || to === wire.from) return;
    const why = T.canConnect(data, wire.from, to); if (why) return refuse(why);
    emit({ type: "edge-added", edge: { id: uid(), from: wire.from, to } });
  };
  const key = (e: React.KeyboardEvent) => {
    if (!editable || typing || !selected || (e.key !== "Delete" && e.key !== "Backspace")) return;
    e.preventDefault(); emit(selected.what === "node" ? { type: "node-deleted", id: selected.id } : { type: "edge-deleted", id: selected.id }); setSelected(null);
  };
  const commit = () => {
    if (!typing) return; const v = typing.value.trim();
    if (typing.what === "node") emit({ type: "node-renamed", id: typing.id, text: v }); else if (typing.what === "edge") emit({ type: "edge-renamed", id: typing.id, label: v }); else if (v) emit({ type: "lane-renamed", id: typing.id, name: v });
    setTyping(null);
  };
  const field = (style: CSSProperties) => typing ? <input autoFocus value={typing.value} onChange={(e) => setTyping({ ...typing, value: e.target.value })} onBlur={commit} onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") commit(); if (e.key === "Escape") setTyping(null); }} className="nodrag nopan" style={{ font: FONT, border: `1px solid ${LINE}`, borderRadius: 4, padding: "2px 6px", textAlign: "center", boxSizing: "border-box", background: "#fff", color: INK, ...style }} /> : null;
  const center = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
  const sticky = (b: Box): CSSProperties => (stickyHeader ? (flip ? { position: "sticky", left: 0 } : { position: "sticky", top: 0 }) : {});

  return (
    <div data-testid="swimlane" tabIndex={0} onKeyDown={key} onPointerDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
      style={{ display: "flex", width: "100%", height: "100%", minHeight: 0, outline: "none", border: "1px solid var(--border, #d9d9d9)", borderRadius: 8, overflow: "hidden", background: "#ffffff" }}>
      {editable ? (
        <div data-part="toolbox" style={{ flex: "0 0 auto", width: box === "expanded" ? 132 : 34, borderRight: "1px solid var(--border, #d9d9d9)", background: "#f6f6f6", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <button type="button" title={box === "expanded" ? "collapse the toolbox" : "expand the toolbox"} onClick={() => { const next = box === "expanded" ? "collapsed" : "expanded"; setOwn(next); emit({ type: "toolbox-toggled", collapsed: next === "collapsed" }); }}
            style={{ display: "flex", alignItems: "center", justifyContent: box === "expanded" ? "space-between" : "center", gap: 6, padding: "8px 10px", border: 0, background: "none", cursor: "pointer", font: "600 10px/1 var(--font-sans, system-ui)", letterSpacing: ".08em", color: LINE }}>
            {box === "expanded" ? <span>TOOLBOX</span> : null}<span aria-hidden>{box === "expanded" ? "‹" : "›"}</span>
          </button>
          {box === "expanded" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "6px 8px 12px", overflowY: "auto" }}>
              {T.shapes.map((s) => (
                <div key={s.kind} data-tool={s.kind} draggable title={`drag ${s.name} into a lane`} onDragStart={(e) => { e.dataTransfer.setData("swimlane/kind", s.kind); e.dataTransfer.effectAllowed = "copy"; }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "grab" }}>
                  <Shape rule={s} fill={fillOf(s.kind)} text={s.form === "box" ? s.name : undefined} size={s.form === "box" ? { w: 96, h: 34 } : s.form === "note" ? { w: 18, h: 18 } : s.form === "code" ? { w: 36, h: 36 } : { w: 40, h: 40 }} />
                  {s.form !== "box" && s.form !== "circle" ? <span style={{ font: "10px/1.2 var(--font-sans, system-ui)", color: LINE, textAlign: "center" }}>{s.name}</span> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative", display: "flex", flexDirection: "column" }}>
        <div data-part="scroll" style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <div ref={plane} style={{ position: "relative", width: L.width, height: L.height }} onPointerMove={moveWire} onPointerUp={endWire}>
            {L.lanes.map((ln, i) => <div key={ln.id} data-lane={ln.id} style={{ position: "absolute", left: ln.box.x, top: ln.box.y, width: ln.box.w, height: ln.box.h, background: laneFill(ln.id, i), opacity: 0.38, boxSizing: "border-box", [flip ? "borderBottom" : "borderRight"]: "1px solid rgba(0,0,0,.18)" }} />)}
            {editable ? L.cells.map((c) => (
              <div key={c.lane + c.order} data-cell={`${c.lane}:${c.order}`} onDragOver={(e) => { e.preventDefault(); setOver(c.lane + c.order); }} onDragLeave={() => setOver((o) => (o === c.lane + c.order ? null : o))} onDrop={(e) => drop(e, c.lane, c.order)}
                style={{ position: "absolute", left: c.box.x, top: c.box.y, width: c.box.w, height: c.box.h, boxSizing: "border-box", background: over === c.lane + c.order ? "rgba(0,0,0,.07)" : "transparent" }} />
            )) : null}
            <svg width={L.width} height={L.height} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
              <defs><marker id={`sw-arrow-${data.id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={lineColor} /></marker></defs>
              {L.routes.map((r) => { const d = "M" + r.points.map((p) => p.join(",")).join(" L"), sel = selected?.what === "edge" && selected.id === r.edge.id; return (
                <g key={r.edge.id} data-edge={r.edge.id}>
                  <path d={d} fill="none" stroke={lineColor} strokeWidth={sel ? 2.5 : 1.5} markerEnd={`url(#sw-arrow-${data.id})`} />
                  <path d={d} fill="none" stroke="transparent" strokeWidth={12} style={{ pointerEvents: "stroke", cursor: editable ? "pointer" : "default" }} onClick={() => setSelected({ what: "edge", id: r.edge.id })} onDoubleClick={() => { if (editable) setTyping({ what: "edge", id: r.edge.id, value: r.edge.label ?? "" }); }} />
                  {r.edge.label && !(typing?.what === "edge" && typing.id === r.edge.id) ? <text x={r.label.x} y={r.label.y} textAnchor={r.label.anchor} fontSize="11" fill={lineColor} style={{ fontFamily: "var(--font-sans, system-ui)" }}>{r.edge.label}</text> : null}
                </g>
              ); })}
              {wire ? (() => { const a = L.nodes.find((n) => n.node.id === wire.from); if (!a) return null; const c = center(a.box); return <path d={`M${c.x},${c.y} L${wire.x},${wire.y}`} stroke={lineColor} strokeWidth={1.5} strokeDasharray="4 4" fill="none" />; })() : null}
            </svg>
            {L.routes.map((r) => typing?.what === "edge" && typing.id === r.edge.id ? <div key={r.edge.id} style={{ position: "absolute", left: r.label.x - 30, top: r.label.y - 16 }}>{field({ width: 64 })}</div> : null)}
            {L.nodes.map(({ node: n, box: b }) => {
              const r = rule(n.kind), sel = selected?.what === "node" && selected.id === n.id, isTyping = typing?.what === "node" && typing.id === n.id;
              if (n.kind === "code") return (
                <div key={n.id} data-node={n.id} data-kind="code" onPointerDown={() => setSelected({ what: "node", id: n.id })} style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, outline: sel ? `2px solid ${INK}` : "none", outlineOffset: 2 }}>
                  <CodeChip layout="compact" v={{ language: n.language ?? "javascript", fontSize: "11", showLineNumbers: false }} data={n.code ?? { id: n.id, code: "" }} />
                </div>
              );
              if (n.kind === "note") return (
                <div key={n.id} data-node={n.id} data-kind="note" onPointerDown={() => setSelected({ what: "node", id: n.id })} style={{ position: "absolute", left: b.x, top: b.y, outline: sel ? `2px solid ${INK}` : "none", outlineOffset: 2 }}>
                  <NoteSticker layout="note" v={{ size: "tiny" }} data={n.note ?? { id: n.id, text: "" }} edit={editable ? { source: "fixture", kind: "note", onSubmit: (note) => emit({ type: "note-changed", id: n.id, note }) } : undefined} />
                </div>
              );
              return (
                <div key={n.id} data-node={n.id} data-kind={n.kind} draggable={editable && !isTyping} onDragStart={(e) => { e.dataTransfer.setData("swimlane/node", n.id); e.dataTransfer.effectAllowed = "move"; }}
                  onDragOver={editable ? (e) => e.preventDefault() : undefined} onDrop={editable ? (e) => drop(e, n.lane, n.order, n.id) : undefined}
                  onPointerDown={() => setSelected({ what: "node", id: n.id })} onDoubleClick={() => { if (editable && r.text) setTyping({ what: "node", id: n.id, value: n.text ?? "" }); }}
                  style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, cursor: editable ? "grab" : "default", outline: sel ? `2px solid ${INK}` : "none", outlineOffset: 3, borderRadius: r.form === "circle" ? "50%" : 4 }}>
                  {isTyping ? field({ width: b.w, height: b.h }) : <Shape rule={r} fill={fillOf(n.kind)} text={n.text} size={{ w: b.w, h: b.h }} />}
                  {editable && sel && r.maxOut !== 0 && !isTyping ? <div data-part="connect" title="drag to another shape to connect" onPointerDown={(e) => startWire(e, n.id)} draggable={false} onDragStart={(e) => e.preventDefault()}
                    style={{ position: "absolute", ...(flip ? { right: -7, top: "50%", marginTop: -6 } : { bottom: -7, left: "50%", marginLeft: -6 }), width: 12, height: 12, borderRadius: "50%", background: "#fff", border: `2px solid ${INK}`, cursor: "crosshair", touchAction: "none" }} /> : null}
                </div>
              );
            })}
            {L.lanes.map((ln, i) => (
              <div key={ln.id} data-lane-head={ln.id} style={{ position: "absolute", left: ln.box.x, top: ln.box.y, width: ln.box.w, height: ln.box.h, pointerEvents: "none" }}>
                <div onDoubleClick={() => { if (editable) setTyping({ what: "lane", id: ln.id, value: data.lanes[i].name }); }}
                  style={{ ...sticky(ln.head), zIndex: 2, pointerEvents: "auto", width: flip ? L.header : ln.head.w, height: flip ? ln.head.h : L.header, boxSizing: "border-box", background: laneFill(ln.id, i), border: "1px solid rgba(0,0,0,.22)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 11px/1 var(--font-sans, system-ui)", letterSpacing: ".04em", color: INK, writingMode: flip ? "vertical-rl" : undefined, transform: flip ? "rotate(180deg)" : undefined }}>
                  {typing?.what === "lane" && typing.id === ln.id ? field({ width: 120, writingMode: "horizontal-tb", transform: flip ? "rotate(180deg)" : undefined }) : data.lanes[i].name}
                </div>
              </div>
            ))}
          </div>
        </div>
        {refused ? <div data-part="refused" role="status" style={{ position: "absolute", left: 12, bottom: 12, padding: "6px 10px", borderRadius: 6, background: INK, color: "#fff", font: FONT, maxWidth: "80%" }}>{refused}</div> : null}
        {editable ? <button type="button" data-part="add-lane" onClick={() => emit({ type: "lane-added", lane: { id: uid(), name: "LANE" } })} style={{ position: "absolute", right: 12, top: flip ? undefined : 6, bottom: flip ? 12 : undefined, font: FONT, padding: "3px 8px", borderRadius: 6, border: "1px solid var(--border, #d9d9d9)", background: "#fff", color: INK, cursor: "pointer", zIndex: 3 }}>+ lane</button> : null}
      </div>
    </div>
  );
}
