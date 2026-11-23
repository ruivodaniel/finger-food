import type { Spec } from "../../types";

/** The swimlane diagram: lanes and a flow across them, with the shapes and the rules of its template (BPMN today). One layout.
 *  `direction`: the lanes as columns with the flow going down, or as rows with the flow going right. `editable`: the toolbox, the dragging and the connecting; off is the view mode.
 *  `toolbox`: expanded or collapsed, only when editable. `stickyHeader`: the lanes' headers stay while the lanes scroll (not on a canvas). The colours of the lanes and of the elements are the instance's, over the template's. */
export const spec: Spec = {
  id: "diagram-swimlane", name: "diagram-swimlane", state: "draft",
  layouts: [{ id: "diagram", name: "diagram", description: "the lanes and the flow; with the toolbox when editable", image: "none", props: [
    { name: "template", kind: "union", values: ["bpmn"], default: "bpmn" },
    { name: "direction", kind: "union", values: ["vertical", "horizontal"], default: "vertical" },
    { name: "editable", kind: "boolean", default: false },
    { name: "toolbox", kind: "union", values: ["expanded", "collapsed"], default: "expanded" },
    { name: "stickyHeader", kind: "boolean", default: true },
  ], hover: [] }],
};
