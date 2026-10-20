// The GATED db wrapper — the ONLY path to the database. `read`/`update`/
// `delete` REQUIRE a matching branded `Scope` (minted only by the engine), so
// "reach the db without going through access control" is a COMPILE ERROR. This
// module is the only place that touches the raw db handle.
//
// `createGatedDb` is the factory that owns the raw handle; it returns `gateDb(bag)`,
// the per-request wrapper. The bag IS the nested session-subjects object (D3) —
// the gate forwards it to the engine for the create verdict.
//
// THE GATE NEVER THROWS. A denied write returns null, an unmatched read returns
// no rows. Deciding what a denial *means* is business logic, and that belongs to
// the service — "a boolean is business logic; the repository should not have
// business logic". The service does: `if (!row) throw forbidden()`.
//
// The gate also needs the injected `tables` (entity → drizzle table) and the
// `engine` (for the create verdict, where there is no Scope to require). Both
// are app-owned and injected here.

import { and, eq, inArray, or, sql, type SQL } from "drizzle-orm";

import type {
  Ac,
  AnyTable,
  ExistsProbe,
  Scope,
  SchemaTables,
} from "./engine";

export type GateDeps<S extends SchemaTables> = {
  tables: S;
  engine: Pick<Ac<S>, "allowCreate">;
  /**
   * Per-entity primary-key column, when it is not the default `"id"`. Every
   * place the gate keys a row by its identity (the write probes, `update`,
   * `delete`, and the visibility-union `IN (…)`) reads this column. An entity
   * whose pk is `userId` (e.g. `user_profile`) declares `user_profile: "userId"`
   * so the fused write matches on `user_id` instead of a non-existent `id`.
   */
  idColumns?: Partial<Record<keyof S & string, string>>;
};

