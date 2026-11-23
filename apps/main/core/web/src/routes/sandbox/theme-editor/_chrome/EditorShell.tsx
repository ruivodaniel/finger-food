/**
 * EditorShell — 3-column theme editor chrome.
 *
 * LINT EXEMPTION: This file uses hardcoded chrome styling on bare divs
 * (h-screen, overflow-auto, flex shells). The theme editor chrome MUST
 * stay visually stable while the theme being edited changes. It cannot
 * use @libs/web-layouts primitives because those are themed.
 *
 * THEME ISOLATION RULE: This file may NOT use any themed Tailwind class
 * (text-foreground, bg-background, border-border, text-muted-foreground,
 * bg-muted, bg-card, etc.). All colors come from Tailwind's static palette
 * (white, zinc-*, blue-*, red-*) which compile to literal hex and never
 * reference theme CSS variables.
 *
 * Layout: left navigator = 170px, right property panel = 240px (per spec).
 */

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { CrosshairIcon } from "../_editors/shared/EditorIcons";

type Props = {
  /** Optional content for the left side of the preview header (e.g. fixture selector). */
  previewHeader?: ReactNode;
  navigator: ReactNode;
  preview: ReactNode;
  panel: ReactNode;
  inspectMode: boolean;
  onInspectToggle: () => void;
  /** Save state */
  isDirty: boolean;
  isUrgent: boolean;
  isSaving: boolean;
  savedAt: number | null;
  saveError: string | null;
  onSave: () => void;
  onRevert: () => void;
  previewRef: RefObject<HTMLDivElement | null>;
  onPreviewMouseMove?: (e: React.MouseEvent) => void;
  onPreviewClick?: (e: React.MouseEvent) => void;
  inspectOverlay?: ReactNode;
};

export function EditorShell({
  previewHeader,
  navigator,
  preview,
  panel,
  inspectMode,
  onInspectToggle,
  isDirty,
  isUrgent,
  isSaving,
  savedAt,
  saveError,
  onSave,
  onRevert,
  previewRef,
  onPreviewMouseMove,
  onPreviewClick,
  inspectOverlay,
}: Props) {
  // Cmd/Ctrl + S → trigger save (only when there's something to save)
  useEffect(() => {
    if (!isDirty || isSaving) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isDirty, isSaving, onSave]);

  return (
    <div className="flex h-screen overflow-hidden bg-white text-zinc-900">
      {/* Left: Navigator — 170px */}
      <div className="w-[170px] shrink-0 border-r border-zinc-200 overflow-y-auto bg-white">
        {navigator}
      </div>

      {/* Center: Preview */}
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50">
        <div className="flex items-center justify-between gap-3 px-3 py-1.5 border-b border-zinc-200 bg-white shrink-0 min-h-[36px]">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="min-w-0">{previewHeader}</div>
            <button
              onClick={onInspectToggle}
              title="Inspect element in preview"
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border transition-colors shrink-0 ${
                inspectMode
                  ? "bg-blue-100 text-blue-700 border-blue-200"
                  : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
              }`}
            >
              <CrosshairIcon />
              <span>Inspect</span>
            </button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SaveControls
              isDirty={isDirty}
              isUrgent={isUrgent}
              isSaving={isSaving}
              savedAt={savedAt}
              saveError={saveError}
              onSave={onSave}
              onRevert={onRevert}
            />
          </div>
        </div>
        <div
          ref={previewRef}
          className={`flex-1 overflow-auto relative ${
            inspectMode ? "cursor-crosshair" : ""
          }`}
          onMouseMove={inspectMode ? onPreviewMouseMove : undefined}
          onClick={inspectMode ? onPreviewClick : undefined}
        >
          {preview}
          {inspectOverlay}
        </div>
      </div>

      {/* Right: Property Panel — 240px */}
      <div className="w-[240px] shrink-0 border-l border-zinc-200 overflow-y-auto bg-white">
        {panel}
      </div>
    </div>
  );
}

/**
 * Save / Revert / saved-at indicator / error inline.
 *
 * States:
 *   - idle clean         : nothing rendered (or fading "✓ Saved at HH:MM")
 *   - dirty              : Revert + Save (blue)
 *   - dirty + urgent     : Revert + "Save Changes!" (red, after 5 min)
 *   - saving             : Revert (disabled) + "Saving..." (disabled)
 *   - error              : same as dirty + inline error message
 */
function SaveControls({
  isDirty,
  isUrgent,
  isSaving,
  savedAt,
  saveError,
  onSave,
  onRevert,
}: {
  isDirty: boolean;
  isUrgent: boolean;
  isSaving: boolean;
  savedAt: number | null;
  saveError: string | null;
  onSave: () => void;
  onRevert: () => void;
}) {
  if (!isDirty && savedAt) {
    return <SavedIndicator timestamp={savedAt} />;
  }
  if (!isDirty) return null;

  const saveLabel = isSaving
    ? "Saving…"
    : isUrgent
      ? "Save Changes!"
      : "Save";

  const saveBtnCls = isUrgent
    ? "bg-red-600 hover:bg-red-700 border-red-700 text-white"
    : "bg-blue-600 hover:bg-blue-700 border-blue-700 text-white";

  return (
    <div className="flex items-center gap-2">
      {saveError && (
        <span
          className="text-[10px] text-red-600 max-w-[180px] truncate"
          title={saveError}
        >
          ⚠ {saveError}
        </span>
      )}
      <button
        onClick={onRevert}
        disabled={isSaving}
        className="px-2.5 py-1 text-xs rounded border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 transition-colors disabled:opacity-50"
      >
        Revert
      </button>
      <button
        onClick={onSave}
        disabled={isSaving}
        title="Save changes (⌘S)"
        className={`px-2.5 py-1 text-xs rounded border transition-colors disabled:opacity-50 ${saveBtnCls}`}
      >
        {saveLabel}
      </button>
    </div>
  );
}

function SavedIndicator({ timestamp }: { timestamp: number }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, [timestamp]);
  if (!visible) return null;
  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <span className="text-[10px] text-zinc-500 transition-opacity">
      ✓ Saved {time}
    </span>
  );
}
