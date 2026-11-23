import { useEffect, useSyncExternalStore } from "react";
import { Badge, DatePicker, Input, InputSelect, Tile } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { Canvas, canvasOwnKinds, free, register, type CanvasDocument, type CanvasViewProps, type Reference } from "@libs/knowledge/hosts/canvas";
import { Editable, Field, Grid, type EditorProps } from "@libs/knowledge/previewer-editors/editing";
import type { Spec } from "@libs/knowledge/previewer-editors/types";
import { Instance, instances } from "../../../lib/instance";

/** Pattern: knowledge — a canvas placing a slice entity (here: meteors), the way a slice would, all mocked inside this pattern.
 *
 *  The slice (a "meteors" model, its table) is imagined: here the table is a JSON in the instance store (open the store tab: edit it and the canvas follows). What the slice would bring:
 *   · the MODEL's rows         → METEORS, below. In the application: a Drizzle model, its Zod schema inferred, rows read through the slice's routes.
 *   · the QUERY                → `api.search`. In the application this is a request to the API (a deterministic query returning ids); here it filters the JSON after a short wait.
 *   · the ENTITY STORE         → `store`, below: a previewer `want`s an id, the store fetches the wanted ids in one request, the previewer subscribes. In the application it is the shared entity store.
 *   · the PREVIEWER and EDITOR → `MeteorPreviewer` (two layouts) and `MeteorEditor` (a form, opened in a sheet from the hover edit button).
 *   · the CANVAS REGISTRATION  → `meteor`: a REFERENCED kind. A node holds only { id, project }; the previewer reads the row; the tool places an existing meteor by searching it.
 *  The canvas knows none of this: it is instantiated with its own kinds and this one registration. */

// ── the model's rows, and what a type of meteor looks like
type MeteorType = "iron" | "stony" | "stony-iron" | "comet";
type Meteor = { id: string; name: string; diameter: number; foundOn: string; type: MeteorType };
const TYPE_COLOUR: Record<MeteorType, string> = { iron: "#9aa5b8", stony: "#d9a066", "stony-iron": "#a78bfa", comet: "#7dd3fc" };
const TYPES: MeteorType[] = ["iron", "stony", "stony-iron", "comet"];
const METEORS: Meteor[] = [
  { id: "m01", name: "Hoba", diameter: 2.7, foundOn: "1920-01-01", type: "iron" },
  { id: "m02", name: "Allende", diameter: 1.1, foundOn: "1969-02-08", type: "stony" },
  { id: "m03", name: "Willamette", diameter: 3.0, foundOn: "1902-08-26", type: "iron" },
  { id: "m04", name: "Esquel", diameter: 0.9, foundOn: "1951-06-14", type: "stony-iron" },
  { id: "m05", name: "Murchison", diameter: 0.6, foundOn: "1969-09-28", type: "stony" },
  { id: "m06", name: "Halley", diameter: 11000, foundOn: "1986-03-13", type: "comet" },
  { id: "m07", name: "Sikhote-Alin", diameter: 4.0, foundOn: "1947-02-12", type: "iron" },
  { id: "m08", name: "Brenham", diameter: 1.4, foundOn: "1882-05-03", type: "stony-iron" },
  { id: "m09", name: "Tagish Lake", diameter: 4.0, foundOn: "2000-01-18", type: "stony" },
  { id: "m10", name: "Hale-Bopp", diameter: 60000, foundOn: "1995-07-23", type: "comet" },
  { id: "m11", name: "Gibeon", diameter: 2.2, foundOn: "1836-01-01", type: "iron" },
  { id: "m12", name: "Chelyabinsk", diameter: 19, foundOn: "2013-02-15", type: "stony" },
];
const PROJECT = "meteors";
const ID = "canvas-meteors";
const rows = () => ((instances.get(ID)?.data.meteors as Meteor[] | undefined) ?? []);
const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 250));

