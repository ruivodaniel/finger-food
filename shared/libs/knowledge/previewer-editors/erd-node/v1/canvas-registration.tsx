// The ERD node on a canvas: a table, drawn by the erd-node previewer in one of its three layouts. The node owns a copy of the table (the page hands it in from the DBML); nothing is edited on the canvas.
// The lines are derived at runtime, never stored (template.edges.derived): one per key column, from the referenced table to the holder, with the cardinality the ERD page shows; and, for a view, one dotted line from each table it reads.
import { register, type CanvasViewProps, type DerivedEdge } from "../../../hosts/canvas/v3/canvas-registration";
import { Previewer } from "./Previewer";
import { spec } from "./spec";
import type { ErdNode } from "./types";

const View = ({ data, layout, switches }: CanvasViewProps<ErdNode>) => <Previewer layout={layout} v={switches as Record<string, string | boolean>} data={data} />;

/** the cardinality of a key: the referenced end is 1 when the column is not null, else 0..1; the holding end is 0..1 when the column is unique or the key, else N */
const cardinality = (f: ErdNode["fields"][number]) => ({ one: f.notNull ? "1" : "0..1", many: f.unique || f.pk ? "0..1" : "N" });
const SOURCE_COLOUR = { designed: "#eab308", generated: "#3b82f6" } as const;

export const erdNode = register<ErdNode>({
  kind: "erd_node", name: "ERD table", component: View, schema: { parse: (x) => x as ErdNode }, spec,
  data: "owned_by_node", edit: "none",
  layout: { default: "simplified", editable: ["simplified", "compact", "fields"] },
  layouts: {
    simplified: { size: { width: "content", height: "content" } },
    compact: { size: { width: "content", height: "content" } },
    fields: { size: { width: "content", height: "content" } },
  },
  useDerivedEdges: (nodes) => {
    const byTable = new Map(nodes.map((n) => [n.data.name, n]));
    const out: DerivedEdge[] = [];
    for (const n of nodes) for (const src of n.data.readsFrom ?? []) { const t = byTable.get(src); if (t) out.push({ id: `reads:${n.data.name}<${src}`, source: t.id, target: n.id, color: SOURCE_COLOUR[n.data.source], style: { dotted: true, animated: false } }); }
    for (const n of nodes) for (const f of n.data.fields) {
      if (!f.fk) continue;
      const target = byTable.get(f.fk.table); if (!target) continue;
      const c = cardinality(f);
      out.push({ id: `fk:${n.data.name}.${f.name}`, source: target.id, target: n.id, color: SOURCE_COLOUR[n.data.source], one: c.one, many: c.many });
    }
    return out;
  },
});
