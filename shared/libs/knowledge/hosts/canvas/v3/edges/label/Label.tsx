// The canvas edge label: a dot or a title on a connector, with a tooltip for the rest. The line itself is the diagram's.
import { Badge, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { Values } from "../../../../../previewer-editors/types";
import { spec } from "./spec";
import type { Label as Data } from "../../document";
import { Editable } from "../../../../../previewer-editors/editing/Editable";
import type { Edit } from "../../../../../previewer-editors/editing/types";
import { EdgeLabelEditor } from "./Editor";

const defaultsOf = (layout: string): Values => { const l = spec.layouts.find((x) => x.id === layout); return Object.fromEntries([...(l?.props ?? []), ...(l?.hover ?? [])].map((p) => [p.name, p.default])); };

export function CanvasEdgeLabel({ layout: layoutProp, v: given, data: d, edit }: { layout?: string; v?: Values; data: Data; edit?: Edit<Data> }) {
  const layout = layoutProp ?? spec.layouts[0].id;
  const v: Values = { ...defaultsOf(layout), ...given };
  const body = layout === "title" && d.title
    ? <Badge emphasis="secondary" scale="sm">{d.title}</Badge>
    : <span element="type--body-extra-small" emphasis="quiet" aria-label={d.title} style={{ display: "inline-block", width: 10, height: 10, borderRadius: 10, background: "currentColor" }} />;
  const lines = [layout === "dot" ? d.title : undefined, d.description, d.note].filter((x): x is string => !!x);
  // the edit shell: only when the consumer gave an `edit` and the editable hover switch is on (editing/types.ts). The label is small: the button sits over it, as on a badge.
  const editable = (node: React.ReactNode) => <Editable edit={edit} enabled={!!v.editable} openOnDoubleClick={false} data={d} Editor={EdgeLabelEditor}>{node}</Editable>;
  if (!v.tooltip || !lines.length) return editable(body);
  return editable(
    <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild><span style={{ display: "inline-flex" }}>{body}</span></TooltipTrigger>
      <TooltipContent><Stack dir="col" scale="2xs" concept="knowledge-canvas-edge-label">{lines.map((l, i) => <span key={i} element={i === 0 ? "type--body-small" : "type--body-extra-small"} emphasis={i === 0 ? undefined : "quiet"}>{l}</span>)}</Stack></TooltipContent>
    </Tooltip></TooltipProvider>,
  );
}
