import { useMemo } from "react";
import type { Theme, ThemeRule } from "../../../../../../../../../shared/libs/ui/types";
import type { NavSelection } from "../_core/types";
import type { ExpansionAPI } from "./expansion";

type Props = {
  theme: Theme;
  selection: NavSelection | null;
  onSelect: (sel: NavSelection | null) => void;
  expansion: ExpansionAPI;
  search: string;
  onOpenCreateRule: () => void;
  onOpenEditRule: (index: number) => void;
};

const KEY = "rules";

/**
 * Rules navigator section — flat list of theme.rules with CRUD lifted to the
 * page so other surfaces (e.g. InspectOverlay) can also open the rule modal
 * with a pre-filled chain.
 *
 * Rendered last in the navigator, separated by a thicker top border so it
 * reads as a distinct section. Collapsible; header shows a count badge.
 * Filtered by the navigator-level global search.
 */
export function RulesSection({
  theme,
  selection,
  onSelect,
  expansion,
  search,
  onOpenCreateRule,
  onOpenEditRule,
}: Props) {
  const rules = theme.rules ?? [];
  const expanded = expansion.isOpen(KEY);

  const isActive = (i: number) =>
    selection?.category === "rules" && selection.path[0] === String(i);

  const indexed = useMemo(
    () => rules.map((r, i) => ({ rule: r, index: i, text: chainText(r) })),
    [rules],
  );

  const q = search.trim().toLowerCase();
  const visible = q
    ? indexed.filter((r) => r.text.toLowerCase().includes(q))
    : indexed;

  // While searching, hide the section if no rules match.
  if (q && visible.length === 0) return null;

  return (
    <div className="border-t-2 border-zinc-300 mt-2">
      <button
        onClick={() => expansion.toggle(KEY)}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-100 transition-colors"
      >
        <span className="text-[10px]">{expanded ? "▾" : "▸"}</span>
        <span className="flex-1 text-left">Rules</span>
        {indexed.length > 0 && (
          <span className="text-[10px] font-normal normal-case tracking-normal text-zinc-600 bg-zinc-100 rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
            {indexed.length}
          </span>
        )}
      </button>

      {expanded && (
        <>
          <div className="px-3 pb-1.5 flex justify-end">
            <button
              onClick={onOpenCreateRule}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 text-[14px] leading-none"
              title="Add rule"
            >
              ＋
            </button>
          </div>

          <div className="flex flex-col pb-1">
            {indexed.length === 0 ? (
              <div className="px-6 py-1 text-[11px] italic text-zinc-400">
                (none — click ＋ to add)
              </div>
            ) : (
              visible.map(({ index: i, text }) => (
                <div key={i} className="flex items-center group">
                  <button
                    onClick={() =>
                      onSelect({ category: "rules", path: [String(i)] })
                    }
                    className={`flex-1 min-w-0 px-6 py-1 text-left text-xs hover:bg-zinc-100 transition-colors ${
                      isActive(i) ? "bg-blue-100 text-blue-700" : ""
                    }`}
                    title={text}
                  >
                    <span className="font-mono truncate block">{text}</span>
                  </button>
                  <button
                    onClick={() => onOpenEditRule(i)}
                    className="px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit chain"
                  >
                    ✎
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Render a rule's chain as `[concept] key > [concept] key > …`. */
export function chainText(rule: ThemeRule): string {
  return rule.chain
    .map((seg) => (seg.concept ? `${seg.concept} ${seg.key}` : seg.key))
    .join(" > ");
}
