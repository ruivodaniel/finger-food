import { useEffect, useRef, useState, type ReactNode } from "react";
import { Section } from "./Section";
import type { OnChange } from "./_types";

// =============================================================================
// KeyedEntryList — CRUD shell for `Record<string, T>` primitives.
//
// Used by EffectsEditor (entries: EffectLayer[]) and ModesEditor
// (entries: ColorModePreset). Same chrome — different body.
//
// CRUD via onChange (path is relative to the record itself):
//   - Create: onChange([newKey], newEntry())
//   - Rename: onChange([], <full record with key replaced, order preserved>)
//   - Delete: onChange([], <full record with key omitted>)
//   - Update entry value: bubbled from renderBody as onChange([key, ...subpath], v)
// =============================================================================

type Props<T> = {
  title: string;
  entries: Record<string, T>;
  inherited?: Partial<Record<string, T>>;
  onChange: OnChange;
  /** Default value when the user clicks "+". */
  newEntry: () => T;
  /** Prefix for auto-generated names ("effect" → "effect-1", "effect-2", …). */
  newEntryNamePrefix: string;
  /** Render the body of an entry (between NAME and Delete). */
  renderBody: (p: {
    name: string;
    value: T;
    inherited: T | undefined;
    onChange: OnChange;
  }) => ReactNode;
  /** Optional summary shown in the collapsed header (e.g. "2 layers"). */
  renderSummary?: (value: T) => ReactNode;
};

export function KeyedEntryList<T>({
  title,
  entries,
  inherited,
  onChange,
  newEntry,
  newEntryNamePrefix,
  renderBody,
  renderSummary,
}: Props<T>) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [autoFocusKey, setAutoFocusKey] = useState<string | null>(null);
  const keys = Object.keys(entries);

  // Clear the auto-focus signal after one render cycle so collapsing+expanding
  // the same entry doesn't keep stealing focus.
  useEffect(() => {
    if (!autoFocusKey) return;
    const t = setTimeout(() => setAutoFocusKey(null), 0);
    return () => clearTimeout(t);
  }, [autoFocusKey]);

  function nextName(): string {
    let i = 1;
    while (keys.includes(`${newEntryNamePrefix}-${i}`)) i++;
    return `${newEntryNamePrefix}-${i}`;
  }

  function handleCreate() {
    const name = nextName();
    onChange([name], newEntry());
    setExpanded((prev) => new Set(prev).add(name));
    setAutoFocusKey(name);
  }

  function handleRename(oldKey: string, newKey: string) {
    // Build a new record preserving insertion order, with oldKey replaced.
    const next: Record<string, T> = {};
    for (const k of keys) {
      if (k === oldKey) next[newKey] = entries[k]!;
      else next[k] = entries[k]!;
    }
    onChange([], next as never);
    setExpanded((prev) => {
      if (!prev.has(oldKey)) return prev;
      const n = new Set(prev);
      n.delete(oldKey);
      n.add(newKey);
      return n;
    });
  }

  function handleDelete(key: string) {
    const next: Record<string, T> = {};
    for (const k of keys) if (k !== key) next[k] = entries[k]!;
    onChange([], next as never);
    setExpanded((prev) => {
      if (!prev.has(key)) return prev;
      const n = new Set(prev);
      n.delete(key);
      return n;
    });
  }

  function toggle(key: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  }

  return (
    <Section
      title={title}
      actions={
        <button
          type="button"
          onClick={handleCreate}
          className="text-zinc-400 hover:text-zinc-700 text-[14px] leading-none px-1"
          title={`Add ${newEntryNamePrefix}`}
        >
          ＋
        </button>
      }
    >
      {keys.length === 0 && (
        <div className="text-[10px] text-zinc-400 italic px-2 py-2 text-center">
          (none — click ＋ to add)
        </div>
      )}
      {keys.map((key) => {
        const isExpanded = expanded.has(key);
        const value = entries[key]!;
        const inh = inherited?.[key];
        return (
          <div key={key} className="-mx-2">
            <EntryHeader
              name={key}
              expanded={isExpanded}
              summary={renderSummary ? renderSummary(value) : null}
              onToggle={() => toggle(key)}
            />
            {isExpanded && (
              <EntryBody
                name={key}
                otherKeys={keys.filter((k) => k !== key)}
                onRename={(next) => handleRename(key, next)}
                onDelete={() => handleDelete(key)}
                autoFocus={autoFocusKey === key}
              >
                {renderBody({
                  name: key,
                  value,
                  inherited: inh,
                  onChange: (path, v) => onChange([key, ...path], v),
                })}
              </EntryBody>
            )}
          </div>
        );
      })}
    </Section>
  );
}

