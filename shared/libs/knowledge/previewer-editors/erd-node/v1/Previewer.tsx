import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Badge, Card, HoverCard, HoverCardContent, HoverCardTrigger, Icon } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { Values } from "../../types";
import type { ErdNode } from "./types";
import { spec } from "./spec";

// Library rules: structure is Stack and `position`, type is `element`, paddings and sizes are the theme's (concept "erd-node-previewer"). No className for design, and inline style only for what is copied from the ERD page (app/erd) and named here:
// the colours of the node (the page's: a designed table is yellow, a generated one blue, the page's yellow and blue, because the theme has no blue of its own), its ground (the theme's gray-100), its dividers (gray-200) and its border (2 px, the source's colour);
// the size (320 px wide, the list of columns at most 320 px high and scrolling inside, a simplified node at most 180 px wide with its name wrapped); the hover card has no frame of its own, the node is its frame.

const defaultsOf = (layout: string): Values => Object.fromEntries([...(spec.layouts.find((l) => l.id === layout)?.props ?? []), ...(spec.layouts.find((l) => l.id === layout)?.hover ?? [])].map((p) => [p.name, p.default]));
const WIDTH = 320, LIST = 320;
/** the source the node is drawn with: the data's, or the one chosen to see the other colour; neutral when the colour is off */
const sourceOf = (n: ErdNode, v: Values): "designed" | "generated" | "none" => (!v.showSource ? "none" : v.source === "designed" || v.source === "generated" ? v.source : n.source);
/** the kind of table the node is drawn as: the theme gives each kind its colours (concepts `knowledge-erd-node-<kind>`, `knowledge-erd-header-<kind>`) */
type Kind = ReturnType<typeof sourceOf>;
const frameOf = (kind: Kind, more = "") => `knowledge-erd-node knowledge-erd-node-${kind}${more}`;

/** the details a column can reveal: its enum (name and values), its default, whether it is unique, the indexes it is in */
function detailsOf(n: ErdNode, f: ErdNode["fields"][number]): { label: string; value?: string; list?: string[] }[] {
  const items: { label: string; value?: string; list?: string[] }[] = [];
  if (f.enum) { items.push({ label: "type", value: f.enum.name }); items.push({ label: "enum", list: f.enum.values }); }
  if (f.dbdefault !== undefined) items.push({ label: "default", value: f.dbdefault });
  if (f.unique) items.push({ label: "unique", value: "✓" });
  for (const idx of n.indexes) if (idx.columns.includes(f.name)) items.push({ label: idx.unique ? "unique index" : "indexed", value: idx.name ?? idx.columns.join("+") });
  return items;
}

/** the badge of a column, `[⤢ n]`: how many details it has, and the details when it is hovered */
function Details({ items }: { items: ReturnType<typeof detailsOf> }) {
  if (!items.length) return null;
  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild><span><Badge scale="xs" status="neutral"><Stack dir="row" scale="2xs" align="center"><Icon name="maximize" scale="xs" />{items.length}</Stack></Badge></span></HoverCardTrigger>
      <HoverCardContent side="bottom" align="end" style={{ zIndex: 100001 }}>
        <Stack dir="col" scale="2xs">
          {items.map((it, i) => (
            <Stack key={i} dir="col">
              <Stack dir="row" scale="sm"><span element="type--code" emphasis="quiet">{it.label}</span>{it.value !== undefined ? <span element="type--code">{it.value}</span> : null}</Stack>
              {it.list ? <Stack dir="col">{it.list.map((x) => <span key={x} element="type--code">{x}</span>)}</Stack> : null}
            </Stack>
          ))}
        </Stack>
      </HoverCardContent>
    </HoverCard>
  );
}

