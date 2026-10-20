import type { InheritedProps } from "./inheritance";
import { inheritedState } from "./inheritance";

type Option = { value: string; label: string };

type Props = InheritedProps<string> & {
  options: readonly Option[];
  className?: string;
};

/**
 * Pill-style toggle for small fixed enums. Used for density (compact/default/spacious),
 * textSize (small/default/large), childAlign (start/center/end), objectFit, etc.
 *
 * Single-row segmented control; click a pill to set, click the active pill to clear.
 * Inherited values render with a dimmed/italic outline.
 */
export function SegmentedSelect({
  value,
  inherited,
  onChange,
  options,
  className,
}: Props) {
  const state = inheritedState(value, inherited);
  const effective = (value ?? inherited) as string | undefined;

  return (
    <div
      className={`inline-flex rounded border border-zinc-200 overflow-hidden ${className ?? ""}`}
    >
      {options.map((opt) => {
        const active = effective === opt.value;
        const isLocal = state === "local" && active;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? undefined : opt.value)}
            className={`px-1.5 h-[22px] text-[10px] border-l border-zinc-200 first:border-l-0 transition-colors ${
              active
                ? isLocal
                  ? "bg-blue-500/15 text-blue-600 font-medium"
                  : "bg-zinc-100 text-zinc-500 italic"
                : "text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
