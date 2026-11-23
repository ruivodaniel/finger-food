import { Canvas, canvasOwnKinds, free, type CanvasDocument } from "@libs/knowledge/hosts/canvas";
import { Instance, instances } from "../../../lib/instance";
import { codeBlock, explorationCard, noteSticker, richTable } from "@libs/knowledge/previewer-editors";

/** Pattern: knowledge — the canvas host (v3). Instantiated with the canvas's own kinds and the knowledge-generic previewer-editors that exist today.
 *  Exploration link is intentionally out (it reads the slice-design entity store; it will move to an exploration slice). */

const DOC: CanvasDocument = {
  id: "canvas-demo", template: "free", edges: [], groups: [],
  nodes: [
    { id: "rectangle-1", kind: "rectangle", x: 80, y: 80, width: 220, height: 120, data: { form: "rectangle", text: "A rectangle" } },
    { id: "note-1", kind: "note_sticker", x: 380, y: 80, width: 170, height: 170, layout: "small", data: { id: "note-1", text: "A note" } },
  ],
};

/** the measure of the previewer's container around each fixture */
export const measure = "xl";

export default function CanvasFixture() {
  return (
    <Instance id="canvas" initial={{ data: { document: DOC } }}>
      {(x) => (
        <div style={{ height: 600 }}>
          <Canvas
            document={x.data.document as CanvasDocument}
            template={free}
            registrations={[...Object.values(canvasOwnKinds), codeBlock, richTable, noteSticker, explorationCard]}
            mode="edit"
            onChange={(d) => instances.patch("canvas", "data", { document: d })}
            viewLock="unlocked"
          />
        </div>
      )}
    </Instance>
  );
}
