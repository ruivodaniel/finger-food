// CANVAS REGISTRATION — what a kind is on the canvas. One per kind, beside the previewer-editor (canvas-registration.ts); the previewer-editor's own component and spec know nothing of it.
// A field marked [T] may be overridden by a template (Template.overrides), one marked [N] by a node. Ruled on the Canvas exploration (v34) and Transition to PROWD (v32).
// The spec already says the layouts and their switches: nothing of that is repeated here; the registration points at the spec and adds what the canvas needs, per layout where the drawing differs.
import type { ComponentType } from "react";
import type { Spec, Values } from "../../previewer-editors/types";
import type { EditorProps } from "../../previewer-editors/editing/types";

/** the id of a canvas registration: "note_sticker", "code_block", "rectangle". Once every registration is typed, this becomes the union of their kinds */
export type KindId = string;
/** the id of a layout of the previewer-editor's spec: "block", "compact" */
export type LayoutId = string;
export type HandleId = "top" | "left" | "bottom" | "right" | "center";
export const ALL_HANDLES: HandleId[] = ["top", "left", "bottom", "right", "center"];
/** one axis of a node's box: follows what is drawn, or set by the person and saved on the node (the axis with resize handles) */
export type Axis = "content" | "user";
export type Size = { width: Axis; height: Axis };
/** what fades on a click: scoped, only the nodes with highlight on; spotlight, every other node */
export type HighlightMode = "scoped" | "spotlight";
/** a tool of the toolbox: one mode at a time. The canvas's own: select, pan, connector, line. Every other is a registration's (its `tools`) */
export type Tool = string;
export const CANVAS_TOOLS = ["select", "pan", "connector", "line"] as const;
/** what gravitates around a node, and where. `edit` opens the registration's editor in a sheet; `settings` the layout and the switches */
export type Satellite = { action: "edit" | "settings"; where: "top-left" | "top-right" | "bottom-left" | "bottom-right" };
export type Switches = Record<string, string | boolean | number>;
/** the shape of a kind's data: anything that parses (zod's ZodType is one) */
export type Schema<D = unknown> = { parse(input: unknown): D };
/** the classes the theme styles: the style toolbar's choices, saved on the node */
export type TextStyle = { fontSize?: number; bold?: boolean; align?: "left" | "center" | "right"; color?: string };
export type ShapeStyle = { fill?: string; fillOpacity?: number; stroke?: string; strokeWidth?: number; strokeStyle?: "solid" | "dashed" | "dotted"; radius?: number };
export type NodeStyle = { text?: TextStyle; shape?: ShapeStyle };
/** a referenced row: which one, and where ids repeat (seed clones) which project it is read from */
export type Reference = { id: string; project?: string };

/** what the canvas hands the component: the row (owned_by_node: the node's data; referenced: the reference, and the component reads the row) and the instance's layout, switches and style */
export type CanvasViewProps<D = unknown> = {
  data: D; layout: LayoutId; switches: Switches; style?: NodeStyle;
  /** the canvas's edit mode and the node unlocked: the component may change the row in place */
  editable: boolean;
  /** the row changed in place (owned_by_node), or the style (a shape's text, a fill) */
  onChange?: (data: D) => void; onStyle?: (style: NodeStyle) => void;
  /** the node, as React Flow knows it: selected, being dragged, in a selection of several */
  selected: boolean; dragging: boolean; multi: boolean;
};
export type CanvasView<D = unknown> = ComponentType<CanvasViewProps<D>>;

/** a style block of the context bar a kind offers: its text, its fill (a text box's background), its border, the icon block (colour, weight, the square behind), the drawing block (stroke colour, thickness) */
export type StyleBlock = "text" | "fill" | "border" | "icon" | "drawing";
/** a tool of the toolbox that places this kind. A kind may offer several (a shape: rectangle, oval, diamond, triangle, labelled, icon box) */
export type ToolEntry<D = unknown> = {
  id: Tool;
  name: string;
  /** the keyboard shortcut, one letter */
  key?: string;
  /** a library icon name, or a picture drawn by the toolbox */
  icon?: string; picture?: ComponentType;
  /** what the toolbox says on hover */
  what?: string;
  /** where the toolbox lists it: its main column, the shapes flyout, the complex shapes flyout */
  group?: "shapes" | "complex";
  /** how it is placed: drag a box out (a click gives `size`), click where it goes, pick an existing row (referenced kinds), draw a stroke with the pen */
  placing: "drag_box" | "click" | "pick" | "stroke";
  /** the box a click places, for drag_box */
  size?: { width: number; height: number };
  /** the style a new one starts with (a labelled box: a thick border, bold) */
  style?: NodeStyle;
  /** something asked before placing (an icon, a table's rows and columns): a component whose pick is merged into the new row */
  ask?: ComponentType<{ onPick: (data: Partial<D>) => void }>;
  /** what a new one holds, from the box drawn and what was asked; a stroke tool receives the points */
  data: (box: { width: number; height: number }, asked?: Partial<D>, stroke?: Stroke) => D;
  /** the layout a new one opens in, else the registration's default */
  layout?: LayoutId;
  /** pick: the rows to choose from, by a search; the pick becomes the node's reference */
  pick?: (project: string, query: string) => Promise<{ id: string; name: string; sub?: string }[]>;
};
/** what the pen drew: the points, relative to the box, and the box's size */
export type Stroke = { points: [number, number][]; w0: number; h0: number };
/** a line the data draws between two nodes (an ERD's foreign keys): never stored */
export type DerivedEdge = { id: string; source: string; target: string; color?: string; one?: string; many?: string };

