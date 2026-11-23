// The toolbox: the canvas's own tools (select, pan, connector, line) and every tool the registrations offer that the template allows, one mode at a time, a key each; left, vertical, the
// name on hover at once. V is the cursor; V again or Escape lets it go (the hand). The shapes button opens Miro's flyout (the registrations' tools grouped "shapes"); the complex shapes button
// the ones grouped "complex". A tool that asks something first (an icon, a table's size) shows its ask in the flyout; its pick travels with the tool.
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Icon, Popover, Toggle, PopoverContent, PopoverTrigger, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, type IconName } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { CANVAS_TOOLS, type CanvasRegistration, type Registrations, type Tool, type ToolEntry } from "../canvas-registration";
import { allowsTool, type Template } from "../template";
import { ToolButton } from "./ToolButton";

const svg = (children: React.ReactNode) => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>;
const PICTURES: Record<string, React.ReactNode> = {
  line: svg(<path d="M3 15 L15 3" />),
  rectangle: svg(<rect x="3" y="4" width="12" height="10" rx="1" />),
  oval: svg(<ellipse cx="9" cy="9" rx="6.5" ry="5.5" />),
  diamond: svg(<path d="M9 2.5 L15.5 9 L9 15.5 L2.5 9 Z" />),
  triangle: svg(<path d="M9 3 L15.5 15 L2.5 15 Z" />),
  icon: svg(<><circle cx="6" cy="6" r="2.6" /><rect x="10" y="10" width="5" height="5" rx="1" /><path d="M3 15 L5.5 10.5 L8 15 Z" /></>),
  complex: svg(<><rect x="2.5" y="4" width="13" height="10" rx="1" /><path d="M6.5 4 V14" /><path d="M8.5 7.5 H13 M8.5 10.5 H12" /></>),
};
/** a tool as the toolbox lists it: the canvas's own, or a registration's entry */
export type ToolItem = { id: Tool; key?: string; name: string; what?: string; icon?: string; picture?: React.ReactNode; group?: "shapes" | "complex" | "entities"; registration?: CanvasRegistration; entry?: ToolEntry };
const OWN: ToolItem[] = [
  { id: "select", key: "v", icon: "cursor", name: "select (V)", what: "click selects; drag draws a box selection; Shift adds. V again lets go: the hand pans" },
  { id: "pan", key: "h", icon: "hand", name: "hand (H)", what: "drag moves the canvas; also what you get with no tool" },
  { id: "connector", key: "l", icon: "arrow", name: "connector (L)", what: "drag from a node to another, or from anywhere on the canvas: an arrow, its ends nodes or free points" },
  { id: "line", key: "", picture: PICTURES.line, name: "line", what: "a connector with no ends", group: "shapes" },
];
/** every tool the template allows, in the toolbox's order: the canvas's own first, then the registrations' */
export function toolsOf(all: Registrations, t: Template): ToolItem[] {
  const out: ToolItem[] = OWN.filter((x) => allowsTool(t, x.id));
  for (const r of Object.values(all)) for (const e of r.tools ?? []) if (allowsTool(t, e.id)) out.push({ id: e.id, key: e.key, name: e.name, what: e.what, icon: e.icon, picture: e.picture ? <PictureOf P={e.picture} /> : PICTURES[e.id], group: e.group, registration: r, entry: e });
  return out;
}
const PictureOf = ({ P }: { P: ComponentType }) => <P />;
/** what the toolbox hands the canvas when a tool is armed: the tool, and what its ask picked */
export type Armed = { tool: Tool; asked?: unknown } | null;

