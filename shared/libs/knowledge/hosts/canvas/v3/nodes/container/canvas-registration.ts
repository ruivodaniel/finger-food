import { register } from "../../canvas-registration";
import { ContainerView, type ContainerData } from "./View";
import { anything, oneLayout } from "../spec";

export const container = register<ContainerData>({
  kind: "container", name: "container", component: ContainerView, schema: anything, spec: oneLayout("container", "container", "a box: a node dropped in it is adopted and moves with it"),
  data: "owned_by_node", edit: "none",
  tools: [{ id: "container", name: "container (B)", key: "b", icon: "layout", what: "drag to draw a container: a box; a node dropped in it is adopted and moves with it", placing: "drag_box", size: { width: 360, height: 240 }, data: () => ({ title: "New container" }), style: { shape: { fill: "var(--primary)", fillOpacity: 15 } } }],
  styleBlocks: ["fill"],
  layout: { default: "default", editable: [] },
  layouts: { default: { size: { width: "user", height: "user" }, min: { width: 120, height: 80 } } },
  container: { adopts: true, nestable: true },
});
