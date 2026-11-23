// A number field + inline slider, same UX for opacity, thickness, corner radius, etc. Type a number or drag the slider; both commit the same value.
import * as React from "react";
import { cn } from "../../../../lib/utils";

export interface NumberSliderProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** text shown after the number in the field (e.g. "%" for opacity, "px" for thickness); the input itself only accepts digits */
  suffix?: string;
  /** background of the slider track (e.g. the opacity gradient); default is a neutral grey */
  trackBackground?: string;
  "aria-label"?: string;
  className?: string;
}

export function NumberSlider({ value, onChange, min = 0, max = 100, step = 1, suffix, trackBackground, "aria-label": aria, className }: NumberSliderProps) {
  const [draft, setDraft] = React.useState(String(value));
  React.useEffect(() => { setDraft(String(value)); }, [value]);
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n / step) * step));
  const commitField = () => { const n = Number(draft); if (Number.isFinite(n)) onChange(clamp(n)); else setDraft(String(value)); };
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className="relative inline-flex items-center">
        <input
          aria-label={aria ?? "value"}
          value={draft}
          inputMode="numeric"
          onChange={(e) => setDraft(e.target.value.replace(/[^\d.-]/g, ""))}
          onBlur={commitField}
          onKeyDown={(e) => { if (e.key === "Enter") { commitField(); (e.target as HTMLInputElement).blur(); } }}
          className="w-14 rounded border border-gray-300 px-2 py-1 pr-5 text-right text-sm"
        />
        {suffix ? <span className="pointer-events-none absolute right-2 text-xs text-gray-400">{suffix}</span> : null}
      </div>
      <input
        type="range"
        aria-label={aria ? `${aria} slider` : "slider"}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-3 min-w-0 flex-1 cursor-pointer appearance-none rounded"
        style={trackBackground ? { background: trackBackground } : { background: "#e5e7eb" }}
      />
    </div>
  );
}
