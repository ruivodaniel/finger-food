import { useCallback, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SNAPSHOT_PAGES, type SnapshotPage } from "../../_snapshots/registry";
import { CAST } from "../../_snapshots/cast";
import { getSnapshot } from "../../_snapshots/reader";

// Inline thumbnail — body-fragment HTML rendered via dangerouslySetInnerHTML
// at desktop width, scaled down. NO IFRAME — the fragment was stripped of
// scripts at capture time.
const PREVIEW_NATIVE_WIDTH = 1440;
const PREVIEW_VISUAL_WIDTH = 280;
const PREVIEW_SCALE = PREVIEW_VISUAL_WIDTH / PREVIEW_NATIVE_WIDTH;
const PREVIEW_NATIVE_HEIGHT = (PREVIEW_NATIVE_WIDTH * 9) / 16;
const PREVIEW_VISUAL_HEIGHT = (PREVIEW_VISUAL_WIDTH * 9) / 16;

export const Route = createFileRoute("/sandbox/layouts/snapshots/" as never)({
  component: SnapshotsManager,
});

type Status = "idle" | "running" | "ok" | "error";
type RowState = {
  status: Status;
  finishedAt?: number;
  error?: string;
};

/**
 * Snapshots manager.
 *
 * "Run" / "Snapshot" buttons POST to `/__api/sandbox-snapshot` (a thin
 * vite plugin that just `spawn`s `scripts/sandbox-snapshot.mts`). The
 * Playwright runner lives in that separate process — never inside the
 * dev server, never inside this browser tab. When it finishes, it has
 * written `_snapshots/snapshots/<id>.html` files; Vite HMR fires and the
 * thumbnails re-render with fresh content.
 *
 * THEME ISOLATION RULE: chrome uses static palette only.
 */
