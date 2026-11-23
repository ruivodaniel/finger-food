import { register } from "../../canvas-registration";
import { IconGrid } from "../../tools/IconGrid";
import { IconView, type IconData } from "./View";
import { anything, oneLayout } from "../spec";

export const icon = register<IconData>({
  kind: "icon", name: "icon", component: IconView, schema: anything, spec: oneLayout("icon", "icon", "an icon of the library, on its own"),
  data: "owned_by_node", edit: "none",
  tools: [{ id: "icon", name: "icon", key: "i", group: "shapes", placing: "drag_box", size: { width: 48, height: 48 }, ask: ({ onPick }) => IconGrid({ value: null, onPick: (name) => onPick({ name }) }), data: (_, asked) => ({ name: asked?.name ?? "star" }), style: { shape: { stroke: "#1a1a1a", strokeWidth: 2 } } }],
  layout: { default: "default", editable: [] },
  layouts: { default: { size: { width: "user", height: "user" }, min: { width: 16, height: 16 }, keepAspect: true } },
  styleBlocks: ["icon"],
});
