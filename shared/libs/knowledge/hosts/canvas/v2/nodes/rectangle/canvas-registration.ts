import type { Spec } from "../../../../previewer-editors/types";
import { register, type ToolEntry } from "../../canvas-registration";
import { IconGrid } from "../../tools/IconGrid";
import { RectangleView, type RectangleData, type ShapeForm } from "./View";
import { anything } from "../spec";

/** three layouts: the plain shape; a labelled box with its title on the left; its title on top */
const spec: Spec = { id: "shape", name: "shape", state: "approved", layouts: [
  { id: "shape", name: "shape", description: "the shape with its text", image: "none", props: [], hover: [] },
  { id: "labelled", name: "title left", description: "a labelled box: the title in a column on the left of the content", image: "none", props: [], hover: [] },
  { id: "labelled-top", name: "title on top", description: "a labelled box: the title above the content", image: "none", props: [], hover: [] },
] };
const form = (id: ShapeForm, name: string, key?: string): ToolEntry<RectangleData> => ({ id, name, key, group: "shapes", placing: "drag_box", size: id === "rectangle" ? { width: 200, height: 120 } : id === "oval" ? { width: 160, height: 120 } : { width: 160, height: 140 }, data: () => ({ form: id }) });
const labelled = { style: { shape: { strokeWidth: 2 }, text: { bold: true } }, layout: "labelled", group: "complex" as const, placing: "drag_box" as const, size: { width: 320, height: 100 } };
export const rectangle = register<RectangleData>({
  kind: "rectangle", name: "shape", component: RectangleView, schema: anything, spec,
  data: "owned_by_node", edit: "in_place",
  tools: [
    form("rectangle", "rectangle", "r"), form("oval", "oval", "o"), form("diamond", "diamond", "d"), form("triangle", "triangle"),
    { id: "labelled", name: "labelled box", ...labelled, data: () => ({ form: "rectangle", badge: "Title", text: "" }) },
    { id: "iconbox", name: "icon box", ...labelled, ask: ({ onPick }) => IconGrid({ value: null, onPick: (name) => onPick({ labelIcon: name }) }), data: (_, asked) => ({ form: "rectangle", text: "", labelIcon: asked?.labelIcon ?? "add" }) },
  ],
  layout: { default: "shape", editable: ["shape", "labelled", "labelled-top"] },
  layouts: { shape: { size: { width: "user", height: "user" }, min: { width: 30, height: 24 }, keepAspect: "shift" }, labelled: { size: { width: "user", height: "user" }, min: { width: 30, height: 24 } }, "labelled-top": { size: { width: "user", height: "user" }, min: { width: 30, height: 24 } } },
  styleBlocks: ["text", "fill", "border"],
});
