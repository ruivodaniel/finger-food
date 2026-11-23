// The canvas card: a diagram node, made of the library's card, icon, image and text, with a tooltip for what the layout does not show (none when there is nothing to show).
// The concept knowledge-exploration-card sits on the wrapper (the theme's concept rules address what is inside it): the card's own padding and gap go to zero, the text is most of the height.
import { Card, Icon, RemoteImage, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { Values } from "../types";
import { spec } from "./spec";
import type { CanvasCard as Data } from "./types";
import { Editable } from "../editing/Editable";
import type { Edit } from "../editing/types";
import { CardEditor } from "./Editor";

const defaultsOf = (layout: string): Values => { const l = spec.layouts.find((x) => x.id === layout); return Object.fromEntries([...(l?.props ?? []), ...(l?.hover ?? [])].map((p) => [p.name, p.default])); };
const FIXED = 240, MAX = 320;

export function CanvasCard({ layout: layoutProp, v: given, data: d, edit }: { layout?: string; v?: Values; data: Data; edit?: Edit<Data> }) {
  const layout = layoutProp ?? spec.layouts[0].id;
  const v: Values = { ...defaultsOf(layout), ...given };
  // the colour is the card's own; the switch says how it shows: a stroke on the left, a tint of the whole card, or none
  const c = d.color ? `var(--color-${d.color})` : undefined;
  const colored: React.CSSProperties = !c || v.color === "none" ? {}
    : v.color === "tint" ? { background: `color-mix(in srgb, ${c} 16%, transparent)`, borderColor: `color-mix(in srgb, ${c} 45%, transparent)` }
    : { borderLeftColor: c, borderLeftWidth: 5, borderLeftStyle: "solid" };
  const size: React.CSSProperties = layout === "picture" ? { width: 200 } : v.width === "hug" ? { maxWidth: MAX, minHeight: 44 } : { width: FIXED, minHeight: 44 };
  const shownDescription = layout === "title-description" || (layout === "picture" && !!v.showDescription);
  const body = (
    <div concept="knowledge-exploration-card" style={{ display: "inline-flex", flexShrink: 0 }}>
      <Card style={{ ...colored, ...size }}>
        {layout === "picture" ? (
          <Stack dir="col" scale="xs" align="center" concept="knowledge-exploration-card-face">
            {d.image ? <RemoteImage src={d.image} alt={d.title} width="100%" ratio="16/9" /> : d.icon ? <Icon name={d.icon} scale="xl" /> : null}
            <span element="type--heading3" style={{ textAlign: "center" }}>{d.title}</span>
            {shownDescription && d.description ? <span element="type--body-small" emphasis="quiet" style={{ textAlign: "center" }}>{d.description}</span> : null}
          </Stack>
        ) : (
          <Stack dir="row" align="stretch">
            {/* as the persona badge: a 44px square flush left — the image, else the icon — the title beside it, truncated; without either the card keeps its height */}
            {v.showPicture && d.image ? <div style={{ width: 44, height: 44, flexShrink: 0, overflow: "hidden" }}><RemoteImage src={d.image} alt={d.title} /></div>
              : v.showPicture && d.icon ? <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: c && v.color !== "none" ? `color-mix(in srgb, ${c} 14%, transparent)` : undefined }}><Icon name={d.icon} scale="xl" className="w-7 h-7" /></div>
              : null}
            <Stack dir="row" scale="sm" align="center" size="fill" concept="knowledge-exploration-card-foot">
              <Stack dir="col" size="fill" clip>
                <span element="type--heading4" className="truncate">{d.title}</span>
                {shownDescription && d.description ? <span element="type--body-extra-small" emphasis="quiet" className="truncate">{d.description}</span> : null}
              </Stack>
            </Stack>
          </Stack>
        )}
      </Card>
    </div>
  );
  // the tooltip: the title in full (the card may clip it), then what the layout left out: the description, the note. Nothing beyond the title, no tooltip
  const rest = [!shownDescription ? d.description : undefined, d.note].filter((x): x is string => !!x);
  const shown = !v.tooltip || !rest.length ? body : (
    <TooltipProvider delayDuration={600}><Tooltip><TooltipTrigger asChild>{body}</TooltipTrigger>
      <TooltipContent><Stack dir="col" scale="2xs" concept="knowledge-exploration-card-tip">
        <span element="type--body" style={{ fontWeight: 600 }}>{d.title}</span>
        {rest.map((l, i) => <span key={i} element="type--body-small" emphasis="quiet">{l}</span>)}
      </Stack></TooltipContent>
    </Tooltip></TooltipProvider>
  );
  // the edit shell: only when the consumer gave an `edit` (see editing/types.ts)
  return <Editable edit={edit} enabled={!!v.editable} data={d} Editor={CardEditor}>{shown}</Editable>;
}
