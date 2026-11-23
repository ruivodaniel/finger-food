/**
 * Snapshot reader — exposes captured HTML to consumers (layouts/map +
 * theme-editor).
 *
 * Files in `_snapshots/snapshots/<id>.html` are body-only fragments,
 * stripped of <script>/<link>/<style> at capture time by the standalone
 * Playwright runner (`scripts/sandbox-snapshot.mts`). Safe to inject
 * inline via `dangerouslySetInnerHTML` — no script execution, no second
 * app boot.
 *
 * Uses Vite's `import.meta.glob` so the bundler statically tracks the
 * snapshots directory; saving a new file triggers HMR and consumers
 * re-render with the fresh content.
 */

import type { Fixture } from "../theme-editor/_fixtures/types";
import { SNAPSHOT_PAGES } from "./registry";

const RAW = import.meta.glob("./snapshots/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** Map snapshot id → body-fragment HTML. */
const BY_ID: Record<string, string> = Object.fromEntries(
  Object.entries(RAW).map(([path, html]) => {
    const id = path.replace(/^\.\/snapshots\//, "").replace(/\.html$/, "");
    return [id, html];
  }),
);

export function getSnapshot(id: string): string | null {
  return BY_ID[id] ?? null;
}

export function hasSnapshot(id: string): boolean {
  return id in BY_ID;
}

export function listSnapshotIds(): string[] {
  return Object.keys(BY_ID);
}

/**
 * Snapshot-derived fixtures for the theme editor's fixture tree. Path
 * prefix is `snapshots/` so they group cleanly in the selector.
 */
export function getSnapshotFixtures(): Fixture[] {
  const out: Fixture[] = [];
  for (const page of SNAPSHOT_PAGES) {
    const html = BY_ID[page.id];
    if (!html) continue;
    const groupSlug = (page.group ?? "other")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    out.push({
      id: `snapshots/${page.id}`,
      path: ["snapshots", groupSlug, page.id],
      label: page.label,
      html,
    });
  }
  return out;
}
