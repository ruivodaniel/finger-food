import { register } from "../../canvas-registration";
import { FrameView, type ContainerData } from "../container/View";
import { anything, oneLayout } from "../spec";

export const frame = register<ContainerData>({
  kind: "frame", name: "frame", component: FrameView, schema: anything, spec: oneLayout("frame", "frame", "a container with a background; never goes inside anything"),
  data: "owned_by_node", edit: "none",
  tools: [{ id: "frame", name: "frame (F)", key: "f", icon: "layers", what: "drag to draw a frame: a container with a background", placing: "drag_box", size: { width: 520, height: 360 }, data: () => ({ title: "Frame" }) }],
  layout: { default: "default", editable: [] },
  layouts: { default: { size: { width: "user", height: "user" }, min: { width: 120, height: 80 } } },
  container: { adopts: true, nestable: false },
});
