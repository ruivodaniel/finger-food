import * as React from "react";
import { createPortal } from "react-dom";
import { DataGrid, Row as GridRow, SelectColumn, renderTextEditor, type Column, type RenderRowProps } from "react-data-grid";
import "react-data-grid/lib/styles.css";

import { Badge } from "../../badge/v1/badge";
import { Button } from "../../button/v1/button";
import { Checkbox } from "../../checkbox/v1/checkbox";
import { DatePicker } from "../../date-picker/v1/date-picker";
import { Input } from "../../input/v1/input";
import { InputSelect } from "../../input-select/v1/input-select";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover/v1/popover";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../../pagination/v1/pagination";
import { evaluate, letterOf } from "./formula";
import type { RichTableCellType, RichTableColumn, RichTableProps, RichTableQuery, RichTableRow, RichTableSort, RichTableView } from "./types";

type Row = RichTableRow;
const CELL_TYPES: RichTableCellType[] = ["text", "number", "boolean", "date", "tag", "link"];

/** the grid draws itself with its own variables; the theme's colours are mapped onto them here, so a theme change restyles it (dark mode too) */
const themeVars = {
  "--rdg-color": "var(--foreground)",
  "--rdg-background-color": "var(--background)",
  "--rdg-header-background-color": "var(--color-gray-50, var(--background))",
  "--rdg-border-color": "var(--color-gray-200, rgba(128,128,128,.3))",
  "--rdg-selection-color": "var(--primary)",
  "--rdg-row-hover-background-color": "var(--color-gray-100, rgba(128,128,128,.08))",
  "--rdg-row-selected-background-color": "color-mix(in srgb, var(--primary) 12%, var(--background))",
  "--rdg-row-selected-hover-background-color": "color-mix(in srgb, var(--primary) 18%, var(--background))",
} as React.CSSProperties;

const sameValue = (a: unknown, b: unknown) => (a ?? "") === (b ?? "");
const asNumber = (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v));
const coerce = (type: RichTableCellType | undefined, text: string): unknown => (type === "number" ? (text.trim() === "" ? null : Number(text)) : type === "boolean" ? /^(true|1|yes|x|✓)$/i.test(text.trim()) : text);
const compare = (a: unknown, b: unknown) => (typeof a === "number" && typeof b === "number" ? a - b : String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true }));

/** the page numbers to show: the first, the last, and a window around the current one */
function pageList(page: number, pages: number): (number | "…")[] {
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  const out: (number | "…")[] = [];
  [...keep].sort((a, b) => a - b).forEach((p, i, all) => { if (i && p - all[i - 1] > 1) out.push("…"); out.push(p); });
  return out;
}

/** the number column's editor is the library input; the grid's own commits on Enter and on leaving */
function NumberEditor({ row, column, onRowChange, onClose }: { row: Row; column: { key: string }; onRowChange: (r: Row, commit?: boolean) => void; onClose: (commit?: boolean) => void }) {
  return (
    <div style={{ width: "100%" }} onBlur={() => onClose(true)}>
      <Input type="number" autoFocus value={String(row[column.key] ?? "")} onChange={(v: string) => onRowChange({ ...row, [column.key]: asNumber(v) })} />
    </div>
  );
}

const toDate = (v: unknown): Date | null => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v ?? "")); return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null; };
const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** the date column's editor is the library date picker; the cell keeps the day as YYYY-MM-DD */
function DateEditor({ row, column, onRowChange, onClose }: { row: Row; column: { key: string }; onRowChange: (r: Row, commit?: boolean) => void; onClose: (commit?: boolean) => void }) {
  return (
    <div style={{ width: "100%" }} onKeyDown={(e) => { if (e.key === "Escape") onClose(false); }}>
      <DatePicker mode="single" value={toDate(row[column.key])} onChange={(d) => onRowChange({ ...row, [column.key]: d ? toIso(d) : "" }, true)} />
    </div>
  );
}