// ── Entry header (collapsed clickable row) ──────────────────────────────────

function EntryHeader({
  name,
  expanded,
  summary,
  onToggle,
}: {
  name: string;
  expanded: boolean;
  summary: ReactNode;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-1.5 h-[26px] px-2 hover:bg-zinc-50 transition-colors text-left"
    >
      <span className="text-[9px] text-zinc-400 w-3 shrink-0 text-center">
        {expanded ? "▾" : "▸"}
      </span>
      <span className="text-[11px] text-zinc-900 flex-1 truncate">{name}</span>
      {summary != null && (
        <span className="text-[10px] text-zinc-400 shrink-0">{summary}</span>
      )}
    </button>
  );
}

// ── Expanded entry body (NAME + content + Delete) ───────────────────────────

function EntryBody({
  name,
  otherKeys,
  onRename,
  onDelete,
  autoFocus,
  children,
}: {
  name: string;
  otherKeys: string[];
  onRename: (next: string) => void;
  onDelete: () => void;
  autoFocus?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mx-2 mb-1.5 border border-zinc-200 rounded bg-white">
      <div className="px-2 py-1.5 border-b border-zinc-100">
        <NameInput
          value={name}
          otherKeys={otherKeys}
          onCommit={onRename}
          autoFocus={autoFocus}
        />
      </div>
      <div className="px-2 py-2">{children}</div>
      <div className="px-2 py-1.5 border-t border-zinc-100 flex justify-end">
        <DeleteButton onConfirm={onDelete} />
      </div>
    </div>
  );
}

// ── Name input with rename validation ───────────────────────────────────────

function NameInput({
  value,
  otherKeys,
  onCommit,
  autoFocus,
}: {
  value: string;
  otherKeys: string[];
  onCommit: (next: string) => void;
  autoFocus?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [autoFocus]);

  const display = draft ?? value;

  function commit() {
    if (draft === null) return;
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) {
      setDraft(null);
      setError(null);
      return;
    }
    if (otherKeys.includes(trimmed)) {
      setError("name in use");
      return; // keep draft so user can fix
    }
    onCommit(trimmed);
    setDraft(null);
    setError(null);
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-zinc-400 w-[44px] shrink-0 uppercase tracking-wider">
        name
      </span>
      <input
        ref={ref}
        type="text"
        value={display}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
            ref.current?.blur();
          }
          if (e.key === "Escape") {
            setDraft(null);
            setError(null);
            ref.current?.blur();
          }
        }}
        className={`flex-1 min-w-0 px-1.5 text-[11px] rounded border h-[22px] bg-white text-zinc-900 ${
          error ? "border-red-400" : "border-zinc-200"
        }`}
      />
      {error && (
        <span className="text-[9px] text-red-500 shrink-0">{error}</span>
      )}
    </div>
  );
}

// ── Two-step delete (button → confirm pair) ─────────────────────────────────

function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[10px] text-zinc-500 hover:text-red-600 transition-colors"
      >
        ⌫ Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-zinc-500">Delete?</span>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 text-zinc-500 hover:bg-zinc-100"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="text-[10px] px-1.5 py-0.5 rounded bg-red-500 text-white hover:bg-red-600"
      >
        Confirm
      </button>
    </div>
  );
}
