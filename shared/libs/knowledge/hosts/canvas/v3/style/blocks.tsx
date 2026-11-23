// The style blocks of the context bar, each pure: the current value in, a partial change out. Text (size, bold, alignment, colour), fill (a shape's fill, a text box's background),
// border (shapes only), line (connectors only). The context bar decides which show (rules.ts).
import { Button, Checkbox, InputSelect, Popover, PopoverContent, PopoverTrigger, PickerMenu, type StrokeValue } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { ToolButton } from "../tools/ToolButton";
import { useSections, type PaletteKey } from "./palette";
import { FONT_SIZES, type ShapeStyle, type TextStyle } from "./types";
import { END_KINDS, type EdgeStyle, type EndKind } from "../template";

export const Pop = ({ trigger, children, testid }: { trigger: React.ReactNode; children: React.ReactNode; testid: string }) => (
  <Popover>
    <PopoverTrigger asChild>{trigger}</PopoverTrigger>
    <PopoverContent align="center" className="nodrag nopan nowheel" data-testid={testid}><Stack dir="col" scale="md">{children}</Stack></PopoverContent>
  </Popover>
);
export const Label = ({ children }: { children: string }) => <span element="type--body-extra-small" emphasis="quiet">{children}</span>;
const opt = (xs: (string | number)[], unit = "") => xs.map((x) => ({ value: String(x), label: `${x}${unit}` }));
const Row = ({ label, children }: { label: string; children: React.ReactNode }) => <Stack dir="row" scale="sm" align="center" justify="between"><Label>{label}</Label><div style={{ width: 110 }}>{children}</div></Stack>;
/** three choices drawn as buttons with a picture each */
function Choice<T extends string>({ value, options, onChange }: { value: T; options: { id: T; picture: React.ReactNode; label: string }[]; onChange: (v: T) => void }) {
  return (
    <Stack dir="row" scale="2xs">
      {options.map((o) => (
        <ToolButton key={o.id} label={o.label} on={value === o.id} onClick={() => onChange(o.id)} style={{ flex: 1, minWidth: 44 }}>{o.picture}</ToolButton>
      ))}
    </Stack>
  );
}

