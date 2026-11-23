import { register } from "../../canvas-registration";
import { DrawingView, type DrawingData } from "./View";
import { anything, oneLayout } from "../spec";

const PenPicture = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 15 C 5 9, 8 13, 10 8 S 14 4, 15 3" /></svg>;
export const drawing = register<DrawingData>({
  kind: "drawing", name: "drawing", component: DrawingView, schema: anything, spec: oneLayout("drawing", "drawing", "a stroke drawn by hand; moved and resized as a box"),
  data: "owned_by_node", edit: "none",
  tools: [{ id: "pen", name: "pen (P)", key: "p", picture: PenPicture, what: "draw freely; the drawing can be moved and resized", placing: "stroke", data: (_, __, stroke) => ({ points: stroke?.points ?? [], w0: stroke?.w0 ?? 4, h0: stroke?.h0 ?? 4 }) }],
  layout: { default: "default", editable: [] },
  layouts: { default: { size: { width: "user", height: "user" }, min: { width: 8, height: 8 }, keepAspect: "shift" } },
  styleBlocks: ["drawing"],
});
