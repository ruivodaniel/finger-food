// The plantuml diagram on a canvas: owned by its node, edited in place (the text beside the drawing while the canvas edits). The box is the person's; the drawing scrolls inside it.
import { useEffect, useState, type ReactNode } from "react";
import { register, type CanvasViewProps } from "../../../hosts/canvas/v3/canvas-registration";
import { Previewer } from "./Previewer";
import { spec } from "./spec";
import type { PlantumlDiagram } from "./types";

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
const View = ({ data, layout, switches, editable, onChange, selected }: CanvasViewProps<PlantumlDiagram>) => <Active selected={selected}><Previewer layout={layout} v={switches as Record<string, string | boolean>} data={data} edit={editable && onChange ? { source: "fixture", kind: "plantuml diagram", onSubmit: onChange } : undefined} /></Active>;
export const diagramPlantuml = register<PlantumlDiagram>({
  kind: "diagram_plantuml", name: "plantuml diagram", component: View, schema: { parse: (x) => x as PlantumlDiagram }, spec,
  data: "owned_by_node", edit: "in_place",
  tools: [{ id: "diagram-plantuml", name: "plantuml diagram", group: "complex", placing: "drag_box", size: { width: 720, height: 420 }, data: () => ({ id: crypto.randomUUID(), text: "@startuml\nAlice -> Bob : Hello\n@enduml" }) }],
  layout: { default: "diagram", editable: ["diagram"] },
  layouts: { diagram: { size: { width: "user", height: "user" }, min: { width: 320, height: 200 } } },
});
