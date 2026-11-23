// The settings satellite: the instance's layout and the switches that layout has, from the registration's spec; a change goes to the document at once
import { useState } from "react";
import { Checkbox } from "../../../../../ui/web/primitives/components/checkbox/v1";
import { InputSelect } from "../../../../../ui/web/primitives/components/input-select/v1";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../ui/web/primitives/components/popover/v1";
import { Stack } from "../../../../../ui/web/primitives/components/stack/v1";
import type { CanvasRegistration, LayoutId, Switches } from "../canvas-registration";
import { RoundButton } from "./RoundButton";

export function Settings({ nodeId, registration: r, layout, switches, onSwitches, onOpenChange }: { nodeId: string; registration: CanvasRegistration; layout: LayoutId; switches: Switches; onSwitches: (id: string, layout: LayoutId, switches: Switches) => void; onOpenChange?: (o: boolean) => void }) {
  const [, setOpen] = useState(false);
  const l = r.spec.layouts.find((x) => x.id === layout) ?? r.spec.layouts[0];
  const props = [...(l?.props ?? []), ...(l?.hover ?? [])];
  const set = (name: string, value: string | boolean) => onSwitches(nodeId, layout, { ...switches, [name]: value });
  const layouts = r.spec.layouts.filter((x) => r.layout.editable.includes(x.id) || x.id === layout);
  return (
    <Popover onOpenChange={(o) => { setOpen(o); onOpenChange?.(o); }}>
      <PopoverTrigger asChild><span><RoundButton icon="settings" label="configure the instance" testid="config-button" /></span></PopoverTrigger>
      <PopoverContent align="start" className="nodrag nopan nowheel" onClick={(e) => e.stopPropagation()}>
        <Stack dir="col" gap={8} style={{ width: 240 }}>
          <span element="type--body-extra-small" emphasis="quiet">{r.name} · this instance</span>
          {layouts.length > 1 ? <InputSelect options={layouts.map((x) => ({ value: x.id, label: x.name }))} value={layout} clearable={false} onChange={(id: string | null) => onSwitches(nodeId, id ?? layout, {})} /> : null}
          {props.map((p) => p.kind === "boolean" ? (
            <label key={p.name} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}><Checkbox scale="sm" checked={!!switches[p.name]} onCheckedChange={(c) => set(p.name, c === true)} /><span element="type--body-small">{p.name}</span></label>
          ) : p.kind === "union" ? (
            <Stack key={p.name} dir="row" gap={8} align="center" justify="between"><span element="type--body-small">{p.name}</span><div style={{ width: 120 }}><InputSelect options={(p.values ?? []).map((x) => ({ value: x, label: x }))} value={String(switches[p.name])} clearable={false} onChange={(x: string | null) => set(p.name, x ?? String(p.default))} /></div></Stack>
          ) : p.kind === "number" ? (
            <Stack key={p.name} dir="row" gap={8} align="center" justify="between"><span element="type--body-small">{p.name}</span><input type="number" min={4} value={String(switches[p.name])} onChange={(e) => set(p.name, e.target.value)} style={{ width: 72 }} /></Stack>
          ) : null)}
        </Stack>
      </PopoverContent>
    </Popover>
  );
}
