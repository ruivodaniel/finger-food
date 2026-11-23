// WHAT EACH COMPONENT THE KNOWLEDGE LIBRARY OFFERS TO A UI DOCUMENT TAKES AND GIVES. Pure data: the validator of a UI document reads it, with no component loaded.
// The components themselves are in ./hosted.ts, by the same names.
import type { Prim } from "@libs/ui-data/types";

const common = { "data-testid": "string", id: "string", key: "string" } as const;
const diagram: Prim = { props: { ...common, layout: "string", v: "any", data: "any", editSource: { enum: ["fixture", "live"] } }, events: ["submit"], container: false, interactable: true };

/** what each takes and gives: the validator of a UI document reads it */
export const KNOWLEDGE_PRIMS: Record<string, Prim> = {
  KanbanBoard: { props: { ...common, layout: "string", v: "any", data: "any", collapsed: "any", look: "any", colors: "any", tagColors: "any" }, events: ["event", "change"], container: false, interactable: true },
  Swimlane: { props: { ...common, data: "any", template: "string", direction: { enum: ["vertical", "horizontal"] }, laneColors: "any", elementColors: "any", editable: "boolean", toolbox: { enum: ["expanded", "collapsed"] }, stickyHeader: "boolean" }, events: ["event", "change"], container: false, interactable: true },
  DiagramMermaid: diagram,
  DiagramPlantuml: diagram,
  TodoTree: { props: { ...common, nodes: "any", closed: "any", hideDone: "boolean", show: "any", editId: "string", expandOnClick: "boolean", editOnDoubleClick: "boolean", buttons: "any", cascadeDown: "boolean", cascadeUp: "boolean" }, events: ["change", "closed"], container: false, interactable: true },
  TodoCount: { props: { ...common, nodes: "any" }, events: [], container: false },
  TodoHideDone: { props: { ...common, value: "boolean" }, events: ["change"], container: false, interactable: true },
  TodoAddButton: { props: { ...common, label: "string" }, events: ["click"], container: false, interactable: true },
};
