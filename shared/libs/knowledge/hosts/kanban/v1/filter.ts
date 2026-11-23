import type { KanbanCard } from "./types";

/** the board's filter, held by its header: a search (over everything a card shows, or the title only), any of the chosen tags, and the creation dates */
export type KanbanFilter = { q: string; titleOnly: boolean; tags: string[]; from: string; to: string };
export const NO_FILTER: KanbanFilter = { q: "", titleOnly: false, tags: [], from: "", to: "" };
export const isActive = (f: KanbanFilter) => !!(f.q || f.tags.length || f.from || f.to);
export const passes = (c: KanbanCard, f: KanbanFilter) => {
  if (f.q) { const q = f.q.toLowerCase(); const where = f.titleOnly ? [c.title] : [c.title, c.text, c.from, ...(c.tags ?? []), ...(c.links ?? []).map((l) => l.label)]; if (!where.some((t) => t?.toLowerCase().includes(q))) return false; }
  if (f.tags.length && !f.tags.some((t) => (c.tags ?? []).includes(t))) return false;
  const day = (c.createdAt ?? "").slice(0, 10);
  if (f.from && day < f.from) return false;
  if (f.to && day > f.to) return false;
  return true;
};
