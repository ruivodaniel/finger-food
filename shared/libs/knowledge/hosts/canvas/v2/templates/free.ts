// FREE: everything allowed, every tool, every kind the canvas was given; the grid to try the component with. A line to a sticker is dashed with no arrow.
import type { Template } from "../template";
import { BASE } from "./base";
export const free: Template = {
  ...BASE, id: "free", name: "free",
  edges: { ...BASE.edges, byPair: { "exploration_card>exploration_card": { path: "straight", end: "arrow", drawing: "line" }, "*>note_sticker": { path: "straight", dashed: true, end: "none", drawing: "line" } }, derived: true },
};
