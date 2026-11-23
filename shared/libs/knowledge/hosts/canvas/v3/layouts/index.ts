// AUTO LAYOUT — the vector-force and layered layouts of the ERD page, for the boxes of a selection. A batch: it answers positions once, the person is free to move the nodes after.
// The presets and the algorithms are the ERD page's (slice-design/app/erd/graph.tsx): d3-force for the organic one, dagre for the hierarchical and no-crossing ones, ELK for the layered and the stress ones.
// Pure: boxes and links in, the top-left of each box out. Nothing here knows a canvas.
import dagre from "dagre";
import * as d3Force from "d3-force";
import ELK from "elkjs/lib/elk.bundled.js";

export type LayoutConfig = {
  id: string; name: string; algorithm: "force" | "dagre" | "elk";
  spacing: { horizontal: number; vertical: number };
  options: {
    chargeStrength?: number; linkDistance?: number; iterations?: number; radialStrength?: number;
    direction?: "TB" | "LR"; ranker?: "network-simplex" | "tight-tree" | "longest-path";
    elkAlgorithm?: "layered" | "stress"; elkDirection?: "DOWN" | "RIGHT";
  };
};
export const LAYOUT_PRESETS: Record<string, LayoutConfig> = {
  force: { id: "force", name: "Organic (force)", algorithm: "force", spacing: { horizontal: 250, vertical: 250 }, options: { chargeStrength: -1500, linkDistance: 250, iterations: 300, radialStrength: 0.3 } },
  "hierarchical-tb": { id: "hierarchical-tb", name: "Hierarchical ↓", algorithm: "dagre", spacing: { horizontal: 40, vertical: 80 }, options: { direction: "TB", ranker: "network-simplex" } },
  "hierarchical-lr": { id: "hierarchical-lr", name: "Hierarchical →", algorithm: "dagre", spacing: { horizontal: 80, vertical: 30 }, options: { direction: "LR", ranker: "network-simplex" } },
  "no-crossing": { id: "no-crossing", name: "No crossing", algorithm: "dagre", spacing: { horizontal: 250, vertical: 250 }, options: { direction: "TB", ranker: "tight-tree" } },
  "elk-layered": { id: "elk-layered", name: "ELK layered ↓", algorithm: "elk", spacing: { horizontal: 80, vertical: 100 }, options: { elkAlgorithm: "layered", elkDirection: "DOWN" } },
  "elk-layered-lr": { id: "elk-layered-lr", name: "ELK layered →", algorithm: "elk", spacing: { horizontal: 100, vertical: 60 }, options: { elkAlgorithm: "layered", elkDirection: "RIGHT" } },
  "elk-stress": { id: "elk-stress", name: "ELK stress", algorithm: "elk", spacing: { horizontal: 600, vertical: 600 }, options: { elkAlgorithm: "stress" } },
};

export type LayoutBox = { id: string; width: number; height: number };
export type LayoutLink = { source: string; target: string };
export type Positions = Map<string, { x: number; y: number }>;

/** the nodes with a link, and the ones without (placed apart by every algorithm but ELK) */
const split = (boxes: LayoutBox[], links: LayoutLink[]) => {
  const linked = new Set<string>(); links.forEach((l) => { linked.add(l.source); linked.add(l.target); });
  return { conn: boxes.filter((b) => linked.has(b.id)), orph: boxes.filter((b) => !linked.has(b.id)) };
};

function dagreLayout(boxes: LayoutBox[], links: LayoutLink[], cfg: LayoutConfig): Positions {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: cfg.options.direction ?? "TB", nodesep: cfg.spacing.horizontal, ranksep: cfg.spacing.vertical, marginx: 50, marginy: 50, ranker: cfg.options.ranker ?? "network-simplex" });
  const { conn, orph } = split(boxes, links);
  conn.forEach((b) => g.setNode(b.id, { width: b.width, height: b.height }));
  links.forEach((l) => g.setEdge(l.source, l.target));
  dagre.layout(g);
  const out: Positions = new Map();
  let maxX = 0, minY = Infinity;
  conn.forEach((b) => { const p = g.node(b.id); const x = p.x - b.width / 2, y = p.y - b.height / 2; out.set(b.id, { x, y }); maxX = Math.max(maxX, x + b.width); minY = Math.min(minY, y); });
  orph.forEach((b, i) => out.set(b.id, { x: maxX + 100 + (i % 2) * 280, y: (minY !== Infinity ? minY : 50) + Math.floor(i / 2) * 100 }));
  return out;
}

