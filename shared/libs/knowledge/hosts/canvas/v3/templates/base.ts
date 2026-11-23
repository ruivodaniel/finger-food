// What every template shares: the viewport and the line defaults. A template spreads it and says what differs.
import { ALL_HANDLES } from "../canvas-registration";
import type { Template } from "../template";
export const BASE: Pick<Template, "edges" | "arrange" | "distances" | "viewport" | "defaults"> = {
  edges: { default: { path: "straight", end: "arrow", drawing: "line" }, byPair: {}, connection: "loose", rememberLast: true },
  arrange: "grid", distances: { x: 24, y: 24 },
  viewport: { minZoom: 0.05, maxZoom: 5, fitView: true, background: "dots", grid: 22, snap: false, unreadableBelowPx: 5 },
  defaults: { highlight: false, highlightMode: "scoped", handles: ALL_HANDLES, rememberLastStyle: true },
};