function SnapshotsManager() {
  const [byId, setById] = useState<Record<string, RowState>>({});

  const triggerRun = useCallback(
    async (key: string, qs: string) => {
      setById((prev) => ({ ...prev, [key]: { status: "running" } }));
      try {
        const res = await fetch(`/__api/sandbox-snapshot${qs}`, {
          method: "POST",
        });
        const body = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
        setById((prev) => ({
          ...prev,
          [key]: { status: "ok", finishedAt: Date.now() },
        }));
      } catch (err) {
        setById((prev) => ({
          ...prev,
          [key]: {
            status: "error",
            error: err instanceof Error ? err.message : String(err),
          },
        }));
      }
    },
    [],
  );

  const snapshotOne = useCallback(
    (id: string) => triggerRun(id, `?id=${encodeURIComponent(id)}`),
    [triggerRun],
  );
  const runCast = useCallback(
    (castId: string | undefined) =>
      triggerRun(
        `cast:${castId ?? "incognito"}`,
        `?cast=${encodeURIComponent(castId ?? "incognito")}`,
      ),
    [triggerRun],
  );
  const runAll = useCallback(() => triggerRun("all", ""), [triggerRun]);

  const grouped = groupByGroup(SNAPSHOT_PAGES);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      <header className="px-6 py-3 border-b border-zinc-200 bg-white flex items-center gap-4 shrink-0">
        <Link
          to={"/sandbox/layouts" as never}
          className="text-[11px] uppercase tracking-wider text-zinc-500 hover:text-zinc-700"
        >
          ← Layouts
        </Link>
        <h1 className="text-sm font-semibold">Snapshots</h1>
        <span className="text-[11px] text-zinc-400">
          {SNAPSHOT_PAGES.length} pages · {CAST.length} cast members
        </span>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge state={byId["all"]} />
          <button
            onClick={() => void runAll()}
            disabled={byId["all"]?.status === "running"}
            className="px-2.5 py-1 text-xs rounded border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 disabled:opacity-50"
          >
            Run all
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 max-w-4xl mx-auto w-full">
        {/* ── CAST ────────────────────────────────────────────── */}
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Cast</h2>
            <span className="text-[11px] text-zinc-400">
              "Run" snapshots every page assigned to that cast in a separate
              Playwright process.
            </span>
          </div>
          <div className="bg-white rounded-lg border border-zinc-200 divide-y divide-zinc-100">
            <CastRow
              label="Unauthenticated"
              email="incognito Playwright context"
              pageCount={SNAPSHOT_PAGES.filter((p) => !p.cast).length}
              state={byId["cast:incognito"]}
              onRun={() => void runCast(undefined)}
            />
            {CAST.map((c) => (
              <CastRow
                key={c.id}
                label={c.label}
                email={c.email}
                pageCount={SNAPSHOT_PAGES.filter((p) => p.cast === c.id).length}
                state={byId[`cast:${c.id}`]}
                onRun={() => void runCast(c.id)}
              />
            ))}
          </div>
        </section>

        {/* ── PAGES ───────────────────────────────────────────── */}
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Pages</h2>
          {SNAPSHOT_PAGES.length === 0 ? (
            <EmptyHint
              title="No pages registered yet"
              body={
                <>
                  Add entries to{" "}
                  <code className="font-mono text-[11px]">
                    sandbox/_snapshots/registry.ts
                  </code>
                  .
                </>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {grouped.map(([group, pages]) => (
                <div key={group}>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                    {group}
                  </div>
                  <div className="bg-white rounded-lg border border-zinc-200 divide-y divide-zinc-100">
                    {pages.map((p) => (
                      <PageRow
                        key={p.id}
                        page={p}
                        state={byId[p.id]}
                        onSnapshot={() => void snapshotOne(p.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ── Cast row ────────────────────────────────────────────────

function CastRow({
  label,
  email,
  pageCount,
  state,
  onRun,
}: {
  label: string;
  email: string;
  pageCount: number;
  state: RowState | undefined;
  onRun: () => void;
}) {
  const running = state?.status === "running";
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{label}</div>
        <div className="text-[11px] text-zinc-500 truncate font-mono">
          {email}
        </div>
      </div>
      <span className="text-[10px] text-zinc-500 shrink-0">
        {pageCount} page{pageCount === 1 ? "" : "s"}
      </span>
      <StatusBadge state={state} />
      <button
        onClick={onRun}
        disabled={running || pageCount === 0}
        className="px-2 py-0.5 text-[11px] rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-50"
      >
        Run
      </button>
    </div>
  );
}

// ── Page row ────────────────────────────────────────────────

function PageRow({
  page,
  state,
  onSnapshot,
}: {
  page: SnapshotPage;
  state: RowState | undefined;
  onSnapshot: () => void;
}) {
  const html = getSnapshot(page.id);
  return (
    <div className="flex items-stretch gap-3 px-3 py-3">
      <PreviewThumb html={html} />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="text-sm font-medium truncate">{page.label}</div>
        <div className="text-[11px] text-zinc-500 truncate font-mono">
          {page.url}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-1">
          {page.cast ? (
            <Tag variant="cast">{page.cast}</Tag>
          ) : (
            <Tag variant="incognito">incognito</Tag>
          )}
          {page.activeOrg && <Tag variant="org">org: {page.activeOrg}</Tag>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <StatusBadge state={state} />
        <button
          onClick={onSnapshot}
          disabled={state?.status === "running"}
          className="px-2 py-0.5 text-[11px] rounded border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 disabled:opacity-50"
        >
          Snapshot
        </button>
      </div>
    </div>
  );
}

function PreviewThumb({ html }: { html: string | null }) {
  return (
    <div
      className="rounded border border-zinc-200 bg-zinc-50 overflow-hidden relative shrink-0"
      style={{ width: PREVIEW_VISUAL_WIDTH, height: PREVIEW_VISUAL_HEIGHT }}
    >
      {html ? (
        <div
          // pointer-events: none — the snapshot is a viewer, not the live app.
          style={{
            width: PREVIEW_NATIVE_WIDTH,
            height: PREVIEW_NATIVE_HEIGHT,
            transform: `scale(${PREVIEW_SCALE})`,
            transformOrigin: "top left",
            pointerEvents: "none",
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-400 italic">
          no snapshot
        </div>
      )}
    </div>
  );
}

function StatusBadge({ state }: { state: RowState | undefined }) {
  if (!state || state.status === "idle") {
    return <span className="text-[10px] text-zinc-400">○ idle</span>;
  }
  if (state.status === "running") {
    return <span className="text-[10px] text-blue-600">● running…</span>;
  }
  if (state.status === "ok") {
    const t = state.finishedAt
      ? new Date(state.finishedAt).toLocaleTimeString()
      : "";
    return <span className="text-[10px] text-emerald-600">● {t}</span>;
  }
  return (
    <span
      className="text-[10px] text-red-600 truncate max-w-[160px]"
      title={state.error}
    >
      ⚠ {state.error}
    </span>
  );
}

function Tag({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "cast" | "incognito" | "org";
}) {
  const cls =
    variant === "cast"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : variant === "org"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : "bg-zinc-100 text-zinc-600 border-zinc-200";
  return (
    <span className={`px-1.5 py-0.5 rounded border text-[9px] ${cls}`}>
      {children}
    </span>
  );
}

function EmptyHint({
  title,
  body,
}: {
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-center">
      <div className="text-sm font-medium text-zinc-700">{title}</div>
      <div className="text-xs text-zinc-500 mt-1">{body}</div>
    </div>
  );
}

function groupByGroup(pages: SnapshotPage[]): Array<[string, SnapshotPage[]]> {
  const map = new Map<string, SnapshotPage[]>();
  for (const p of pages) {
    const key = p.group ?? "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries());
}
