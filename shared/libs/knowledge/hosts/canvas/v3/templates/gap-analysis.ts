// GAP ANALYSIS: what exists against what is wanted: cards, notes and references in frames, with connectors per frame
import type { Template } from "../template";
import { BASE } from "./base";
export const gapAnalysis: Template = {
  ...BASE, id: "gap-analysis", name: "gap analysis",
  allow: ["frame", "container", "exploration_card", "note_sticker", "text", "point", "image", "drawing", "exploration_link"],
  tools: { allow: ["select", "pan", "connector", "line", "pen", "frame", "container", "card", "note", "text", "exploration"] },
  edges: { ...BASE.edges, byPair: { "exploration_card>exploration_card": { path: "straight", end: "arrow", drawing: "line" }, "*>note_sticker": { path: "straight", dashed: true, end: "none", drawing: "line" } } },
};