/** one column: the key (primary) or link (foreign) icon, the name with a ? when nullable, the type, the details badge */
function FieldRow({ n, f, v, first }: { n: ErdNode; f: ErdNode["fields"][number]; v: Values; first: boolean }) {
  return (
    <Stack dir="row" scale="sm" align="center" divider={first ? undefined : "top"} concept="knowledge-erd-row">
      <Stack dir="row" position="w-xs" align="center" justify="center" size="fixed" concept="knowledge-erd-marker">
        {f.pk ? <Icon name="lock" scale="sm" status="warning" /> : f.fk ? <span title={`→ ${f.fk.table}.${f.fk.column}`}><Icon name="link" scale="sm" status="success" /></span> : null}
      </Stack>
      <Stack dir="row" size="fill" clip>
        <span element="type--code" className="truncate">{f.name}{f.notNull ? "" : <span emphasis="quiet" title="nullable">?</span>}</span>
      </Stack>
      <span element="type--code" emphasis="quiet" style={f.enum ? { fontStyle: "italic" } : undefined}>{f.enum ? "type" : f.type}</span>
      {v.showDetails ? <Details items={detailsOf(n, f)} /> : null}
    </Stack>
  );
}

/** the header band: the table's name on the colour of its source */
const Header = ({ name, kind, view }: { name: string; kind: Kind; view?: boolean }) => (
  <Stack dir="row" scale="sm" align="center" concept={`knowledge-erd-band knowledge-erd-header-${kind}`}><span element="type--heading4">{name}</span>{view ? <Badge scale="xs" status="neutral">view</Badge> : null}</Stack>
);

/** the table as the page's card of its fields, 320 px wide: the header, the description if asked, the columns in a list at most 320 px high that scrolls, the tables it points to if asked */
function Table({ n, v }: { n: ErdNode; v: Values }) {
  const kind = sourceOf(n, v);
  return (
    <div style={{ width: WIDTH }}>
      <Card position="fill" concept={frameOf(kind)}>
        <Header name={n.name} kind={kind} view={n.kind === "view"} />
        {v.showDescription && n.description ? <Stack divider="bottom" concept="knowledge-erd-band"><span element="type--body-small">{n.description}</span></Stack> : null}
        <div style={{ maxHeight: LIST, overflowY: "auto" }}>
          {n.fields.map((f, i) => <FieldRow key={f.name} n={n} f={f} v={v} first={i === 0} />)}
        </div>
        {n.checks?.length ? (
          <Stack dir="col" scale="3xs" divider="top" concept="knowledge-erd-band">
            <span element="type--body-extra-small" emphasis="quiet">CHECKS</span>
            {n.checks.map((k, i) => <span key={i} element="type--code" title={k.name ?? undefined}>{k.expression}</span>)}
          </Stack>
        ) : null}
        {v.showPointsTo && n.pointsTo?.length ? (
          <Stack dir="col" scale="3xs" divider="top" concept="knowledge-erd-band">
            <span element="type--body-extra-small" emphasis="quiet">POINTS TO</span>
            <span element="type--code" concept="knowledge-erd-link">{n.pointsTo.join(" · ")}</span>
          </Stack>
        ) : null}
      </Card>
    </div>
  );
}

/** the hover card of the ERD page, as the page does it: it opens where the pointer rests on the node (still for 250 ms) and stays where it opened, beside the pointer: 14 px to its right, or to its left when the pointer is less than 500 px from the right edge of the browser window; its top starts 14 px under the pointer and, once its height is measured, is kept at least 8 px inside the screen. It stays while the pointer is on the node or on the card, closes 350 ms after it leaves both,
 *  and at once on a press. The floating box is a plain positioned element (the library's hover card can only sit beside an element, not at a pointer); what it holds is the library's card. */
