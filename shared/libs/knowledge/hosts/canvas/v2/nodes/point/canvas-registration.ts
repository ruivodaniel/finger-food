import { register } from "../../canvas-registration";
import { PointView } from "./View";
import { anything, oneLayout } from "../spec";

export const point = register<Record<string, never>>({
  kind: "point", name: "point", component: PointView, schema: anything, spec: oneLayout("point", "point", "a free end of a connector; it goes when no connector uses it"),
  data: "owned_by_node", edit: "none",
  layout: { default: "default", editable: [] },
  layouts: { default: { size: { width: "content", height: "content" }, handles: [] } },
  freeEnd: true,
});
