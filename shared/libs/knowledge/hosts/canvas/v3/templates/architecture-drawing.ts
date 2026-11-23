// ARCHITECTURE DRAWING: boxes and arrows: cards, containers, shapes, text, notes, tables, code
import type { Template } from "../template";
import { BASE } from "./base";
export const architectureDrawing: Template = {
  ...BASE, id: "architecture-drawing", name: "architecture drawing",
  disallow: [],
  tools: { disallow: [] },
  edges: { ...BASE.edges, byPair: { "exploration_card>exploration_card": { path: "straight", end: "arrow", drawing: "line" } } },
};
