// ── Override axis types ────────────────────────────────────
//
// The theme's `combined: CombinedEntry[]` array holds orthogonal axis
// overrides. Each entry's `where` is a free combination of three axes:
//   { state?, status?, emphasis? }
//
// The selector renders three independent rows (Emphasis / State / Status)
// where each row picks at most one value (Emphasis always has one — Default
// means "no emphasis override"). The active selection is the resulting
// `where` clause, which the parent uses to look up — or materialize — the
// matching CombinedEntry.

export type CombinedWhere = {
  state?: string;
  status?: string;
  emphasis?: string;
};

export type CombinedEntryShape = {
  where: CombinedWhere;
  partialSurface?: Record<string, unknown>;
  transition?: Record<string, unknown>;
  animation?: Record<string, unknown>;
};

export const STATE_KEYS = [
  "default", "hover", "active", "focus",
  "selected", "disabled", "loading",
] as const;

export const STATUS_KEYS = [
  "neutral", "error", "warning",
  "success", "info", "destructive",
] as const;

export const EMPHASIS_KEYS = [
  "hero", "primary", "secondary",
  "tertiary", "quiet",
] as const;

// ── Helpers ─────────────────────────────────────────────────

export function whereEqual(a: CombinedWhere, b: CombinedWhere): boolean {
  return a.state === b.state && a.status === b.status && a.emphasis === b.emphasis;
}

export function whereIsEmpty(w: CombinedWhere): boolean {
  return !w.state && !w.status && !w.emphasis;
}

// ── Component ──────────────────────────────────────────────

type Props = {
  selectedWhere: CombinedWhere;
  onSelect: (where: CombinedWhere) => void;
  /** Wheres that have a declared entry (in tokens or inherited). Used to dot pills. */
  existingWheres: CombinedWhere[];
  /** Whether to enable the Remove button — true when the current where has a tokens entry. */
  canRemove: boolean;
  onRemove: () => void;
};

/**
 * Three sticky pill rows: Emphasis (1 — Default = undefined), State (0..1),
 * Status (0..1). Picks combine into a `where` clause. The component is a
 * pure controlled selector — it does not know whether the resulting `where`
 * exists in `combined` or not; the parent handles lookup and materialisation.
 *
 * THEME ISOLATION RULE: Lives in the property panel sidebar — must use
 * static palette colors only (no themed Tailwind tokens).
 */
export function OverrideAxisSelector({
  selectedWhere,
  onSelect,
  existingWheres,
  canRemove,
  onRemove,
}: Props) {
  const setAxis = (axis: keyof CombinedWhere, value: string | undefined) => {
    onSelect({ ...selectedWhere, [axis]: value });
  };

  return (
    <div className="px-3 pb-2 space-y-1">
      <AxisRow
        label="Emphasis"
        keys={EMPHASIS_KEYS}
        nullLabel="Default"
        value={selectedWhere.emphasis}
        onPick={(v) => setAxis("emphasis", v)}
        existingValues={collectAxisValues(existingWheres, "emphasis")}
        showRemove={canRemove}
        onRemove={onRemove}
      />
      <AxisRow
        label="State"
        keys={STATE_KEYS}
        nullLabel="—"
        value={selectedWhere.state}
        onPick={(v) => setAxis("state", v)}
        existingValues={collectAxisValues(existingWheres, "state")}
      />
      <AxisRow
        label="Status"
        keys={STATUS_KEYS}
        nullLabel="—"
        value={selectedWhere.status}
        onPick={(v) => setAxis("status", v)}
        existingValues={collectAxisValues(existingWheres, "status")}
      />
    </div>
  );
}

function collectAxisValues(
  wheres: CombinedWhere[],
  axis: keyof CombinedWhere,
): Set<string> {
  const out = new Set<string>();
  for (const w of wheres) {
    const v = w[axis];
    if (v) out.add(v);
  }
  return out;
}

function AxisRow({
  label,
  keys,
  nullLabel,
  value,
  onPick,
  existingValues,
  showRemove,
  onRemove,
}: {
  label: string;
  keys: readonly string[];
  nullLabel: string;
  value: string | undefined;
  onPick: (v: string | undefined) => void;
  existingValues: Set<string>;
  showRemove?: boolean;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider w-16 shrink-0">
        {label}
      </span>
      <Pill
        active={!value}
        onClick={() => onPick(undefined)}
        label={nullLabel}
      />
      {keys.map((k) => (
        <Pill
          key={k}
          active={value === k}
          hasData={existingValues.has(k)}
          onClick={() => onPick(value === k ? undefined : k)}
          label={k}
        />
      ))}
      {showRemove && onRemove && (
        <button
          onClick={onRemove}
          className="ml-auto text-[10px] text-red-500 hover:text-red-700 transition-colors"
        >
          Remove
        </button>
      )}
    </div>
  );
}

function Pill({
  active,
  hasData,
  onClick,
  label,
}: {
  active: boolean;
  hasData?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
        active
          ? "bg-blue-100 border-blue-300 text-blue-700 font-medium"
          : hasData
          ? "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
          : "border-zinc-200 text-zinc-400 hover:bg-zinc-100"
      }`}
    >
      {hasData && !active && <span className="mr-1 text-blue-400">●</span>}
      {label}
    </button>
  );
}
