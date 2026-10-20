import { useEffect, useMemo, useRef, useState } from "react";
import type { Theme } from "../../../../../../../../../shared/libs/ui/types";
import type { NavSelection } from "../_core/types";
import { PrimitivesSection } from "./PrimitivesSection";
import { FamiliesSection } from "./FamiliesSection";
import { ElementsSection } from "./ElementsSection";
import { ContextualSection } from "./ContextualSection";
import { LayoutsSection } from "./LayoutsSection";
import { RulesSection } from "./RulesSection";
import {
  focusKeysFor,
  type ExpansionAPI,
  type ExpansionKey,
} from "./expansion";

type Props = {
  theme: Theme;
  selection: NavSelection | null;
  onSelect: (sel: NavSelection | null) => void;
  /**
   * One-shot signal: when this number changes, the navigator collapses
   * everything not on the focus path to `selection` and expands what's
   * needed to reveal it. Manual section-header clicks aren't affected.
   */
  focusPulse?: number;
  /** Triggers the rule modal (state + handlers live in $themeId). */
  onOpenCreateRule: () => void;
  onOpenEditRule: (index: number) => void;
};

export function Navigator({
  theme,
  selection,
  onSelect,
  focusPulse = 0,
  onOpenCreateRule,
  onOpenEditRule,
}: Props) {
  // Single source of truth for which navigator keys are expanded.
  // Default: only "primitives" open on initial mount.
  const [expanded, setExpanded] = useState<Set<ExpansionKey>>(
    () => new Set<ExpansionKey>(["primitives"]),
  );

  // One global search across all sections. While non-empty, every section
  // and sub-group is force-expanded so matches are visible without clicks.
  const [search, setSearch] = useState("");

  // Atomic-replace expansion when focusPulse changes (inspect-driven jump).
  // Intentionally NOT triggered by `selection` alone — manual nav clicks
  // shouldn't collapse other sections the user has opened for exploration.
  const lastPulse = useRef(focusPulse);
  useEffect(() => {
    if (focusPulse === lastPulse.current) return;
    lastPulse.current = focusPulse;
    if (selection) setExpanded(focusKeysFor(selection));
  }, [focusPulse, selection]);

  const isSearching = search.trim().length > 0;

  const expansion: ExpansionAPI = useMemo(
    () => ({
      // While searching, treat every key as expanded so matches are visible.
      isOpen: (key) => isSearching || expanded.has(key),
      toggle: (key) =>
        setExpanded((prev) => {
          const next = new Set(prev);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return next;
        }),
    }),
    [expanded, isSearching],
  );

  return (
    <div className="flex flex-col text-sm">
      <div className="px-3 py-2 border-b border-zinc-200 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Navigator
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full px-1.5 py-0.5 text-[11px] rounded border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
        />
      </div>
      <PrimitivesSection
        selection={selection}
        onSelect={onSelect}
        expansion={expansion}
        search={search}
      />
      <FamiliesSection
        theme={theme}
        selection={selection}
        onSelect={onSelect}
        expansion={expansion}
        search={search}
      />
      <ElementsSection
        theme={theme}
        selection={selection}
        onSelect={onSelect}
        expansion={expansion}
        search={search}
      />
      <ContextualSection
        theme={theme}
        selection={selection}
        onSelect={onSelect}
        expansion={expansion}
        search={search}
      />
      <LayoutsSection
        theme={theme}
        selection={selection}
        onSelect={onSelect}
        expansion={expansion}
        search={search}
      />

      {/* Rules — collapsible with count badge */}
      <RulesSection
        theme={theme}
        selection={selection}
        onSelect={onSelect}
        expansion={expansion}
        search={search}
        onOpenCreateRule={onOpenCreateRule}
        onOpenEditRule={onOpenEditRule}
      />
    </div>
  );
}
