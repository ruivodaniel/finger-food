import { ExpandIcon } from "./EditorIcons";

type Props = {
  expanded: boolean;
  onToggle: () => void;
  label?: string;
};

/**
 * Toggle between unified and expanded (per-corner / per-side) view.
 * Renders the grid icon when expanded, the square icon when collapsed.
 */
export function ExpandToggle({ expanded, onToggle, label }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-zinc-100 transition-colors"
      title={expanded ? "Collapse to unified" : "Expand per-side"}
    >
      <ExpandIcon expanded={expanded} />
      {label && <span className="text-[10px] text-zinc-500">{label}</span>}
    </button>
  );
}
