import type { InheritedProps } from "./inheritance";
import { inheritedState, inheritedTextCls } from "./inheritance";

/**
 * Hex color input: native color picker + text input, synced.
 *
 * Used directly for `RawColor` fields (colors.main.*, colors.brand.*, colors.flat.*),
 * and as the "hex" sub-mode of <ColorField> in dual-mode contexts.
 */
export function HexInput({ value, inherited, onChange }: InheritedProps<string>) {
  const state = inheritedState(value, inherited);
  const display = (value ?? inherited ?? "") as string;
  const pickerValue = display && display.startsWith("#") ? display : "#000000";

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <input
        type="color"
        value={pickerValue}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-[22px] rounded border border-zinc-200 cursor-pointer shrink-0 p-0"
      />
      <input
        type="text"
        value={state === "local" ? display : ""}
        placeholder={state === "inherited" ? display : "#000000"}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={`flex-1 min-w-0 px-1.5 text-[11px] font-mono rounded border border-zinc-200 bg-white h-[22px] ${inheritedTextCls(state)}`}
      />
    </div>
  );
}
