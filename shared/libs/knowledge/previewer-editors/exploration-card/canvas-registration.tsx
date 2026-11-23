// The exploration card on a canvas: owned by its node, its own sheet editor (the previewer's Editable, under the canvas's host); three layouts
import { register, type CanvasViewProps } from "../../hosts/canvas/v3/canvas-registration";
import { CanvasCard } from "./Previewer";
import { spec } from "./spec";
import type { CanvasCard as Data } from "./types";

const View = ({ data, layout, switches, editable, onChange }: CanvasViewProps<Data>) => <CanvasCard layout={layout} v={switches as Record<string, string | boolean>} data={data} edit={editable && onChange ? { source: "fixture", kind: "card", onSubmit: onChange } : undefined} />;
export const explorationCard = register<Data>({
  kind: "exploration_card", name: "card", component: View, schema: { parse: (x) => x as Data }, spec,
  data: "owned_by_node", edit: "sheet",
  tools: [{ id: "card", name: "card (C)", key: "c", icon: "component", what: "click to place a card; hover it to edit", placing: "click", data: () => ({ id: crypto.randomUUID(), title: "New card" }) }],
  layout: { default: "title", editable: ["title", "title-description", "picture"] },
  layouts: {
    title: { size: { width: "content", height: "content" }, satellites: [{ action: "edit", where: "top-left" }, { action: "settings", where: "top-left" }] },
    "title-description": { size: { width: "content", height: "content" }, satellites: [{ action: "edit", where: "top-left" }, { action: "settings", where: "top-left" }] },
    picture: { size: { width: "content", height: "content" }, satellites: [{ action: "edit", where: "top-left" }, { action: "settings", where: "top-left" }] },
  },
});
