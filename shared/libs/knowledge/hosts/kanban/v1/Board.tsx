// The kanban board. It fills the box the consumer gives (never under 350px high) and scrolls inside it, down and sideways; the column headers stick to the top of that area.
// Pure: the cards and columns in, events out. The collapsed columns and the look are the board's state, seeded by the consumer (`collapsed`, `look`) and told back
// by events, so a consumer that wants them kept saves them. Dragging is the library's way (list-draggable): grab the card, the drop line says where it lands — before or after the card
// under the pointer, in any column, or at the end of an empty one — release. The order of the cards array is the order inside the columns.
import { useEffect, useRef, useState } from "react";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, pointerWithin, useDraggable, useDroppable, useSensor, useSensors, type CollisionDetection, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import { Badge } from "../../../../ui/web/primitives/components/badge/v1";
import { Button } from "../../../../ui/web/primitives/components/button/v1";
import { Tile } from "../../../../ui/web/primitives/components/tile/v1";
import { Stack } from "../../../../ui/web/primitives/components/stack/v1";
import type { Values } from "../../../previewer-editors/types";
import { spec } from "./spec";
import type { Kanban, KanbanCard, KanbanEvent, KanbanLook } from "./types";
import { KanbanHeader } from "./Header";
import { poolOf, sectionsOf, tagStyle, withTagColours, type KanbanColors } from "./palette";
import { NO_FILTER, passes, type KanbanFilter } from "./filter";

const defaultsOf = (layout: string): Values => { const l = spec.layouts.find((x) => x.id === layout); return Object.fromEntries([...(l?.props ?? []), ...(l?.hover ?? [])].map((p) => [p.name, p.default])); };
const WIDTH: Record<string, number> = { narrow: 220, regular: 270, wide: 340 };
/** the drop line and the highlight of a column being dropped on: the theme's primary */
const accent = "var(--primary)";

/** where the dragged card lands: a column and an index among its cards */
type Drop = { column: string; index: number };
const collision: CollisionDetection = (args) => { const p = pointerWithin(args); return p.length ? p : closestCenter(args); };
function pointerY(e: DragMoveEvent): number | null {
  const ev = e.activatorEvent as Partial<PointerEvent> & Partial<TouchEvent>;
  const y0 = typeof ev.clientY === "number" ? ev.clientY : ev.touches?.[0]?.clientY;
  if (typeof y0 === "number") return y0 + e.delta.y;
  const t = e.active.rect.current.translated;
  return t ? t.top + t.height / 2 : null;
}

