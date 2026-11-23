import { createFileRoute, Link } from "@tanstack/react-router";
import { SNAPSHOT_PAGES, type SnapshotPage } from "../../_snapshots/registry";
import { getSnapshot } from "../../_snapshots/reader";

export const Route = createFileRoute("/sandbox/layouts/map/" as never)({
  component: LayoutMap,
});

// Render snapshots at desktop width (1440), then visually scale down via
// CSS transform. NO IFRAMES — body-fragment HTML is injected inline via
// `dangerouslySetInnerHTML`. Scripts were stripped at capture time, so
// there's no second-app-boot risk. Live theme CSS applies automatically.
const NATIVE_WIDTH = 1440;
const VISUAL_WIDTH = 600;
const SCALE = VISUAL_WIDTH / NATIVE_WIDTH;
const NATIVE_HEIGHT = (NATIVE_WIDTH * 9) / 16;
const VISUAL_HEIGHT = (VISUAL_WIDTH * 9) / 16;

/**
 * Layout map — gallery of captured snapshots.
 *
 * Snapshots come from `pnpm sandbox:snapshot` or the Run button in
 * /sandbox/layouts/snapshots. Vite HMR re-renders this page when files
 * in `_snapshots/snapshots/` change.
 *
 * THEME ISOLATION RULE: chrome uses static palette only. Inlined snapshots
 * inherit the live theme CSS — that's the whole point of inline rendering.
 */
function LayoutMap() {
  const total = SNAPSHOT_PAGES.length;
  const haveSnapshot = SNAPSHOT_PAGES.filter((p) => getSnapshot(p.id) != null).length;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      <header className="px-6 py-3 border-b border-zinc-200 bg-white flex items-center gap-4 shrink-0">
        <Link
          to={"/sandbox/layouts" as never}
          className="text-[11px] uppercase tracking-wider text-zinc-500 hover:text-zinc-700"
        >
          ← Layouts
        </Link>
        <h1 className="text-sm font-semibold">Layout map</h1>
        <span className="text-[11px] text-zinc-400">
          {haveSnapshot}/{total} cached
        </span>
        <div className="ml-auto">
          <Link
            to={"/sandbox/layouts/snapshots" as never}
            className="px-2.5 py-1 text-xs rounded border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700"
          >
            Open snapshots
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 grid gap-6" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
        {SNAPSHOT_PAGES.map((page) => (
          <PageFrame key={page.id} page={page} />
        ))}
      </div>
    </div>
  );
}

function PageFrame({ page }: { page: SnapshotPage }) {
  const html = getSnapshot(page.id);

  return (
    <section className="flex flex-col gap-2" style={{ width: VISUAL_WIDTH }}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500">
            {page.group ?? "Page"}
          </span>
          <h2 className="text-sm font-semibold">{page.label}</h2>
        </div>
        <a
          href={page.url}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-zinc-500 hover:text-zinc-700 font-mono"
          title="Open live in new tab"
        >
          {page.url} ↗
        </a>
      </div>
      <div
        className="rounded-lg border border-zinc-200 bg-white overflow-hidden relative"
        style={{ width: VISUAL_WIDTH, height: VISUAL_HEIGHT }}
      >
        {html ? (
          <ScaledFragment html={html} />
        ) : (
          <Link
            to={"/sandbox/layouts/snapshots" as never}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
          >
            <span>No snapshot yet</span>
            <span className="text-[10px] text-zinc-400">Click to open Snapshots →</span>
          </Link>
        )}
      </div>
    </section>
  );
}

function ScaledFragment({ html }: { html: string }) {
  return (
    <div
      // pointer-events: none so clicks don't activate buttons inside the
      // snapshot — it's a viewer, not the live app.
      style={{
        width: NATIVE_WIDTH,
        height: NATIVE_HEIGHT,
        transform: `scale(${SCALE})`,
        transformOrigin: "top left",
        pointerEvents: "none",
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
