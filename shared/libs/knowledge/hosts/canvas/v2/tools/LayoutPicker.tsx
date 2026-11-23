// The layout picker: for selected nodes of one kind, a vertical list of the layouts the registration lets the bar switch to, the current one marked; a click switches the nodes to it.
// Under the list, the switches of the current layout (from the registration's spec). Pure: the nodes in, the new layout and switches out.
import { Checkbox } from "../../../../../ui/web/primitives/components/checkbox/v1";
import { InputSelect } from "../../../../../ui/web/primitives/components/input-select/v1";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../ui/web/primitives/components/popover/v1";
import { Stack } from "../../../../../ui/web/primitives/components/stack/v1";
import { switchDefaultsOf, type CanvasRegistration, type LayoutId, type Switches } from "../canvas-registration";
import type { CanvasNode } from "../document";

type Pick = { layout: LayoutId; switches: Switches };
/** one or more nodes that share a kind: the shared layout and switches show as they are; where the nodes differ the value reads "mixed", and a pick is written to every node */
export function LayoutPicker({ nodes, registration: r, onPick }: { nodes: CanvasNode[]; registration: CanvasRegistration; onPick: (picks: Record<string, Pick>) => void }) {
  const all = nodes.map((n): Pick => ({ layout: n.layout ?? r.layout.default, switches: n.switches ?? {} })), now = all[0], sameLayout = all.every((x) => x.layout === now.layout);
  const each = (f: (p: Pick, i: number) => Pick) => onPick(Object.fromEntries(nodes.map((n, i) => [n.id, f(all[i], i)])));
  const layouts = r.spec.layouts.filter((l) => r.layout.editable.includes(l.id)).map((l) => ({ id: l.id, name: l.name }));
  const l = r.spec.layouts.find((x) => x.id === now.layout) ?? r.spec.layouts[0];
  // the hover group's edit and expand belong to the canvas, not to the picker
  const props = !sameLayout ? [] : [...(l?.props ?? []), ...(l?.hover ?? [])].filter((p) => p.name !== "editable" && p.name !== "expandable");
  const defaults = switchDefaultsOf(r, now.layout);
  const v = { ...defaults, ...now.switches };
  const mixed = (name: string) => new Set(all.map((x) => ({ ...defaults, ...x.switches })[name])).size > 1;
  const set = (name: string, value: string | boolean) => each((x) => ({ layout: x.layout, switches: { ...x.switches, [name]: value } }));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label="layout" title="layout and switches" data-testid="layout-button" style={{ height: 32, padding: "0 10px", border: "none", background: "transparent", borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, color: "var(--foreground, #1a1a1a)" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><rect x="2.5" y="2.5" width="13" height="4" rx="1" /><rect x="2.5" y="9" width="13" height="6.5" rx="1" /></svg>
          <span element="type--body-small">{sameLayout ? r.spec.layouts.find((x) => x.id === now.layout)?.name ?? now.layout : "mixed"}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="nodrag nopan nowheel" data-testid="layout-list" style={{ width: 260, padding: 8, maxHeight: "70vh", overflowY: "auto" }}>
        <Stack dir="col" gap={2}>
          {layouts.length > 1 ? <span element="type--body-extra-small" emphasis="quiet" style={{ padding: "2px 10px 4px" }}>{nodes.length > 1 ? `${nodes.length} ` : ""}{r.name} · layouts</span> : null}
          {layouts.length > 1 ? layouts.map((x) => (
            <button key={x.id} type="button" onClick={() => each((c) => ({ layout: x.id, switches: x.id === c.layout ? c.switches : {} }))} data-testid={`layout-${x.id}`}
              style={{ textAlign: "left", padding: "7px 10px", borderRadius: 6, cursor: "pointer", border: "none", background: sameLayout && x.id === now.layout ? "var(--bg-3, #eee)" : "transparent" }} className="hover:bg-[var(--bg-3,#f3f3f3)]">
              <span element="type--body-small" style={{ fontWeight: sameLayout && x.id === now.layout ? 600 : 400 }}>{x.name}</span>
            </button>
          )) : null}
          {props.length ? <span element="type--body-extra-small" emphasis="quiet" style={{ marginTop: 4 }}>{l?.name} · switches</span> : null}
          {props.map((p) => p.kind === "boolean" ? (
            <label key={p.name} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}><Checkbox scale="sm" checked={!mixed(p.name) && !!v[p.name]} onCheckedChange={(c) => set(p.name, c === true)} /><span element="type--body-small">{p.name}</span>{mixed(p.name) ? <span element="type--body-extra-small" emphasis="quiet">mixed</span> : null}</label>
          ) : p.kind === "union" ? (
            <Stack key={p.name} dir="row" gap={8} align="center" justify="between"><span element="type--body-small">{p.name}</span><div style={{ width: 140 }}><InputSelect options={(p.values ?? []).map((x) => ({ value: x, label: x }))} value={mixed(p.name) ? "" : String(v[p.name])} clearable={false} onChange={(x: string | null) => set(p.name, x ?? String(p.default))} /></div></Stack>
          ) : p.kind === "number" ? (
            <Stack key={p.name} dir="row" gap={8} align="center" justify="between"><span element="type--body-small">{p.name}</span><input type="number" min={4} value={mixed(p.name) ? "" : String(v[p.name])} onChange={(e) => set(p.name, e.target.value)} style={{ width: 72 }} data-testid={`switch-${p.name}`} /></Stack>
          ) : null)}
        </Stack>
      </PopoverContent>
    </Popover>
  );
}
