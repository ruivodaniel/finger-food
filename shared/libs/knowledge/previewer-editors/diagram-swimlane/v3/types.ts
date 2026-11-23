// The swimlane diagram: lanes and a flow across them. Data in, events out; it never saves. The swimlane places its own shapes: a shape says its lane and its order, never x and y.
import type { CanvasNote } from "../../note-sticker/types";
import type { CodeSnippet } from "../../code-block/types";

/** the shapes of the BPMN template: a start, an end, an action (the only box; its text is free), the two decisions (only one happens: X; all happen: +), a note and a code snippet (both sit next to a shape) */
export type Kind = "start" | "end" | "action" | "only-one" | "all" | "note" | "code";
export type Lane = { id: string; name: string; /** the instance's colour for this lane; unset: the template's */ color?: string };
/** a shape sits in a lane at an order (a whole number: the position along the flow) */
export type DiagramNode = { id: string; kind: Kind; text?: string; lane: string; order: number; /** a note or a code snippet: the shape it sits next to, and what it carries */ attachedTo?: string; note?: CanvasNote; code?: CodeSnippet; /** a code snippet: its language (the code block's languages); unset: javascript */ language?: string };
export type DiagramEdge = { id: string; from: string; to: string; /** written on the connector, next to the shape it leaves (a decision's yes, no) */ label?: string; /** a connector that passes shapes of its own lane goes around them by this side of the lane; unset: right */ side?: "left" | "right" };
export type Diagram = { id: string; name: string; lanes: Lane[]; nodes: DiagramNode[]; edges: DiagramEdge[] };
export type Direction = "vertical" | "horizontal";
/** the colours of the elements: by shape, and the connectors. Unset: the template's */
export type ElementColors = Partial<Record<Kind | "connector", string>>;

/** what the swimlane tells the consumer; it changes nothing by itself (`apply` turns an event into the next diagram) */
export type DiagramEvent =
  | { type: "node-added"; node: DiagramNode }
  | { type: "node-moved"; id: string; lane: string; order: number }
  | { type: "node-renamed"; id: string; text: string }
  | { type: "node-deleted"; id: string }
  | { type: "note-changed"; id: string; note: CanvasNote }
  | { type: "code-changed"; id: string; code: CodeSnippet }
  | { type: "edge-added"; edge: DiagramEdge }
  | { type: "edge-renamed"; id: string; label: string }
  | { type: "edge-deleted"; id: string }
  | { type: "lane-added"; lane: Lane }
  | { type: "lane-renamed"; id: string; name: string }
  | { type: "toolbox-toggled"; collapsed: boolean };