/** the tag column's editor is the library dropdown, in the cell */
function TagEditor({ options, row, column, onRowChange, onClose }: { options: string[]; row: Row; column: { key: string }; onRowChange: (r: Row, commit?: boolean) => void; onClose: (commit?: boolean) => void }) {
  return (
    <div style={{ width: "100%" }} onKeyDown={(e) => { if (e.key === "Escape") onClose(false); }}>
      <InputSelect options={options.map((o) => ({ value: o, label: o }))} value={(row[column.key] as string | null | undefined) ?? null}
        onChange={((v: string | null) => onRowChange({ ...row, [column.key]: v ?? "" }, true)) as never} />
    </div>
  );
}

function AddColumn({ onAdd }: { onAdd: (name: string, type: RichTableCellType) => void }) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<RichTableCellType>("text");
  const [open, setOpen] = React.useState(false);
  const submit = () => { if (!name.trim()) return; onAdd(name.trim(), type); setName(""); setType("text"); setOpen(false); };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><Button emphasis="tertiary" scale="sm" startIcon="add" data-testid="rich-table-add-column">Column</Button></PopoverTrigger>
      <PopoverContent align="start" style={{ width: 260 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Input value={name} onChange={setName} placeholder="column name" autoFocus />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {CELL_TYPES.map((t) => <Button key={t} emphasis={t === type ? "primary" : "tertiary"} scale="xs" onClick={() => setType(t)}>{t}</Button>)}
          </div>
          <Button emphasis="primary" scale="sm" onClick={submit}>Add column</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** a column header: the name (a double click, or Enter on it, renames it when the table allows), the sort arrow (only the arrow sorts), and the filter field */
function HeaderCell({ label, tabIndex, direction, onSort, onRename, filter }: { label: string; tabIndex: number; direction?: "asc" | "desc"; onSort?: (shift: boolean) => void; onRename?: (name: string) => void; filter?: React.ReactNode }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(label);
  React.useEffect(() => { if (!editing) setDraft(label); }, [label, editing]);
  const commit = () => { setEditing(false); const v = draft.trim(); if (v && v !== label) onRename?.(v); else setDraft(label); };
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 2, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
        {editing
          ? <div style={{ flex: 1, minWidth: 0 }} onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
              <Input autoFocus value={draft} onChange={setDraft} onBlur={commit} onKeyDown={(e: React.KeyboardEvent) => { e.stopPropagation(); if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(label); setEditing(false); } }} />
            </div>
          : <span tabIndex={tabIndex} title={onRename ? "double click, or Enter, to rename" : undefined} style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", outline: "none" }}
              onDoubleClick={onRename ? () => setEditing(true) : undefined} onKeyDown={onRename ? (e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); setEditing(true); } } : undefined}>{label}</span>}
        {onSort ? <span onClick={(e) => { e.stopPropagation(); onSort(e.shiftKey); }} onDoubleClick={(e) => e.stopPropagation()}><Button buttonType="icon" emphasis="tertiary" scale="xs" startIcon={direction === "asc" ? "sortAsc" : direction === "desc" ? "sortDesc" : "chevronsUpDown"} aria-label={`sort ${label}`} /></span> : null}
      </div>
      {filter ? <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>{filter}</span> : null}
    </div>
  );
}

/** the menu of a right click, at the pointer: the theme's popover surface and the library's buttons; a click anywhere else, Escape or a scroll closes it */
function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: { label: string; run: () => void }[]; onClose: () => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const down = (e: Event) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("pointerdown", down, true); window.addEventListener("keydown", key); window.addEventListener("scroll", onClose, true);
    return () => { window.removeEventListener("pointerdown", down, true); window.removeEventListener("keydown", key); window.removeEventListener("scroll", onClose, true); };
  }, [onClose]);
  return createPortal(
    <div ref={ref} element="overlay--popover" data-testid="rich-table-menu" style={{ position: "fixed", left: x, top: y, zIndex: 60, minWidth: 170, display: "flex", flexDirection: "column", padding: 4 }}>
      {items.map((it) => <Button key={it.label} emphasis="tertiary" scale="sm" className="w-full justify-start" onClick={() => { it.run(); onClose(); }}>{it.label}</Button>)}
    </div>,
    document.body,
  );
}

