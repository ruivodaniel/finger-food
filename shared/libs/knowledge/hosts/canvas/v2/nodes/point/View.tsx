// A free end of a connector: a small dot, seen when selected; drag it to move the end
import { Handle, Position } from "@xyflow/react";
import type { CanvasViewProps } from "../../canvas-registration";
export const PointView = ({ selected }: CanvasViewProps<Record<string, never>>) => (
  <div className="canvas-point" style={{ width: 12, height: 12, borderRadius: 6, position: "relative", background: selected ? "var(--primary, #4338ca)" : "transparent", border: `2px solid ${selected ? "var(--bg, #fff)" : "transparent"}`, boxSizing: "border-box" }}>
    <Handle id="center" type="source" position={Position.Top} style={{ opacity: 0, inset: 0, width: "100%", height: "100%", transform: "none", top: 0, left: 0, border: "none" }} />
  </div>
);
