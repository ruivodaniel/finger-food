import { register } from "../../canvas-registration";
import { TextView, type TextData } from "./View";
import { anything, oneLayout } from "../spec";

export const text = register<TextData>({
  kind: "text", name: "text", component: TextView, schema: anything, spec: oneLayout("text", "text", "a text box: a fill, no border; double click to type"),
  data: "owned_by_node", edit: "in_place",
  tools: [{ id: "text", name: "text (T)", key: "t", icon: "text", what: "drag to draw a text box, click for the default size; double click it to type", placing: "drag_box", size: { width: 200, height: 40 }, data: () => ({ text: "Text" }) }],
  layout: { default: "default", editable: [] },
  layouts: { default: { size: { width: "user", height: "user" }, min: { width: 60, height: 24 } } },
  styleBlocks: ["text", "fill"],
});
