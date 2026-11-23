import { register } from "../../canvas-registration";
import { ImageView, type ImageData } from "./View";
import { anything, oneLayout } from "../spec";

export const image = register<ImageData>({
  kind: "image", name: "image", component: ImageView, schema: anything, spec: oneLayout("image", "image", "a picture dropped on the canvas; its file is the consumer's"),
  data: "owned_by_node", edit: "none",
  layout: { default: "default", editable: [] },
  layouts: { default: { size: { width: "user", height: "user" }, min: { width: 24, height: 24 }, keepAspect: true } },
  // a dropped picture: its natural size, at most 360 wide or tall
  dropsFile: { accept: (f) => f.type.startsWith("image/"), data: (src, f) => ({ src, alt: f.name }), size: (n) => { const k = Math.min(1, 360 / Math.max(n.width, n.height)); return { width: Math.round(n.width * k), height: Math.round(n.height * k) }; } },
});
