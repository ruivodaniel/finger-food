// The canvas note: a sticker on a whiteboard. The library's tile is the sticker, solid pastel, no border, a soft shadow; the text keeps one size at every side and is cut
// with an ellipsis. Hovering shows the note whole in a square card at the pointer (the pointer card, as the ERD node and the compact code snippet have); a double click pins
// that card, and in it a double click on the title or on the text types it in place. The colour is the context bar's. No edit button, no sheet.
import { useEffect, useRef, useState } from "react";
import { Tile } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { Values } from "../types";
import { spec } from "./spec";
import { noteColorCss, type CanvasNote as Data } from "./types";
import type { Edit } from "../editing/types";
import { PointerCard } from "../PointerCard";

const defaultsOf = (layout: string): Values => { const l = spec.layouts.find((x) => x.id === layout); return Object.fromEntries([...(l?.props ?? []), ...(l?.hover ?? [])].map((p) => [p.name, p.default])); };
/** the sticker's side; the text size never changes with it */
const SIDE: Record<string, number> = { tiny: 28, "extra-small": 110, small: 170, medium: 230, large: 300 };
/** how many lines of text fit a side, under the title */
const LINES: Record<string, number> = { tiny: 0, "extra-small": 4, small: 7, medium: 10, large: 14 };
/** the card's side: a square, the text scrolls inside */
const CARD = 360;

/** a zone of the card: shown as text; a double click types it in place; a click outside or ⌘ Enter keeps it, Escape keeps it too */
function Zone({ value, element, bold, placeholder, editable, fill = false, onCommit }: { value: string; element: string; bold?: boolean; placeholder: string; editable: boolean; /** the zone takes the rest of the card and scrolls inside while typed */ fill?: boolean; onCommit: (v: string) => void }) {
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState(value);
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (!typing) setDraft(value); }, [value, typing]);
  // always saving: a debounce while typing, and a flush on leaving by any road (blur, Escape, the card closing, the note unmounting)
  const latest = useRef({ draft, value, onCommit }); latest.current = { draft, value, onCommit };
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flush = () => { clearTimeout(timer.current); const l = latest.current; if (l.draft !== l.value) { l.value = l.draft; l.onCommit(l.draft); } };
  const type = (t: string) => { setDraft(t); latest.current.draft = t; clearTimeout(timer.current); timer.current = setTimeout(flush, 600); };
  useEffect(() => () => flush(), []);
  const keep = () => { flush(); setTyping(false); };
  // a short zone grows with its lines; a filling zone keeps the card's height and scrolls inside, so the caret is always reachable
  const grow = (t: HTMLTextAreaElement) => { if (fill) return; t.style.height = "auto"; t.style.height = `${t.scrollHeight}px`; };
  if (typing) return (
    <textarea ref={area} autoFocus data-canvas-text className="nodrag nopan nowheel" value={draft} onChange={(e) => { type(e.target.value); grow(e.target); }} onFocus={(e) => { e.target.setSelectionRange(e.target.value.length, e.target.value.length); grow(e.target); }}
      onBlur={keep} onKeyDown={(e) => { if (e.key !== "Escape") e.stopPropagation(); else keep(); if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) area.current?.blur(); }} onMouseDown={(e) => e.stopPropagation()}
      element={element} rows={1} style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", padding: 0, margin: 0, fontFamily: "inherit", fontWeight: bold ? 600 : undefined, ...(fill ? { flex: 1, minHeight: 0, overflowY: "auto" } : { overflow: "hidden" }) }} />
  );
  return <span element={element} style={{ fontWeight: bold ? 600 : undefined, whiteSpace: "pre-wrap", opacity: value ? 1 : 0.35, cursor: editable ? "text" : undefined, ...(fill ? { flex: 1, minHeight: 0, overflowY: "auto" } : {}) }} onDoubleClick={(e) => { if (!editable) return; e.stopPropagation(); setDraft(value); setTyping(true); }}>{value || (editable ? placeholder : "")}</span>;
}

export function CanvasNote({ layout: layoutProp, v: given, data: d, edit }: { layout?: string; v?: Values; data: Data; edit?: Edit<Data> }) {
  const layout = layoutProp ?? spec.layouts[0].id;
  const v: Values = { ...defaultsOf(layout), ...given };
  const size = String(v.size), side = SIDE[size] ?? SIDE.small;
  const c = noteColorCss(d.color);
  const tiny = size === "tiny";
  const title = !!v.showTitle && d.title;
  const lines = Math.max(0, LINES[size] - (title ? 1 : 0));
  const clamp: React.CSSProperties = { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines, overflow: "hidden" };
  // the sticker is the note's colour as given (a theme token follows the theme's mode; a typed colour is drawn as typed); the text is the theme's foreground
  const bg = c;
  const textColor = "var(--foreground)";
  // the shadow is the theme's (the knowledge add-on, effect knowledge-note); the paper gradient stays here
  const paper = `linear-gradient(180deg, color-mix(in srgb, var(--foreground) 2%, transparent), color-mix(in srgb, var(--background) 14%, transparent)), ${bg}`;
  const save = (p: Partial<Data>) => { void edit?.onSubmit({ ...d, ...p }); };
  // the sticker: a solid pastel of the note's colour, a soft shadow, no border
  const body = (
    <div concept="knowledge-note-sticker" style={{ display: "inline-flex", flexShrink: 0 }} data-testid={`canvas-note-${d.id}`}>
      <Tile style={{ width: side, height: side, overflow: "hidden", background: paper, color: textColor }}>
        {tiny ? null : (
          <Stack dir="col" scale="3xs" clip concept="knowledge-note-body">
            {title ? <span element="type--body" className="truncate" style={{ fontWeight: 600 }}>{d.title}</span> : null}
            {lines > 0 && d.text ? <span element="type--body-small" style={clamp}>{d.text}</span> : null}
          </Stack>
        )}
      </Tile>
    </div>
  );
  // the card: the note whole, a square; two zones, the title and the text, each typed in place on a double click
  const card = (
    <Tile concept="knowledge-note-sticker" style={{ width: CARD, height: CARD, background: paper, color: textColor, overflow: "hidden" }}>
      <Stack dir="col" scale="xs" clip concept="knowledge-note-body">
        {/* the title is the card's header: it stays in sight, only the text scrolls under it */}
        <div style={{ flexShrink: 0 }}><Zone value={d.title ?? ""} element="type--body" bold placeholder="title" editable={!!edit} onCommit={(t) => save({ title: t.trim() || undefined })} /></div>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}><Zone value={d.text} element="type--body-small" placeholder="text" editable={!!edit} fill onCommit={(t) => save({ text: t })} /></div>
      </Stack>
    </Tile>
  );
  return <PointerCard width={CARD} pinnable testid={`canvas-note-card-${d.id}`} body={body} card={card} />;
}
