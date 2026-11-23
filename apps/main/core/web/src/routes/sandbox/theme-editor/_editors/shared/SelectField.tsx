import type { InheritedProps } from "./inheritance";
import { inheritedState, inheritedTextCls } from "./inheritance";

type Props = InheritedProps<string> & {
  options: readonly string[];
  placeholder?: string;
  className?: string;
};

/**
 * Generic select with inherited support. Shows "(unset)" or "(inherited)" when
 * value is unset; italic + dimmed when displaying inherited fallback.
 *
 * The token-specific selects (SpacingSelect, RadiusSelect, etc.) are thin
 * wrappers over this with a fixed `options` array.
 */
export function SelectField({
  value,
  inherited,
  onChange,
  options,
  placeholder,
  className,
}: Props) {
  const state = inheritedState(value, inherited);
  const display = (value ?? "") as string;
  const inhStr = inherited != null ? String(inherited) : "";

  const placeholderLabel =
    placeholder ?? (state === "inherited" ? `(${inhStr})` : "(unset)");

  return (
    <select
      value={display}
      onChange={(e) => onChange(e.target.value || undefined)}
      className={`text-[11px] rounded border border-zinc-200 bg-white h-[22px] px-1 ${inheritedTextCls(state)} ${className ?? "w-full"}`}
    >
      <option value="" className="text-zinc-500 italic">
        {placeholderLabel}
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
