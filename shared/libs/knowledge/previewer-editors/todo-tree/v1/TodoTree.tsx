import { useEffect, useRef, useState } from "react";
import { Button, Checkbox, Icon, Input, Text, Textarea, Tile } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";

// A nested to-do: any depth, numbered by position, checkable, editable, dragged into order and into nesting.
// One way of dragging, for every row at every level:
//   grab the handle · the row shows where the drop lands · release.
//   a row has three zones: top = before it · bottom = after it · middle = inside it, as its last child.
//   top and bottom act at once. The middle acts only after the pointer stays in it for half a second
//   (until then the nearest line shows), so passing through never flickers; once inside, it stays inside
//   however the pointer moves within the middle, and changes only when the pointer enters another zone.
//   below an open row that has children, "after" means first child (the line is indented one level).
// A row can be expanded only if it has children. The title is required; the detail is optional and never competes with the title: an "i" chip on the row shows it on hover; it is read in full only while editing.

/** an item: every item can have items inside it, at any depth. `createdAt` is set when it is made, `completedAt` when it is ticked (a group is done when everything inside it is). */
export type Node = { id: string; title: string; detail?: string; done?: boolean; createdAt?: string; completedAt?: string; children: Node[] };
type Pos = "before" | "after" | "into" | "first";

/** the drop line, and the highlight of a row being dropped INTO: the theme's primary, as an outline and a tint, so it shows whatever the theme does with a tile's border */
const accent = "var(--primary)";
const INTO: React.CSSProperties = { outline: `2px solid ${accent}`, outlineOffset: -2, backgroundColor: "color-mix(in srgb, var(--primary) 12%, var(--bg))" };

// ── pure tree functions ──────────────────────────────────────────────────────────────────────
export const leaves = (n: Node): Node[] => (n.children.length ? n.children.flatMap(leaves) : [n]);
const contains = (n: Node, id: string): boolean => n.id === id || n.children.some((c) => contains(c, id));
const map = (ns: Node[], f: (n: Node) => Node): Node[] => ns.map((n) => { const m = f(n); return { ...m, children: map(m.children, f) }; });
const take = (ns: Node[], id: string): [Node[], Node | null] => {
  let got: Node | null = null;
  const walk = (list: Node[]): Node[] => list.flatMap((n) => { if (n.id === id) { got = n; return []; } return [{ ...n, children: walk(n.children) }]; });
  return [walk(ns), got];
};
const put = (ns: Node[], target: string, pos: Pos, node: Node): Node[] =>
  ns.flatMap((n) => {
    if (n.id === target) {
      if (pos === "before") return [node, n];
      if (pos === "after") return [n, node];
      if (pos === "first") return [{ ...n, children: [node, ...n.children] }];
      return [{ ...n, children: [...n.children, node] }];
    }
    return [{ ...n, children: put(n.children, target, pos, node) }];
  });
export const move = (ns: Node[], src: string, target: string, pos: Pos): Node[] => {
  const [rest, node] = take(ns, src); if (!node || contains(node, target)) return ns;
  return put(rest, target, pos, node);
};
const addTo = (ns: Node[], parent: string | null, node: Node): Node[] => parent === null ? [...ns, node] : map(ns, (n) => (n.id === parent ? { ...n, children: [...n.children, node] } : n));
const remove = (ns: Node[], id: string): Node[] => take(ns, id)[0];
const subtree = (n: Node): string[] => [n.id, ...n.children.flatMap(subtree)];
/** the ids of the items above `id`, from the top down */
const ancestorsOf = (ns: Node[], id: string): string[] => { const walk = (list: Node[], path: string[]): string[] | null => { for (const n of list) { if (n.id === id) return path; const f = walk(n.children, [...path, n.id]); if (f) return f; } return null; }; return walk(ns, []) ?? []; };
/** the items above a changed one take what is inside them: done when everything inside is done */
const settle = (ns: Node[], above: Set<string>, now: string): Node[] => ns.map((n) => {
  const children = settle(n.children, above, now);
  if (above.has(n.id) && children.length) { const all = children.every((c) => c.done); return { ...n, children, done: all, completedAt: all ? n.completedAt ?? now : undefined }; }
  return { ...n, children };
});
export const newId = () => "n" + Math.random().toString(36).slice(2, 8);
/** a new item, made now */
export const newNode = (title = "New item"): Node => ({ id: newId(), title, createdAt: new Date().toISOString(), children: [] });

