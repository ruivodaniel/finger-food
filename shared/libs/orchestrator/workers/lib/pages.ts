/**
 * Page ranges, as the document workers take them in config: "1-3,7", 1-based.
 */

import { z } from "zod";

/** The config field: a 1-based range list; absent = every page. */
export const pageRange = z.string().regex(/^\d+(-\d+)?(,\d+(-\d+)?)*$/);

/** "1-3,7" → the 0-based page indexes of a document with `count` pages, in order; absent = all. */
export function pageIndexes(spec: string | undefined, count: number): number[] {
  if (!spec) return Array.from({ length: count }, (_, i) => i);
  const wanted = new Set<number>();
  for (const part of spec.split(",")) {
    const [a, b] = part.split("-");
    const lo = Number(a);
    const hi = Number(b ?? a);
    for (let n = lo; n <= hi; n++) if (n >= 1 && n <= count) wanted.add(n - 1);
  }
  return [...wanted].sort((x, y) => x - y);
}
