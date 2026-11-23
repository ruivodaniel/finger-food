// The swimlane on a canvas: ONE node. The canvas places the swimlane; the swimlane places its own shapes. Owned by its node, edited in place while the canvas edits.
import { useEffect, useState, type ReactNode } from "react";
import { register, type CanvasViewProps } from "../../../hosts/canvas/v3/canvas-registration";
import { Swimlane } from "./Surface";
import { apply } from "./apply";
import { spec } from "./spec";
import type { Diagram, Direction } from "./types";

// Like the table: until a double click the diagram is only a node (the canvas zooms and scrolls over it, a drag moves it). After a double click it has its own clicks, drags and wheel
// (nodrag nopan nowheel); deselecting the node or Escape gives them back to the canvas.
function Active({ selected, children }: { selected: boolean; children: ReactNode }) {
  const [active, setActive] = useState(false);
  useEffect(() => { if (!selected) setActive(false); }, [selected]);
  return (
    <div onDoubleClick={() => setActive(true)} onKeyDown={(e) => { if (e.key === "Escape") setActive(false); }} title={active ? undefined : "double click to use the diagram"} style={{ width: "100%", height: "100%" }}>
      <div className={active ? "nodrag nopan nowheel" : undefined} style={{ width: "100%", height: "100%", pointerEvents: active ? "auto" : "none" }}>{children}</div>
    </div>
  );
}
const View = ({ data, switches, editable, onChange, selected }: CanvasViewProps<Diagram>) => (
  <Active selected={selected}><Swimlane data={data} template={String(switches.template ?? "bpmn")} direction={(switches.direction as Direction) ?? "vertical"} editable={editable && !!onChange} onEvent={(e) => onChange?.(apply(data, e))} /></Active>
);
export const diagramSwimlane = register<Diagram>({
  kind: "diagram_swimlane", name: "swimlane", component: View, schema: { parse: (x) => x as Diagram }, spec,
  data: "owned_by_node", edit: "in_place",
  tools: [{ id: "diagram-swimlane", name: "swimlane", group: "complex", placing: "drag_box", size: { width: 760, height: 520 }, data: () => ({ id: crypto.randomUUID(), name: "Swimlane", lanes: [{ id: crypto.randomUUID(), name: "USER" }, { id: crypto.randomUUID(), name: "SYSTEM" }], nodes: [], edges: [] }) }],
  layout: { default: "diagram", editable: ["diagram"] },
  layouts: { diagram: { size: { width: "user", height: "user" }, min: { width: 360, height: 240 } } },
});
