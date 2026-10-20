import { useState, type ReactNode } from "react";

/**
 * Single-expanded accordion. Opening one section collapses any other.
 * Use one hook per panel to coordinate multiple sections.
 */
export function useSingleExpand(initial: string | null = null) {
  const [open, setOpen] = useState<string | null>(initial);
  return {
    isOpen: (key: string) => open === key,
    toggle: (key: string) =>
      setOpen((prev) => (prev === key ? null : key)),
    set: setOpen,
  };
}

/**
 * Multi-expand accordion. Each section's open/closed state is independent.
 * Initial open keys come from `defaults` (any entry whose value is `true`).
 *
 * Used by composite shape views (ListContainer, TableRow, InteractiveControl,
 * Field, Switch, ElevatedOverlay, Media) so that on mount, every slot that
 * already has data is auto-opened — the user can see what's set without
 * clicking through each accordion.
 */
export function useMultiExpand(defaults: Record<string, boolean>) {
  const [open, setOpen] = useState<Set<string>>(
    () =>
      new Set(
        Object.entries(defaults)
          .filter(([, v]) => v)
          .map(([k]) => k),
      ),
  );
  return {
    isOpen: (key: string) => open.has(key),
    toggle: (key: string) =>
      setOpen((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      }),
  };
}

/**
 * Recursively check if a value carries any meaningful data.
 * Empty objects, empty arrays, null, undefined, "" all return false.
 */
export function hasAnyValue(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v !== "";
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return true;
  if (Array.isArray(v)) return v.some(hasAnyValue);
  if (typeof v === "object") return Object.values(v as object).some(hasAnyValue);
  return false;
}

type Props = {
  title: string;
  /** Optional small annotation rendered on the right (e.g. axis hint). */
  annotation?: ReactNode;
  /** Glyph/icon hint for the section type. ⊞ = surface, ⊟ = partial, … */
  glyph?: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
};

/**
 * One accordion section. Header is a clickable strip with chevron + glyph
 * + title + optional annotation. Body is rendered when `expanded`.
 */
export function AccordionSection({
  title,
  annotation,
  glyph,
  expanded,
  onToggle,
  children,
}: Props) {
  return (
    <div className="border-b border-zinc-100">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 hover:bg-zinc-100 transition-colors text-left bg-zinc-50"
      >
        <span className="text-[9px] text-zinc-400 w-3 shrink-0 text-center">
          {expanded ? "▾" : "▸"}
        </span>
        {glyph && (
          <span className="text-[10px] text-zinc-500 shrink-0">{glyph}</span>
        )}
        <span className="text-[10px] font-semibold text-zinc-700 uppercase tracking-wider truncate flex-1">
          {title}
        </span>
        {annotation && (
          <span className="text-[9px] text-zinc-400 shrink-0">
            {annotation}
          </span>
        )}
      </button>
      {expanded && <div>{children}</div>}
    </div>
  );
}
