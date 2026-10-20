import { useState, useCallback, useMemo, useEffect } from "react";
import type { Theme } from "../../../../../../../../../shared/libs/ui/types";
import { deepClone, deepSetImmutable } from "./deep-update";
import type { OnChange } from "./types";

// Theme registry — derived from the versioned themes folder
// (shared/libs/ui/themes/<theme>/v<n>/theme.ts), keyed "<theme>@v<n>".
// Drop a version folder in and it registers automatically; no map to
// maintain. The folder is the truth for both theme and version — the same
// key shape configs/theme's APP_THEME resolves to (see themeKey).
export const themeKey = (theme: string, version: number | string) => `${theme}@v${version}`;
export const parseThemeKey = (key: string): { theme: string; version: number } | null => {
  const m = /^([a-zA-Z0-9_-]+)@v(\d+)$/.exec(key);
  return m ? { theme: m[1]!, version: Number(m[2]) } : null;
};
export const THEME_MAP: Record<string, Theme> = (() => {
  const modules = import.meta.glob<Record<string, unknown>>(
    "../../../../../../../../shared/libs/ui/themes/*/v*/theme.ts",
    { eager: true },
  );
  const map: Record<string, Theme> = {};
  for (const [path, mod] of Object.entries(modules)) {
    const m = /\/themes\/([^/]+)\/v(\d+)\/theme\.ts$/.exec(path);
    if (!m) continue;
    for (const value of Object.values(mod)) {
      if (
        value &&
        typeof value === "object" &&
        typeof (value as { id?: unknown }).id === "string"
      ) {
        map[themeKey(m[1]!, m[2]!)] = value as Theme;
      }
    }
  }
  return map;
})();

// 5-minute nag — when isDirty has been true this long without a save,
// the Save button turns red.
const URGENT_MS = 5 * 60 * 1000;

// =============================================================================
// Structural model — single universe, one engine call per render:
//
//   mount    → useState(() => deepClone(base))
//   edit     → setState (engine runs on state → preview, always)
//   save     → POST /__api/theme-edit (writes source from state)
//
// No localStorage, no cross-mount persistence, no HMR magic.
// Reload = fresh clone of the imported source. Source-on-disk is the only
// truth that survives a reload; in-memory state is everything else.
// =============================================================================

export function useThemeEditor(themeId: string) {
  const base = useMemo(() => {
    const t = THEME_MAP[themeId];
    if (!t) throw new Error(`Unknown theme: ${themeId}`);
    return t;
  }, [themeId]);

  // Initial state: clone of the current imported source. Period.
  const [draft, setDraft] = useState<Theme>(() => deepClone(base));

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(base),
    [draft, base],
  );

  // ── Save UX state (orthogonal to the engine pipeline) ────────
  const [dirtyTimestamp, setDirtyTimestamp] = useState<number | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // First entry into dirty captures the timestamp; back to clean clears it.
  useEffect(() => {
    if (isDirty) {
      setDirtyTimestamp((prev) => prev ?? Date.now());
    } else {
      setDirtyTimestamp(null);
      setIsUrgent(false);
    }
  }, [isDirty]);

  // 5-minute escalation to red Save button.
  useEffect(() => {
    if (!isDirty || dirtyTimestamp == null) {
      setIsUrgent(false);
      return;
    }
    const elapsed = Date.now() - dirtyTimestamp;
    if (elapsed >= URGENT_MS) {
      setIsUrgent(true);
      return;
    }
    const t = setTimeout(() => setIsUrgent(true), URGENT_MS - elapsed);
    return () => clearTimeout(t);
  }, [isDirty, dirtyTimestamp]);

  // ── Mutation API ─────────────────────────────────────────────
  const onChange: OnChange = useCallback((path, value) => {
    setDraft((prev) => deepSetImmutable(prev, path, value));
    // Any new edit invalidates the previous "✓ Saved at..." indicator
    setSavedAt(null);
    setSaveError(null);
  }, []);

  /** Discard all in-memory edits and re-clone from the current source. */
  const revert = useCallback(() => {
    setDraft(deepClone(base));
    setSavedAt(null);
    setSaveError(null);
  }, [base]);

  /** Persist the state to disk via the dev plugin (`/__api/theme-edit`). */
  const save = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const at = parseThemeKey(themeId);
      if (!at) throw new Error(`Bad theme key: ${themeId} (expected <theme>@v<n>)`);
      const res = await fetch("/__api/theme-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId: at.theme, version: at.version, theme: draft }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errBody.error || `Save failed (HTTP ${res.status})`);
      }
      setSavedAt(Date.now());
      // Note: isDirty stays true until the imported `base` updates (via HMR
      // or reload). The savedAt indicator confirms the write reached disk.
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }, [draft, themeId]);

  return {
    base,
    draft,
    onChange,
    isDirty,
    isUrgent,
    isSaving,
    savedAt,
    saveError,
    revert,
    save,
  };
}
