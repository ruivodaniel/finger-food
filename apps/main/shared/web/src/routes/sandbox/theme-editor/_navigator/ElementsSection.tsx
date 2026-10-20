import type { Theme } from "../../../../../../../../../shared/libs/ui/types";
import { ELEMENT_FAMILIES } from "../../../../../../../../../shared/libs/ui/web/theme-engine/conventions";
import type { NavSelection } from "../_core/types";
import type { ExpansionAPI } from "./expansion";

type Props = {
  theme: Theme;
  selection: NavSelection | null;
  onSelect: (sel: NavSelection) => void;
  expansion: ExpansionAPI;
  search: string;
};

/** Group elements by their family for display. */
function groupByFamily(): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const [element, family] of Object.entries(ELEMENT_FAMILIES)) {
    if (!groups[family]) groups[family] = [];
    groups[family].push(element);
  }
  return groups;
}

const GROUPED = groupByFamily();
const FAMILY_ORDER = Object.keys(GROUPED);

const KEY = "elements";
const FAMILY_KEY = (family: string) => `elements:${family}`;

export function ElementsSection({ selection, onSelect, expansion, search }: Props) {
  const expanded = expansion.isOpen(KEY);

  const isActive = (element: string) =>
    selection?.category === "elements" && selection.path[0] === element;

  const q = search.trim().toLowerCase();
  const filtered = FAMILY_ORDER.map((family) => {
    const all = GROUPED[family] ?? [];
    if (!q) return { family, items: all };
    const familyMatches = family.toLowerCase().includes(q);
    const items = familyMatches
      ? all
      : all.filter((el) => el.toLowerCase().includes(q));
    return { family, items };
  }).filter((g) => g.items.length > 0);

  if (q && filtered.length === 0) return null;

  return (
    <div className="border-b border-zinc-200">
      <button
        onClick={() => expansion.toggle(KEY)}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-100 transition-colors"
      >
        <span className="text-[10px]">{expanded ? "▾" : "▸"}</span>
        Elements
      </button>
      {expanded && (
        <div className="flex flex-col pb-1">
          {filtered.map(({ family, items }) => {
            const familyOpen = expansion.isOpen(FAMILY_KEY(family));
            return (
              <div key={family}>
                <button
                  onClick={() => expansion.toggle(FAMILY_KEY(family))}
                  className="flex items-center gap-1.5 px-5 py-1 w-full text-left text-xs text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  <span className="text-[9px]">{familyOpen ? "▾" : "▸"}</span>
                  {family}
                </button>
                {familyOpen &&
                  items.map((el) => (
                    <button
                      key={el}
                      onClick={() =>
                        onSelect({ category: "elements", path: [el] })
                      }
                      className={`px-9 py-1 text-left text-xs hover:bg-zinc-100 transition-colors ${
                        isActive(el) ? "bg-blue-100 text-blue-700" : ""
                      }`}
                    >
                      {el}
                    </button>
                  ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