// ── the mock API: in the application, each of these is a request
const api = {
  /** GET the rows of these ids */
  getMany: (ids: string[]) => wait(rows().filter((m) => ids.includes(m.id))),
  /** the query behind the pick: a search by name, answered as ids with a name and a line under it */
  search: (_project: string, q: string) => wait(rows().filter((m) => m.name.toLowerCase().includes(q.toLowerCase())).map((m) => ({ id: m.id, name: m.name, sub: `${m.type} · ${m.diameter} m` }))),
  /** PUT a row: the editor's draft is saved where the row lives */
  put: async (row: Meteor) => { await wait(null); instances.patch(ID, "data", { meteors: rows().map((m) => (m.id === row.id ? row : m)) }); store.invalidate(row.id); },
};

// ── the mock entity store: want / unwant, one batched request for what was wanted in the same tick, subscribe
const cache = new Map<string, Meteor | null>();
const wanted = new Map<string, number>();
const listeners = new Map<string, Set<() => void>>();
let batch: Set<string> | null = null;
const emit = (id: string) => listeners.get(id)?.forEach((f) => f());
const flush = async () => {
  const ids = [...(batch ?? [])]; batch = null;
  const got = await api.getMany(ids);
  for (const id of ids) { cache.set(id, got.find((m) => m.id === id) ?? null); emit(id); }
};
const store = {
  want: (id: string) => { wanted.set(id, (wanted.get(id) ?? 0) + 1); if (cache.has(id)) return; if (!batch) { batch = new Set(); setTimeout(() => void flush(), 0); } batch.add(id); },
  unwant: (id: string) => { const n = (wanted.get(id) ?? 1) - 1; if (n <= 0) wanted.delete(id); else wanted.set(id, n); },
  subscribe: (id: string, f: () => void) => { if (!listeners.has(id)) listeners.set(id, new Set()); listeners.get(id)!.add(f); return () => { listeners.get(id)?.delete(f); }; },
  get: (id: string) => cache.get(id),
  /** a row changed: every previewer that wants it asks again (the application's store gets it by its stream) */
  invalidate: (id: string) => { cache.delete(id); if (wanted.has(id)) { if (!batch) { batch = new Set(); setTimeout(() => void flush(), 0); } batch.add(id); } },
};
/** a previewer's row, by id */
function useMeteor(id: string): Meteor | null | undefined {
  useEffect(() => { store.want(id); return () => store.unwant(id); }, [id]);
  return useSyncExternalStore((f) => store.subscribe(id, f), () => store.get(id));
}

// ── the previewer: it knows nothing of the canvas; two layouts
function MeteorPreviewer({ meteor, layout }: { meteor: Meteor; layout: string }) {
  const colour = TYPE_COLOUR[meteor.type];
  if (layout === "chip") return <Stack dir="row" scale="xs" align="center" concept="slice-entity-chip"><span style={{ width: 10, height: 10, borderRadius: 10, background: colour }} /><span element="type--body-small">{meteor.name}</span></Stack>;
  return (
    <Tile style={{ width: 230, borderLeft: `6px solid ${colour}` }}>
      <Stack dir="col" scale="2xs">
        <span element="type--body" style={{ fontWeight: 600 }}>{meteor.name}</span>
        <span element="type--body-small" emphasis="quiet">{meteor.diameter} m · found {meteor.foundOn}</span>
        <span><Badge style={{ background: colour, color: "#1a1a1a" }}>{meteor.type}</Badge></span>
      </Stack>
    </Tile>
  );
}

// ── the editor: pure, a draft in and out; the sheet and the save are the instantiator's
function MeteorEditor({ draft, onChange }: EditorProps<Meteor>) {
  const set = (p: Partial<Meteor>) => onChange({ ...draft, ...p });
  return (
    <Stack dir="col" scale="md">
      <Field label="Name"><Input value={draft.name} onChange={(name: string) => set({ name })} /></Field>
      <Grid cols={2}>
        <Field label="Diameter (m)"><Input type="number" value={String(draft.diameter)} onChange={(v: string) => set({ diameter: Number(v) })} /></Field>
        <Field label="Type"><InputSelect options={TYPES.map((t) => ({ value: t, label: t }))} value={draft.type} onChange={((v: string | null) => v && set({ type: v as MeteorType })) as never} /></Field>
      </Grid>
      <Field label="Found on">
        <DatePicker mode="single" value={new Date(draft.foundOn)} onChange={(d) => d && set({ foundOn: d.toISOString().slice(0, 10) })} />
      </Field>
    </Stack>
  );
}

