// The style blocks of the context bar, each pure: the current value in, a partial change out. Text (size, bold, alignment, colour), fill (a shape's fill, a text box's background),
// border (shapes only), line (connectors only). The context bar decides which show (rules.ts).
import { Button } from "../../../../../ui/web/primitives/components/button/v1";
import { Checkbox } from "../../../../../ui/web/primitives/components/checkbox/v1";
import { InputSelect } from "../../../../../ui/web/primitives/components/input-select/v1";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../ui/web/primitives/components/popover/v1";
import { Stack } from "../../../../../ui/web/primitives/components/stack/v1";
import { Swatches, SwatchTrigger } from "./Swatches";
import { FONT_SIZES, type ShapeStyle, type TextStyle } from "./types";
import { END_KINDS, type EdgeStyle, type EndKind } from "../template";

export const Pop = ({ trigger, children, testid }: { trigger: React.ReactNode; children: React.ReactNode; testid: string }) => (
  <Popover>
    <PopoverTrigger asChild>{trigger}</PopoverTrigger>
    <PopoverContent align="center" className="nodrag nopan nowheel" data-testid={testid}><Stack dir="col" gap={12}>{children}</Stack></PopoverContent>
  </Popover>
);
export const Label = ({ children }: { children: string }) => <span element="type--body-extra-small" emphasis="quiet">{children}</span>;
const opt = (xs: (string | number)[], unit = "") => xs.map((x) => ({ value: String(x), label: `${x}${unit}` }));
const Row = ({ label, children }: { label: string; children: React.ReactNode }) => <Stack dir="row" gap={8} align="center" justify="between"><Label>{label}</Label><div style={{ width: 110 }}>{children}</div></Stack>;
/** three choices drawn as buttons with a picture each */
function Choice<T extends string>({ value, options, onChange }: { value: T; options: { id: T; picture: React.ReactNode; label: string }[]; onChange: (v: T) => void }) {
  return (
    <Stack dir="row" gap={4}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-label={o.label} title={o.label} onClick={() => onChange(o.id)} style={{ flex: 1, minWidth: 44, height: 32, border: "none", borderRadius: 6, cursor: "pointer", background: value === o.id ? "var(--bg-3, #eee)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{o.picture}</button>
      ))}
    </Stack>
  );
}
const stroke = (st: "solid" | "dashed" | "dotted") => <span style={{ width: 28, borderTop: `2px ${st} #333` }} />;