export function Toolbox({ items, tool, onTool }: { items: ToolItem[]; tool: Tool | null; onTool: (a: Armed) => void }) {
  const [lastShape, setLastShape] = useState<Tool>("rectangle");
  const [flyout, setFlyout] = useState(false);
  const [complexOpen, setComplexOpen] = useState(false);
  const [entitiesOpen, setEntitiesOpen] = useState(false);
  // a tool asking something before it places: the ask shown in its flyout
  const [asking, setAsking] = useState<ToolItem | null>(null);
  const main = useMemo(() => items.filter((x) => !x.group), [items]);
  const shapes = useMemo(() => items.filter((x) => x.group === "shapes"), [items]);
  const complex = useMemo(() => items.filter((x) => x.group === "complex"), [items]);
  const entities = useMemo(() => items.filter((x) => x.group === "entities"), [items]);
  const arm = (x: ToolItem) => { if (x.group === "shapes") setLastShape(x.id); if (x.entry?.ask) { setAsking(x); if (x.group === "complex") setComplexOpen(true); else if (x.group === "entities") setEntitiesOpen(true); else setFlyout(true); return; } setFlyout(false); setComplexOpen(false); setEntitiesOpen(false); onTool(tool === x.id ? null : { tool: x.id }); };
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable || e.metaKey || e.ctrlKey) return;
      if (e.key === "Escape") { onTool(null); setFlyout(false); setComplexOpen(false); setEntitiesOpen(false); return; }
      const x = items.find((i) => i.key && i.key === e.key.toLowerCase());
      if (x) arm(x);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  });
  const item = (x: ToolItem) => (
    <Tooltip key={x.id}><TooltipTrigger asChild>
      <ToolButton label={x.name} on={tool === x.id || (x.id === "pan" && tool === null)} onClick={() => arm(x)}>{x.icon ? <Icon name={x.icon as IconName} scale="sm" /> : x.picture}</ToolButton>
    </TooltipTrigger><TooltipContent side="right" style={{ pointerEvents: "none" }}><Stack dir="col" scale="3xs" concept="knowledge-canvas-tool-tip"><span element="type--body-small" style={{ fontWeight: 600 }}>{x.name}</span>{x.what ? <span element="type--body-extra-small" emphasis="quiet">{x.what}</span> : null}</Stack></TooltipContent></Tooltip>
  );
  const ask = asking?.entry?.ask ? (() => { const Ask = asking.entry!.ask!; return <Ask onPick={(data) => { setAsking(null); setFlyout(false); setComplexOpen(false); setEntitiesOpen(false); onTool({ tool: asking.id, asked: data }); }} />; })() : null;
  const list = (xs: ToolItem[], title: string) => (
    <Stack dir="col" scale="3xs" concept="knowledge-canvas-menu">
      <span element="type--body-extra-small" emphasis="quiet" style={{ padding: "4px 10px" }}>{title}</span>
      {xs.map((x) => (
        <Toggle key={x.id} emphasis="tertiary" scale="sm" pressed={tool === x.id} onPressedChange={() => arm(x)} data-testid={`tool-${x.id}`} className="w-full justify-start gap-3">
          {x.picture ?? (x.icon ? <Icon name={x.icon as IconName} scale="sm" /> : PICTURES.complex)}<span element="type--body-small" style={{ flex: 1, textAlign: "left" }}>{x.name}</span>{x.key ? <span element="type--body-small" emphasis="quiet">{x.key.toUpperCase()}</span> : null}
        </Toggle>
      ))}
    </Stack>
  );
  const shapeOn = !!tool && shapes.some((x) => x.id === tool);
  return (
    <TooltipProvider delayDuration={0}>
      <Stack element="overlay--popover" dir="col" scale="3xs" data-testid="canvas-toolbox">
        {main.slice(0, 3).map(item)}
        {shapes.length ? (
          <Popover open={flyout} onOpenChange={(o) => { setFlyout(o); if (!o) setAsking(null); }}>
            <PopoverTrigger asChild><ToolButton label="shapes" testid="shapes-button" on={shapeOn}>{PICTURES[shapeOn ? tool! : lastShape] ?? PICTURES.rectangle}</ToolButton></PopoverTrigger>
            <PopoverContent side="right" align="start" className="nodrag nopan" data-testid="shapes-flyout" style={{ width: "auto", padding: 6 }}>{asking && asking.group === "shapes" ? ask : list(shapes, "Shapes")}</PopoverContent>
          </Popover>
        ) : null}
        {complex.length ? (
          <Popover open={complexOpen} onOpenChange={(o) => { setComplexOpen(o); if (!o) setAsking(null); }}>
            <PopoverTrigger asChild><ToolButton label="complex shapes" testid="complex-button" on={complex.some((x) => x.id === tool)}>{PICTURES.complex}</ToolButton></PopoverTrigger>
            <PopoverContent side="right" align="start" className="nodrag nopan" data-testid="complex-flyout" style={{ width: "auto", padding: 6 }}>{asking && asking.group === "complex" ? ask : list(complex, "Complex shapes")}</PopoverContent>
          </Popover>
        ) : null}
        {entities.length ? (
          <Popover open={entitiesOpen} onOpenChange={(o) => { setEntitiesOpen(o); if (!o) setAsking(null); }}>
            <PopoverTrigger asChild><ToolButton label="slice entities" testid="entities-button" on={entities.some((x) => x.id === tool)}><Icon name="database" scale="sm" /></ToolButton></PopoverTrigger>
            <PopoverContent side="right" align="start" className="nodrag nopan" data-testid="entities-flyout" style={{ width: "auto", padding: 6 }}>{asking && asking.group === "entities" ? ask : list(entities, "Slice entities")}</PopoverContent>
          </Popover>
        ) : null}
        {main.slice(3).map(item)}
      </Stack>
    </TooltipProvider>
  );
}
export const isCanvasTool = (t: Tool) => (CANVAS_TOOLS as readonly string[]).includes(t);
