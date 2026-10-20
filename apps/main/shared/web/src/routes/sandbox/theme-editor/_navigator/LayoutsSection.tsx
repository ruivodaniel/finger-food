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

const LAYOUT_KEYS = [
  "surface",
  "shell",
  "shellNone",
  "page",
  "pageHeader",
  "pageBody",
  "main",
  "mainHeader",
  "mainBody",
  "section",
  "rowSection",
  "colSection",
  "leftSidebar",
  "rightSidebar",
  "contextPanel",
  "container",
  "scrollArea",
  "dialog",
  "sheet",
] as const;

const KEY = "layouts";

export function LayoutsSection({ theme, selection, onSelect, expansion, search }: Props) {
  const expanded = expansion.isOpen(KEY);
  const hasLayouts = theme.layouts != null;

  const isActive = (key: string) =>
    selection?.category === "layouts" && selection.path[0] === key;

  const q = search.trim().toLowerCase();
  const visible = q
    ? LAYOUT_KEYS.filter((k) => k.toLowerCase().includes(q))
    : LAYOUT_KEYS;

  if (q && visible.length === 0) return null;

  return (
    <div className="border-b border-zinc-200">
      <button
        onClick={() => expansion.toggle(KEY)}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-100 transition-colors"
      >
        <span className="text-[10px]">{expanded ? "▾" : "▸"}</span>
        Layouts
        {!hasLayouts && (
          <span className="ml-auto text-[10px] text-zinc-400">(empty)</span>
        )}
      </button>
      {expanded && (
        <div className="flex flex-col pb-1">
          {visible.map((key) => (
            <button
              key={key}
              onClick={() => onSelect({ category: "layouts", path: [key] })}
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
