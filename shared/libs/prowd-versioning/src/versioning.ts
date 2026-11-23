// The five helpers: identity · created · save · current · remove. Stateless,
// bound at boot to the versioned map and the capsule tables. They take the
// handle the caller has (db or tx) and never open a connection of their own;
// they never see a Scope: access control is asked by the caller, through
// gated-scoped-ac, before the write.
import { and, eq, getTableColumns, getTableName, isNull, sql, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { CapsuleTables } from "./schema";

export type Row = Record<string, unknown>;
export type Author = { id: string; type: "user" | "agent" | "deterministic" };
/** Which rows a read means: a branch, a moment. Default: main, now. */
export type View = { branch?: string; at?: Date };

export type VersionedEntry = {
  table: PgTable;
  /** The column (drizzle key) that holds the outer id on every row. */
  outerId: string;
  /** The column (drizzle key) that is the row's primary key. Default "id". */
  id?: string;
};
export type VersionedMap = Record<string, VersionedEntry>;

export type VersioningConfig<V extends VersionedMap> = {
  versioned: V;
  capsules: CapsuleTables;
  /** Ids for capsule rows and for new version rows. Default: crypto.randomUUID. */
  createId?: () => string;
  /** The clock. Default: () => new Date(). */
  now?: () => Date;
};

/** Any drizzle handle with insert/update/select/execute: a db or a tx. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Handle = any;

export const MAIN = "main";

export function createVersioning<V extends VersionedMap>(config: VersioningConfig<V>) {
  type Entity = keyof V & string;
  const { versioned, capsules } = config;
  const { outerCapsule, branch, innerCapsule, versionDelta } = capsules;
  const createId = config.createId ?? (() => crypto.randomUUID());
  const now = config.now ?? (() => new Date());

  const entryOf = (entity: Entity): Required<VersionedEntry> => {
    const e = versioned[entity];
    if (!e) throw new Error(`versioning: "${entity}" is not in the versioned map`);
    return { table: e.table, outerId: e.outerId, id: e.id ?? "id" };
  };
  const col = (table: PgTable, key: string) => {
    const c = (getTableColumns(table) as Record<string, any>)[key];
    if (!c) throw new Error(`versioning: column "${key}" not on ${getTableName(table)}`);
    return c;
  };

  // The head of a branch, if any.
  const headOf = async (db: Handle, outerId: string, branchName: string) => {
    const [row] = await db
      .select({ ic: innerCapsule, branchId: branch.id })
      .from(innerCapsule)
      .innerJoin(branch, eq(branch.id, innerCapsule.branchId))
      .where(and(eq(innerCapsule.outerCapsuleId, outerId), eq(branch.name, branchName), isNull(innerCapsule.validTo)));
    return row as { ic: typeof innerCapsule.$inferSelect; branchId: string } | undefined;
  };
  const alive = async (db: Handle, outerId: string) => {
    const [row] = await db.select({ id: outerCapsule.entityId }).from(outerCapsule).where(and(eq(outerCapsule.entityId, outerId), isNull(outerCapsule.validTo)));
    return Boolean(row);
  };

  return {
    /** BEFORE the row is inserted: the outer capsule. Returns the id the API will talk about. */
    async identity(db: Handle, entity: Entity): Promise<string> {
      entryOf(entity);
      const t = now();
      const entityId = createId();
      await db.insert(outerCapsule).values({ entityId, entityType: entity, createdAt: t, validFrom: t, validTo: null });
      return entityId;
    },

    /** AFTER the row is inserted: branch main and the first inner capsule. Returns the row as stored. */
    async created(db: Handle, entity: Entity, rowId: string, outerId: string, author: Author): Promise<Row> {
      const e = entryOf(entity);
      const t = now();
      const branchId = createId();
      await db.insert(branch).values({ id: branchId, outerCapsuleId: outerId, name: MAIN, createdAt: t, validFrom: t, validTo: null });
      await db.insert(innerCapsule).values({
        id: createId(), outerCapsuleId: outerId, branchId, entityType: entity, entityRowId: rowId,
        createdAt: t, validFrom: t, validTo: null, originKind: "first", authorId: author.id, authorType: author.type, isMain: true, sourceVersionIds: [],
      });
      const [row] = await db.select().from(e.table).where(eq(col(e.table, e.id), rowId));
      if (!row) throw new Error(`versioning: no ${entity} row ${rowId} to version`);
      return row as Row;
    },

    /** A new version from the current one plus the patch, in the caller's tx: the old row is kept, the head moves, the delta is recorded.
     * null when the identity has no current version (removed, unknown). The current row when the patch changes nothing (no version). */
    async save(tx: Handle, entity: Entity, outerId: string, patch: Row, author: Author, branchName = MAIN): Promise<Row | null> {
      const e = entryOf(entity);
      if (!(await alive(tx, outerId))) return null;
      const head = await headOf(tx, outerId, branchName);
      if (!head) return null;
      const [cur] = await tx.select().from(e.table).where(eq(col(e.table, e.id), head.ic.entityRowId));
      if (!cur) return null;
      const fields: { field: string; from: unknown; to: unknown }[] = [];
      for (const [k, v] of Object.entries(patch)) {
        if (k === e.id || k === e.outerId || v === undefined) continue;
        if (JSON.stringify(cur[k]) !== JSON.stringify(v)) fields.push({ field: k, from: cur[k], to: v });
      }
      if (fields.length === 0) return cur as Row;
      const t = now();
      const rowId = createId();
      const next: Row = { ...cur, ...Object.fromEntries(fields.map((f) => [f.field, f.to])), [e.id]: rowId, [e.outerId]: outerId };
      const [row] = await tx.insert(e.table).values(next).returning();
      await tx.update(innerCapsule).set({ validTo: t }).where(eq(innerCapsule.id, head.ic.id));
      const icId = createId();
      await tx.insert(innerCapsule).values({
        id: icId, outerCapsuleId: outerId, branchId: head.branchId, entityType: entity, entityRowId: rowId,
        createdAt: t, validFrom: t, validTo: null, originKind: "continuation", authorId: author.id, authorType: author.type, isMain: head.ic.isMain, sourceVersionIds: [head.ic.id],
      });
      await tx.insert(versionDelta).values({ id: createId(), fromInnerCapsuleId: head.ic.id, toInnerCapsuleId: icId, entityType: entity, fields, computedAt: t });
      return row as Row;
    },

    /** A WHERE fragment: the rows that are the current version on a branch at a moment. AND it into any read, as a scope is. */
    current(entity: Entity, view: View = {}): SQL {
      const e = entryOf(entity);
      const id = col(e.table, e.id);
      const b = view.branch ?? MAIN;
      if (!view.at) {
        return sql`${id} in (select ${innerCapsule.entityRowId} from ${innerCapsule}
          join ${branch} on ${branch.id} = ${innerCapsule.branchId}
          join ${outerCapsule} on ${outerCapsule.entityId} = ${innerCapsule.outerCapsuleId}
          where ${innerCapsule.entityType} = ${entity} and ${branch.name} = ${b}
            and ${innerCapsule.validTo} is null and ${outerCapsule.validTo} is null)`;
      }
      const at = view.at;
      return sql`${id} in (select ${innerCapsule.entityRowId} from ${innerCapsule}
        join ${branch} on ${branch.id} = ${innerCapsule.branchId}
        join ${outerCapsule} on ${outerCapsule.entityId} = ${innerCapsule.outerCapsuleId}
        where ${innerCapsule.entityType} = ${entity} and ${branch.name} = ${b}
          and ${innerCapsule.validFrom} <= ${at} and (${innerCapsule.validTo} is null or ${innerCapsule.validTo} > ${at})
          and ${outerCapsule.validFrom} <= ${at} and (${outerCapsule.validTo} is null or ${outerCapsule.validTo} > ${at}))`;
    },

    /** Closes the identity: the outer capsule and every open inner capsule get valid_to = now. No entity row is touched.
     * true when it was alive, false when there was nothing to close. */
    async remove(tx: Handle, entity: Entity, outerId: string): Promise<boolean> {
      entryOf(entity);
      const t = now();
      const closed = await tx.update(outerCapsule).set({ validTo: t }).where(and(eq(outerCapsule.entityId, outerId), isNull(outerCapsule.validTo))).returning({ id: outerCapsule.entityId });
      if (closed.length === 0) return false;
      await tx.update(innerCapsule).set({ validTo: t }).where(and(eq(innerCapsule.outerCapsuleId, outerId), isNull(innerCapsule.validTo)));
      return true;
    },
  };
}

export type Versioning<V extends VersionedMap> = ReturnType<typeof createVersioning<V>>;
