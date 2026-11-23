// THE MODEL — what every adapter produces and what the ERD node and the canvas consume. Postgres, nothing more: tables, columns, keys, indexes, checks, enums, views.
// A key is on its column (`fk`); the canvas derives the lines from the keys, so they are never stored elsewhere. A view reads from tables (`readsFrom`): a line of another kind.

export type ErdSource = "generated" | "designed";
export type ErdEnum = { name: string; values: string[] };
export type ErdColumn = {
  name: string;
  /** the SQL type as the source names it ("text", "timestamp", "uuid[]"); an enum column names its enum in `enum` */
  type: string;
  pk: boolean; notNull: boolean; unique: boolean;
  dbdefault?: string;
  /** the foreign key this column holds */
  fk?: { table: string; column: string; onDelete?: string };
  enum?: ErdEnum;
};
export type ErdIndex = { name: string | null; columns: string[]; unique: boolean };
export type ErdCheck = { name: string | null; expression: string };
export type ErdTable = {
  name: string;
  /** a table, or a view over tables (no keys of its own; it reads from tables) */
  kind: "table" | "view";
  /** generated from the product's models, or designed by hand */
  source: ErdSource;
  schema?: string;
  description?: string;
  fields: ErdColumn[];
  indexes: ErdIndex[];
  checks: ErdCheck[];
  /** a view: the tables its query reads; empty when the query is opaque (raw SQL) */
  readsFrom?: string[];
  /** the tables this one's keys reach, derived once */
  pointsTo: string[];
};
export type ErdSchema = {
  tables: ErdTable[];
  enums: ErdEnum[];
  /** what the adapter could not read: a dangling key, a table declared twice */
  problems: string[];
};

/** the tables a table's keys reach, in order of first appearance */
export const pointsToOf = (t: Pick<ErdTable, "fields">): string[] => [...new Set(t.fields.flatMap((f) => (f.fk ? [f.fk.table] : [])))];
/** a schema checked: a key to a table the schema has not is a problem, not a line */
export function finish(tables: ErdTable[], enums: ErdEnum[], problems: string[] = []): ErdSchema {
  const names = new Set(tables.map((t) => t.name));
  for (const t of tables) for (const f of t.fields) if (f.fk && !names.has(f.fk.table)) problems.push(`${t.name}.${f.name} points at ${f.fk.table}.${f.fk.column}, a table the schema has not`);
  const seen = new Set<string>();
  for (const t of tables) { if (seen.has(t.name)) problems.push(`table ${t.name} is declared twice`); seen.add(t.name); }
  return { tables: tables.map((t) => ({ ...t, pointsTo: pointsToOf(t) })), enums, problems };
}
