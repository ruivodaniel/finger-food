import { useState } from "react";
import type { InheritedProps } from "./inheritance";
import { inheritedState, inheritedTextCls } from "./inheritance";

type Props = InheritedProps<number> & {
  step?: number;
  min?: number;
  max?: number;
  /** Display suffix shown next to the input (e.g. "px", "ms", "%"). */
  unit?: string;
  className?: string;
};

/**
 * Numeric input with inherited support.
 * Local edits go through a string draft so partial entries (e.g. "0.") don't
 * round-trip-break. Empty string commits to undefined on blur.
 */
export function NumberField({
  value,
  inherited,
  onChange,
  step = 1,
  min,
  max,
  unit,
  className,
}: Props) {
  const state = inheritedState(value, inherited);
  const [draft, setDraft] = useState<string | null>(null);

  const display =
    draft !== null
      ? draft
      : value != null
        ? String(value)
        : "";
  const placeholder = state === "inherited" ? String(inherited) : "—";

  const input = (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      placeholder={placeholder}
      step={step}
      min={min}
      max={max}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        if (raw === "") return;
        const parsed = parseFloat(raw);
        if (!Number.isNaN(parsed)) onChange(parsed);
      }}
      onBlur={() => {
        if (draft === "") onChange(undefined);
        setDraft(null);
      }}
      className={`text-[11px] rounded border border-zinc-200 bg-white h-[22px] px-1.5 ${inheritedTextCls(state)} ${unit ? "w-full" : (className ?? "w-full")}`}
    />
  );

  if (!unit) return input;

  return (
    <div className={`flex items-center gap-1 ${className ?? "w-full"}`}>
      {input}
      <span className="text-[10px] text-zinc-400 shrink-0">{unit}</span>
    </div>
  );
}
