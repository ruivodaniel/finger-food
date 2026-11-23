// FROM DRIZZLE PG — the exports of Drizzle pg model modules (pgTable, pgEnum, pgView, pgMaterializedView) → the model. Reads Drizzle's own table config: columns, primary keys,
// foreign keys, indexes, checks, unique constraints; a view's selected fields and the tables they come from. `relations()` is not Postgres and is not read.
import { is, SQL } from "drizzle-orm";
import { PgDialect, PgTable, getMaterializedViewConfig, getTableConfig, getViewConfig, isPgEnum, isPgMaterializedView, isPgView, type PgColumn } from "drizzle-orm/pg-core";
import { finish, type ErdColumn, type ErdEnum, type ErdSchema, type ErdSource, type ErdTable } from "./model";

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any -- Drizzle's runtime objects are read past their public types
const dialect = new PgDialect();
const text = (v: unknown): string => (is(v, SQL) ? dialect.sqlToQuery(v).sql : typeof v === "object" ? JSON.stringify(v) : String(v));
const tableName = (t: unknown): string => String((t as Record<symbol, unknown>)[Symbol.for("drizzle:Name")] ?? getTableConfig(t as PgTable).name);

export function fromDrizzlePg(models: Record<string, unknown>, options: { source?: ErdSource } = {}): ErdSchema {
  const source = options.source ?? "generated";
  const enums: ErdEnum[] = [];
  const tables: ErdTable[] = [];
  const values = Object.values(models);
  for (const v of values) if (isPgEnum(v)) enums.push({ name: v.enumName, values: [...v.enumValues] });
  const column = (c: PgColumn, extra: { pk?: boolean; unique?: boolean; fk?: ErdColumn["fk"] } = {}): ErdColumn => {
    const en = (c as Any).enum && isPgEnum((c as Any).enum) ? { name: (c as Any).enum.enumName as string, values: [...((c as Any).enum.enumValues as string[])] } : c.enumValues?.length ? { name: `${c.name}`, values: [...c.enumValues] } : undefined;
    return {
      name: c.name, type: c.getSQLType(), pk: c.primary || !!extra.pk, notNull: c.notNull || c.primary || !!extra.pk, unique: !!c.isUnique || !!extra.unique,
      ...(c.default !== undefined ? { dbdefault: text(c.default) } : {}),
      ...(extra.fk ? { fk: extra.fk } : {}),
      ...(en ? { enum: en } : {}),
    };
  };
  for (const v of values) {
    if (!is(v, PgTable)) continue;
    const cfg = getTableConfig(v);
    const pk = new Set(cfg.primaryKeys.flatMap((k) => k.columns.map((c) => c.name)));
    const uniq = new Set(cfg.uniqueConstraints.filter((u) => u.columns.length === 1).map((u) => u.columns[0].name));
    const fks = new Map<string, ErdColumn["fk"]>();
    for (const fk of cfg.foreignKeys) {
      const r = fk.reference();
      r.columns.forEach((c, i) => fks.set(c.name, { table: tableName(r.foreignTable), column: r.foreignColumns[i]?.name ?? "id", ...(fk.onDelete ? { onDelete: fk.onDelete } : {}) }));
    }
    tables.push({
      name: cfg.name, kind: "table", source, ...(cfg.schema ? { schema: cfg.schema } : {}),
      fields: cfg.columns.map((c) => column(c, { pk: pk.has(c.name), unique: uniq.has(c.name), fk: fks.get(c.name) })),
      indexes: cfg.indexes.map((i) => ({ name: i.config.name ?? null, columns: i.config.columns.map((c) => ((c as Any).name as string) ?? text(c)), unique: !!i.config.unique })),
      checks: cfg.checks.map((c) => ({ name: c.name, expression: text(c.value) })),
      pointsTo: [],
    });
  }
  for (const v of values) {
    if (!isPgView(v) && !isPgMaterializedView(v)) continue;
    const cfg = isPgView(v) ? getViewConfig(v) : getMaterializedViewConfig(v);
    const reads = new Set<string>();
    const fields: ErdColumn[] = Object.entries(cfg.selectedFields as Record<string, unknown>).map(([k, f]) => {
      const c = f as Any;
      if (c?.table) reads.add(tableName(c.table));
      return { name: (c?.name as string) ?? k, type: typeof c?.getSQLType === "function" ? c.getSQLType() : "expression", pk: false, notNull: !!c?.notNull, unique: false };
    });
    tables.push({ name: cfg.name, kind: "view", source, ...(cfg.schema ? { schema: cfg.schema } : {}), fields, indexes: [], checks: [], readsFrom: [...reads], pointsTo: [] });
  }
  return finish(tables, enums);
}
