import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePopoverPlacement } from "../_editors/shared/usePopoverPlacement";

/**
 * Ellipsis-menu next to the FixtureSelector with developer actions for
 * fixtures. Currently exposes "Regenerate fixtures" — POSTs to a dev-only
 * Vite plugin endpoint that runs `scripts/build-fixtures.mjs` and updates
 * `_fixtures/generated.ts` (Vite HMR then reloads it automatically).
 */
export function FixtureActionsMenu() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { style } = usePopoverPlacement(triggerRef, open, {
    width: 220,
    maxHeight: 240,
    align: "right",
    gap: 4,
  });

  async function regenerate() {
    setBusy(true);
    setError(null);
    setSavedAt(null);
    try {
      const res = await fetch("/__api/regenerate-fixtures", {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setSavedAt(Date.now());
      // Auto-close shortly after success
      setTimeout(() => setOpen(false), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setError(null);
          setSavedAt(null);
        }}
        title="Fixture actions"
        className="px-1.5 h-6 flex items-center justify-center text-xs rounded border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
      >
        ⋯
      </button>
      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0"
              style={{ zIndex: 9998 }}
              onClick={() => setOpen(false)}
            />
            <div
              className="bg-white border border-zinc-200 rounded-lg shadow-xl py-1 flex flex-col"
              style={{ ...style, zIndex: 9999 }}
            >
              <button
                type="button"
                onClick={regenerate}
                disabled={busy}
                className="px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-default"
              >
                {busy ? "Regenerating…" : "Regenerate fixtures"}
              </button>
              {savedAt && (
                <div className="px-3 py-1 text-[10px] text-zinc-500">
                  ✓ Done. Fixtures will hot-reload.
                </div>
              )}
              {error && (
                <div className="px-3 py-1 text-[10px] text-red-600 break-words">
                  ⚠ {error}
                </div>
              )}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