function forceLayout(boxes: LayoutBox[], links: LayoutLink[], cfg: LayoutConfig): Positions {
  const linkDist = cfg.options.linkDistance ?? cfg.spacing.horizontal, charge = cfg.options.chargeStrength ?? -1500, iters = cfg.options.iterations ?? 300, radStr = cfg.options.radialStrength ?? 0.3;
  const { conn, orph } = split(boxes, links);
  const count = new Map<string, number>(conn.map((b) => [b.id, 0]));
  links.forEach((l) => { count.set(l.source, (count.get(l.source) ?? 0) + 1); count.set(l.target, (count.get(l.target) ?? 0) + 1); });
  let centerId = conn[0]?.id, maxC = 0;
  conn.forEach((b) => { const c = count.get(b.id) ?? 0; if (c > maxC) { maxC = c; centerId = b.id; } });
  type Sim = { id: string; x: number; y: number; fx?: number | null; fy?: number | null; radius: number };
  const sim: Sim[] = conn.map((b, i) => {
    const angle = (i / conn.length) * 2 * Math.PI, ir = linkDist + Math.random() * 200;
    return { id: b.id, x: b.id === centerId ? 0 : Math.cos(angle) * ir, y: b.id === centerId ? 0 : Math.sin(angle) * ir, fx: b.id === centerId ? 0 : null, fy: b.id === centerId ? 0 : null, radius: Math.max(b.width, b.height) / 2 + 40 };
  });
  if (sim.length) {
    const s = d3Force.forceSimulation(sim)
      .force("link", d3Force.forceLink<Sim, { source: string; target: string }>(links.map((l) => ({ source: l.source, target: l.target }))).id((d) => d.id).distance(linkDist).strength(0.8))
      .force("charge", d3Force.forceManyBody().strength(charge).distanceMax(800))
      .force("collision", d3Force.forceCollide<Sim>().radius((d) => d.radius).strength(1))
      .force("center", d3Force.forceCenter(0, 0).strength(0.1))
      .force("radial", d3Force.forceRadial<Sim>((d) => (d.id === centerId ? 0 : linkDist * 1.2), 0, 0).strength(radStr));
    s.stop();
    for (let i = 0; i < iters; i++) s.tick();
  }
  const byId = new Map(conn.map((b) => [b.id, b]));
  const out: Positions = new Map();
  let maxX = 0, minY = 0;
  sim.forEach((p) => { const b = byId.get(p.id)!; out.set(p.id, { x: p.x - b.width / 2, y: p.y - b.height / 2 }); maxX = Math.max(maxX, p.x + b.width / 2); minY = Math.min(minY, p.y - b.height / 2); });
  let oy = minY;
  orph.forEach((b) => { out.set(b.id, { x: maxX + 150, y: oy }); oy += b.height + 20; });
  return out;
}

async function elkLayout(boxes: LayoutBox[], links: LayoutLink[], cfg: LayoutConfig): Promise<Positions> {
  const algo = cfg.options.elkAlgorithm ?? "layered", hS = cfg.spacing.horizontal, vS = cfg.spacing.vertical;
  const opts: Record<string, string> = { "elk.algorithm": `org.eclipse.elk.${algo}`, "elk.spacing.nodeNode": String(Math.max(hS, vS)) };
  if (algo === "layered") {
    opts["elk.direction"] = cfg.options.elkDirection ?? "DOWN";
    opts["elk.layered.spacing.nodeNodeBetweenLayers"] = String(vS);
    opts["elk.spacing.nodeNode"] = String(hS);
    opts["elk.layered.crossingMinimization.strategy"] = "LAYER_SWEEP";
  } else {
    opts["elk.stress.desiredEdgeLength"] = String(hS);
    // stress gives unconnected pairs no target distance, so isolated nodes drift away: each component is laid out alone, then packed
    opts["elk.separateConnectedComponents"] = "true";
    opts["elk.spacing.componentComponent"] = String(Math.round(hS / 2));
  }
  const r = await new ELK().layout({ id: "root", layoutOptions: opts, children: boxes.map((b) => ({ id: b.id, width: b.width, height: b.height })), edges: links.map((l, i) => ({ id: `e${i}`, sources: [l.source], targets: [l.target] })) });
  return new Map((r.children ?? []).map((c) => [c.id, { x: c.x ?? 0, y: c.y ?? 0 }] as const));
}

/** the top-left of every box under a preset; a box the algorithm could not place stays where the grid would put it */
export async function autoLayout(presetId: string, boxes: LayoutBox[], links: LayoutLink[]): Promise<Positions> {
  const cfg = LAYOUT_PRESETS[presetId];
  if (!cfg || !boxes.length) return new Map();
  const ids = new Set(boxes.map((b) => b.id));
  const own = links.filter((l) => l.source !== l.target && ids.has(l.source) && ids.has(l.target));
  try {
    return cfg.algorithm === "dagre" ? dagreLayout(boxes, own, cfg) : cfg.algorithm === "force" ? forceLayout(boxes, own, cfg) : await elkLayout(boxes, own, cfg);
  } catch (err) {
    console.error("auto layout:", err);
    return new Map(boxes.map((b, i) => [b.id, { x: (i % 5) * 300, y: Math.floor(i / 5) * 200 }] as const));
  }
}
