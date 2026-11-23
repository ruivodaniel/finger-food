// WHAT THE KNOWLEDGE LIBRARY OFFERS TO A UI DOCUMENT: its components that are code and take data only. A UI document names one by its name, as it names a component
// of the UI library; the app that mounts the document hands this set to the live screen or the live component, once. The UI as data engine knows none of them.
// Each is the version of the component that takes data only (kanban v2, swimlane v2, the two diagrams v2).
// A component is here when everything it is given is data and everything it gives back is an event. The canvases and the two previewers are not: they are handed code.
import type * as React from "react";
import { KanbanBoard } from "./hosts/kanban/v2";
import { Swimlane } from "./previewer-editors/diagram-swimlane/v3";
import { DiagramMermaid } from "./previewer-editors/diagram-mermaid/v2";
import { DiagramPlantuml } from "./previewer-editors/diagram-plantuml/v2";
import { TodoAddButton, TodoCount, TodoHideDone, TodoTree } from "./previewer-editors/todo-tree";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Component = React.ComponentType<any>;
/** the components, by the name a document gives them */
export const KNOWLEDGE_COMPONENTS: Record<string, Component> = { KanbanBoard, Swimlane, DiagramMermaid, DiagramPlantuml, TodoTree, TodoCount, TodoHideDone, TodoAddButton };
export { KNOWLEDGE_PRIMS } from "./hosted-prims";