export function KanbanBoard({ layout: layoutProp, v: given, data: d, collapsed: seedCollapsed, look: seedLook, colors, tagColors: seedTagColors, onEvent }: { layout?: string; v?: Values; data: Kanban; /** the columns that start collapsed */ collapsed?: string[]; /** the look to start from, over the switches */ look?: Partial<KanbanLook>; /** the colours offered for the tags and the columns (hex or theme tokens); the board has its own palette */ colors?: KanbanColors; /** the colours the tags have, kept by the consumer */ tagColors?: Record<string, string>; onEvent?: (e: KanbanEvent) => void }) {
  const layout = layoutProp ?? spec.layouts[0].id;
  const v: Values = { ...defaultsOf(layout), ...given };
  const [closed, setClosed] = useState<Set<string>>(new Set(seedCollapsed ?? []));
  // the look starts from the switches, then from what the consumer kept; the header lets the reader change it, and the filter is the header's
  const [look, setLookState] = useState<KanbanLook>({ view: v.view === "compact" ? "compact" : "expanded", showTags: !!v.showTags, columnWidth: (["narrow", "regular", "wide"] as const).find((x) => x === v.columnWidth) ?? "regular", ...seedLook });
  const setLook = (l: KanbanLook) => { setLookState(l); onEvent?.({ type: "look-changed", look: l }); };
  // what the consumer kept may arrive after the board is up (it is fetched); when it changes, the board follows it
  const seedLookKey = JSON.stringify(seedLook ?? null), seedCollapsedKey = JSON.stringify(seedCollapsed ?? null);
  useEffect(() => { if (seedLook) setLookState((l) => ({ ...l, ...seedLook })); }, [seedLookKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (seedCollapsed) setClosed(new Set(seedCollapsed)); }, [seedCollapsedKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [filter, setFilter] = useState<KanbanFilter>(NO_FILTER);
  const compact = look.view === "compact";
  const width = WIDTH[look.columnWidth];
  const shown: Values = { ...v, showTags: look.showTags };
  const cards = v.showHeader ? d.cards.filter((c) => passes(c, filter)) : d.cards;
  const tags = [...new Set(d.cards.flatMap((c) => c.tags ?? []))].sort();
  // the tags' colours: what the consumer kept, then each new tag takes the next colour of the palette no tag has; the reader may change them in the tags window
  const tagSections = sectionsOf(colors, "tags");
  const [tagColors, setTagColorsState] = useState<Record<string, string>>(seedTagColors ?? {});
  const setTagColors = (c: Record<string, string>) => { setTagColorsState(c); onEvent?.({ type: "tag-colors-changed", colors: c }); };
  const seedTagKey = JSON.stringify(seedTagColors ?? null);
  useEffect(() => { if (seedTagColors) setTagColorsState(seedTagColors); }, [seedTagKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const tagKey = tags.join("|");
  useEffect(() => { const next = withTagColours(tags, tagColors, poolOf(colors, "tags")); if (tags.some((t) => !tagColors[t])) setTagColors(next); }, [tagKey]); // eslint-disable-line react-hooks/exhaustive-deps
  /** where a double click on a column's free space lands among ALL the column's cards, from its place among the cards shown (a filter may hide some) */
  const fullIndex = (column: string, shownCards: KanbanCard[], at: number) => {
    const all = d.cards.filter((c) => c.column === column);
    if (at < shownCards.length) return all.indexOf(shownCards[at]);
    const last = shownCards[shownCards.length - 1];
    return last ? all.indexOf(last) + 1 : all.length;
  };
  const columnTone = (id: string, i: number) => d.columns.find((x) => x.id === id)?.tone ?? poolOf(colors, "columns")[i % Math.max(1, poolOf(colors, "columns").length)] ?? accent;
  const toggle = (id: string) => { const now = !closed.has(id); setClosed((c) => { const n = new Set(c); now ? n.add(id) : n.delete(id); return n; }); onEvent?.({ type: "column-toggled", column: id, collapsed: now }); };

  // the drag: the card under the pointer and which half of it says before or after; a column's empty space says last
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);
  const zone = useRef<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }), useSensor(KeyboardSensor));
  const active = activeId ? d.cards.find((c) => c.id === activeId) ?? null : null;
  const onDragStart = (e: DragStartEvent) => { setActiveId(String(e.active.id).slice(5)); setDrop(null); zone.current = null; };
  const onDragMove = (e: DragMoveEvent) => {
    const over = e.over, y = pointerY(e);
    if (!over || y === null) { zone.current = null; setDrop(null); return; }
    const id = String(over.id);
    if (id.startsWith("col:")) { const column = id.slice(4); const key = "col:" + column; if (zone.current === key) return; zone.current = key; setDrop({ column, index: cards.filter((c) => c.column === column && c.id !== activeId).length }); return; }
    const cardId = id.slice(5), target = cards.find((c) => c.id === cardId);
    if (!target || cardId === activeId) return;
    const r = over.rect, below = (y - r.top) / r.height > 0.5, key = cardId + ":" + (below ? "b" : "t");
    if (zone.current === key) return;
    zone.current = key;
    const inColumn = cards.filter((c) => c.column === target.column && c.id !== activeId);
    setDrop({ column: target.column, index: inColumn.indexOf(target) + (below ? 1 : 0) });
  };
  const finish = () => { setActiveId(null); setDrop(null); zone.current = null; };
  const onDragEnd = (e: DragEndEvent) => { const id = String(e.active.id).slice(5); if (drop) onEvent?.({ type: "card-moved", id, column: drop.column, index: drop.index }); finish(); };
  useEffect(() => { const k = (ev: KeyboardEvent) => { if (ev.key === "Escape") finish(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);

  return (
    <div concept="kanban" data-testid={`kanban-${d.id}`} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 350, minWidth: 0, height: "100%", boxSizing: "border-box" }}>
      <DndContext sensors={sensors} collisionDetection={collision} onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd} onDragCancel={finish}>
        {/* the board's own scroll area: down and sideways. The header scrolls away with the body, as before; only the column headers stick, to the top of this area */}
        <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {v.showHeader ? <div style={{ position: "sticky", left: 0, width: "100%", zIndex: 30 }}><KanbanHeader filter={filter} setFilter={setFilter} tags={tags} tagColors={tagColors} setTagColors={setTagColors} tagSections={tagSections} look={look} setLook={setLook} parts={{ search: !!v.headerSearch, filter: !!v.headerFilter, view: !!v.headerView, tags: !!v.headerTags, width: !!v.headerWidth }} /></div> : null}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${d.columns.length}, ${width}px)`, width: "max-content", gap: 14, alignItems: "start", paddingBottom: 24 }}>
          {d.columns.map((col, ci) => {
            const tone = columnTone(col.id, ci);
            const list = cards.filter((c) => c.column === col.id);
            const others = list.filter((c) => c.id !== activeId);
            const shut = closed.has(col.id);
            const here = drop?.column === col.id ? drop.index : null;
            return (
              <Column key={col.id} id={col.id} tone={tone} shut={shut} name={col.name} count={list.length} over={here !== null} onAddAt={v.addable ? (at) => onEvent?.({ type: "card-added", column: col.id, index: fullIndex(col.id, list, at) }) : undefined}
                controls={<Stack dir="row" gap={4}>
                  {v.collapsible ? <Button buttonType="icon" startIcon={shut ? "chevronRight" : "chevronDown"} emphasis="tertiary" scale="xs" aria-label={shut ? "expand the column" : "collapse the column"} onClick={() => toggle(col.id)} /> : null}
                  {v.addable ? <Button buttonType="icon" startIcon="add" emphasis="tertiary" scale="xs" aria-label="add a card here" onClick={() => onEvent?.({ type: "card-added", column: col.id })} /> : null}
                </Stack>}>
                {list.map((c) => { const i = others.indexOf(c); return <CardTile key={c.id} c={c} tone={tone} tagColors={tagColors} v={shown} compact={compact} dragging={c.id === activeId} line={here === null || i < 0 ? null : here === i ? "before" : here === i + 1 && i === others.length - 1 ? "after" : null} onOpen={() => onEvent?.({ type: "card-opened", id: c.id })} />; })}
                {others.length === 0 && here !== null ? <div style={{ height: 0, borderTop: `2px solid ${accent}`, borderRadius: 2 }} /> : null}
              </Column>
            );
          })}
        </div>
        </div>
        <DragOverlay dropAnimation={null}>{active ? <div style={{ width, opacity: .92, transform: "rotate(1.5deg)" }}><CardTile c={active} tone={columnTone(active.column, Math.max(0, d.columns.findIndex((x) => x.id === active.column)))} tagColors={tagColors} v={shown} compact={compact} /></div> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({ id, tone, shut, name, count, over, onAddAt, controls, children }: { id: string; tone: string; shut: boolean; name: string; count: number; over: boolean; /** a double click on the free space of the column: the place, among the cards shown */ onAddAt?: (index: number) => void; controls: React.ReactNode; children: React.ReactNode }) {
  const drop = useDroppable({ id: "col:" + id, disabled: shut });
  // the column is a tile: the theme decides its fill, seam and radius. Its colour (the data's) is the top edge of the header strip, not of the tile, so the strip keeps its colour and its lines (the tile's own `--bg` and `--border-color`) when it sticks and the column's top has scrolled away; the whole seam takes the colour while a card is over it
  return (
    <Tile ref={drop.setNodeRef} onDoubleClick={onAddAt && !shut ? (e: React.MouseEvent<HTMLDivElement>) => {
      const t = e.target as HTMLElement;
      if (t.closest("[data-card]") || t.closest("button") || t.closest("[data-column-header]")) return;
      const y = e.clientY; let at = 0;
      e.currentTarget.querySelectorAll("[data-card]").forEach((el) => { const r = el.getBoundingClientRect(); if (y > r.top + r.height / 2) at++; });
      onAddAt(at);
    } : undefined} style={{ borderTopWidth: 0, ...(over ? { borderColor: tone } : {}), padding: "0 10px 10px", minHeight: shut ? 0 : 200 }}>
      {/* the column header: the name and the count, then collapse/expand and add; it sticks while the board scrolls down */}
      <div data-column-header="" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 -10px 10px", padding: "6px 10px 6px 14px", position: "sticky", top: 0, zIndex: 4, background: "var(--bg)", borderTop: `3px solid ${tone}`, borderBottom: "1px solid var(--border-color)" }}>
        <span element="type--body-extra-small" style={{ letterSpacing: ".14em", textTransform: "uppercase", color: tone }}>{name} · {count}</span>
        {controls}
      </div>
      <div style={{ display: shut ? "none" : "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 8, minHeight: 40 }}>{children}</div>
    </Tile>
  );
}

function CardTile({ c, tone, tagColors, v, compact, dragging = false, line = null, onOpen }: { c: KanbanCard; tone: string; tagColors: Record<string, string>; v: Values; compact: boolean; dragging?: boolean; line?: "before" | "after" | null; onOpen?: () => void }) {
  const drag = useDraggable({ id: "card:" + c.id, disabled: !onOpen });
  const drop = useDroppable({ id: "card:" + c.id, disabled: !onOpen || dragging });
  return (
    <Tile ref={(el: HTMLDivElement | null) => { drag.setNodeRef(el); drop.setNodeRef(el); }} {...drag.attributes} {...drag.listeners} onClick={onOpen} data-card="" data-testid={`kanban-card-${c.id}`}
      style={{ position: "relative", ...(c.dashed ? { borderStyle: "dashed" } : {}), padding: compact ? "7px 10px" : "10px 12px", cursor: onOpen ? "grab" : "default", minWidth: 0, overflowWrap: "anywhere", touchAction: "none", opacity: dragging ? .35 : 1 }}>
      {line === "before" ? <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: -5, height: 0, borderTop: `2px solid ${accent}`, pointerEvents: "none" }} /> : null}
      {line === "after" ? <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: -5, height: 0, borderTop: `2px solid ${accent}`, pointerEvents: "none" }} /> : null}
      {!compact && v.showImage && c.images?.[0] ? <img src={c.images[0]} alt="" draggable={false} style={{ display: "block", width: "100%", maxHeight: 130, objectFit: "cover", marginBottom: 8 }} /> : null}
      <div element={compact ? "type--body-small" : "type--body"} style={{ fontWeight: 650 }}>{c.title}</div>
      {!compact && v.showText && c.text ? <div element="type--body-small" emphasis="quiet" style={{ marginTop: 4 }}>{c.text}</div> : null}
      {!compact && v.showFrom && c.from ? <div element="type--body-extra-small" emphasis="quiet" style={{ marginTop: 6 }}>{c.from}</div> : null}
      {v.showTags && c.tags?.length ? <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: compact ? 5 : 8 }}>{c.tags.map((t) => <Badge key={t} scale="sm" style={tagStyle(tagColors[t] ?? tone)}>{t}</Badge>)}</div> : null}
      {!compact && v.showDate && c.createdAt ? <div element="type--body-extra-small" emphasis="quiet" style={{ marginTop: 6 }}>{new Date(c.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</div> : null}
      {!compact && v.showLinks && c.links?.length ? <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>{c.links.map((l, i) => <a key={i} href={l.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} draggable={false} element="type--body-extra-small" style={{ textDecoration: "underline" }}>{l.label}</a>)}</div> : null}
    </Tile>
  );
}