export function RichTable(props: RichTableProps) {
  const { columns, onColumnsChange, source, height = 420, pagination = "table", page: pageProp, onPageChange, onTotalChange, frozenColumns = 0, selection = "none", selectedRows, onSelectionChange, reorderColumns = true,
    density = "comfortable", rowHeight: rowHeightProp, reorderRows: reorderRowsProp, striped = false, newRow, onQueryChange, initialView, onViewChange, columnLetters, rowNumbers, formulas, onCellEdited, className } = props;
  const authored = source.kind === "authored";
  const editable = props.editable ?? authored;
  const baseHeight = density === "compact" ? 28 : 36;
  const rowHeight = rowHeightProp ?? baseHeight;
  const headerHeight = typeof rowHeight === "number" ? rowHeight : baseHeight;
  const reorderRows = (reorderRowsProp ?? true) && authored && editable;
  const [menu, setMenu] = React.useState<{ x: number; y: number; kind: "row" | "column"; id: string | number } | null>(null);
  const [dragId, setDragId] = React.useState<string | number | null>(null);
  const [overId, setOverId] = React.useState<string | number | null>(null);

  // ── the view: order and widths of the columns, the sort and the filters, the page
  const [order, setOrder] = React.useState<string[]>(() => initialView?.order ?? columns.map((c) => c.key));
  const [widths, setWidths] = React.useState<Record<string, number>>(initialView?.widths ?? {});
  const [sort, setSort] = React.useState<RichTableSort[]>(initialView?.sort ?? []);
  const [filters, setFilters] = React.useState<Record<string, string>>(initialView?.filters ?? {});
  // the view is reported whenever the person changes it (not at the start)
  const viewKey = JSON.stringify([order, widths, sort, filters]);
  const viewSeen = React.useRef(viewKey);
  React.useEffect(() => { if (viewSeen.current === viewKey) return; viewSeen.current = viewKey; onViewChange?.({ order, widths, sort, filters } satisfies RichTableView); }, [viewKey]);
  const viewIsDataset = !sort.length && !Object.keys(filters).length;
  const [pageState, setPageState] = React.useState(pageProp ?? 1);
  const page = pageProp !== undefined ? pageProp : pageState;
  const setPage = (p: number) => { setPageState(p); onPageChange?.(p); };
  const size = source.kind === "queried" ? source.pageSize ?? 20 : 0;
  const [selected, setSelected] = React.useState<ReadonlySet<string | number>>(new Set());
  const [error, setError] = React.useState<string | null>(null);

  // a column added from outside joins the order at the end
  const keys = columns.map((c) => c.key).join("|");
  React.useEffect(() => { setOrder((o) => [...o.filter((k) => columns.some((c) => c.key === k)), ...columns.map((c) => c.key).filter((k) => !o.includes(k))]); }, [keys]);

  const query = React.useMemo<RichTableQuery>(() => ({ page, size, sort, filters }), [page, size, sort, filters]);

  // ── queried: ask the source whenever the query changes; the filters wait for the person to stop typing
  const [asked, setAsked] = React.useState<{ rows: Row[]; total: number; loading: boolean; failed: string | null }>({ rows: [], total: 0, loading: source.kind === "queried", failed: null });
  const fetchRef = React.useRef(source.kind === "queried" ? source.fetch : null);
  fetchRef.current = source.kind === "queried" ? source.fetch : null;
  const queryKey = JSON.stringify(query);
  React.useEffect(() => {
    onQueryChange?.(query);
    if (!fetchRef.current) return;
    let live = true;
    setAsked((a) => ({ ...a, loading: true, failed: null }));
    const t = setTimeout(() => {
      fetchRef.current?.(query).then((r) => { if (live) { setAsked({ rows: r.rows, total: r.total, loading: false, failed: null }); onTotalChange?.(r.total); } })
        .catch((e: unknown) => { if (live) setAsked((a) => ({ ...a, loading: false, failed: e instanceof Error ? e.message : "the query failed" })); });
    }, Object.keys(filters).length ? 250 : 0);
    return () => { live = false; clearTimeout(t); };
  }, [queryKey]);

  // ── authored: the rows are the person's; sort and filters only change what is shown
  const shown = React.useMemo<Row[]>(() => {
    if (source.kind === "queried") return asked.rows;
    let rows = source.rows;
    for (const [k, text] of Object.entries(filters)) if (text) rows = rows.filter((r) => String(r[k] ?? "").toLowerCase().includes(text.toLowerCase()));
    if (sort.length) rows = [...rows].sort((a, b) => { for (const s of sort) { const d = compare(a[s.key], b[s.key]); if (d) return s.direction === "asc" ? d : -d; } return 0; });
    return rows;
  }, [source, asked.rows, sort, filters]);

  /** the sort arrow of a header: ascending, descending, off; Shift adds the column to the sort */
  const toggleSort = (key: string, shift: boolean) => {
    setPage(1);
    setSort((s) => { const cur = s.find((x) => x.key === key); const next = !cur ? "asc" : cur.direction === "asc" ? "desc" : null; const rest = shift ? s.filter((x) => x.key !== key) : []; return next ? [...rest, { key, direction: next }] : rest; });
  };

  // ── the columns, as the grid wants them
  const gridColumns = React.useMemo<Column<Row>[]>(() => {
    const byKey = new Map(columns.map((c) => [c.key, c]));
    const visible = order.map((k) => byKey.get(k)).filter((c): c is RichTableColumn => !!c && !c.hidden);
    const sticky = visible.map((c, i) => c.frozen ?? (i < frozenColumns ? "start" : false));
    // a cell as a formula sees it: by column and row position in the table (A1 is the first column, the first row of the dataset)
    const lookup = (col: number, rowIdx: number) => (source.kind === "authored" ? source.rows[rowIdx]?.[visible[col]?.key ?? ""] : undefined) as number | string | null | undefined;
    const cols = visible.map<Column<Row>>((c, i) => {
      const type = c.type ?? "text";
      const canEdit = (c.editable ?? editable) && type !== "boolean";
      return {
        key: c.key, name: columnLetters ? letterOf(i) : c.name,
        width: widths[c.key] ?? c.width, minWidth: c.minWidth ?? 60, maxWidth: c.maxWidth,
        resizable: c.resizable ?? true, sortable: false, draggable: reorderColumns,
        frozen: sticky[i],
        editable: canEdit,
        renderHeaderCell: ({ column, tabIndex }) => (
          <HeaderCell label={String(column.name)} tabIndex={tabIndex}
            direction={sort.find((x) => x.key === c.key)?.direction}
            onSort={(c.sortable ?? true) ? (shift) => toggleSort(c.key, shift) : undefined}
            onRename={editable && onColumnsChange && !columnLetters ? (name) => onColumnsChange(columns.map((x) => (x.key === c.key ? { ...x, name } : x))) : undefined}
            filter={c.filterable ? <Input value={filters[c.key] ?? ""} onChange={(v: string) => { setPage(1); setFilters((f) => { const n = { ...f }; if (v) n[c.key] = v; else delete n[c.key]; return n; }); }} placeholder="filter" /> : undefined} />
        ),
        renderCell: ({ row, onRowChange }) => {
          if (c.render) return c.render(row);
          const v = row[c.key];
          if (formulas && typeof v === "string" && v.startsWith("=")) {
            const out = evaluate(v, lookup);
            return <span style={{ display: "block", textAlign: typeof out === "number" ? "right" : "left" }}>{typeof out === "number" ? String(Math.round(out * 1e8) / 1e8) : out}</span>;
          }
          if (type === "boolean") return <Checkbox scale="sm" checked={v === true} disabled={!(c.editable ?? editable)} onCheckedChange={(x) => onRowChange({ ...row, [c.key]: x === true })} />;
          if (type === "tag") return v ? <Badge>{String(v)}</Badge> : null;
          if (type === "link") return v ? <a href={String(v)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{String(v)}</a> : null;
          if (type === "number") return <span style={{ display: "block", textAlign: "right" }}>{v === null || v === undefined || v === "" ? "" : String(v)}</span>;
          return <>{v === null || v === undefined ? "" : String(v)}</>;
        },
        renderEditCell: canEdit
          ? (p) => type === "number" ? <NumberEditor {...p} />
            : type === "date" ? <DateEditor {...p} />
            : type === "tag" ? <TagEditor options={c.options ?? []} {...p} />
            : renderTextEditor(p)
          : undefined,
      };
    });
    const grip: Column<Row> | null = reorderRows ? {
      key: "__grip", name: "", width: 34, minWidth: 34, maxWidth: 34, resizable: false, sortable: false, draggable: false, editable: false, frozen: "start",
      renderCell: ({ row }) => (
        <span draggable={viewIsDataset} title={viewIsDataset ? "drag to move the row" : "clear the sort and the filters to move rows"}
          onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDragId(row.id); }} onDragEnd={() => { setDragId(null); setOverId(null); }}
          style={{ display: "block", textAlign: "center", cursor: viewIsDataset ? "grab" : "not-allowed", opacity: viewIsDataset ? 0.7 : 0.25, userSelect: "none" }}>⠿</span>
      ),
    } : null;
    const numbers: Column<Row> | null = rowNumbers ? {
      key: "__n", name: "", width: 46, minWidth: 46, maxWidth: 46, resizable: false, sortable: false, draggable: false, editable: false, frozen: "start",
      renderCell: ({ row, rowIdx }) => <span style={{ display: "block", textAlign: "center", opacity: 0.6 }}>{source.kind === "authored" ? source.rows.findIndex((x) => x.id === row.id) + 1 : (page - 1) * size + rowIdx + 1}</span>,
    } : null;
    return [...(selection === "row" ? [{ ...SelectColumn, frozen: "start" as const }] : []), ...(grip ? [grip] : []), ...(numbers ? [numbers] : []), ...cols];
  }, [columns, order, widths, frozenColumns, editable, reorderColumns, selection, filters, reorderRows, viewIsDataset, columnLetters, rowNumbers, formulas, source, page, size]);

  // ── an edit, a paste or a fill: the column's rule first, then the new rows go up
  const columnOf = (key: string) => columns.find((c) => c.key === key);
  const apply = (changed: Row, key: string): boolean => {
    const col = columnOf(key);
    const verdict = col?.validate?.(changed[key], changed);
    if (typeof verdict === "string") { setError(`${col?.name ?? key}: ${verdict}`); return false; }
    setError(null);
    return true;
  };
  /** the changed rows go where the rows live: authored, up to the app's dataset; queried, onto the page shown (the app saves them through onCellEdited) */
  const put = (changes: Row[]) => {
    const byId = new Map(changes.map((r) => [r.id, r]));
    if (source.kind === "authored") source.onChange(source.rows.map((r) => byId.get(r.id) ?? r));
    else setAsked((a) => ({ ...a, rows: a.rows.map((r) => byId.get(r.id) ?? r) }));
  };
  const rowsChanged = (next: Row[], data: { indexes: number[]; column: { key: string } }) => {
    const key = data.column.key;
    const changes = data.indexes.map((i) => next[i]).filter((r) => r && apply(r, key));
    if (!changes.length) return;
    changes.forEach((r) => onCellEdited?.(r, key, r[key]));
    put(changes);
  };

  // ── the right click: a row (add above, add below, delete) or a column header (insert left, insert right, delete), on authored tables
  const canMenu = authored && editable;
  const menuItems = (): { label: string; run: () => void }[] => {
    if (!menu || source.kind !== "authored") return [];
    if (menu.kind === "row") {
      const at = source.rows.findIndex((r) => r.id === menu.id);
      return [
        ...(newRow ? [{ label: "Add row above", run: () => source.onChange([...source.rows.slice(0, at), newRow(), ...source.rows.slice(at)]) }, { label: "Add row below", run: () => source.onChange([...source.rows.slice(0, at + 1), newRow(), ...source.rows.slice(at + 1)]) }] : []),
        { label: "Delete row", run: () => source.onChange(source.rows.filter((r) => r.id !== menu.id)) },
      ];
    }
    if (!onColumnsChange) return [];
    const at = columns.findIndex((c) => c.key === menu.id);
    const insert = (offset: number) => { const key = `c${Date.now().toString(36)}`; onColumnsChange([...columns.slice(0, at + offset), { key, name: "Column", type: "text" }, ...columns.slice(at + offset)]); setOrder((o) => { const n = o.filter((k) => k !== key); n.splice(Math.max(0, o.indexOf(String(menu.id))) + offset, 0, key); return n; }); };
    return [{ label: "Insert left", run: () => insert(0) }, { label: "Insert right", run: () => insert(1) }, { label: "Delete column", run: () => onColumnsChange(columns.filter((c) => c.key !== menu.id)) }];
  };
  const headerMenu = (e: React.MouseEvent) => {
    if (!canMenu) return;
    const th = (e.target as HTMLElement).closest('[role="columnheader"]');
    const idx = th ? Number(th.getAttribute("aria-colindex")) : 0;
    const col = idx ? gridColumns[idx - 1] : undefined;
    if (!col || col.key.startsWith("__") || col.key === "rdg-select-column") return;
    e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, kind: "column", id: col.key });
  };

  const pages = source.kind === "queried" ? Math.max(1, Math.ceil(asked.total / size)) : 1;
  const ids = selectedRows ?? selected;

  return (
    <div className={className} data-testid="rich-table" style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", minWidth: 0, maxWidth: "100%", ...(height === "fill" ? { height: "100%" } : {}) }}>
      {authored ? (
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {newRow ? <Button emphasis="tertiary" scale="sm" startIcon="add" data-testid="rich-table-add-row" onClick={() => source.onChange([...source.rows, newRow()])}>Row</Button> : null}
          {selection === "row" ? <Button emphasis="tertiary" scale="sm" startIcon="trash" disabled={!ids.size} data-testid="rich-table-delete-rows" onClick={() => { source.onChange(source.rows.filter((r) => !ids.has(r.id))); const none = new Set<string | number>(); setSelected(none); onSelectionChange?.(none); }}>Delete rows</Button> : null}
          {onColumnsChange ? <AddColumn onAdd={(name, type) => onColumnsChange([...columns, { key: `c${Date.now().toString(36)}`, name, type, ...(type === "tag" ? { options: [] } : {}) }])} /> : null}
        </div>
      ) : null}
      <div style={{ position: "relative", minWidth: 0, maxWidth: "100%", ...(height === "fill" ? { flex: 1, minHeight: 0 } : {}) }} onContextMenu={headerMenu}>
        <DataGrid
          columns={gridColumns}
          rows={shown}
          getRowKey={(r) => r.id}
          rowHeight={typeof rowHeight === "function" ? (row) => rowHeight(row) : rowHeight}
          headerRowHeight={columns.some((c) => c.filterable) ? headerHeight * 2 : headerHeight}
          style={{ ...themeVars, blockSize: height === "fill" ? "100%" : height, inlineSize: "100%", maxInlineSize: "100%" }}
          selectedRows={selection === "row" ? ids : undefined}
          onSelectedRowsChange={selection === "row" ? (s) => { setSelected(s); onSelectionChange?.(s); } : undefined}
          onRowsChange={editable ? rowsChanged : undefined}
          onColumnResize={(col, width) => setWidths((w) => ({ ...w, [col.key]: Math.round(width) }))}
          onColumnsReorder={reorderColumns ? (from, to) => setOrder((o) => { const n = o.filter((k) => k !== from); n.splice(n.indexOf(to) + (o.indexOf(from) < o.indexOf(to) ? 1 : 0), 0, from); return n; }) : undefined}
          onCellContextMenu={canMenu ? ({ row }, event) => { event.preventGridDefault(); event.preventDefault(); setMenu({ x: event.clientX, y: event.clientY, kind: "row", id: row.id }); } : undefined}
          // the column that owns the cell's value says what a copy puts on the clipboard; without one, the row's value as stored
          onCellCopy={({ row, column }, event) => { const c = columns.find((x) => x.key === column.key); event.preventDefault(); event.clipboardData?.setData("text/plain", c?.copy ? c.copy(row) : String(row[column.key] ?? "")); }}
          onCellPaste={editable ? ({ row, column }, event) => {
            const text = event.clipboardData?.getData("text") ?? "";
            const next = { ...row, [column.key]: coerce(columnOf(column.key)?.type, text) };
            if (!(columnOf(column.key)?.editable ?? editable) || !apply(next, column.key)) return row;
            onCellEdited?.(next, column.key, next[column.key]);
            put([next]);
            return next;
          } : undefined}
          onFill={editable ? ({ columnKey, sourceRow, targetRow }) => {
            const next = { ...targetRow, [columnKey]: sourceRow[columnKey] };
            if (!apply(next, columnKey)) return targetRow;
            onCellEdited?.(next, columnKey, next[columnKey]);
            put([next]);
            return next;
          } : undefined}
          renderers={striped || reorderRows ? { renderRow: (key, p) => (
            <RowFrame key={key} {...p} striped={striped} drop={dragId !== null && overId === p.row.id && dragId !== p.row.id}
              onDragOver={reorderRows && dragId !== null ? (e: React.DragEvent) => { e.preventDefault(); setOverId(p.row.id); } : undefined}
              onDrop={reorderRows && dragId !== null ? () => {
                if (source.kind === "authored" && dragId !== p.row.id) {
                  const rows = [...source.rows]; const from = rows.findIndex((x) => x.id === dragId); const [moved] = rows.splice(from, 1);
                  rows.splice(rows.findIndex((x) => x.id === p.row.id), 0, moved); source.onChange(rows);
                }
                setDragId(null); setOverId(null);
              } : undefined} />
          ) } : undefined}
        />
        {asked.loading && source.kind === "queried" ? <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "color-mix(in srgb, var(--background) 60%, transparent)", pointerEvents: "none" }} element="type--body-small">Loading…</div> : null}
      </div>
      {menu ? <ContextMenu x={menu.x} y={menu.y} items={menuItems()} onClose={() => setMenu(null)} /> : null}
      {error || asked.failed ? <div element="type--body-small" status="error" role="alert">{error ?? asked.failed}</div> : null}
      {source.kind === "queried" && pagination === "table" ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span element="type--body-small" emphasis="quiet">{asked.total ? `${(page - 1) * size + 1}–${Math.min(page * size, asked.total)} of ${asked.total}` : "no rows"}</span>
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious onClick={() => setPage(Math.max(1, page - 1))} /></PaginationItem>
              {pageList(page, pages).map((p, i) => <PaginationItem key={`${p}${i}`}>{p === "…" ? <PaginationEllipsis /> : <PaginationLink isActive={p === page} onClick={() => setPage(p)}>{p}</PaginationLink>}</PaginationItem>)}
              <PaginationItem><PaginationNext onClick={() => setPage(Math.min(pages, page + 1))} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </div>
  );
}

/** a grid row with the theme's stripe, and the line that shows where a dragged row will land */
function RowFrame({ striped, drop, ...props }: RenderRowProps<Row> & { striped: boolean; drop: boolean; onDragOver?: (e: React.DragEvent) => void; onDrop?: () => void }) {
  const style: React.CSSProperties = {
    ...(striped && props.rowIdx % 2 ? { backgroundColor: "color-mix(in srgb, var(--foreground) 4%, var(--background))" } : {}),
    ...(drop ? { boxShadow: "inset 0 2px 0 var(--primary)" } : {}),
  };
  return <GridRow {...props} style={style} />;
}