// ── the canvas registration: a referenced kind; the node holds { id, project } and the previewer reads the row.
// The previewer wraps itself in the edit shell with ITS row (not the node's reference): on the canvas the host opens the sheet from the hover edit button; the shell learns from the host that an editor exists.
function View({ data: ref, layout, editable }: CanvasViewProps<Reference>) {
  const meteor = useMeteor(ref.id);
  const edit = editable ? { source: "live" as const, kind: "meteor", onSubmit: (next: Meteor) => api.put(next) } : undefined;
  return (
    <div data-entity={`meteor:${ref.id}`} style={{ display: "inline-flex", minWidth: 24, minHeight: 24 }}>
      {meteor ? <Editable edit={edit} data={meteor} Editor={MeteorEditor}><MeteorPreviewer meteor={meteor} layout={layout} /></Editable> : null}
    </div>
  );
}
const spec: Spec = { id: "meteor", name: "meteor", state: "draft", layouts: [
  { id: "chip", name: "chip", description: "a dot of its type's colour and the name", image: "none", props: [], hover: [] },
  { id: "card", name: "card", description: "name, diameter, the day it was found, its type", image: "none", props: [], hover: [] },
] };
const corner = [{ action: "edit", where: "top-left" }, { action: "settings", where: "top-left" }] as const;
const meteor = register<Reference>({
  kind: "meteor", name: "meteor", component: View, schema: { parse: (x) => x as Reference }, spec,
  data: "referenced", edit: "sheet",
  tools: [{ id: "meteor", name: "meteor (M)", key: "m", icon: "star", group: "entities", what: "click where it goes, then search a meteor by name", placing: "pick", pick: api.search, data: () => ({ id: "" }) }],
  layout: { default: "card", editable: ["chip", "card"] },
  layouts: { chip: { size: { width: "content", height: "content" }, satellites: [...corner] }, card: { size: { width: "content", height: "content" }, satellites: [...corner] } },
});

const DOC: CanvasDocument = {
  id: "canvas-meteors-demo", template: "free", groups: [], edges: [],
  nodes: [
    { id: "n1", kind: "meteor", x: 60, y: 60, data: { id: "m01", project: PROJECT } },
    { id: "n2", kind: "meteor", x: 340, y: 60, data: { id: "m06", project: PROJECT } },
    { id: "n3", kind: "meteor", x: 60, y: 230, layout: "chip", data: { id: "m12", project: PROJECT } },
  ],
};

/** the measure of the previewer's container around each fixture */
export const measure = "xl";

export default function CanvasMeteorsFixture() {
  return (
    <Instance id={ID} initial={{ data: { meteors: METEORS, document: DOC } }}>
      {(x) => (
        <Stack dir="col" scale="sm">
          <span element="type--body-small" emphasis="quiet">Mocked: the meteors are the JSON in the store tab, the search is a mock API over it, the entity store batches what the previewers want. In the application these are requests to the slice's API. Open the database button in the toolbox (or press M), click the canvas, search a meteor; hover a meteor and press its edit button.</span>
          <div style={{ height: 560 }}>
            <Canvas
              document={x.data.document as CanvasDocument}
              template={free}
              registrations={[...Object.values(canvasOwnKinds), meteor]}
              project={PROJECT}
              mode="edit"
              onChange={(d) => instances.patch(ID, "data", { document: d })}
              viewLock="unlocked"
            />
          </div>
        </Stack>
      )}
    </Instance>
  );
}