/** how much room there is between the pointer and the right edge of the browser window, in the window's own coordinates: when the component lives in a frame (the cockpit), the pointer is moved by where the frame sits in the window */
function roomRight(clientX: number): number {
  try {
    const top = window.top ?? window;
    const frame = top === window ? null : window.frameElement;
    const offset = frame ? frame.getBoundingClientRect().left : 0;
    return top.innerWidth - (offset + clientX);
  } catch { return window.innerWidth - clientX; }   // a frame of another origin: its own window
}
const OPEN_AFTER = 250, GRACE = 350, OFFSET = 14, EDGE = 8, NEEDS_RIGHT = 500;
function PointerCard({ body, card }: { body: ReactNode; card: ReactNode }) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const [top, setTop] = useState(0);
  const opening = useRef<number | null>(null), closing = useRef<number | null>(null), box = useRef<HTMLDivElement>(null);
  const shut = useRef(false);   // pressed: no card until the pointer has left the node
  const clear = (t: typeof opening) => { if (t.current) window.clearTimeout(t.current); t.current = null; };
  useEffect(() => () => { clear(opening); clear(closing); }, []);
  const move = (e: ReactMouseEvent) => {
    clear(closing);
    if (at || e.buttons || shut.current) return;
    clear(opening);
    const x = e.clientX, y = e.clientY;
    opening.current = window.setTimeout(() => setAt({ x, y }), OPEN_AFTER);
  };
  const leave = () => { clear(opening); shut.current = false; if (!closing.current) closing.current = window.setTimeout(() => { closing.current = null; setAt(null); }, GRACE); };
  const press = () => { clear(opening); clear(closing); shut.current = true; setAt(null); };
  useLayoutEffect(() => {
    if (!at || !box.current) return;
    setTop(Math.max(EDGE, Math.min(at.y + OFFSET, window.innerHeight - box.current.offsetHeight - EDGE)));
  }, [at]);
  // to the right, unless the pointer is less than 500 px from the right edge of the browser window (the top window, also when the component is in a frame)
  const left = at ? (roomRight(at.x) < NEEDS_RIGHT ? at.x - WIDTH - OFFSET : at.x + OFFSET) : 0;
  return (
    <>
      <div concept="erd-node-previewer" onMouseMove={move} onMouseLeave={leave} onMouseDownCapture={press}>{body}</div>
      {at ? createPortal(
        <div ref={box} concept="erd-node-previewer" onMouseEnter={() => clear(closing)} onMouseLeave={leave} style={{ position: "fixed", left, top, width: WIDTH, zIndex: 100000, userSelect: "text" }}>{card}</div>,
        document.body,
      ) : null}
    </>
  );
}

/** the erd node previewer: the data comes from the host (a fixture here); the layout and its switches from the consumer. The hover card is the page's: the fields, the description above and the tables it points to below. */
export function Previewer({ layout: layoutProp, v: given, data }: { layout?: string; v?: Values; data: ErdNode }) {
  const layout = layoutProp ?? spec.layouts[0].id;
  const v: Values = { ...defaultsOf(layout), ...given };
  const n = data, kind = sourceOf(n, v);
  const fks = n.fields.filter((f) => f.fk).length;
  const body = layout === "fields" ? (
    <Table n={n} v={v} />
  ) : layout === "compact" ? (
    <Card position="hug" concept={frameOf(kind, " knowledge-erd-node-compact")}>
      <Header name={n.name} kind={kind} view={n.kind === "view"} />
      <Stack dir="row" scale="sm" align="center" concept="knowledge-erd-band">
        <span element="type--body-extra-small" emphasis="quiet">{n.fields.length} field{n.fields.length === 1 ? "" : "s"}</span>
        {v.showForeignKeys && fks > 0 ? <span element="type--body-extra-small" concept="knowledge-erd-link">• {fks} FK</span> : null}
      </Stack>
    </Card>
  ) : (
    <Card position="hug" concept={frameOf(kind)}>
      <Stack align="center" concept="knowledge-erd-label"><span element="type--body" style={{ fontWeight: 500 }}>{n.name}</span></Stack>
    </Card>
  );
  if (!v.tooltip) return <div concept="erd-node-previewer">{body}</div>;
  return <PointerCard body={body} card={<Table n={n} v={{ ...v, showDescription: true, showPointsTo: true, showDetails: true }} />} />;
}
