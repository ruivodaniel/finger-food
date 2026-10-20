import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type {
  Theme,
  ThemeRule,
  ChainSegment,
} from "../../../../../../../../../shared/libs/ui/types";
import { ELEMENT_FAMILIES } from "../../../../../../../../../shared/libs/ui/web/theme-engine/conventions";

// Selectable entity universe for the chain segment dropdown:
// elements + families + layouts. Hand-mirrored in lockstep with the type tree.
const FAMILY_KEYS = [
  "surfaceContainer",
  "elevatedOverlay",
  "listContainer",
  "interactiveControl",
  "interactiveControlGroup",
  "field",
  "switch",
  "media",
  "shape",
  "inlineSurface",
];
const LAYOUT_KEYS = [
  "shell",
  "shellNone",
  "page",
  "pageBody",
  "main",
  "mainBody",
  "section",
  "rowSection",
  "colSection",
  "pageHeader",
  "mainHeader",
  "leftSidebar",
  "rightSidebar",
  "contextPanel",
  "container",
  "scrollArea",
  "dialog",
  "sheet",
];

const ENTITY_GROUPS: { label: string; keys: string[] }[] = [
  { label: "Elements", keys: Object.keys(ELEMENT_FAMILIES).sort() },
  { label: "Families", keys: [...FAMILY_KEYS].sort() },
  { label: "Layouts", keys: [...LAYOUT_KEYS].sort() },
];

type Props = {
  mode: "create" | "edit";
  initialRule?: ThemeRule;
  index?: number;
  existingRules: readonly ThemeRule[];
  theme: Theme;
  onSave: (rule: ThemeRule, index?: number) => void;
  onDelete?: (index: number) => void;
  onCancel: () => void;
};

/**
 * Modal-based query-builder for theme.rules entries.
 * Edits/creates a single ThemeRule's chain; tokens are edited
 * in the property panel (separate concern).
 */
export function RuleEditorModal({
  mode,
  initialRule,
  index,
  existingRules,
  theme,
  onSave,
  onDelete,
  onCancel,
}: Props) {
  const [chain, setChain] = useState<ChainSegment[]>(() =>
    initialRule
      ? initialRule.chain.map((s) => ({ ...s }))
      : [{ key: "" }],
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Concept autocomplete: gather existing concept names from theme.concepts
  // and from any chain segment in theme.rules.
  const conceptOptions = useMemo(() => {
    const set = new Set<string>();
    for (const k of Object.keys(theme.concepts ?? {})) set.add(k);
    for (const r of theme.rules ?? []) {
      for (const seg of r.chain) {
        if (seg.concept) set.add(seg.concept);
      }
    }
    return Array.from(set).sort();
  }, [theme.concepts, theme.rules]);

  // Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function updateSeg(i: number, patch: Partial<ChainSegment>) {
    setChain((prev) =>
      prev.map((seg, idx) => (idx === i ? { ...seg, ...patch } : seg)),
    );
    setError(null);
  }

  function addSeg() {
    setChain((prev) => [...prev, { key: "" }]);
  }

  function removeSeg(i: number) {
    setChain((prev) => prev.filter((_, idx) => idx !== i));
  }

  function chainText(c: ChainSegment[]): string {
    return c
      .map((seg) => {
        const concept = seg.concept?.trim() ? `${seg.concept.trim()} ` : "";
        return `${concept}${seg.key || "?"}`;
      })
      .join(" > ");
  }

  function handleSave() {
    setError(null);
    if (chain.length === 0) {
      setError("Chain must have at least one segment");
      return;
    }
    for (const seg of chain) {
      if (!seg.key.trim()) {
        setError("Every segment needs an entity key");
        return;
      }
    }

    // Duplicate check (skip self when editing)
    const newText = chainText(chain);
    for (let i = 0; i < existingRules.length; i++) {
      if (mode === "edit" && i === index) continue;
      if (chainText([...existingRules[i]!.chain]) === newText) {
        setError("A rule with this chain already exists");
        return;
      }
    }

    const cleaned = chain.map((seg) => {
      const out: ChainSegment = { key: seg.key.trim() };
      if (seg.concept?.trim()) out.concept = seg.concept.trim();
      return out;
    });

    // Validation above guarantees ≥1 segment; type cast through unknown is
    // necessary because TS can't infer the tuple shape from runtime checks.
    const rule: ThemeRule = {
      chain: cleaned as unknown as readonly [ChainSegment, ...ChainSegment[]],
      tokens: initialRule?.tokens ?? {},
    };
    onSave(rule, index);
  }

  function handleDelete() {
    if (typeof index !== "number" || !onDelete) return;
    onDelete(index);
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-zinc-900/30"
        style={{ zIndex: 9998 }}
        onClick={onCancel}
      />
      <div
        className="fixed bg-white border border-zinc-200 rounded-lg shadow-xl flex flex-col"
        style={{
          zIndex: 9999,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 520,
          maxHeight: "80vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-900">
            {mode === "create" ? "Add rule" : "Edit rule"}
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-700 text-base leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-4 py-3 flex-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
            Chain (most-general → most-specific)
          </div>
          {chain.map((seg, i) => (
            <div key={i} className="mb-2 flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-3 shrink-0 text-right">
                {i + 1}
              </span>
              <select
                value={seg.key}
                onChange={(e) => updateSeg(i, { key: e.target.value })}
                className="flex-1 min-w-0 px-2 py-1 text-xs rounded border border-zinc-200 bg-white text-zinc-900"
              >
                <option value="">— select entity —</option>
                {ENTITY_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.keys.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input
                type="text"
                value={seg.concept ?? ""}
                onChange={(e) =>
                  updateSeg(i, { concept: e.target.value || undefined })
                }
                placeholder="concept (opt)"
                list={`concepts-${i}`}
                className="w-32 px-2 py-1 text-xs rounded border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
              />
              <datalist id={`concepts-${i}`}>
                {conceptOptions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={() => removeSeg(i)}
                disabled={chain.length === 1}
                className="px-1 text-zinc-400 hover:text-red-600 disabled:opacity-30 text-base leading-none"
                title="Remove this level"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSeg}
            className="mt-1 text-xs text-blue-600 hover:text-blue-800"
          >
            + add level
          </button>

          <div className="mt-4 pt-3 border-t border-zinc-100">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
              Preview
            </div>
            <div className="text-xs font-mono text-zinc-700 break-all">
              {chainText(chain)}
            </div>
          </div>

          {error && (
            <div className="mt-3 text-xs text-red-600">⚠ {error}</div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-zinc-200 flex items-center justify-between">
          <div>
            {mode === "edit" && onDelete && (
              <>
                {confirmingDelete ? (
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Delete?</span>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="px-2 py-0.5 text-xs rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-2 py-0.5 text-xs rounded bg-red-500 text-white hover:bg-red-600"
                    >
                      Confirm
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="text-xs text-zinc-500 hover:text-red-600"
                  >
                    ⌫ Delete
                  </button>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1 text-xs rounded border border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
