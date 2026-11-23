import type { RichTableColumn, RichTableRow } from "@libs/web-components";
// A rich table on a canvas: an authored dataset, owned by its node: the columns (name, type, width) and the rows
export type RichTableData = { columns: RichTableColumn[]; rows: RichTableRow[] };
