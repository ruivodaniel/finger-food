// PickerMenu — ONE picker popover. Sections and features switch on/off by props:
//   sections   each is a group of swatches; may be addable (a `+` opens the hex picker), may carry the transparent slot
//   opacity    show the opacity row (number + slider)
//   stroke     show pattern and thickness rows (the stroke section)
//   multiple   several colours at once (incompatible with stroke)
// ColorMenu, StrokeMenu do not exist — this is the one component.
import * as React from "react";
import { Icon } from "../../icons";
import { Content } from "../../parts";
import { Stack } from "../../../layouts";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover";
import { HexColorPicker } from "./hex-color-picker";
import { NumberSlider } from "./number-slider";
import { Trigger, type TriggerProps } from "./trigger";
import type { PaletteColor, Section, StrokePattern, StrokeValue, TriggerLook } from "./types";
import { resolveToHex } from "./color";

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
// a colour with an opacity: a hex carries it in its 8th digit; anything else (a theme token) as color-mix(in srgb, <colour> N%, transparent), so a token keeps its mode and its opacity
const MIX = /^color-mix\(in srgb,\s*(.+?)\s+(\d+(?:\.\d+)?)%,\s*transparent\)$/i;
const baseOf = (c: string): string => { const h = c.trim(); const mix = MIX.exec(h); return mix ? mix[1] : /^#[0-9a-f]{8}$/i.test(h) ? h.slice(0, 7) : h; };
const withAlpha = (c: string, alpha: number): string => {
  const base = baseOf(c);
  if (alpha >= 100) return base;
  const m = base.match(/^#([0-9a-f]{6})$/i);
  if (m) return `#${m[1]}${Math.round((alpha / 100) * 255).toString(16).padStart(2, "0")}`;
  return `color-mix(in srgb, ${base} ${alpha}%, transparent)`;
};


const PATTERNS: StrokePattern[] = ["solid", "dashed", "dotted"];
const DEFAULT_WIDTHS = [0, 24];
const DEFAULT_STROKE: StrokeValue = { color: null, pattern: "solid", width: 1 };

type ColorOnly = { color: string | null };
type MultiValue = { colors: string[] };
export type PickerValue = string | null | string[] | StrokeValue;

export interface PickerMenuProps {
  /** the trigger's look (optional icon + optional text) */
  trigger?: TriggerLook;
  /** the colour groups */
  sections?: Section[];
  /** show the opacity row (number field + gradient slider) */
  opacity?: boolean;
  /** show the pattern + thickness rows; the value becomes { color, pattern, width } */
  stroke?: boolean;
  /** thickness slider [min, max] (stroke only); default [0, 24] */
  widths?: [number, number];
  /** several colours at once (incompatible with stroke) */
  multiple?: boolean;
  max?: number;
  /** the value — single colour string|null (default), or string[] (multiple), or StrokeValue (stroke) */
  value?: PickerValue;
  defaultValue?: PickerValue;
  onChange?: (v: PickerValue) => void;
  placeholder?: string;
  disabled?: boolean;
  /** extra rows the consumer adds at the bottom of the menu (e.g. rounded corners) */
  footer?: React.ReactNode;
  /** accessibility label of the trigger button */
  label?: string;
  /** a colour was added to an addable section: which section, which hex (said beside the section's own onAdd) */
  onAddColor?: (e: { section: string; hex: string }) => void;
  /** a colour was taken out of an addable section: which section, which hex (said beside the section's own onRemove) */
  onRemoveColor?: (e: { section: string; hex: string }) => void;
  /** extra classes on the popover content (e.g. a host that must not treat clicks inside as its own) */
  contentClassName?: string;
}

/** a swatch inside a section */
function Swatch({ color, selected, onClick }: { color: PaletteColor; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" element="control--swatch" title={color.name ?? color.value} aria-label={color.name ?? color.value} aria-pressed={selected} onClick={onClick}
      style={{ background: color.value, border: "1px solid rgba(0,0,0,.1)" }} className="relative size-7 shrink-0 cursor-pointer rounded-sm">
      {selected ? <span className="absolute inset-0 flex items-center justify-center text-white mix-blend-difference"><Icon name="check" scale="xs" /></span> : null}
    </button>
  );
}

/** the "No color" swatch — first slot of a section with `allowTransparent`. Just the checker pattern (that's enough; a solid white would read as a white colour). Clicking it sets the value to null. */
function TransparentSwatch({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  return (
    <button type="button" element="control--swatch" title="No color" aria-label="No color" aria-pressed={selected} onClick={onClick}
      className="relative size-7 shrink-0 cursor-pointer rounded-sm" style={{ border: selected ? "2px solid #333" : "1px solid rgba(0,0,0,.25)", background: CHECKER }} />
  );
}

/** a chip in the top zone (selected colour): checker underneath, colour (with its alpha) on top. × on hover removes. */
const CHECKER = "repeating-conic-gradient(#888 0 25%, #ccc 0 50%) 0 0 / 8px 8px";
function Chip({ color, onRemove }: { color: string; onRemove: () => void }) {
  return (
    <span className="group relative inline-flex" title={color}>
      <span style={{ width: 36, height: 28, border: "1px solid rgba(0,0,0,.1)", borderRadius: 4, background: CHECKER, backgroundClip: "padding-box", position: "relative", overflow: "hidden" }}>
        <span style={{ position: "absolute", inset: 0, background: color }} />
      </span>
      <button type="button" aria-label={`remove ${color}`} onClick={onRemove}
        className="absolute -right-1.5 -top-1.5 hidden size-4 items-center justify-center rounded-full bg-white group-hover:flex"
        style={{ border: "1px solid rgba(0,0,0,.2)" }}>
        <Icon name="close" scale="xs" />
      </button>
    </span>
  );
}

/** the top-zone preview for stroke: a line with the current colour, pattern and thickness */
function StrokePreview({ color, pattern, width }: { color: string; pattern: StrokePattern; width: number }) {
  return <span style={{ display: "block", width: "100%", borderTop: `${Math.max(2, width)}px ${pattern} ${color}` }} />;
}

export function PickerMenu(props: PickerMenuProps) {
  const { trigger: triggerLook, sections, opacity = false, stroke = false, widths = DEFAULT_WIDTHS, multiple = false, max, value, defaultValue, onChange, placeholder = "Pick a colour", disabled, footer, label, contentClassName, onAddColor, onRemoveColor } = props;

  // internal shape selector: stroke → StrokeValue (single colour, pattern, width); multiple → string[]; else string|null. Stroke always implies a single colour; `multiple` is ignored when `stroke` is on.
  type Shape = "stroke" | "multi" | "single";
  const shape: Shape = stroke ? "stroke" : multiple ? "multi" : "single";

  // controlled vs uncontrolled; the defaults match the shape
  const initial: PickerValue = defaultValue ?? (shape === "stroke" ? DEFAULT_STROKE : shape === "multi" ? [] : null);
  const [unc, setUnc] = React.useState<PickerValue>(initial);
  const ctrl = value !== undefined;
  const v: PickerValue = ctrl ? value! : unc;

  // alpha lives here when opacity is on (single/stroke only); with multi it is ignored for v2
  const [alpha, setAlpha] = React.useState(100);

  // helpers to pull / set the colour part of the value depending on shape
  const colorPart = (): string | null => shape === "stroke" ? (v as StrokeValue).color : shape === "multi" ? ((v as string[])[0] ?? null) : (v as string | null);
  const colorsPart = (): string[] => shape === "multi" ? (v as string[]) : (colorPart() ? [colorPart() as string] : []);

  const emit = (next: PickerValue) => { if (!ctrl) setUnc(next); onChange?.(next); };
  const setColor = (c: string | null) => {
    const withOp = (x: string | null) => (x && opacity ? withAlpha(x, alpha) : x);
    if (shape === "stroke") emit({ ...(v as StrokeValue), color: withOp(c) });
    else if (shape === "multi") { const base = baseOf(c ?? ""); const list = (v as string[]).map(baseOf); const has = base && list.some((x) => same(x, base));
      const next = !c ? [] : has ? list.filter((x) => !same(x, base)) : (max && list.length >= max ? list : [...list, base]);
      emit(next.map((x) => (opacity ? withAlpha(x, alpha) : x))); }
    else emit(withOp(c));
  };
  const addColor = (c: string) => setColor(c);
  const removeColor = (c: string) => {
    if (shape === "multi") { const list = (v as string[]).map(baseOf).filter((x) => !same(x, baseOf(c))); emit(list.map((x) => (opacity ? withAlpha(x, alpha) : x))); }
    else setColor(null);
  };
  const setPattern = (p: StrokePattern) => { if (shape === "stroke") emit({ ...(v as StrokeValue), pattern: p }); };
  const setWidth = (w: number) => { if (shape === "stroke") emit({ ...(v as StrokeValue), width: w }); };
  const onAlpha = (a: number) => { setAlpha(a); const list = colorsPart().map(baseOf).map((x) => withAlpha(x, a));
    if (shape === "stroke") emit({ ...(v as StrokeValue), color: list[0] ?? null });
    else if (shape === "multi") emit(list);
    else emit(list[0] ?? null); };

  // the alpha follows the value: an 8-digit hex carries its own; a 6-digit one is fully opaque
  const alphaOf = (c: string | null): number => { const mix = c ? MIX.exec(c.trim()) : null; if (mix) return Math.round(Number(mix[2])); const m = c?.trim().match(/^#[0-9a-f]{6}([0-9a-f]{2})$/i); return m ? Math.round((parseInt(m[1], 16) / 255) * 100) : 100; };
  const currentAlpha = (shape === "stroke" ? (v as StrokeValue).color : shape === "multi" ? ((v as string[])[0] ?? null) : (v as string | null)) ?? null;
  React.useEffect(() => { if (currentAlpha) setAlpha(alphaOf(currentAlpha)); }, [currentAlpha]);   // eslint-disable-line react-hooks/exhaustive-deps

  const selectedBases = colorsPart().map(baseOf);
  const isSelected = (c: string) => selectedBases.some((x) => same(x, baseOf(c)));
  const firstColor = selectedBases[0] ?? null;
  // the trigger must show the colour WITH alpha (null → checker, alpha<100% → colour over checker). Use the actual stored value, not the base.
  const triggerColor: string | null = (shape === "stroke" ? (v as StrokeValue).color : shape === "multi" ? ((v as string[])[0] ?? null) : (v as string | null)) ?? null;
  const previewHex = resolveToHex(firstColor ?? "") ?? "#4a2d8f";

  // the pending-add state, per section
  const pending = React.useRef<Record<string, string | null>>({});
  const onPickerCommit = (s: Section, hex: string) => {
    if (!s.addable) return;
    const prev = pending.current[s.id] ?? null;
    if (prev && !same(prev, hex)) { s.onRemove?.(prev); onRemoveColor?.({ section: s.id, hex: prev }); }
    if (!prev || !same(prev, hex)) { s.onAdd?.(hex); onAddColor?.({ section: s.id, hex }); }
    pending.current[s.id] = hex;
    addColor(hex);
  };
  const resetPending = (s: Section) => { pending.current[s.id] = null; };

  const triggerProps: TriggerProps = {
    icon: triggerLook?.icon,
    solid: triggerLook?.solid,
    text: triggerLook?.text ?? "none",
    iconThickness: triggerLook?.iconThickness,
    iconSize: triggerLook?.iconSize,
    color: triggerColor,
    multipleCount: selectedBases.length,
    sections, placeholder, disabled,
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Trigger {...triggerProps} aria-label={label} />
      </PopoverTrigger>
      <PopoverContent align="start" className={"w-64 p-0 " + (contentClassName ?? "")}>
        <Content>
          <Stack dir="col" scale="sm">
            {/* TOP — stroke preview when stroke is on; otherwise selected chip(s) */}
            {stroke ? (
              firstColor ? <StrokePreview color={opacity ? withAlpha(firstColor, alpha) : firstColor} pattern={(v as StrokeValue).pattern} width={(v as StrokeValue).width} /> : <span className="text-xs text-gray-500">{placeholder}</span>
            ) : selectedBases.length > 0 ? (
              <Stack dir="row" scale="sm" wrap align="center">{selectedBases.map((c) => <Chip key={c} color={opacity ? withAlpha(c, alpha) : c} onRemove={() => removeColor(c)} />)}</Stack>
            ) : (
              <span className="text-xs text-gray-500">{placeholder}</span>
            )}
            {opacity && firstColor ? (
              <NumberSlider aria-label="opacity" value={alpha} onChange={onAlpha} min={0} max={100} suffix="%"
                trackBackground={`linear-gradient(to right, transparent, ${previewHex}), repeating-conic-gradient(#888 0 25%, #ccc 0 50%) 0 0 / 8px 8px`} />
            ) : null}

            {/* STROKE — pattern + thickness, only when stroke is on */}
            {stroke ? (
              <Stack dir="col" scale="3xs">
                <span className="text-xs font-medium text-gray-500">pattern</span>
                <Stack dir="row" scale="xs">
                  {PATTERNS.map((p) => (
                    <button key={p} type="button" aria-pressed={(v as StrokeValue).pattern === p} onClick={() => setPattern(p)}
                      className={(v as StrokeValue).pattern === p ? "flex-1 cursor-pointer rounded border border-gray-700 bg-gray-100 px-2 py-1" : "flex-1 cursor-pointer rounded border border-gray-300 px-2 py-1"}>
                      <span style={{ display: "inline-block", width: "100%", borderTop: `2px ${p} #333` }} />
                    </button>
                  ))}
                </Stack>
              </Stack>
            ) : null}
            {stroke ? (
              <Stack dir="col" scale="3xs">
                <span className="text-xs font-medium text-gray-500">thickness</span>
                <NumberSlider aria-label="thickness" value={(v as StrokeValue).width} onChange={setWidth} min={widths[0]} max={widths[1]} suffix="px" />
              </Stack>
            ) : null}

            {/* SECTIONS */}
            {sections?.map((s) => (
              <Stack key={s.id} dir="col" scale="3xs">
                <span className="text-xs font-medium text-gray-500">{s.label}</span>
                <div className="grid grid-cols-7 gap-1.5">
                  {s.allowTransparent ? <TransparentSwatch selected={firstColor === null} onClick={() => setColor(null)} /> : null}
                  {s.colors.map((c) => <Swatch key={c.value} color={c} selected={isSelected(c.value)} onClick={() => setColor(c.value)} />)}
                  {s.addable ? (
                    <HexColorPicker value={previewHex} onCommit={(hex) => onPickerCommit(s, hex)} onOpenChange={(o) => { if (!o) resetPending(s); }}>
                      <button type="button" aria-label={`add a colour to ${s.label}`} title={`add a colour to ${s.label}`} className="flex size-7 items-center justify-center rounded-sm border border-dashed border-gray-300 cursor-pointer">
                        <Icon name="add" scale="xs" />
                      </button>
                    </HexColorPicker>
                  ) : null}
                </div>
              </Stack>
            ))}
            {footer}
          </Stack>
        </Content>
      </PopoverContent>
    </Popover>
  );
}