// ── the colour pickers: one PickerMenu per element, its colours from the canvas palette ──
const alphaHex = (opacity: number) => Math.round((opacity / 100) * 255).toString(16).padStart(2, "0");
/** a fill and its opacity as the picker's one value: "#rrggbbaa", or null for no colour */
const toPicker = (fill: string, opacity = 100): string | null => (fill === "transparent" ? null : opacity >= 100 ? fill : /^#[0-9a-f]{6}$/i.test(fill) ? fill + alphaHex(opacity) : `color-mix(in srgb, ${fill} ${opacity}%, transparent)`);
const fromPicker = (v: string | null): { fill: string; fillOpacity: number } => {
  if (v === null) return { fill: "transparent", fillOpacity: 100 };
  const mix = v.match(/^color-mix\(in srgb,\s*(.+?)\s+(\d+(?:\.\d+)?)%,\s*transparent\)$/i);
  if (mix) return { fill: mix[1], fillOpacity: Math.round(Number(mix[2])) };
  const m = v.match(/^(#[0-9a-f]{6})([0-9a-f]{2})$/i);
  return m ? { fill: m[1], fillOpacity: Math.round((parseInt(m[2], 16) / 255) * 100) } : { fill: v, fillOpacity: 100 };
};
const CANVAS_CLASSES = "nodrag nopan nowheel";
/** one colour: its trigger icon, its palette key, whether "No color" and opacity are offered */
function Colour({ k, icon, solid = false, label, value, onChange, transparent = false, opacity = false, footer }: { k: PaletteKey; icon: string; solid?: boolean; label: string; value: string | null; onChange: (v: string | null) => void; transparent?: boolean; opacity?: boolean; footer?: React.ReactNode }) {
  const sections = useSections(k, transparent);
  return <PickerMenu trigger={{ icon, solid }} label={label} sections={sections} opacity={opacity} value={value} onChange={(v) => onChange(v as string | null)} contentClassName={CANVAS_CLASSES} footer={footer} />;
}
const stroke = (st: "solid" | "dashed" | "dotted") => <span style={{ width: 28, borderTop: `2px ${st} var(--foreground)` }} />;

export function TextBlock({ text, onChange }: { text: Required<TextStyle>; onChange: (p: Partial<TextStyle>) => void }) {
  return (
    <>
      <div style={{ width: 84 }}><InputSelect options={opt(FONT_SIZES)} value={String(text.fontSize)} clearable={false} onChange={(v: string | null) => onChange({ fontSize: Number(v ?? text.fontSize) })} /></div>
      <Button buttonType="icon" startIcon="bold" scale="sm" emphasis={text.bold ? "primary" : "tertiary"} aria-label="bold" onClick={() => onChange({ bold: !text.bold })} />
      {(["left", "center", "right"] as const).map((a) => <Button key={a} buttonType="icon" startIcon={a === "left" ? "alignLeft" : a === "center" ? "alignCenter" : "alignRight"} scale="sm" emphasis={text.align === a ? "primary" : "tertiary"} aria-label={`align ${a}`} onClick={() => onChange({ align: a })} />)}
      <Colour k="text" icon="text" label="text colour" value={text.color} onChange={(c) => c && onChange({ color: c })} />
    </>
  );
}
export function FillBlock({ shape, label, onChange }: { shape: Required<ShapeStyle>; /** "fill" for a shape, "background" for a text box */ label: string; onChange: (p: Partial<ShapeStyle>) => void }) {
  return <Colour k="fill" icon="circle" solid label={label} transparent opacity value={toPicker(shape.fill, shape.fillOpacity)} onChange={(v) => onChange(fromPicker(v))} />;
}
export function BorderBlock({ shape, onChange }: { shape: Required<ShapeStyle>; onChange: (p: Partial<ShapeStyle>) => void }) {
  const sections = useSections("border", true);
  const value: StrokeValue = { color: shape.stroke === "transparent" ? null : shape.stroke, pattern: shape.strokeStyle, width: shape.strokeWidth };
  const set = (v: StrokeValue) => onChange({ stroke: v.color ?? "transparent", strokeStyle: v.pattern, strokeWidth: v.width });
  return (
    <PickerMenu trigger={{ icon: "circle" }} label="border" stroke widths={[0, 16]} sections={sections} value={value} onChange={(v) => set(v as StrokeValue)} contentClassName={CANVAS_CLASSES}
      footer={<Row label="rounded corners"><InputSelect options={opt([0, 4, 8, 12, 16, 24], "px")} value={String(shape.radius)} clearable={false} onChange={(v: string | null) => onChange({ radius: Number(v ?? 0) })} /></Row>} />
  );
}
export const LINE_DEFAULT = { path: "straight" as const, pattern: "solid" as const, width: 1.4, color: "var(--color-gray-500)" };
export type LineValue = { path: "straight" | "bezier" | "step"; pattern: "solid" | "dashed" | "dotted"; width: number; color: string; start: EndKind; end: EndKind };
export const lineOf = (s: EdgeStyle = {}): LineValue => ({
  path: s.path ?? LINE_DEFAULT.path, pattern: s.dotted ? "dotted" : s.dashed ? "dashed" : "solid", width: s.width ?? LINE_DEFAULT.width, color: s.color ?? LINE_DEFAULT.color,
  start: s.start ?? "none", end: s.end ?? "arrow",
});
export const styleOfLine = (v: Partial<LineValue>): Partial<EdgeStyle> => ({
  ...(v.path ? { path: v.path } : {}), ...(v.pattern ? { dashed: v.pattern === "dashed", dotted: v.pattern === "dotted" } : {}), ...(v.width !== undefined ? { width: v.width } : {}), ...(v.color ? { color: v.color } : {}),
  ...(v.start ? { start: v.start } : {}), ...(v.end ? { end: v.end } : {}),
});
/** an end drawn small: a line with its end, pointing right (the start picture is the same turned) */
export function EndPicture({ kind, flip }: { kind: EndKind; flip?: boolean }) {
  const solid = { fill: "currentColor", stroke: "currentColor" }, open = { fill: "var(--background)", stroke: "currentColor" };
  const end = kind === "arrow" ? <path d="M20 5 L27 9 L20 13 Z" {...solid} /> : kind === "arrow-open" ? <path d="M20 5 L27 9 L20 13" fill="none" stroke="currentColor" />
    : kind === "triangle" ? <path d="M20 5 L27 9 L20 13 Z" {...open} /> : kind === "circle" ? <circle cx="24" cy="9" r="3.2" {...solid} /> : kind === "circle-open" ? <circle cx="24" cy="9" r="3.2" {...open} />
    : kind === "diamond" ? <path d="M19 9 L23 5.5 L27 9 L23 12.5 Z" {...solid} /> : kind === "diamond-open" ? <path d="M19 9 L23 5.5 L27 9 L23 12.5 Z" {...open} /> : kind === "bar" ? <path d="M26 4 L26 14" stroke="currentColor" /> : null;
  return <svg width="30" height="18" viewBox="0 0 30 18" strokeWidth="1.5" style={{ transform: flip ? "scaleX(-1)" : undefined }} aria-hidden><path d={`M2 9 L${kind === "none" ? 28 : 21} 9`} stroke="currentColor" fill="none" />{end}</svg>;
}
const ENDS: EndKind[] = END_KINDS;
const END_NAME: Record<EndKind, string> = { none: "none", arrow: "arrow", "arrow-open": "open arrow", triangle: "triangle", circle: "dot", "circle-open": "circle", diamond: "diamond", "diamond-open": "open diamond", bar: "bar" };
function EndMenu({ which, value, onChange }: { which: "start" | "end"; value: EndKind; onChange: (k: EndKind) => void }) {
  return (
    <Pop testid={`line-${which}`} trigger={<ToolButton label={`line ${which}`}><EndPicture kind={value} flip={which === "start"} /></ToolButton>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 44px)", gap: 2 }}>
        {ENDS.map((k) => <ToolButton key={k} label={END_NAME[k]} on={value === k} testid={`line-${which}-${k}`} onClick={() => onChange(k)}><EndPicture kind={k} flip={which === "start"} /></ToolButton>)}
      </div>
    </Pop>
  );
}
/** the line block, as Miro orders it: line start, reverse, line end, the type (thickness, path, pattern), the colour */
export function LineBlock({ line, onChange, onReverse, colourOnly }: { line: LineValue; onChange: (p: Partial<LineValue>) => void; onReverse: () => void; /** a line whose style is the template's (the ERD's): only its colour may change */ colourOnly?: boolean }) {
  const curve = (d: string) => <svg width="28" height="16" viewBox="0 0 28 16"><path d={d} fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
  const colour = <Colour k="line" icon="line" label="line colour" value={line.color} onChange={(color) => color && onChange({ color })} />;
  if (colourOnly) return colour;
  return (
    <>
      <EndMenu which="start" value={line.start} onChange={(start) => onChange({ start })} />
      <ToolButton label="reverse the direction" testid="line-reverse" onClick={onReverse}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h11l-3-3M15 12H4l3 3" /></svg>
      </ToolButton>
      <EndMenu which="end" value={line.end} onChange={(end) => onChange({ end })} />
      <Pop testid="line-type" trigger={<ToolButton label="line type">{curve(line.path === "bezier" ? "M2 14 C14 14 14 2 26 2" : line.path === "step" ? "M2 14 L14 14 L14 2 L26 2" : "M2 14 L26 2")}</ToolButton>}>
        <Row label="thickness"><InputSelect options={opt([1, 1.4, 2, 3, 4, 6, 8], "px")} value={String(line.width)} clearable={false} onChange={(v: string | null) => onChange({ width: Number(v ?? 1.4) })} /></Row>
        <Choice value={line.path} onChange={(path) => onChange({ path })} options={[{ id: "straight", label: "straight", picture: curve("M2 14 L26 2") }, { id: "step", label: "orthogonal", picture: curve("M2 14 L14 14 L14 2 L26 2") }, { id: "bezier", label: "curved", picture: curve("M2 14 C14 14 14 2 26 2") }]} />
        <Choice value={line.pattern} onChange={(pattern) => onChange({ pattern })} options={(["solid", "dashed", "dotted"] as const).map((st) => ({ id: st, label: st, picture: stroke(st) }))} />
      </Pop>
      {colour}
    </>
  );
}

/** the icon block: its colour, its line weight, the square behind it (a fill and its corners) */
export function IconBlock({ color, weight, shape, onChange }: { color: string; weight: number; shape: Required<ShapeStyle>; onChange: (p: { color?: string; strokeWidth?: number; shape?: Partial<ShapeStyle> }) => void }) {
  return (
    <>
      <Colour k="icon" icon="palette" label="icon colour" value={color} onChange={(c) => c && onChange({ color: c })} />
      <div style={{ width: 92 }}><InputSelect options={[1, 1.5, 2, 2.5, 3].map((x) => ({ value: String(x), label: `weight ${x}` }))} value={String(weight)} clearable={false} onChange={(v: string | null) => onChange({ strokeWidth: Number(v ?? 2) })} /></div>
      <Colour k="fill" icon="circle" solid label="square behind" transparent opacity value={toPicker(shape.fill, shape.fillOpacity)} onChange={(v) => { const f = fromPicker(v); onChange({ shape: { fill: f.fill, fillOpacity: f.fillOpacity } }); }}
        footer={<Row label="rounded corners"><InputSelect options={opt([0, 4, 8, 12, 16, 24], "px")} value={String(shape.radius)} clearable={false} onChange={(v: string | null) => onChange({ shape: { radius: Number(v ?? 0) } })} /></Row>} />
    </>
  );
}

/** the drawing block: the stroke's colour and thickness */
export function DrawingBlock({ color, width, onChange }: { color: string; width: number; onChange: (p: { color?: string; strokeWidth?: number }) => void }) {
  return (
    <>
      <Colour k="drawing" icon="palette" label="stroke colour" value={color} onChange={(c) => c && onChange({ color: c })} />
      <div style={{ width: 96 }}><InputSelect options={[1, 2, 2.5, 4, 6, 8, 12].map((x) => ({ value: String(x), label: `${x}px` }))} value={String(width)} clearable={false} onChange={(v: string | null) => onChange({ strokeWidth: Number(v ?? 2.5) })} /></div>
    </>
  );
}
