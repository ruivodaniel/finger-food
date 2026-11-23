// The context bar: floats above the selection (Miro's), its blocks chosen by the rules (rules.ts), what each kind offers read from its registration. Filter by kind; the style blocks; group, ungroup, lock; the wrench: layer order,
// and with two or more nodes align and distribute. Pure: the selection in, events out; the canvas applies them to the document.
import { useState } from "react";
import { Button, InputSelect, Popover, PopoverContent, PopoverTrigger, Separator, Toggle } from "@libs/web-components";
import { ToolButton } from "./ToolButton";
import { Stack } from "@libs/web-layouts";
import { blocksFor, type Selection } from "./rules";
import type { Template } from "../template";
import { BorderBlock, DrawingBlock, FillBlock, IconBlock, LineBlock, TextBlock, lineOf, type LineValue } from "../style/blocks";
import { SHAPE_DEFAULT, TEXT_DEFAULT, type ShapeStyle, type TextStyle } from "../style/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@libs/web-components";
import { GLYPHS, type Glyph } from "./glyphs";
import { LayoutPicker } from "./LayoutPicker";
import { LAYOUT_PRESETS } from "../layouts";
import { switchDefaultsOf, type LayoutId, type Registrations, type Switches } from "../canvas-registration";

export type Arrange = "forward" | "backward" | "front" | "back" | "left" | "hcenter" | "right" | "top" | "vmiddle" | "bottom" | "distribute-h" | "distribute-v" | "grid" | "space";
export type ContextEvents = {
  onFilter: (key: string) => void; onLock: (locked: boolean) => void; onHighlight: (on: boolean) => void; onSpotlight: (on: boolean) => void; onGroup: () => void; onUngroup: () => void; onArrange: (a: Arrange) => void; onLayout: (presetId: string) => void; onSpace: (axis: "h" | "v", px: number) => void;
  onText: (p: Partial<TextStyle>) => void; onShape: (p: Partial<ShapeStyle>) => void; onLine: (p: Partial<LineValue>) => void; onReverse: () => void; onCopyStyle: () => void; onPasteStyle: () => void; onLayouts: (picks: Record<string, { layout: LayoutId; switches: Switches }>) => void;
  /** a kind's own block: the node's switches or data changed */
  onSwitches: (id: string, switches: Switches) => void; onData: (id: string, data: unknown) => void;
};
const Sep = () => <Separator orientation="vertical" />;
/** a picture button with its name on hover at once */
const GlyphButton = ({ g, label, onClick, testid }: { g: Glyph; label: string; onClick?: () => void; testid?: string }) => (
  <Tooltip><TooltipTrigger asChild>
    <span style={{ display: "inline-flex" }}><ToolButton label={label} onClick={onClick} testid={testid}>{GLYPHS[g]}</ToolButton></span>
  </TooltipTrigger><TooltipContent side="top" style={{ pointerEvents: "none" }}><span element="type--body-small">{label}</span></TooltipContent></Tooltip>
);
/** auto layout: pick one of the ERD page's layouts and the selection is arranged once (the dropdown keeps no value: a pick runs it) */
function AutoLayout({ onPick }: { onPick: (presetId: string) => void }) {
  return (
    <Stack dir="col" scale="3xs" concept="knowledge-canvas-menu-heading">
      <span element="type--body-small">auto layout</span>
      <InputSelect options={Object.values(LAYOUT_PRESETS).map((p) => ({ value: p.id, label: p.name }))} value={null} clearable={false} placeholder="vector force, layered…" onChange={((v: string | null) => { if (v) onPick(v); }) as never} />
    </Stack>
  );
}
/** the spacing: two sliders, the gap between the columns and between the rows; letting go of one sets it once on the selection, nothing is kept */
function GapSliders({ onSpace }: { onSpace: (axis: "h" | "v", px: number) => void }) {
  const [gap, setGap] = useState({ h: 24, v: 24 });
  return (
    <Stack dir="col" scale="3xs" concept="knowledge-canvas-menu-heading-narrow">
      {([["h", "horizontal gap"], ["v", "vertical gap"]] as const).map(([axis, l]) => (
        <label key={axis} style={{ display: "grid", gap: 2 }}>
          <span element="type--body-small" style={{ display: "flex", justifyContent: "space-between" }}>{l}<span emphasis="quiet">{gap[axis]}</span></span>
          <input type="range" min={0} max={500} value={gap[axis]} data-testid={`gap-${axis}`} style={{ width: "100%", accentColor: "var(--primary)" }} onChange={(e) => setGap({ ...gap, [axis]: Number(e.target.value) })} onPointerUp={() => onSpace(axis, gap[axis])} onKeyUp={() => onSpace(axis, gap[axis])} />
        </label>
      ))}
    </Stack>
  );
}
/** a trigger picture opening a grid of picture buttons */
const GlyphMenu = ({ g, label, items, cols, onPick, testid, extra }: { g: Glyph; label: string; items: [Arrange, string][]; cols: number; onPick: (a: Arrange) => void; testid: string; extra?: React.ReactNode }) => (
  <Popover>
    <PopoverTrigger asChild><span><GlyphButton g={g} label={label} testid={testid} /></span></PopoverTrigger>
    <PopoverContent align="center" className="nodrag nopan" data-testid={`${testid}-list`} style={{ width: "auto", padding: 6 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 32px)`, gap: 2 }}>{items.map(([a, l]) => <GlyphButton key={a} g={a as Glyph} label={l} onClick={() => onPick(a)} testid={`${testid}-${a}`} />)}</div>
      {extra}
    </PopoverContent>
  </Popover>
);

/** what the selection holds for click to highlight: true, false, or "mixed" */
export type FocusState = { highlight: boolean | "mixed"; spotlight: boolean | "mixed" };
/** a picture button that is on or off, and says "mixed" when the selection is both */
const GlyphToggle = ({ g, label, value, onChange, testid }: { g: Glyph; label: string; value: boolean | "mixed"; onChange: (on: boolean) => void; testid: string }) => (
  <span style={{ borderRadius: 6, background: value === true ? "var(--color-gray-100)" : "transparent" }}>
    <GlyphButton g={g} label={`${label}: ${value === "mixed" ? "mixed" : value ? "on" : "off"}`} testid={testid} onClick={() => onChange(value !== true)} />
  </span>
);

export function ContextBar({ sel, ev, state, registrations: all, template }: { sel: Selection; ev: ContextEvents; state: FocusState; registrations: Registrations; template?: Template }) {
  const b = blocksFor(sel, all, template);
  const filterName = (k: string) => (k === "edge" ? "connection line" : all[k]?.name ?? k);
  const counts = new Map<string, number>();
  for (const n of sel.nodes) counts.set(n.kind, (counts.get(n.kind) ?? 0) + 1);
  if (sel.edges.length) counts.set("edge", sel.edges.length);
  const total = sel.nodes.length + sel.edges.length;
  const allLocked = sel.nodes.length > 0 && sel.nodes.every((n) => n.locked);
  const first = sel.nodes[0];
  const firstReg = first ? all[first.kind] : undefined;
  const text = { ...TEXT_DEFAULT, ...first?.style?.text };
  const shape = { ...SHAPE_DEFAULT, ...first?.style?.shape };
  const groups: React.ReactNode[] = [];
  if (b.has("filter")) groups.push(
    <Popover key="filter">
      <PopoverTrigger asChild><span><Button emphasis="tertiary" scale="sm" endIcon="chevronDown" data-testid="filter-button">Filter · {total} objects</Button></span></PopoverTrigger>
      <PopoverContent align="start" className="nodrag nopan" data-testid="filter-list">
        <Stack dir="col" scale="3xs" concept="knowledge-canvas-menu">
          {[...counts].map(([k, c]) => (
            <Toggle key={k} emphasis="tertiary" scale="sm" pressed={false} onPressedChange={() => ev.onFilter(k)} className="w-full justify-between gap-4">
              <span element="type--body-small">{filterName(k)}</span><span element="type--body-small" emphasis="quiet">{c}</span>
            </Toggle>
          ))}
        </Stack>
      </PopoverContent>
    </Popover>,
  );
  if (b.has("text")) groups.push(<TextBlock key="text" text={text} onChange={ev.onText} />);
  if (b.has("fill") || b.has("border")) groups.push(<Stack key="shape" dir="row" scale="3xs" align="center">{b.has("fill") ? <FillBlock shape={shape} label={b.has("border") ? "fill" : "background"} onChange={ev.onShape} /> : null}{b.has("border") ? <BorderBlock shape={shape} onChange={ev.onShape} /> : null}</Stack>);
  // the icon block and the drawing block write the node's shape style: the stroke is the colour, its width the weight
  if (b.has("icon")) groups.push(<Stack key="icon" dir="row" scale="3xs" align="center"><IconBlock color={shape.stroke} weight={shape.strokeWidth} shape={shape} onChange={(p) => ev.onShape({ ...(p.color ? { stroke: p.color } : {}), ...(p.strokeWidth ? { strokeWidth: p.strokeWidth } : {}), ...(p.shape ?? {}) })} /></Stack>);
  if (b.has("drawing")) groups.push(<Stack key="drawing" dir="row" scale="3xs" align="center"><DrawingBlock color={shape.stroke} width={shape.strokeWidth} onChange={(p) => ev.onShape({ ...(p.color ? { stroke: p.color } : {}), ...(p.strokeWidth ? { strokeWidth: p.strokeWidth } : {}) })} /></Stack>);
  if (b.has("line")) groups.push(<Stack key="line" dir="row" scale="3xs" align="center"><LineBlock line={lineOf(sel.edges[0]?.style)} onChange={ev.onLine} onReverse={ev.onReverse} colourOnly={sel.edges.every((e) => e.style?.drawing === "erd")} /></Stack>);
  // one node drawn by a component with layouts: its layouts, as previews, and its switches
  if (b.has("layout") && firstReg) groups.unshift(<LayoutPicker key="layout" nodes={sel.nodes} registration={firstReg} onPick={ev.onLayouts} />);
  if (b.has("options") && first && firstReg?.optionsBar) { const Options = firstReg.optionsBar; groups.unshift(<Options key="options" data={first.data} switches={{ ...switchDefaultsOf(firstReg, first.layout ?? firstReg.layout.default), ...first.switches }} onSwitches={(sw) => ev.onSwitches(first.id, sw)} onData={(d) => ev.onData(first.id, d)} />); }
  if (b.has("highlight")) groups.push(<GlyphToggle key="highlight" g="highlight" label="click to highlight" value={state.highlight} onChange={ev.onHighlight} testid="highlight-toggle" />);
  if (b.has("highlight")) groups[groups.length - 1] = <Stack key="highlight" dir="row" scale="3xs" align="center">{groups[groups.length - 1]}<GlyphToggle g="spotlight" label="spotlight (everything else fades)" value={state.spotlight} onChange={ev.onSpotlight} testid="spotlight-toggle" /></Stack>;
  const actions: React.ReactNode[] = [];
  if (b.has("group")) actions.push(<Button key="group" buttonType="icon" startIcon="group" emphasis="tertiary" scale="sm" aria-label="group (⌘G)" title="group (⌘G)" data-testid="group-button" onClick={ev.onGroup} />);
  if (b.has("ungroup")) actions.push(<Button key="ungroup" buttonType="icon" startIcon="ungroup" emphasis="tertiary" scale="sm" aria-label="ungroup (⌘⇧G)" title="ungroup (⌘⇧G)" data-testid="ungroup-button" onClick={ev.onUngroup} />);
  // the styles: copy this one's, put the copied one on these (⌘⌥C, ⌘⌥V)
  if (b.has("styles")) actions.push(
    <Popover key="styles">
      <PopoverTrigger asChild><span><GlyphButton g="styles" label="styles (⌘⌥C, ⌘⌥V)" testid="styles-button" /></span></PopoverTrigger>
      <PopoverContent align="center" className="nodrag nopan" data-testid="styles-list" style={{ width: "auto", padding: 6 }}>
        <Stack dir="col" scale="3xs" concept="knowledge-canvas-menu">
          {([["copy style", "⌘⌥C", ev.onCopyStyle], ["paste style", "⌘⌥V", ev.onPasteStyle]] as [string, string, () => void][]).map(([l, k, f]) => (
            <Toggle key={l} emphasis="tertiary" scale="sm" pressed={false} onPressedChange={() => f()} data-testid={l.replace(" ", "-")} className="w-full justify-between gap-4">
              <span element="type--body-small">{l}</span><span element="type--body-small" emphasis="quiet">{k}</span>
            </Toggle>
          ))}
        </Stack>
      </PopoverContent>
    </Popover>,
  );
  if (b.has("lock")) actions.push(<Button key="lock" buttonType="icon" startIcon={allLocked ? "unlock" : "lock"} emphasis={allLocked ? "primary" : "tertiary"} scale="sm" aria-label={allLocked ? "unlock" : "lock"} title={allLocked ? "unlock" : "lock"} data-testid="lock-button" onClick={() => ev.onLock(!allLocked)} />);
  if (b.has("arrange")) actions.push(<GlyphMenu key="arrange" g="arrange" label="arrange" testid="arrange" cols={4} onPick={ev.onArrange} items={[["forward", "bring forward"], ["backward", "send backward"], ["front", "bring to front"], ["back", "send to back"]]} />);
  if (b.has("align")) actions.push(<GlyphMenu key="align" g="align" label="align" testid="align" cols={3} onPick={ev.onArrange} items={[["left", "align left"], ["hcenter", "align centre"], ["right", "align right"], ["top", "align top"], ["vmiddle", "align middle"], ["bottom", "align bottom"]]} />);
  if (b.has("distribute")) actions.push(<GlyphMenu key="distribute" g="distribute" label="distribute" testid="distribute" cols={3} onPick={ev.onArrange} extra={<><GapSliders onSpace={ev.onSpace} /><AutoLayout onPick={ev.onLayout} /></>} items={[["distribute-h", "distribute horizontally"], ["distribute-v", "distribute vertically"], ["grid", "arrange in a grid"]]} />);
  const parts = [...groups, ...(actions.length ? [<Stack key="actions" dir="row" scale="3xs" align="center">{actions}</Stack>] : [])];
  return (
    <TooltipProvider delayDuration={0}><Stack element="overlay--popover" dir="row" scale="3xs" align="center" className="nodrag nopan" data-testid="context-bar">
      {!b.has("filter") ? <span element="type--body-small" style={{ padding: "0 8px" }}>{total} {counts.size === 1 ? filterName([...counts.keys()][0]) + (total === 1 ? "" : "s") : "objects"}</span> : null}
      {parts.map((p, i) => <Stack key={i} dir="row" scale="3xs" align="center">{i > 0 ? <Sep /> : null}{p}</Stack>)}
    </Stack></TooltipProvider>
  );
}
