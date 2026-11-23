// The exploration link on a canvas: a REFERENCED row (an exploration outlives any drawing), read through the entity store by id and project; its editor in a sheet, saved through the server.
// The one dependency on current code: the entity store (slice-design/shared/ui/components/entity-store) brings the row. It moves with the store.
import { useEffect, useSyncExternalStore } from "react";
import { listen, store } from "../../../../../slice-design/shared/ui/components/entity-store";
import { register, type CanvasViewProps, type Reference } from "../../hosts/canvas/v3/canvas-registration";
import { Previewer } from "./Previewer";
import { ExplorationEditor } from "./Editor";
import { spec } from "./spec";
import type { Exploration } from "./types";

function View({ data: ref, layout, switches }: CanvasViewProps<Reference>) {
  const key = { kind: "exploration", id: ref.id, project: ref.project };
  useEffect(() => { listen(); store.want(key); return () => store.unwant(key); }, [ref.id, ref.project]);   // eslint-disable-line react-hooks/exhaustive-deps
  const row = useSyncExternalStore((f) => store.subscribe(key, f), () => store.get(key), () => store.get(key)) as Exploration | null | undefined;
  return <div data-entity={`exploration:${ref.id}`} style={{ display: "inline-flex", minWidth: 24, minHeight: 24 }}>{row ? <Previewer layout={layout} v={switches as Record<string, string | boolean>} data={row} /> : null}</div>;
}
const search = async (project: string, q: string) => {
  const r = await fetch(`/api/slice-design/entities/search?project=${encodeURIComponent(project)}&kind=exploration&q=${encodeURIComponent(q)}`);
  if (!r.ok) throw new Error(String(r.status));
  const d = (await r.json()) as { hits?: { kind: string; id: string; name: string; sub?: string }[] };
  return (d.hits ?? []).filter((h) => h.kind === "exploration").map((h) => ({ id: h.id, name: h.name, sub: h.sub }));
};
export const explorationLink = register<Reference>({
  kind: "exploration_link", name: "exploration", component: View, schema: { parse: (x) => x as Reference }, spec,
  data: "referenced", edit: "sheet",
  editor: ExplorationEditor as never,
  save: async (ref, next) => { await fetch("/api/slice-design/entities/put", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "exploration", project: ref.project, row: next }) }); },
  tools: [{ id: "exploration", name: "exploration (E)", key: "e", icon: "compass", what: "click where it goes, then search an exploration by name", placing: "pick", pick: search, data: () => ({ id: "" }) }],
  layout: { default: "reference", editable: ["item", "card", "reference"] },
  layouts: {
    item: { size: { width: "content", height: "content" }, satellites: [{ action: "edit", where: "top-left" }, { action: "settings", where: "top-left" }] },
    card: { size: { width: "content", height: "content" }, satellites: [{ action: "edit", where: "top-left" }, { action: "settings", where: "top-left" }] },
    reference: { size: { width: "content", height: "content" }, satellites: [{ action: "edit", where: "top-left" }, { action: "settings", where: "top-left" }] },
  },
});
