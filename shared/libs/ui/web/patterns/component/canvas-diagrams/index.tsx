import { Canvas, canvasOwnKinds, free, type CanvasDocument } from "@libs/knowledge/hosts/canvas";
import { diagramMermaid, diagramPlantuml, diagramSwimlane } from "@libs/knowledge/previewer-editors";
import swimlane from "../../../../../knowledge/previewer-editors/diagram-swimlane/v3/fixtures.json";
import mermaid from "../../../../../knowledge/previewer-editors/diagram-mermaid/v2/fixtures.json";
import plantuml from "../../../../../knowledge/previewer-editors/diagram-plantuml/v2/fixtures.json";
import { Instance, instances } from "../../../lib/instance";

/** Pattern: knowledge — the three diagram components on a canvas (v3): the swimlane (BPMN), the Mermaid diagram and the PlantUML diagram, each ONE node owned by the canvas document.
 *  The toolbox places new ones (complex group). */
const ID = "canvas-diagrams";
const DOC: CanvasDocument = {
  id: "canvas-diagrams-demo", template: "free", edges: [], groups: [],
  nodes: [
    { id: "swimlane-1", kind: "diagram_swimlane", x: 40, y: 40, width: 760, height: 560, data: swimlane[0].data },
    { id: "mermaid-1", kind: "diagram_mermaid", x: 860, y: 40, width: 760, height: 560, data: mermaid[0].data },
    { id: "plantuml-1", kind: "diagram_plantuml", x: 1680, y: 40, width: 760, height: 560, data: plantuml[0].data },
  ],
};

/** the measure of the previewer's container around each fixture */
export const measure = "xl";

export default function CanvasDiagramsFixture() {
  return (
    <Instance id={ID} initial={{ data: { document: DOC } }}>
      {(x) => (
        <div style={{ height: 700 }}>
          <Canvas
            document={x.data.document as CanvasDocument}
            template={free}
            registrations={[...Object.values(canvasOwnKinds), diagramSwimlane, diagramMermaid, diagramPlantuml]}
            mode="edit"
            onChange={(d) => instances.patch(ID, "data", { document: d })}
            viewLock="unlocked"
          />
        </div>
      )}
    </Instance>
  );
}
