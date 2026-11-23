// FROM DBML — one DBML text (dbml v2) → the model. A `ref:` line becomes the key on its source column; an enum type on a column becomes its enum. Pure: the caller reads the files.
import { Parser } from "@dbml/core";
import { finish, type ErdColumn, type ErdEnum, type ErdSchema, type ErdSource, type ErdTable } from "./model";

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any -- the parser's objects are untyped

export function fromDbml(text: string, options: { source?: ErdSource; /** a table's source when the file mixes both */ sourceOf?: (table: string) => ErdSource } = {}): ErdSchema {
  const database = new Parser().parse(text, "dbmlv2") as Any;
  const enums: ErdEnum[] = [];
  const tables: ErdTable[] = [];
  const keys = new Map<string, ErdColumn["fk"]>();
  for (const schema of database.schemas ?? []) {
    for (const ref of schema.refs ?? []) {
      const [a, b] = ref.endpoints ?? [];
      if (!a || !b) continue;
      // `a > b`: a holds the key, b is referenced; `a < b`: the other way round
      const [holder, referenced] = a.relation === "*" || b.relation === "1" ? [a, b] : a.relation === "1" && b.relation === "*" ? [b, a] : [a, b];
      keys.set(`${holder.tableName}.${holder.fieldNames?.[0]}`, { table: String(referenced.tableName), column: String(referenced.fieldNames?.[0]), ...(ref.onDelete ? { onDelete: String(ref.onDelete) } : {}) });
    }
    for (const e of schema.enums ?? []) enums.push({ name: String(e.name), values: (e.values ?? []).map((v: Any) => String(v.name)) });
    for (const t of schema.tables ?? []) {
      const name = String(t.name);
      const fields: ErdColumn[] = (t.fields ?? []).map((f: Any) => {
        const type = String(f.type?.type_name ?? f.type ?? "");
        const en = enums.find((e) => e.name === type);
        return {
          name: String(f.name), type, pk: !!f.pk, notNull: !!(f.not_null ?? f.dbdefault !== undefined), unique: !!f.unique,
          ...(f.dbdefault != null ? { dbdefault: String(f.dbdefault?.value ?? f.dbdefault) } : {}),
          ...(keys.get(`${name}.${f.name}`) ? { fk: keys.get(`${name}.${f.name}`) } : {}),
          ...(en ? { enum: en } : {}),
        };
      });
      tables.push({
        name, kind: "table", source: options.sourceOf?.(name) ?? options.source ?? "designed",
        ...(t.note?.value ?? t.note ? { description: String(t.note?.value ?? t.note) } : {}),
        fields,
        indexes: (t.indexes ?? []).map((i: Any) => ({ name: i.name ?? null, columns: (i.columns ?? []).map((c: Any) => String(c.value ?? c)), unique: !!i.unique })),
        checks: (t.checks ?? []).map((c: Any) => ({ name: c.name ?? null, expression: String(c.expression) })),
        pointsTo: [],
      });
    }
  }
  return finish(tables, enums);
}
