import type { Theme } from "../../../../../../../../../shared/libs/ui/types";
import type { NavSelection } from "../_core/types";
import type { ExpansionAPI } from "./expansion";

type Props = {
  theme: Theme;
  selection: NavSelection | null;
  onSelect: (sel: NavSelection) => void;
  expansion: ExpansionAPI;
  search: string;
};

const KEY = "contextual";

export function ContextualSection({
  theme,
  selection,
  onSelect,
  expansion,
  search,
}: Props) {
  const contextualKeys = theme.contextual ? Object.keys(theme.contextual) : [];

  // Hide entirely when there are no contextual entries — the section adds
  // no value as an empty stub and rules cover the same conceptual space.
  if (contextualKeys.length === 0) return null;

  const expanded = expansion.isOpen(KEY);

  const isActive = (parent: string, child?: string) =>
    selection?.category === "contextual" &&
    selection.path[0] === parent &&
    (child ? selection.path[1] === child : selection.path.length === 1);

  const q = search.trim().toLowerCase();
  const filtered = contextualKeys
    .map((parent) => {
      const allChildren = theme.contextual
        ? Object.keys(theme.contextual[parent] ?? {})
        : [];
      if (!q) return { parent, children: allChildren, parentMatches: true };
      const parentMatches = parent.toLowerCase().includes(q);
      const matchedChildren = allChildren.filter((c) =>
        c.toLowerCase().includes(q),
      );
      return {
        parent,
        children: parentMatches ? allChildren : matchedChildren,
        parentMatches,
      };
    })
    .filter((g) => g.parentMatches || g.children.length > 0);

  if (q && filtered.length === 0) return null;

  return (
    <div className="border-b border-zinc-200">
      <button
        onClick={() => expansion.toggle(KEY)}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-100 transition-colors"
      >
        <span className="text-[10px]">{expanded ? "▾" : "▸"}</span>
        Contextual
      </button>
      {expanded && (
        <div className="flex flex-col pb-1">
          {filtered.map(({ parent, children }) => (
            <div key={parent}>
              <button
                onClick={() =>
                  onSelect({
                    category: "contextual",
                    path: [parent],
                  })
                }
                className={`px-6 py-1 text-left text-xs hover:bg-zinc-100 transition-colors ${
                  isActive(parent) ? "bg-blue-100 text-blue-700" : ""
                }`}
              >
                {parent}
              </button>
              {children.map((child) => (
                <button
                  key={child}
                  onClick={() =>
                    onSelect({
                      category: "contextual",
                      path: [parent, child],
                    })
                  }
                  className={`px-9 py-1 text-left text-xs hover:bg-zinc-100 transition-colors ${
                    isActive(parent, child)
                      ? "bg-blue-100 text-blue-700"
                      : ""
                  }`}
                >
                  {child}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
