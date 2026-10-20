import { useState } from "react";
import { HexInput } from "./HexInput";
import { TokenPicker } from "./TokenPicker";
import { ANCHOR_COLOR_GROUPS, COLOR_GROUPS, isHexColor } from "./colorTaxonomy";
import type { InheritedProps } from "./inheritance";

export type ColorFieldMode =
  /** Only HexInput. Used for RawColor fields: colors.main.*, colors.brand.*, colors.flat.*. */
  | "hex"
  /** Only TokenPicker. Used for ColorRef fields: surface tokens, semanticTokens.*. */
  | "token"
  /** Both — user toggles. Used for colors.status.* and effect-layer colors. */
  | "hex-or-token"
  /** Limited token set + hex. Used for modes.colorScheme.*.background/foreground. */
  | "anchor-or-hex";

type Props = InheritedProps<string> & {
  mode: ColorFieldMode;
};

/**
 * Color field — the dispatcher.
 *
 * Picks one of HexInput / TokenPicker based on `mode`. For dual modes,
 * shows a Hex/Token toggle pill and remembers the user's choice locally.
 */
export function ColorField({ value, inherited, onChange, mode }: Props) {
  const strVal = value != null ? String(value) : "";
  const inhVal = inherited != null ? String(inherited) : "";
  const currentIsHex = isHexColor(strVal);
  const inheritedIsHex = isHexColor(inhVal);

  const isDual = mode === "hex-or-token" || mode === "anchor-or-hex";
  const [subMode, setSubMode] = useState<"hex" | "token">(() => {
    if (mode === "hex") return "hex";
    if (mode === "token") return "token";
    if (currentIsHex) return "hex";
    if (!strVal && inheritedIsHex) return "hex";
    return "token";
  });

  const effectiveMode = isDual ? subMode : (mode === "hex" ? "hex" : "token");
  const tokenGroups = mode === "anchor-or-hex" ? ANCHOR_COLOR_GROUPS : COLOR_GROUPS;

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      {isDual && (
        <div className="flex rounded border border-zinc-200 overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => setSubMode("hex")}
            className={`px-1 text-[9px] leading-tight h-[22px] ${
              subMode === "hex"
                ? "bg-blue-500/15 text-blue-600 font-medium"
                : "text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            Hex
          </button>
          <button
            type="button"
            onClick={() => setSubMode("token")}
            className={`px-1 text-[9px] leading-tight h-[22px] border-l border-zinc-200 ${
              subMode === "token"
                ? "bg-blue-500/15 text-blue-600 font-medium"
                : "text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            Token
          </button>
        </div>
      )}

      {effectiveMode === "hex" ? (
        <HexInput value={value} inherited={inherited} onChange={onChange} />
      ) : (
        <TokenPicker
          value={value}
          inherited={inherited}
          onChange={onChange}
          groups={tokenGroups}
        />
      )}
    </div>
  );
}
