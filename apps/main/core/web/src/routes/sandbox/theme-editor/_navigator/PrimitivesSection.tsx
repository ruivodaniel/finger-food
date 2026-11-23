import type { NavSelection } from "../_core/types";
import type { ExpansionAPI } from "./expansion";

type Props = {
  selection: NavSelection | null;
  onSelect: (sel: NavSelection) => void;
  expansion: ExpansionAPI;
  search: string;
};

const PRIMITIVE_ITEMS = [
  "colors",
  "typography",
  "spacing",
  "radius",
  "effects",
  "gradients",
  "transitions",
  "borderWidths",
  "icons",
  "modes",
] as const;

const KEY = "primitives";

export function PrimitivesSection({ selection, onSelect, expansion, search }: Props) {
  const expanded = expansion.isOpen(KEY);

  const isActive = (item: string) =>
    selection?.category === "primitives" && selection.path[0] === item;

  const q = search.trim().toLowerCase();
  const visible = q
    ? PRIMITIVE_ITEMS.filter((k) => k.toLowerCase().includes(q))
    : PRIMITIVE_ITEMS;

  // Hide the section entirely while searching when nothing matches.
  if (q && visible.length === 0) return null;

  return (
    <div className="border-b border-zinc-200">
      <button
        onClick={() => expansion.toggle(KEY)}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-100 transition-colors"
      >
        <span className="text-[10px]">{expanded ? "▾" : "▸"}</span>
        Primitives
      </button>
      {expanded && (
        <div className="flex flex-col pb-1">
          {visible.map((item) => (
            <button
              key={item}
              onClick={() =>
                onSelect({ category: "primitives", path: [item] })
              }
              className={`px-6 py-1 text-left text-xs hover:bg-zinc-100 transition-colors ${
                isActive(item) ? "bg-blue-100 text-blue-700" : ""
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
