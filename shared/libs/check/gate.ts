// ── THE GATE ─────────────────────────────────────────────────────
// A backlog holds what was found when a check was built: a count for each item. It only ever gets shorter.
// An item that is not in the backlog passes with nothing found; an item in the backlog never has more than its count.
import type { Finding } from "./schema.ts";

export type Backlog = Record<string, number>;
export type GateResult = { item: string; found: number; allowed: number }[];

/** the items that break the gate: more errors found than the backlog allows. A warning and an `info` finding never count */
export function gate(items: readonly string[], findings: readonly Finding[], backlog: Backlog): GateResult {
  const count = new Map<string, number>();
  for (const f of findings) if (f.severity === "error") count.set(f.item, (count.get(f.item) ?? 0) + 1);
  return items.map((item) => ({ item, found: count.get(item) ?? 0, allowed: backlog[item] ?? 0 })).filter((r) => r.found > r.allowed);
}
/** the backlog entries that are stale: an item that is no longer checked, or that has nothing found any more */
export const stale = (items: readonly string[], findings: readonly Finding[], backlog: Backlog): string[] => {
  const has = new Set(findings.filter((f) => f.severity === "error").map((f) => f.item)), scanned = new Set(items);
  return Object.keys(backlog).filter((item) => !scanned.has(item) || !has.has(item));
};