export function createGatedDb<S extends SchemaTables>(
  db: any,
  deps: GateDeps<S>,
) {
  type EntityName = keyof S & string;
  const { tables, engine, idColumns } = deps;
  const tableOf = (entity: string): AnyTable => tables[entity];
  // The entity's identity column — its declared pk override, else `"id"`.
  const idColOf = (entity: EntityName): any =>
    tableOf(entity)[idColumns?.[entity] ?? "id"];

  // assemble the final WHERE: base OR (entity.<pk> IN each described sub-query)
  function scopeWhere<E extends EntityName, A extends "read" | "update" | "delete">(
    entity: E,
    scope: Scope<E, A>,
  ): SQL {
    const parts: SQL[] = [scope.base];
    for (const sub of scope.idSubqueries) {
      const fromTable = tableOf(sub.from);
      let q = db
        .select({ id: fromTable[sub.idColumn] })
        .from(fromTable)
        .$dynamic();
      if (sub.joinTo) {
        q = q.innerJoin(tableOf(sub.joinTo.table), sub.joinTo.on);
      }
      parts.push(inArray(idColOf(entity), q.where(sub.where)));
    }
    return parts.length > 1 ? or(...parts)! : parts[0];
  }

  // Payload probes, OR-ed: does ANY of them find a row? Each is self-contained
  // (the engine built the whole WHERE, key match included), so this is a plain
  // existence question — short-circuits on the first hit.
  async function anyProbePasses(
    probes: readonly ExistsProbe<EntityName>[],
  ): Promise<boolean> {
    for (const probe of probes) {
      const rows = await db
        .select({ ok: sql`1` })
        .from(tableOf(probe.from))
        .where(probe.where)
        .limit(1);
      if (rows.length) return true;
    }
    return false;
  }

  // Rows the scope admits, by id — the shared body of the two write probes.
  async function rowsByIdWhere<E extends EntityName, A extends "update" | "delete">(
    entity: E,
    scope: Scope<E, A>,
    id: string,
  ): Promise<Record<string, unknown>[]> {
    const table = tableOf(entity);
    return db
      .select()
      .from(table)
      .where(and(eq(idColOf(entity), id), scopeWhere(entity, scope)));
  }

  // the per-request wrapper — `bag` is the nested session-subjects object (D3)
  const gateDb = function gateDb(bag: unknown) {
    return {
      // READ — requires a read-scope; applies `fields`; narrow-only builder.
      // A restricted field list NARROWS THE COLUMNS, it never denies the row:
      // if you may see any column of a row you may see, you get the row with
      // the columns you're allowed.
      read<E extends EntityName>(entity: E, scope: Scope<NoInfer<E>, "read">) {
        const table = tableOf(entity);
        let where = scopeWhere(entity, scope);
        const cols = scope.fields
          ? Object.fromEntries(scope.fields.map((f) => [f, table[f]]))
          : undefined;
        const run = () =>
          (cols ? db.select(cols) : db.select()).from(table).where(where);
        const builder = {
          // AND only (compress-never-expand): callers may narrow, never widen.
          where(extra: SQL) {
            where = and(where, extra)!;
            return builder;
          },
          rows: () => run(),
          first: async () => (await run().limit(1))[0] ?? null,
        };
        return builder;
      },

      // ── the two write probes ────────────────────────────────────────────
      // Non-mutating: "which rows with this id may I update / delete?".
      // Needed wherever the actual write happens somewhere the gate can't see
      // it (an external provider), and as update's ROW gate. They return ROWS,
      // never a boolean — the service decides what emptiness means.
      findRowsByIdWhereCanUpdate<E extends EntityName>(
        entity: E,
        scope: Scope<NoInfer<E>, "update">,
        id: string,
      ): Promise<Record<string, unknown>[]> {
        return rowsByIdWhere(entity, scope, id);
      },

      findRowsByIdWhereCanDelete<E extends EntityName>(
        entity: E,
        scope: Scope<NoInfer<E>, "delete">,
        id: string,
      ): Promise<Record<string, unknown>[]> {
        return rowsByIdWhere(entity, scope, id);
      },

      // CREATE — no scope: there is no row yet to constrain. The gate enforces
      // the engine verdict so a row can't be inserted ungated even if a caller
      // forgets. Denied ⇒ null.
      //
      // A rule's `payload` can also require that the PARENT the new row points
      // at admits the caller ("append a slice only to a song I may edit"). The
      // engine hands those over as probes, OR-ed: one row back from any of them
      // and the insert proceeds. Deliberately NOT fused into the INSERT — the
      // check-then-write window is the same one requireX-then-insert has always
      // had, and closing it would mean hand-built casts for every jsonb and
      // array column.
      async create<E extends EntityName>(
        entity: E,
        permissions: Iterable<string>,
        values: Record<string, unknown>,
      ): Promise<Record<string, unknown> | null> {
        const verdict = engine.allowCreate(permissions, entity, bag, values);
        if (!verdict.allow) return null;
        if (verdict.requires?.length && !(await anyProbePasses(verdict.requires))) {
          return null;
        }
        const [insertedRow] = await db
          .insert(tableOf(entity))
          .values(values)
          .returning();
        return insertedRow ?? null;
      },

      // UPDATE / DELETE — require the matching action-scope, fused into the
      // statement. Denied (or no such row) ⇒ null. Never throws.
      async update<E extends EntityName>(
        entity: E,
        scope: Scope<NoInfer<E>, "update">,
        id: string,
        patch: Record<string, unknown>,
      ): Promise<Record<string, unknown> | null> {
        const table = tableOf(entity);
        const [updatedRow] = await db
          .update(table)
          .set(patch)
          .where(and(eq(idColOf(entity), id), scopeWhere(entity, scope)))
          .returning();
        return updatedRow ?? null;
      },

      async delete<E extends EntityName>(
        entity: E,
        scope: Scope<NoInfer<E>, "delete">,
        id: string,
      ): Promise<{ id: string } | null> {
        const table = tableOf(entity);
        const deleted = await db
          .delete(table)
          .where(and(eq(idColOf(entity), id), scopeWhere(entity, scope)))
          .returning({ id: idColOf(entity) });
        return deleted[0] ?? null;
      },
    };
  };

  // ── THE ONE SANCTIONED UNGATED PATH ───────────────────────────────────────
  // Hydration has to read the database BEFORE access control exists — it is
  // what produces the bag that AC needs — so it cannot go through AC. Since AC
  // is the only thing allowed to touch the db, that exception has to come from
  // here, named and obvious rather than smuggled in as a second db handle.
  //
  // ONLY for hydration. Anything reachable from a route goes through gateDb.
  gateDb.unscopedForHydration = (): any => db;

  return gateDb;
}

export type GatedDb<S extends SchemaTables> = ReturnType<
  ReturnType<typeof createGatedDb<S>>
>;
