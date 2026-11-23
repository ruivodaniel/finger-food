// THE NODE — one React Flow node type for every kind. The registration says what it is; this draws what every node shares, from the config resolved by the canvas:
// the handles, the resizer on the axes the size says "user", the satellites at its corners, the edit sheet; and renders the registration's component with the row.
// No kind is named here.
import { useLayoutEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { NodeResizeControl, NodeResizer, ResizeControlVariant, type NodeProps } from "@xyflow/react";
import type { CanvasRegistration, CanvasView, HandleId, LayoutId, LayoutOnCanvas, NodeStyle, Reference, Switches } from "../canvas-registration";
import type { CanvasNode } from "../document";
import { EditHost } from "../../../../previewer-editors/editing/EditHost";
import { Editable } from "../../../../previewer-editors/editing/Editable";
import type { EditorProps } from "../../../../previewer-editors/editing/types";
import { Handles, FullHandle } from "./handles";
import { useShift } from "./shift";
import { Satellites } from "../satellites/Satellites";

/** what every node's React Flow `data` carries: the canvas node, its registration and the config resolved for it, and the canvas's callbacks (undefined in read mode or when locked) */
export type NodeData = {
  node: CanvasNode;
  registration: CanvasRegistration;
  layout: LayoutId;
  /** the switches in force: the spec's defaults under the node's own */
  switches: Switches;
  onCanvas: LayoutOnCanvas;
  handles: HandleId[];
  /** in a selection of two or more: the box around the selection resizes, the node's own handles are off */
  multi: boolean;
  /** a referenced row's project when the node names none */
  project?: string;
  /** its editor opens as it is first drawn: a row just made from the picker, whose creation says so */
  openEditor?: boolean;
  onData?: (id: string, data: unknown) => void;
  onStyle?: (id: string, style: NodeStyle) => void;
  onSwitches?: (id: string, layout: LayoutId, switches: Switches) => void;
  onNode?: (id: string, patch: Partial<CanvasNode>) => void;
};

export function CanvasNodeView({ data, selected, dragging }: NodeProps) {
  const d = data as NodeData;
  const { node, registration: r, layout, switches, onCanvas, handles, multi } = d;
  const editable = !!d.onData && !node.locked;
  const shift = useShift();
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(!!d.openEditor);
  const [hasEditor, setHasEditor] = useState(false);
  const host = useMemo(() => ({ open, setOpen, register: setHasEditor }), [open]);
  const box = useRef<HTMLDivElement>(null);
  const userW = onCanvas.size.width === "user", userH = onCanvas.size.height === "user";
  // a user width with none saved yet: it draws as its content once, and that width becomes the node's
  const first = userW && node.width === undefined;
  useLayoutEffect(() => { if (first && box.current && d.onNode) { const w = Math.round(box.current.offsetWidth); if (w > 0) d.onNode(node.id, { width: w }); } }, [first]);   // eslint-disable-line react-hooks/exhaustive-deps
  const View = r.component as CanvasView<unknown>;
  const sats = onCanvas.satellites ?? [];
  const showSats = (hover || open) && !dragging && !node.locked && sats.length > 0 && (d.onSwitches || hasEditor || r.editor);
  const resizable = !!selected && !multi && !node.locked && editable;
  const keep = onCanvas.keepAspect === true || (onCanvas.keepAspect === "shift" && shift);
  const min = onCanvas.min ?? {};
  const content = (
    <View data={node.data} layout={layout} switches={switches} style={node.style} editable={editable} selected={!!selected} dragging={!!dragging} multi={multi}
      onChange={d.onData ? (x: unknown) => d.onData!(node.id, x) : undefined} onStyle={d.onStyle ? (s: NodeStyle) => d.onStyle!(node.id, s) : undefined} />
  );
  // the edit sheet: the registration's editor (the previewer-editor's own Editable, under the host, registers itself instead)
  const Editor = r.editor as ComponentType<EditorProps<unknown>> | undefined;
  const edit = r.edit === "sheet" && editable ? { source: r.data === "referenced" ? ("live" as const) : ("fixture" as const), kind: r.name, onSubmit: async (next: unknown) => { if (r.data === "referenced") await r.save?.(node.data as Reference, next); else d.onData?.(node.id, next); } } : undefined;
  return (
    <div ref={box} data-kind={r.kind} style={{ position: "relative", width: userW && !first ? "100%" : undefined, height: userH ? "100%" : undefined }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Handles ids={handles} />
      {resizable && userW && userH ? <NodeResizer isVisible minWidth={min.width ?? 8} minHeight={min.height ?? 8} keepAspectRatio={keep} /> : null}
      {resizable && userW && !userH && !first ? <><NodeResizeControl variant={ResizeControlVariant.Line} position="left" minWidth={min.width ?? 80} style={{ zIndex: 5 }} /><NodeResizeControl variant={ResizeControlVariant.Line} position="right" minWidth={min.width ?? 80} style={{ zIndex: 5 }} /></> : null}
      {resizable && userH && !userW ? <><NodeResizeControl variant={ResizeControlVariant.Line} position="top" minHeight={min.height ?? 24} style={{ zIndex: 5 }} /><NodeResizeControl variant={ResizeControlVariant.Line} position="bottom" minHeight={min.height ?? 24} style={{ zIndex: 5 }} /></> : null}
      {resizable && onCanvas.scaleSwitch ? <ScaleCorners node={node} switchName={onCanvas.scaleSwitch} switches={switches} layout={layout} onSwitches={d.onSwitches} /> : null}
      <EditHost.Provider value={host}>
        {Editor && edit ? <Editable edit={edit} data={node.data} Editor={Editor}>{content}</Editable> : content}
      </EditHost.Provider>
      <FullHandle />
      {showSats ? <Satellites node={node} registration={r} layout={layout} switches={switches} satellites={sats} canEdit={hasEditor || !!Editor} onEdit={() => setOpen(true)} onSwitches={d.onSwitches} /> : null}
    </div>
  );
}

/** the corner handles that scale a numeric switch with the width (a code block's font size): the switch is written when the resize ends */
function ScaleCorners({ node, switchName, switches, layout, onSwitches }: { node: CanvasNode; switchName: string; switches: Switches; layout: LayoutId; onSwitches?: NodeData["onSwitches"] }) {
  const start = useRef({ w: 1, v: 14 });
  const at = (w: number) => Math.min(200, Math.max(4, Math.round(start.current.v * (w / start.current.w))));
  return <>{(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((p) => <NodeResizeControl key={p} position={p} keepAspectRatio minWidth={80} style={{ zIndex: 6 }}
    onResizeStart={(_, r) => { start.current = { w: r.width, v: Number(switches[switchName]) || 14 }; }}
    onResizeEnd={(_, r) => onSwitches?.(node.id, layout, { ...(node.switches ?? {}), [switchName]: String(at(r.width)) })} />)}</>;
}
export const nodeTypes = { canvas: CanvasNodeView };
