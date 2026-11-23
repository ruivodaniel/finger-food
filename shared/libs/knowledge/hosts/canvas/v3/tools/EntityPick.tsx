// The pick of a referenced kind (a tool whose placing is "pick"). One picker for every kind, drawn from the tool's source alone (canvas-registration: Source):
// a search by name; a row of filters for each facet the source declares; each row's value on a facet as a badge; a row once for each placement that applies to it,
// a once-only placement already on the board disabled; and, when the source declares a creation and the text typed is no row's name, the fields to make one.
// What only the canvas knows comes from its document: which rows are on the board, where, and by which placement.
import { useEffect, useMemo, useState } from "react";
import { Button, Icon, Input } from "@libs/web-components";
import { useReactFlow } from "@xyflow/react";
import { Stack } from "@libs/web-layouts";
import type { CanvasRegistration, Facet, Hit, Placement, Reference, Source, Tone, ToolEntry } from "../canvas-registration";
import type { NodeData } from "../nodes/Node";
import { focusNodes } from "./focus";
import { ToolButton } from "./ToolButton";

const ONE: Placement = { id: "", name: "", times: "many" };
/** the placements of a source that apply to a row with these facet values */
export const placementsFor = (source: Source | undefined, facets: Record<string, string> | undefined): Placement[] => {
  const all = source?.placements ?? [];
  const fit = all.filter((p) => !p.when || facets?.[p.when.facet] === p.when.value);
  return fit.length ? fit : [ONE];
};
// the kind's own colours, painted directly: they are its data, not the theme's
const Tag = ({ label, tone }: { label: string; tone?: Tone }) => <span element="type--body-extra-small" style={{ padding: "2px 9px", borderRadius: 999, background: tone?.fill ?? "var(--color-surface-2)", color: tone?.ink, border: tone?.line ? `1.5px dashed ${tone.line}` : undefined }}>{label}</span>;
const valueOf = (facet: Facet, id: string | undefined) => facet.values.find((v) => v.id === id);

