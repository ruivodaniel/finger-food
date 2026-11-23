// The connection handles of a node: the ones its config offers (properties/handles.ts), four sides and the centre. Hidden until the node is hovered or a connection is drawn (Canvas.tsx's style rules);
// with the connector tool the whole node is a handle, so a drag from anywhere on it starts a floating connection. React Flow's loose mode: every handle a source, so any side is either end of a line.
import { Handle, Position } from "@xyflow/react";
import type { HandleId } from "../canvas-registration";

const dot: React.CSSProperties = { width: 9, height: 9, borderRadius: 9, background: "var(--primary, #4338ca)", border: "2px solid var(--bg, #fff)", opacity: 0, transition: "opacity .12s" };
const SIDES: Record<Exclude<HandleId, "center">, Position> = { top: Position.Top, left: Position.Left, bottom: Position.Bottom, right: Position.Right };
export const Handles = ({ ids }: { ids: HandleId[] }) => (
  <>
    {ids.filter((h): h is Exclude<HandleId, "center"> => h !== "center").map((h) => <Handle key={h} id={h} type="source" position={SIDES[h]} className="canvas-handle" style={dot} />)}
    {ids.includes("center") ? <Handle id="center" type="source" position={Position.Top} className="canvas-handle canvas-handle-center" style={{ ...dot, width: 11, height: 11, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} /> : null}
  </>
);
/** with the connector tool the whole node is a handle: drawn last, over the content */
export const FullHandle = () => <Handle id="center" type="source" position={Position.Top} className="canvas-handle-full" style={{ position: "absolute", inset: 0, top: 0, left: 0, width: "100%", height: "100%", transform: "none", borderRadius: 0, border: "none", background: "transparent", opacity: 1, display: "none", cursor: "crosshair", zIndex: 4 }} />;
