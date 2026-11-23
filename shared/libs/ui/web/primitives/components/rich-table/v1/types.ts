// RichTable — the editable data grid: typed columns, a header that stays, columns that stick, sorting, filtering, pages, editing, copy and fill. One component, two kinds of source:
//   queried  the server owns the rows. The table asks (page, size, sort, filters) and shows what comes back; pages are our Pagination.
//   authored the person owns the rows (a working dataset the app saves). The table shows all of them, edits them and reports the new dataset; no pages, ever.
// Capabilities are switches, not the two kinds: a queried table can be editable, an authored one read-only. Undo and redo are the app's (versioning), not the table's.

export type RichTableCellType = "text" | "number" | "boolean" | "date" | "tag" | "link";
export type RichTableRow = { id: string | number } & Record<string, unknown>;

export interface RichTableColumn {
  key: string;
  name: string;
  /** how the cell is shown and edited (default text) */
  type?: RichTableCellType;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  /** default true */
  resizable?: boolean;
  /** default true */
  sortable?: boolean;
  /** a filter field under the header name (default false) */
  filterable?: boolean;
  /** overrides the table's `editable` for this column */
  editable?: boolean;
  /** the column sticks to this edge while the others scroll */
  frozen?: "start" | "end";
  hidden?: boolean;
  /** draws the cell with any component (an avatar and a name, a button, a badge stack...). Display only: the type still decides how the cell is edited. */
  render?: (row: RichTableRow) => React.ReactNode;
  /** what a copy of the cell puts on the clipboard: the value as the person reads it, not as it is stored (a rendered number gives its plain form). Default: the stored value */
  copy?: (row: RichTableRow) => string;
  /** the choices of a tag column: its editor is the library dropdown */
  options?: string[];
  /** a rule on the value: true to accept, or the message that rejects the edit */
  validate?: (value: unknown, row: RichTableRow) => true | string;
}

/** what the person arranged: kept by the app as a saved view */
export type RichTableView = { order: string[]; widths: Record<string, number>; sort: RichTableSort[]; filters: Record<string, string> };
export type RichTableSort = { key: string; direction: "asc" | "desc" };
export type RichTableQuery = { page: number; size: number; sort: RichTableSort[]; filters: Record<string, string> };
export type RichTableResult = { rows: RichTableRow[]; total: number };

export type RichTableSource =
  | { kind: "queried"; fetch: (query: RichTableQuery) => Promise<RichTableResult>; pageSize?: number }
  | { kind: "authored"; rows: RichTableRow[]; onChange: (rows: RichTableRow[]) => void };

export interface RichTableProps {
  columns: RichTableColumn[];
  /** authored: the person adds a column (name and type); the app stores the new list. Without it there is no add-column button. */
  onColumnsChange?: (columns: RichTableColumn[]) => void;
  source: RichTableSource;
  /** the grid scrolls inside this height and the header stays in view (default 420). "fill": it takes the height of the box it is in (a canvas node). */
  height?: number | string | "fill";
  /** the first n visible columns stick to the left, like Excel's freeze panes (a column's own `frozen` wins) */
  frozenColumns?: number;
  /** a checkbox column to select rows; the active cell is always there (default none) */
  selection?: "none" | "row";
  selectedRows?: ReadonlySet<string | number>;
  onSelectionChange?: (ids: Set<string | number>) => void;
  /** cells can be edited, pasted into and filled (default: authored yes, queried no) */
  editable?: boolean;
  /** drag a header to move its column (default true) */
  reorderColumns?: boolean;
  density?: "compact" | "comfortable";
  /** the height of a row in px, or a function of the row; wins over density. Cells that hold taller content need a taller row. */
  rowHeight?: number | ((row: RichTableRow) => number);
  /** authored: a grip column drags a row to a new place in the dataset (default true when editable). Off while a sort or a filter is on, because the order shown is then not the dataset's. */
  reorderRows?: boolean;
  striped?: boolean;
  /** authored: builds the row that "Add row" appends */
  newRow?: () => RichTableRow;
  /** queried only. "table": the table draws its own page bar under the grid (the library Pagination). "app": no bar; the app draws its own pagination and drives the page with `page`, reading `total` from `onTotalChange`. Default "table". */
  pagination?: "table" | "app";
  /** the current page (1-based). Given, the app owns it (the store, the router) and the table's own bar only reports through onPageChange; absent, the table keeps it. */
  page?: number;
  /** the page changed (the table's own bar or the app's) */
  onPageChange?: (page: number) => void;
  /** the number of rows the query matches, after each answer */
  onTotalChange?: (total: number) => void;
  /** the query changed (page, sort or filters): queried tables ask the source themselves, this is for the app to know */
  onQueryChange?: (query: RichTableQuery) => void;
  /** the view to start from: the column order and widths, the sort and the filters (a saved view). Remount the table (a `key`) to apply another one. */
  initialView?: Partial<RichTableView>;
  /** the view changed (a column moved or resized, a sort, a filter): the view preference to save */
  onViewChange?: (view: RichTableView) => void;
  /** spreadsheet look: the headers are the letters A, B, C… and the rows are numbered 1, 2, 3… (a number column at the left) */
  columnLetters?: boolean;
  rowNumbers?: boolean;
  /** a cell whose text starts with "=" is computed: + - * / ( ), cells like B3, ranges in SUM, AVG, MIN, MAX, COUNT. Authored tables only. */
  formulas?: boolean;
  /** a cell was changed by an edit, a paste or a fill */
  onCellEdited?: (row: RichTableRow, key: string, value: unknown) => void;
  className?: string;
}