export function EntityPick({ project, registration: r, entry, onPick, onCancel }: { project: string; registration: CanvasRegistration; entry: ToolEntry; onPick: (ref: Reference, placement?: Placement, created?: boolean) => void; onCancel: () => void }) {
  const flow = useReactFlow();
  // a tool with no source: its `pick` is one, with nothing declared
  const source = useMemo<Source>(() => entry.source ?? { list: (p, q) => entry.pick?.(p, q) ?? Promise.resolve([]) }, [entry]);
  const facets = source.facets ?? [];
  // where each row of this kind sits on the board, by the placement it was placed by (a row may sit several times): the target button brings the eye there
  const sites = new Map<string, { node: string; placement: string }[]>();
  for (const n of flow.getNodes()) { const d = n.data as NodeData; if (d.registration?.kind === r.kind && d.registration.data === "referenced") { const ref = d.node.data as Reference; sites.set(ref.id, [...(sites.get(ref.id) ?? []), { node: n.id, placement: ref.placement ?? "" }]); } }
  const find = (id: string) => { const ids = (sites.get(id) ?? []).map((x) => x.node); if (!ids.length) return; onCancel(); window.setTimeout(() => focusNodes(flow, ids, ids, { padding: 0.6, maxZoom: 1 }), 80); };
  const [q, setQ] = useState("");
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [hits, setHits] = useState<Hit[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  useEffect(() => {
    let dead = false;
    setState("loading");
    const t = setTimeout(() => { source.list(project, q, chosen).then((h) => { if (!dead) { setHits(h); setState("idle"); } }).catch(() => { if (!dead) setState("error"); }); }, 150);
    return () => { dead = true; clearTimeout(t); };
  }, [q, project, source, chosen]);

  // creation: the text typed fills the text fields; a field of a facet is chosen among its values
  const creation = source.create ? source.creation : undefined;
  const text = q.trim();
  const [filled, setFilled] = useState<Record<string, string>>({});
  const [making, setMaking] = useState(false);
  const fieldsOf = (extra: Record<string, string> = {}) => Object.fromEntries((creation?.fields ?? []).map((f) => [f.id, f.from === "text" ? text : extra[f.id] ?? filled[f.id] ?? ""]));
  const complete = (fields: Record<string, string>) => (creation?.fields ?? []).every((f) => !f.required || !!fields[f.id]);
  const asked = (creation?.fields ?? []).filter((f) => f.from !== "text");
  const make = async (fields: Record<string, string>) => {
    if (!creation || !source.create || !complete(fields) || making) return;
    setMaking(true);
    try {
      const ref = await source.create(project, fields);
      // the row's facet values, as the fields say them: the first placement that applies
      const of = Object.fromEntries(creation.fields.flatMap((f) => (f.from === "text" ? [] : [[f.from.facet, fields[f.id]]])));
      onPick(ref, placementsFor(source, of)[0], true);
    } catch { setState("error"); } finally { setMaking(false); }
  };
  const offer = !!creation && !!text && state === "idle" && !hits.some((h) => h.name.toLowerCase() === text.toLowerCase());

  return (
    <Stack dir="col" scale="xs" concept="knowledge-canvas-entity-pick" data-testid="entity-pick" onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}>
      <Stack dir="row" scale="xs" align="center">
        <Input className="w-full" value={q} onChange={setQ} placeholder={`search a ${r.name} by name`} autoFocus />
        <Button scale="sm" emphasis="tertiary" onClick={onCancel}>cancel</Button>
      </Stack>
      {facets.map((f) => (
        <Stack key={f.id} dir="row" scale="2xs" wrap align="center" data-testid={`entity-pick-facet-${f.id}`}>
          <Button scale="sm" emphasis={chosen[f.id] ? "secondary" : "primary"} onClick={() => setChosen(({ [f.id]: _, ...rest }) => rest)}>all</Button>
          {f.values.map((v) => <Button key={v.id} scale="sm" emphasis={chosen[f.id] === v.id ? "primary" : "secondary"} onClick={() => setChosen((c) => (c[f.id] === v.id ? (({ [f.id]: _, ...rest }) => rest)(c) : { ...c, [f.id]: v.id }))}>{v.label ?? v.id}</Button>)}
        </Stack>
      ))}
      <div style={{ maxHeight: 420, overflowY: "auto" }} className="nowheel">
        {state === "error" ? <span element="type--body-small" style={{ color: "var(--color-status-error)" }}>the search did not answer</span> : null}
        {state !== "error" && !hits.length ? <span element="type--body-small" emphasis="quiet" style={{ display: "block", padding: "10px 12px" }}>{state === "loading" ? "searching…" : `no ${r.name} by that name in ${project}`}</span> : null}
        {hits.flatMap((h) => placementsFor(source, h.facets).map((p) => {
          const here = sites.get(h.id) ?? [], placed = here.some((x) => x.placement === p.id), taken = p.times === "once" && placed;
          return (
            <div key={h.id + " " + p.id} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
              <ToolButton label={p.name ? `${h.name}, ${p.name}` : h.name} className="flex-1 w-full justify-start gap-3" disabled={taken} onClick={() => onPick({ id: h.id, project, ...(p.id ? { placement: p.id } : {}) }, p)}>
                <span element="type--body" style={{ fontWeight: 500 }}>{h.name}</span>
                {p.name && p.tone ? <Tag label={p.name} tone={p.tone} /> : facets.map((f) => { const v = valueOf(f, h.facets?.[f.id]); return v ? <Tag key={f.id} label={v.label ?? v.id} tone={v.tone} /> : null; })}
                {h.sub ? <span element="type--body-extra-small" emphasis="quiet">{h.sub}</span> : null}
                {placed ? <label style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", color: "var(--color-status-success)", pointerEvents: "none" }}><input type="checkbox" checked readOnly style={{ accentColor: "var(--color-status-success)" }} /><span element="type--body-extra-small">on the board</span></label> : null}
              </ToolButton>
              {here.length ? <ToolButton label={`show ${h.name} on the board`} onClick={() => find(h.id)}><Icon name="target" scale="xs" /></ToolButton> : null}
            </div>
          );
        }))}
      </div>
      {offer ? (
        <Stack dir="col" scale="2xs" data-testid="entity-pick-create">
          {asked.length === 1 ? (
            // one field to choose: a click on a value makes the row
            <Stack dir="row" scale="2xs" wrap align="center">
              <span element="type--body-small" emphasis="quiet">add “{text}” as</span>
              {(facets.find((f) => f.id === (asked[0].from as { facet: string }).facet)?.values ?? []).map((v) => <Button key={v.id} scale="sm" emphasis="secondary" disabled={making} onClick={() => void make(fieldsOf({ [asked[0].id]: v.id }))}>{v.label ?? v.id}</Button>)}
            </Stack>
          ) : (
            <>
              {asked.map((a) => (
                <Stack key={a.id} dir="row" scale="2xs" wrap align="center">
                  <span element="type--body-small" emphasis="quiet">{a.name}{a.required ? "" : " (optional)"}</span>
                  {(facets.find((f) => f.id === (a.from as { facet: string }).facet)?.values ?? []).map((v) => <Button key={v.id} scale="sm" emphasis={filled[a.id] === v.id ? "primary" : "secondary"} onClick={() => setFilled((c) => ({ ...c, [a.id]: c[a.id] === v.id ? "" : v.id }))}>{v.label ?? v.id}</Button>)}
                </Stack>
              ))}
              <Stack dir="row" scale="2xs" align="center"><Button scale="sm" emphasis="primary" disabled={making || !complete(fieldsOf())} onClick={() => void make(fieldsOf())}>add “{text}”</Button></Stack>
            </>
          )}
        </Stack>
      ) : null}
    </Stack>
  );
}
