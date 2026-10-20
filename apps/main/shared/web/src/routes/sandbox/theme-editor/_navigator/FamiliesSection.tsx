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

const FAMILY_KEYS = [
  "surfaceContainer",
  "elevatedOverlay",
  "listContainer",
  "interactiveControl",
  "interactiveControlGroup",
  "field",
  "shape",
  "media",
] as const;

const KEY = "families";

export function FamiliesSection({ selection, onSelect, expansion, search }: Props) {
  const expanded = expansion.isOpen(KEY);

  const isActive = (key: string) =>
    selection?.category === "families" && selection.path[0] === key;

  const q = search.trim().toLowerCase();
  const visible = q
    ? FAMILY_KEYS.filter((k) => k.toLowerCase().includes(q))
    : FAMILY_KEYS;

  if (q && visible.length === 0) return null;

  return (
    <div className="border-b border-zinc-200">
      <button
        onClick={() => expansion.toggle(KEY)}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-100 transition-colors"
      >
        <span className="text-[10px]">{expanded ? "▾" : "▸"}</span>
        Families
      </button>
      {expanded && (
        <div className="flex flex-col pb-1">
          {visible.map((key) => (
            <button
              key={key}
              onClick={() =>
                onSelect({ category: "families", path: [key] })
              }
              className={`px-6 py-1 text-left text-xs hover:bg-zinc-100 transition-colors ${
                isActive(key) ? "bg-blue-100 text-blue-700" : ""
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
