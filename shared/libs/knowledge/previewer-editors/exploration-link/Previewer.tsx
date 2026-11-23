import { Badge, Button, Card, Icon, Tile } from "@libs/web-components";
import { Container, Stack } from "@libs/web-layouts";
import type { Values } from "../types";
import type { Exploration } from "./types";
import { spec } from "./spec";
import { Editable } from "../editing/Editable";
import type { Edit } from "../editing/types";
import { ExplorationEditor } from "./Editor";
import type { ExplorationLookups } from "./options";
import { STACK_AT, useWidth } from "../useWidth";

// Library rules: structure is Stack and `position`, type is `element`, paddings and sizes are the theme's (concept "exploration-previewer"). No className, no inline style.

/** the layout's defaults: its props and its hover switches (so a consumer that passes nothing gets the spec's defaults, `editable` among them) */
const defaultsOf = (layout: string): Values => { const l = spec.layouts.find((x) => x.id === layout); return Object.fromEntries([...(l?.props ?? []), ...(l?.hover ?? [])].map((p) => [p.name, p.default])); };
const SIZES: Record<string, string> = { "extra-small": "type--body-extra-small", small: "type--body-small", medium: "type--body", large: "type--body-large", "extra-large": "type--body-extra-large" };
const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

/** the strip on the left, the full height of the box: which kind of thing this is (its colour is the theme's for the concept's tile) */
const Spine = ({ stacked, version }: { stacked?: boolean; version?: string }) => (
  <Tile position="hug">
    {stacked ? (
      <Stack dir="row" scale="md" align="center" justify="between">
        <Stack dir="row" scale="md" align="center"><Icon name="compass" scale="lg" /><span element="type--body-small">exploration</span></Stack>
        {version ? <span element="type--body-small">{version}</span> : null}
      </Stack>
    ) : (
      <Stack dir="col" align="center" justify="center" size="fill"><Icon name="compass" scale="lg" /></Stack>
    )}
  </Tile>
);

/** opens the latest version in a new tab: the address comes from the host (`href`) */
const Open = ({ e, scale = "sm" }: { e: Exploration; scale?: "xs" | "sm" }) => (
  e.href ? <Button asChild buttonType="icon" startIcon="externalLink" emphasis="secondary" scale={scale}><a href={e.href} target="_blank" rel="noopener noreferrer" aria-label={`open ${e.title} in a new tab`}><Icon name="externalLink" /></a></Button> : null
);
const Label = ({ children }: { children: string }) => <span element="type--body-extra-small" emphasis="quiet">{children}</span>;
const Dates = ({ e, v, row }: { e: Exploration; v: Values; row?: boolean }) => (
  <Stack dir={row ? "row" : "col"} scale={row ? "xl" : "sm"}>
    {v.showCreated && e.createdAt ? <Stack dir="col"><Label>CREATED</Label><span element="type--body-small">{day(e.createdAt)}</span></Stack> : null}
    {v.showEdited && e.updatedAt ? <Stack dir="col"><Label>LAST EDIT</Label><span element="type--body-small">{day(e.updatedAt)}</span></Stack> : null}
  </Stack>
);
const Tags = ({ e }: { e: Exploration }) => (e.tags?.length ? <Stack dir="row" scale="2xs" wrap>{e.tags.map((t) => <Badge key={t} scale="xs" status="neutral">{t}</Badge>)}</Stack> : null);
const Marks = ({ e, v, noVersion }: { e: Exploration; v: Values; noVersion?: boolean }) => (
  <Stack dir="row" scale="sm" align="center" wrap>
    {v.showSpike && e.spike ? <Badge scale="xs" status="warning">spike</Badge> : null}
    {v.showVersion && !noVersion ? <span element="type--body-small" emphasis="quiet">{e.version}</span> : null}
  </Stack>
);

/** the exploration previewer: the data comes from the host (a fixture here); the layout and its switches from the consumer. */
export function Previewer({ layout: layoutProp, v: given, data, edit }: { layout?: string; v?: Values; data: Exploration; edit?: Edit<Exploration, ExplorationLookups> }) {
  const layout = layoutProp ?? spec.layouts[0].id;
  const v: Values = { ...defaultsOf(layout), ...given };
  const e = data;
  // the edit shell: only when the consumer gave an `edit` and the editable hover switch is on (editing/types.ts)
  const editable = (node: React.ReactNode, block: boolean) => <Editable edit={edit} enabled={!!v.editable} block={block} data={data} Editor={ExplorationEditor}>{node}</Editable>;
  if (layout === "reference") {
    const t = SIZES[String(v.size)] ?? SIZES.medium;
    return editable(
      <Stack dir="row" scale="xs" align="center">
        <Icon name="compass" scale="sm" />
        <strong element={t} style={{ fontWeight: 600 }}>{e.title}</strong>
        {v.showVersion ? <span element={t} emphasis="quiet">{e.version}</span> : null}
        {v.showOpen ? <Open e={e} scale="xs" /> : null}
      </Stack>, false,
    );
  }
  const { ref, width } = useWidth<HTMLDivElement>();
  // in a narrow space the strip goes on top and the parts stack
  const stacked = width !== undefined && width < STACK_AT;
  const card = layout === "card";
  const body = card ? (
    <Card position="fill">
      <Stack dir={stacked ? "col" : "row"} align="stretch"><Spine stacked={stacked} version={v.showVersion ? e.version : undefined} />
      <Stack dir="col" scale="md" size="fill">
        <Stack dir="row" scale="md" align="start">
          <Stack dir="col" scale="2xs" size="fill">
            <span element="type--heading3">{e.title}</span>
            <Marks e={e} v={v} noVersion={stacked} />
          </Stack>
          {v.showOpen ? <Open e={e} /> : null}
        </Stack>
        <Dates e={e} v={v} row={stacked} />
        {v.showTags ? <Tags e={e} /> : null}
      </Stack>
      </Stack>
    </Card>
  ) : (
    <Card position="fill">
      <Stack dir={stacked ? "col" : "row"} align="stretch"><Spine stacked={stacked} version={v.showVersion ? e.version : undefined} />
        {stacked ? (
          <Stack dir="col" scale="lg">
            <Stack dir="row" scale="md" align="start">
              <Stack dir="col" scale="sm" size="fill">
                <span element="type--heading2">{e.title}</span>
                <Marks e={e} v={v} noVersion />
                {v.showTags ? <Tags e={e} /> : null}
              </Stack>
              {v.showOpen ? <Open e={e} /> : null}
            </Stack>
            <Dates e={e} v={v} row />
          </Stack>
        ) : (
          <>
            <Stack dir="col" scale="sm" size="fill">
              <span element="type--heading2">{e.title}</span>
              <Marks e={e} v={v} />
              {v.showTags ? <Tags e={e} /> : null}
            </Stack>
            <Stack dir="col"><Dates e={e} v={v} /></Stack>
            {v.showOpen ? <Stack dir="col"><Open e={e} /></Stack> : null}
          </>
        )}
      </Stack>
    </Card>
  );
  return editable(<div ref={ref} concept="exploration-previewer" className="w-full">{v.width === "fill" ? body : <Container scale={card ? "sm" : "md"}>{body}</Container>}</div>, true);
}