export function TextBlock({ text, onChange }: { text: Required<TextStyle>; onChange: (p: Partial<TextStyle>) => void }) {
  return (
    <>
      <div style={{ width: 84 }}><InputSelect options={opt(FONT_SIZES)} value={String(text.fontSize)} clearable={false} onChange={(v: string | null) => onChange({ fontSize: Number(v ?? text.fontSize) })} /></div>
      <Button buttonType="icon" startIcon="bold" scale="sm" emphasis={text.bold ? "primary" : "tertiary"} aria-label="bold" onClick={() => onChange({ bold: !text.bold })} />
      {(["left", "center", "right"] as const).map((a) => <Button key={a} buttonType="icon" startIcon={a === "left" ? "alignLeft" : a === "center" ? "alignCenter" : "alignRight"} scale="sm" emphasis={text.align === a ? "primary" : "tertiary"} aria-label={`align ${a}`} onClick={() => onChange({ align: a })} />)}
      <Pop testid="text-colour" trigger={<SwatchTrigger kind="text" color={text.color} label="text colour" />}><Label>text colour</Label><Swatches none={false} value={text.color} onChange={(c) => onChange({ color: c })} /></Pop>
    </>
  );
}
export function FillBlock({ shape, label, onChange }: { shape: Required<ShapeStyle>; /** "fill" for a shape, "background" for a text box */ label: string; onChange: (p: Partial<ShapeStyle>) => void }) {
  return (
    <Pop testid="fill" trigger={<SwatchTrigger kind="fill" color={shape.fill} label={label} />}>
      <Label>{label}</Label>
      <Row label="opacity"><InputSelect options={opt([100, 80, 60, 40, 20], "%")} value={String(shape.fillOpacity)} clearable={false} onChange={(v: string | null) => onChange({ fillOpacity: Number(v ?? 100) })} /></Row>
      <Swatches value={shape.fill} onChange={(c) => onChange({ fill: c })} />
    </Pop>
  );
}
export function BorderBlock({ shape, onChange }: { shape: Required<ShapeStyle>; onChange: (p: Partial<ShapeStyle>) => void }) {
  return (
    <Pop testid="border" trigger={<SwatchTrigger kind="ring" color={shape.stroke} label="border" />}>
      <Choice value={shape.strokeStyle} onChange={(v) => onChange({ strokeStyle: v })} options={(["solid", "dashed", "dotted"] as const).map((st) => ({ id: st, label: st, picture: stroke(st) }))} />
      <Row label="thickness"><InputSelect options={opt([0, 1, 2, 3, 4, 6, 8], "px")} value={String(shape.strokeWidth)} clearable={false} onChange={(v: string | null) => onChange({ strokeWidth: Number(v ?? 1) })} /></Row>
      <Row label="rounded corners"><InputSelect options={opt([0, 4, 8, 12, 16, 24], "px")} value={String(shape.radius)} clearable={false} onChange={(v: string | null) => onChange({ radius: Number(v ?? 0) })} /></Row>
      <Swatches value={shape.stroke} onChange={(c) => onChange({ stroke: c })} />
    </Pop>
  );
}
export const LINE_DEFAULT = { path: "straight" as const, pattern: "solid" as const, width: 1.4, color: "#8a8a8a" };
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
  const solid = { fill: "currentColor", stroke: "currentColor" }, open = { fill: "#fff", stroke: "currentColor" };
  const end = kind === "arrow" ? <path d="M20 5 L27 9 L20 13 Z" {...solid} /> : kind === "arrow-open" ? <path d="M20 5 L27 9 L20 13" fill="none" stroke="currentColor" />
    : kind === "triangle" ? <path d="M20 5 L27 9 L20 13 Z" {...open} /> : kind === "circle" ? <circle cx="24" cy="9" r="3.2" {...solid} /> : kind === "circle-open" ? <circle cx="24" cy="9" r="3.2" {...open} />
    : kind === "diamond" ? <path d="M19 9 L23 5.5 L27 9 L23 12.5 Z" {...solid} /> : kind === "diamond-open" ? <path d="M19 9 L23 5.5 L27 9 L23 12.5 Z" {...open} /> : kind === "bar" ? <path d="M26 4 L26 14" stroke="currentColor" /> : null;
  return <svg width="30" height="18" viewBox="0 0 30 18" strokeWidth="1.5" style={{ transform: flip ? "scaleX(-1)" : undefined }} aria-hidden><path d={`M2 9 L${kind === "none" ? 28 : 21} 9`} stroke="currentColor" fill="none" />{end}</svg>;
}
const ENDS: EndKind[] = END_KINDS;
const END_NAME: Record<EndKind, string> = { none: "none", arrow: "arrow", "arrow-open": "open arrow", triangle: "triangle", circle: "dot", "circle-open": "circle", diamond: "diamond", "diamond-open": "open diamond", bar: "bar" };
function EndMenu({ which, value, onChange }: { which: "start" | "end"; value: EndKind; onChange: (k: EndKind) => void }) {
  return (
    <Pop testid={`line-${which}`} trigger={<button type="button" aria-label={`line ${which}`} title={`line ${which}`} style={{ height: 32, padding: "0 4px", border: "none", background: "transparent", borderRadius: 6, cursor: "pointer", color: "var(--foreground, #1a1a1a)" }}><EndPicture kind={value} flip={which === "start"} /></button>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 44px)", gap: 2 }}>
        {ENDS.map((k) => <button key={k} type="button" aria-label={END_NAME[k]} title={END_NAME[k]} onClick={() => onChange(k)} data-testid={`line-${which}-${k}`} style={{ height: 32, border: "none", borderRadius: 6, cursor: "pointer", background: value === k ? "var(--bg-3, #eee)" : "transparent", color: "var(--foreground, #1a1a1a)" }}><EndPicture kind={k} flip={which === "start"} /></button>)}
      </div>
    </Pop>
  );
}
/** the line block, as Miro orders it: line start, reverse, line end, the type (thickness, path, pattern), the colour */
export function LineBlock({ line, onChange, onReverse, colourOnly }: { line: LineValue; onChange: (p: Partial<LineValue>) => void; onReverse: () => void; /** a line whose style is the template's (the ERD's): only its colour may change */ colourOnly?: boolean }) {
  const curve = (d: string) => <svg width="28" height="16" viewBox="0 0 28 16"><path d={d} fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
  const colour = <Pop testid="line-colour" trigger={<SwatchTrigger kind="fill" color={line.color} label="line colour" />}><Label>line colour</Label><Swatches none={false} value={line.color} onChange={(color) => onChange({ color })} /></Pop>;
  if (colourOnly) return colour;
  return (
    <>
      <EndMenu which="start" value={line.start} onChange={(start) => onChange({ start })} />
      <button type="button" aria-label="reverse" title="reverse the direction" data-testid="line-reverse" onClick={onReverse} style={{ width: 32, height: 32, border: "none", background: "transparent", borderRadius: 6, cursor: "pointer", color: "var(--foreground, #1a1a1a)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h11l-3-3M15 12H4l3 3" /></svg>
      </button>
      <EndMenu which="end" value={line.end} onChange={(end) => onChange({ end })} />
      <Pop testid="line-type" trigger={<button type="button" aria-label="line type" title="line type" style={{ height: 32, padding: "0 6px", border: "none", background: "transparent", borderRadius: 6, cursor: "pointer", color: "var(--foreground, #1a1a1a)", display: "inline-flex", alignItems: "center" }}>{curve(line.path === "bezier" ? "M2 14 C14 14 14 2 26 2" : line.path === "step" ? "M2 14 L14 14 L14 2 L26 2" : "M2 14 L26 2")}</button>}>
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
      <Pop testid="icon-colour" trigger={<SwatchTrigger kind="text" color={color} label="icon colour" />}><Label>icon colour</Label><Swatches none={false} value={color} onChange={(c) => onChange({ color: c })} /></Pop>
      <div style={{ width: 92 }}><InputSelect options={[1, 1.5, 2, 2.5, 3].map((x) => ({ value: String(x), label: `weight ${x}` }))} value={String(weight)} clearable={false} onChange={(v: string | null) => onChange({ strokeWidth: Number(v ?? 2) })} /></div>
      <Pop testid="icon-square" trigger={<SwatchTrigger kind="fill" color={shape.fill} label="square behind" />}>
        <Label>the square behind</Label>
        <Row label="rounded corners"><InputSelect options={opt([0, 4, 8, 12, 16, 24], "px")} value={String(shape.radius)} clearable={false} onChange={(v: string | null) => onChange({ shape: { radius: Number(v ?? 0) } })} /></Row>
        <Swatches value={shape.fill} onChange={(c) => onChange({ shape: { fill: c } })} />
      </Pop>
    </>
  );
}

/** the drawing block: the stroke's colour and thickness */
export function DrawingBlock({ color, width, onChange }: { color: string; width: number; onChange: (p: { color?: string; strokeWidth?: number }) => void }) {
  return (
    <>
      <Pop testid="drawing-colour" trigger={<SwatchTrigger kind="fill" color={color} label="stroke colour" />}><Label>stroke colour</Label><Swatches none={false} value={color} onChange={(c) => onChange({ color: c })} /></Pop>
      <div style={{ width: 96 }}><InputSelect options={[1, 2, 2.5, 4, 6, 8, 12].map((x) => ({ value: String(x), label: `${x}px` }))} value={String(width)} clearable={false} onChange={(v: string | null) => onChange({ strokeWidth: Number(v ?? 2.5) })} /></div>
    </>
  );
}
