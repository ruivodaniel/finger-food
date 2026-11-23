// Trigger — the shared button that opens any picker popover. Two independent properties: an optional icon (tinted by the current colour) and an optional text (nothing / name-or-hex / hex).
import * as React from "react";
import { iconRegistry, type IconName } from "../../icons";
import type { Section, TriggerLook } from "./types";

export interface TriggerProps extends TriggerLook {
  /** the current colour the trigger reflects (icon tint; the chip in the text form) */
  color: string | null;
  /** when multiple colours are selected, how many; the text becomes "N colours" */
  multipleCount?: number;
  /** the sections known to the menu — used to look up a colour's name for `text: "name-or-hex"` */
  sections?: Section[];
  placeholder?: string;
  disabled?: boolean;
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export const Trigger = React.forwardRef<HTMLButtonElement, TriggerProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">>(function Trigger(
  { icon, solid = false, text = "none", iconThickness = 2.5, iconSize = 20, color, multipleCount, sections, placeholder = "Pick a colour", disabled, ...rest },
  ref,
) {
  const Ico = icon ? iconRegistry[icon as IconName] : undefined;
  const patternId = "checker-" + React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const nameOf = (hex: string): string | undefined => sections?.flatMap((s) => s.colors).find((c) => same(c.value, hex))?.name;
  const showText = text !== "none";
  const label = (() => {
    if (!showText) return null;
    if (multipleCount && multipleCount > 1) return `${multipleCount} colours`;
    if (!color) return placeholder;
    return text === "hex" ? color : (nameOf(color) ?? color);
  })();
  // the checker is ALWAYS underneath; the colour (with its alpha) is painted on top. A solid colour hides the checker; alpha<100 lets it through; null shows pure checker.
  const CHECKER = "repeating-conic-gradient(#888 0 25%, #ccc 0 50%) 0 0 / 8px 8px";
  const chip = !icon && showText ? (
    <span style={{ width: 16, height: 16, borderRadius: 2, border: "1px solid rgba(0,0,0,.1)", background: CHECKER, backgroundClip: "padding-box", position: "relative", overflow: "hidden", display: "inline-block" }}>
      {color ? <span style={{ position: "absolute", inset: 0, background: color }} /> : null}
    </span>
  ) : null;

  return (
    <button
      ref={ref}
      type="button"
      element="field--color-picker"
      aria-label={rest["aria-label"] ?? label ?? placeholder}
      title={rest["aria-label"] ?? (typeof label === "string" ? label : undefined)}
      disabled={disabled}
      {...rest}
      className={showText ? "inline-flex cursor-pointer items-center gap-2 rounded border border-gray-300 bg-white px-2 py-1" : "inline-flex cursor-pointer items-center justify-center rounded border border-gray-300 bg-white"}
      style={showText ? undefined : { width: 40, height: 32 }}
    >
      {chip}
      {/* the icon is the shape: drawn twice, stacked. Bottom copy stroked with the checker pattern, top copy stroked with the colour (and its alpha). null → only the checker copy. */}
      {Ico ? (
        <span style={{ position: "relative", display: "inline-flex", width: iconSize, height: iconSize }}>
          <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
            <defs>
              <pattern id={patternId} patternUnits="userSpaceOnUse" width="6" height="6">
                <rect width="6" height="6" fill="#ccc" />
                <rect width="3" height="3" fill="#888" />
                <rect x="3" y="3" width="3" height="3" fill="#888" />
              </pattern>
            </defs>
          </svg>
          <span style={{ position: "absolute", inset: 0 }}><Ico size={iconSize} strokeWidth={iconThickness} stroke={`url(#${patternId})`} fill={solid ? `url(#${patternId})` : "none"} aria-hidden="true" /></span>
          {color ? <span style={{ position: "absolute", inset: 0 }}><Ico size={iconSize} strokeWidth={iconThickness} stroke={color} fill={solid ? color : "none"} aria-hidden="true" /></span> : null}
        </span>
      ) : null}
      {showText ? <span className="text-sm">{label}</span> : null}
    </button>
  );
});