export type CanvasRegistration<D = unknown> = {
  kind: KindId;
  /** the word the tool uses: "sticky note", "code block" */
  name: string;
  /** what draws it: a previewer-editor, or the canvas's own view */
  component: CanvasView<D>;
  schema: Schema<D>;
  /** the previewer-editor's spec: its layouts and their switches, which the settings satellite and the layout picker read */
  spec: Spec;
  /** owned_by_node: the row is the node's (a note: deleted with it, copied as a new row); referenced: a row that outlives the node (a persona: placed many times, edited everywhere). Both rows in the database */
  data: "owned_by_node" | "referenced";
  /** how the toolbox offers it; none: not in the toolbox */
  tools?: ToolEntry<D>[];
  /** how its data is changed on the canvas: typed in place (text, cells, code), the previewer-editor's editor in a sheet, or not at all */
  edit: "in_place" | "sheet" | "none";
  /** the editor the sheet opens (edit: sheet) */
  editor?: ComponentType<EditorProps<D>>;
  /** referenced, edit sheet: the draft saved where the row lives */
  save?: (reference: Reference, next: D) => void | Promise<void>;
  /** [T] [N] the layout it opens in; the ones the bar may switch to */
  layout: { default: LayoutId; editable: LayoutId[] };
  /** per layout: the same kind is a different box in each */
  layouts: Record<LayoutId, LayoutOnCanvas>;
  /** the style blocks of the context bar this kind offers (the node's `style`); none: no style block */
  styleBlocks?: StyleBlock[];
  /** a block of its own in the context bar when one node of this kind is selected (the code block's language, size, line numbers) */
  optionsBar?: ComponentType<{ data: D; switches: Switches; onSwitches: (s: Switches) => void; onData: (d: D) => void }>;
  /** a box that adopts a node dropped on it (a container, a frame): it moves with it; drawn behind. `nestable: false`: it never goes inside another box */
  container?: { adopts: true; nestable: boolean };
  /** the free end of a connector: a point on the canvas, no box; it goes when no connector uses it */
  freeEnd?: true;
  /** a file dropped on the canvas becomes a node of this kind (an image): which files, what the row holds, the box it takes from the file's natural size */
  dropsFile?: { accept: (file: File) => boolean; data: (src: string, file: File) => D; size: (natural: { width: number; height: number }) => { width: number; height: number } };
  /** the lines the data draws between the nodes of this kind on the canvas (an ERD's foreign keys), when the template says `edges.derived`: a hook, called with the nodes of this kind */
  useDerivedEdges?: (nodes: { id: string; data: D }[]) => DerivedEdge[];
};
export type LayoutOnCanvas = {
  /** [T] the node's box */
  size: Size;
  /** [T] [N] unset: the template's default */
  handles?: HandleId[];
  /** [T] */
  satellites?: Satellite[];
  /** [T] what to draw when the zoom makes it unreadable; unset: as it is */
  farAway?: "skeleton";
  /** the smallest box the person may resize it to */
  min?: { width?: number; height?: number };
  /** a resize keeps the proportions (an image, an icon); "shift": only while Shift is held */
  keepAspect?: true | "shift";
  /** the corner handles scale this numeric switch with the width (a code block's font size: the whole block scales with it) */
  scaleSwitch?: string;
};
/** the registrations a canvas knows, by kind: the slice's own and the shared ones, gathered by whoever instantiates the canvas */
export type Registrations = Record<KindId, CanvasRegistration>;
/** types a registration without widening it */
export const register = <D,>(r: CanvasRegistration<D>): CanvasRegistration<D> => r;
/** the switches a layout starts with, from the spec */
export const switchDefaultsOf = (r: CanvasRegistration, layout: LayoutId): Values => { const l = r.spec.layouts.find((x) => x.id === layout); return Object.fromEntries([...(l?.props ?? []), ...(l?.hover ?? [])].map((p) => [p.name, p.default])); };
