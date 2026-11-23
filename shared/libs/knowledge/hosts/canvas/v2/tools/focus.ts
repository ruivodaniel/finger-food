// Brings the eye to nodes: the view is set to hold them (never closer than maxZoom) and each one pulses, bigger and faster than a single node's pulse, so far-apart ones are found.
// The viewport is computed and set directly: React Flow's own fitView is queued until its next node update, and anything else that runs first (the picker closing) takes it over.
import { getViewportForBounds, type ReactFlowInstance } from "@xyflow/react";

export function focusNodes(flow: ReactFlowInstance, show: string[], pulse: string[], opts: { padding?: number; maxZoom?: number } = {}) {
  const els = pulse.map((id) => document.querySelector(`.react-flow__node[data-id="${CSS.escape(id)}"]`));
  const root = els.find(Boolean)?.closest(".react-flow") ?? document.querySelector(".react-flow");
  const box = root?.getBoundingClientRect();
  const nodes = show.map((id) => flow.getInternalNode(id)).filter((n): n is NonNullable<typeof n> => !!n);
  if (box && nodes.length) {
    const bounds = flow.getNodesBounds(nodes.map((n) => n.id));
    void flow.setViewport(getViewportForBounds(bounds, box.width, box.height, 0.05, opts.maxZoom ?? 5, opts.padding ?? 0.4), { duration: 600 });
  }
  els.forEach((el) => el?.classList.add("canvas-find-pulse"));
  window.setTimeout(() => els.forEach((el) => el?.classList.remove("canvas-find-pulse")), 1500);
}