/** what a row shows besides its title: the schema's switches (the spec) */
export type TodoShow = { path: boolean; progress: boolean; detail: boolean; created: boolean; completed: boolean; duration: boolean };
export const SHOW: TodoShow = { path: true, progress: true, detail: true, created: false, completed: false, duration: false };
// Dates are written plainly here; the project's format library will replace them (smart dates, durations, time ago).
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
const took = (from: string, to: string) => { const d = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000); return d < 1 ? "took under a day" : `took ${d} day${d === 1 ? "" : "s"}`; };

// ── the component ────────────────────────────────────────────────────────────────────────────
export function TodoTree({ nodes, onChange, closed, onClosed, hideDone = false, show: showGiven, editId, expandOnClick = false, editOnDoubleClick = false, buttons: buttonsGiven, cascadeDown = true, cascadeUp = true }: {
  nodes: Node[]; onChange: (n: Node[]) => void;
  /** the rows that are collapsed, by id: the consumer keeps them */
  closed: Record<string, boolean>; onClosed: (c: Record<string, boolean>) => void;
  /** the items that are done are not drawn (a group is done when everything inside it is) */
  hideDone?: boolean;
  /** what a row shows besides its title (the schema's switches); the path, the progress and the detail are on by default, the dates off */
  show?: Partial<TodoShow>;
  /** an item to open for editing now (the consumer added it: the actions are not part of the tree) */
  editId?: string | null;
  /** a click on the title opens or closes the item (default off); independent of the buttons: both can be on */
  expandOnClick?: boolean;
  /** a double click on the title starts editing it (default off); independent of the buttons */
  editOnDoubleClick?: boolean;
  /** which of the add and edit buttons at the end of a row are drawn (default both); a place stays empty when its button is off, so the others do not move. The open arrow of an item with items inside is always there: it says who has children, whatever else opens it. */
  buttons?: Partial<{ add: boolean; edit: boolean }>;
  /** ticking an item ticks everything inside it, and unticking unticks it (default on) */
  cascadeDown?: boolean;
  /** when everything inside an item is ticked the item is ticked, and when one is unticked it is too (default on) */
  cascadeUp?: boolean;
}) {
  const show: TodoShow = { ...SHOW, ...showGiven };
  const buttons = { add: true, edit: true, ...buttonsGiven };
  const [editing, setEditing] = useState<string | null>(null);
  useEffect(() => { if (editId) setEditing(editId); }, [editId]);
  const [drop, setDrop] = useState<{ id: string; pos: Pos } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const drag = useRef<string | null>(null);
  const hover = useRef<string | null>(null), dwell = useRef<ReturnType<typeof setTimeout>>(undefined);
  const DWELL_MS = 500;

  const patch = (id: string, f: Partial<Node>) => onChange(map(nodes, (n) => (n.id === id ? { ...n, ...f } : n)));
  // a tick, with the two cascades: down (the item and everything inside it) and up (the items that contain it follow what is inside them)
  const isDone = (n: Node): boolean => (cascadeUp && n.children.length ? n.children.every(isDone) : !!n.done);
  const toggle = (n: Node, done: boolean) => {
    const now = new Date().toISOString();
    const inside = cascadeDown ? new Set(subtree(n)) : new Set([n.id]);
    const set = (x: Node, d: boolean): Node => ({ ...x, done: d, completedAt: d ? x.completedAt ?? now : undefined });
    let next = map(nodes, (x) => (inside.has(x.id) ? set(x, done) : x));
    if (cascadeUp) { const above = new Set(ancestorsOf(nodes, n.id)); next = settle(next, above, now); }
    onChange(next);
  };
  const add = (parent: string | null) => { const n = newNode(); onChange(addTo(nodes, parent, n)); if (parent) onClosed({ ...closed, [parent]: false }); setEditing(n.id); };
  const del = (n: Node) => { if (n.children.length && !confirm("Delete this and everything inside it?")) return; onChange(remove(nodes, n.id)); setEditing(null); };
  const finishEdit = (n: Node) => { if (!n.title.trim()) return; setEditing(null); };

  const band = (e: React.DragEvent): "top" | "mid" | "bottom" => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect(), y = (e.clientY - r.top) / r.height;
    return y < 0.28 ? "top" : y > 0.72 ? "bottom" : "mid";
  };
  const edge = (n: Node, below: boolean): Pos => (!below ? "before" : n.children.length > 0 && !closed[n.id] ? "first" : "after");
  // while dragging, the list scrolls when the pointer is near the top or the bottom of its scroll area
  const autoScroll = (e: React.DragEvent) => {
    let el: HTMLElement | null = e.currentTarget as HTMLElement;
    while (el && !/(auto|scroll)/.test(getComputedStyle(el).overflowY)) el = el.parentElement;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (e.clientY < r.top + 50) el.scrollBy(0, -14); else if (e.clientY > r.bottom - 50) el.scrollBy(0, 14);
  };
  const onOver = (e: React.DragEvent, n: Node) => {
    const src = drag.current; if (!src) return;
    const srcNode = findNode(nodes, src); if (!srcNode || contains(srcNode, n.id)) { setDrop(null); return; }
    e.preventDefault(); autoScroll(e);
    const bd = band(e), key = n.id + ":" + bd;
    if (hover.current === key) return;   // still in the same zone: nothing changes, nothing flickers
    hover.current = key; clearTimeout(dwell.current);
    if (bd === "mid") {
      // the nearest line until the pointer has stayed in the middle for DWELL_MS
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect(), below = e.clientY - r.top > r.height / 2;
      setDrop({ id: n.id, pos: edge(n, below) });
      dwell.current = setTimeout(() => { if (hover.current === key) setDrop({ id: n.id, pos: "into" }); }, DWELL_MS);
    } else setDrop({ id: n.id, pos: edge(n, bd === "bottom") });
  };
  const onDrop = (e: React.DragEvent, n: Node) => {
    e.preventDefault(); clearTimeout(dwell.current); hover.current = null; const src = drag.current, d = drop; drag.current = null; setDragging(null); setDrop(null);
    if (!src || !d || d.id !== n.id) return;
    onChange(move(nodes, src, n.id, d.pos));
    if (d.pos === "into" || d.pos === "first") onClosed({ ...closed, [n.id]: false });
  };

  // a plain function, not a component: a component defined here would be a new type on every render and remount every row, which cancels a drag
  /** the items drawn, with their place among all their siblings (the numbers do not shift when the done ones are hidden) */
  const drawn = (ns: Node[]): [Node, number][] => ns.map((n, i) => [n, i] as [Node, number]).filter(([n]) => !(hideDone && isDone(n)));
  const completedOf = (n: Node): string | undefined => (n.children.length ? (isDone(n) ? n.completedAt ?? subtree(n).slice(1).map((id) => findNode(nodes, id)?.completedAt).filter((d): d is string => !!d).sort().pop() : undefined) : n.completedAt);
  const row = (n: Node, path: string, depth: number): React.ReactNode => {
    const ls = leaves(n), doneCount = ls.filter((l) => l.done).length, all = isDone(n), hasKids = n.children.length > 0, open = !closed[n.id], ed = editing === n.id;
    const here = drop?.id === n.id ? drop.pos : null;
    const completed = completedOf(n);
    return (
      <Stack key={n.id} dir="col">
        {/* the row is a Tile, laid out by a Stack; what is inline is what the data and the drag decide at runtime: the indent, the fade, the drop highlight */}
        <Tile data-row className="relative" onDragOver={(e: React.DragEvent) => onOver(e, n)} onDrop={(e: React.DragEvent) => onDrop(e, n)} onDragLeave={(e: React.DragEvent) => { if (e.currentTarget.contains(e.relatedTarget as globalThis.Node | null)) return; clearTimeout(dwell.current); hover.current = null; setDrop((d) => (d && d.id === n.id ? null : d)); }}
          style={{ ...(here === "into" ? INTO : {}), opacity: dragging === n.id ? 0.35 : all ? 0.5 : 1, marginLeft: depth * 26, marginTop: 6 }}>
          {here === "before" && <Line top />}
          {here === "after" && <Line />}
          {here === "first" && <Line indent />}
          <Stack dir="row" scale="sm">
            <Text type="body-small" emphasis="quiet" draggable title="drag to move" className="inline-flex shrink-0 cursor-grab select-none items-center"
              onDragStart={(e: React.DragEvent) => { drag.current = n.id; setDragging(n.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", n.id); const r = (e.currentTarget as HTMLElement).closest("[data-row]") as HTMLElement; if (r) e.dataTransfer.setDragImage(r, 20, 16); }}
              onDragEnd={() => { clearTimeout(dwell.current); hover.current = null; drag.current = null; setDragging(null); setDrop(null); }}><Icon name="gripVertical" scale="xs" /></Text>
            <Stack dir="row" align="start" className="shrink-0"><Checkbox scale="sm" title={all ? "reopen" : "mark done"} checked={all} onCheckedChange={() => toggle(n, !all)} /></Stack>
            <Stack dir="col" scale="xs" size="fill" className="min-w-0">
              {ed ? (
                <>
                  <Input autoFocus value={n.title} onChange={(title: string) => patch(n.id, { title })} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") finishEdit(n); }} placeholder="Title (required)" status={n.title.trim() ? undefined : "error"} />
                  <Textarea rows={2} value={n.detail ?? ""} onChange={(detail: string) => patch(n.id, { detail: detail || undefined })} placeholder="Detail (optional)" />
                  {!n.title.trim() && <Text type="body-extra-small" status="error">a title is required</Text>}
                  <Stack dir="row" scale="sm">
                    <Button scale="sm" onClick={() => finishEdit(n)} disabled={!n.title.trim()}>done</Button>
                    <Button emphasis="tertiary" status="error" scale="sm" onClick={() => del(n)}>delete</Button>
                  </Stack>
                </>
              ) : (
                /* the title and what goes with it share a line: the title is the part that grows, what goes with it follows it, and the line wraps only when the title is too long */
                <Stack dir="row" wrap align="baseline" scale="sm" className="min-w-0">
                  {show.path && <Text type="body-extra-small" emphasis="quiet">{path}</Text>}
                  <Text type={depth ? "body-small" : "body"} onClick={expandOnClick && hasKids ? () => onClosed({ ...closed, [n.id]: open }) : undefined} onDoubleClick={editOnDoubleClick ? () => setEditing(n.id) : undefined}
                    className={`min-w-0 break-words ${depth ? "font-medium" : "font-semibold"} ${all ? "line-through" : ""} ${expandOnClick && hasKids ? "cursor-pointer" : ""}`}>{n.title}</Text>
                  {show.progress && hasKids && <Text type="body-extra-small" emphasis="quiet" className="shrink-0">{doneCount}/{ls.length}</Text>}
                  {show.detail && n.detail && <Text type="body-small" emphasis="quiet" title={n.detail} className="inline-flex shrink-0 cursor-help self-center"><Icon name="info" scale="xs" /></Text>}
                  {show.created && n.createdAt && <Text type="body-extra-small" emphasis="quiet" className="shrink-0">created {day(n.createdAt)}</Text>}
                  {show.completed && completed && <Text type="body-extra-small" emphasis="quiet" className="shrink-0">done {day(completed)}</Text>}
                  {show.duration && completed && n.createdAt && <Text type="body-extra-small" emphasis="quiet" className="shrink-0">{took(n.createdAt, completed)}</Text>}
                </Stack>
              )}
            </Stack>
            {/* three places: add, edit, open; a place whose button is off, or a row with nothing inside, stays empty, so everything lines up at every level. The open arrow is never off: it says who has children. */}
            <Stack dir="row" scale="2xs" align="start" className="shrink-0">
              <Stack dir="row" justify="center" className="w-[26px]">{buttons.add ? <Button buttonType="icon" startIcon="add" emphasis="tertiary" scale="xs" aria-label="add inside" title="add inside" onClick={() => add(n.id)} /> : null}</Stack>
              <Stack dir="row" justify="center" className="w-[26px]">{buttons.edit ? <Button buttonType="icon" startIcon="edit" emphasis={ed ? "secondary" : "tertiary"} scale="xs" aria-label={ed ? "done editing" : "edit"} title={ed ? "done editing" : "edit"} onClick={() => (ed ? finishEdit(n) : setEditing(n.id))} /> : null}</Stack>
              <Stack dir="row" justify="center" className="w-[26px]">{hasKids ? <Button buttonType="icon" startIcon={open ? "chevronDown" : "chevronRight"} emphasis="tertiary" scale="xs" aria-label={open ? "collapse" : "expand"} title={open ? "collapse" : "expand"} onClick={() => onClosed({ ...closed, [n.id]: open })} /> : null}</Stack>
            </Stack>
          </Stack>
        </Tile>
        {hasKids && open && drawn(n.children).map(([c, j]) => row(c, `${path}.${j + 1}`, depth + 1))}
      </Stack>
    );
  };

  return <Stack dir="col">{drawn(nodes).map(([n, i]) => row(n, String(i + 1), 0))}</Stack>;
}

const findNode = (ns: Node[], id: string): Node | null => { for (const n of ns) { if (n.id === id) return n; const f = findNode(n.children, id); if (f) return f; } return null; };
export const idsWithChildren = (ns: Node[]): string[] => ns.flatMap((n) => (n.children.length ? [n.id, ...idsWithChildren(n.children)] : []));

/** the line that says where a dragged row lands: a Stack placed over the row's edge (the class), in the theme's primary (the one inline value: it draws a state the drag decides) */
const Line = ({ top, indent }: { top?: boolean; indent?: boolean }) => <Stack dir="row" concept="knowledge-todo-drop-line" className={`pointer-events-none absolute right-0 h-[3px] ${top ? "-top-[6px]" : "-bottom-[6px]"} ${indent ? "left-[26px]" : "left-0"}`}>{null}</Stack>;
