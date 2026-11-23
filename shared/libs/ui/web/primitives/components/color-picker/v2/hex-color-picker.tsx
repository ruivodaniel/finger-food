// HexColorPicker — a standalone popover: SV square, hue slider, hex field. The consumer gives the trigger; the popover anchors to it. Clicking outside closes it (Radix).
import * as React from "react";
import { Content } from "../../parts";
import { Stack } from "../../../layouts";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover";
import { hexToHsv, hsvToHex, normalizeHex, resolveToHex, type Hsv } from "./color";
import type { HexColorPickerProps } from "./types";

export function HexColorPicker({ children, value, onChange, onCommit, open, onOpenChange, side = "bottom", align = "start" }: HexColorPickerProps) {
  const hex0 = resolveToHex(value ?? "") ?? "#4a2d8f";
  const [hsv, setHsv] = React.useState<Hsv>(() => hexToHsv(hex0));
  const [hex, setHex] = React.useState(hex0);
  React.useEffect(() => { const n = resolveToHex(value ?? ""); if (n && n.toLowerCase() !== hex.toLowerCase()) { setHsv(hexToHsv(n)); setHex(n); } }, [value]);   // eslint-disable-line react-hooks/exhaustive-deps

  const set = (next: Hsv, commit = false) => { const h = hsvToHex(next); setHsv(next); setHex(h); onChange?.(h); if (commit) onCommit?.(h); };
  const sv = React.useRef<HTMLDivElement>(null);
  const onSVDown = (e: React.PointerEvent) => {
    const el = sv.current; if (!el) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const to = (ev: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect();
      const s = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
      const v = 1 - Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height));
      set({ h: hsv.h, s, v });
    };
    to(e);
    const mv = (ev: PointerEvent) => to(ev);
    const up = (ev: PointerEvent) => { to(ev); document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); onCommit?.(hsvToHex({ h: hsv.h, s: Math.max(0, Math.min(1, (ev.clientX - el.getBoundingClientRect().left) / el.getBoundingClientRect().width)), v: 1 - Math.max(0, Math.min(1, (ev.clientY - el.getBoundingClientRect().top) / el.getBoundingClientRect().height)) })); };
    document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
  };
  const onHue = (e: React.ChangeEvent<HTMLInputElement>) => set({ ...hsv, h: Number(e.target.value) });
  const onHueCommit = () => onCommit?.(hex);
  const onHex = (e: React.ChangeEvent<HTMLInputElement>) => { const v = e.target.value; setHex(v); const n = normalizeHex(v); if (n) { setHsv(hexToHsv(n)); onChange?.(n); } };
  const onHexCommit = () => { const n = normalizeHex(hex); if (n) onCommit?.(n); };

  const picker = (
    <Content>
      <Stack dir="col" scale="sm">
        <div ref={sv} onPointerDown={onSVDown} className="relative h-28 w-full cursor-crosshair rounded-sm" data-testid="hex-sv"
          style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h}deg 100% 50%))` }}>
          <div className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }} />
        </div>
        <input type="range" min={0} max={360} value={Math.round(hsv.h)} onChange={onHue} onPointerUp={onHueCommit} aria-label="hue" data-testid="hex-hue"
          className="h-2 w-full appearance-none rounded"
          style={{ background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }} />
        <input value={hex} onChange={onHex} onBlur={onHexCommit} onKeyDown={(e) => { if (e.key === "Enter") onHexCommit(); }} aria-label="hex" data-testid="hex-field"
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
      </Stack>
    </Content>
  );

  // the trigger is always the consumer's element; open/onOpenChange are forwarded so a parent can watch it. PopoverTrigger handles the click to open.
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-56 p-0">{picker}</PopoverContent>
    </Popover>
  );
}
