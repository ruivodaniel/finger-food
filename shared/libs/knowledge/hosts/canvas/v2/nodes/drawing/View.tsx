// A free drawing: the stroke as drawn, stretched with its box; the stroke keeps its thickness. Its colour and thickness are the node's shape style.
import type { CanvasViewProps } from "../../canvas-registration";
export type DrawingData = { points: [number, number][]; w0: number; h0: number };
export function DrawingView({ data, style }: CanvasViewProps<DrawingData>) {
  const d = data.points.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <svg viewBox={`0 0 ${data.w0} ${data.h0}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
        <path d={d} fill="none" stroke={style?.shape?.stroke ?? "#1a1a1a"} strokeWidth={style?.shape?.strokeWidth ?? 2.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
