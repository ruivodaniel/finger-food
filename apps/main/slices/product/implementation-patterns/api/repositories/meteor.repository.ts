/**
 * Meteor repository — data access for `meteor`. Two doors: the public one
 * (Public token) reads published rows ungated; the private one goes through
 * the gated db — create takes the caller's permissions, every other method a
 * Scope. The gate never throws: a denied write comes back null and the
 * service decides what that means.
 */

import { and, asc, count, eq, ilike, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { GatedDb, Private, Public, Scope, SchemaTables } from "@libs/gated-scoped-ac";
import { meteor, type MeteorSelect } from "../models/meteor.model";
import type { MeteorListQuery, UpdateMeteorInput } from "../models/meteor.schemas";

export interface CreateMeteorRecord {
  /** chosen by the service: a charge is taken under it before the row exists */
  id: string;
  organizationId: string;
  createdBy: string;
  name: string;
  description?: string | null;
  diameterKm?: string | null;
  discoveredAt?: string | null;
  status: "draft" | "published";
}

export type MeteorPatch = UpdateMeteorInput;

export interface MeteorRepository {
  /** Published rows of the given ids, ungated — the public door. */
  findPublishedByIds(visibility: Public, ids: string[]): Promise<MeteorSelect[]>;
  /** The page of published rows, ungated — the public door. */
  findAllPublished(visibility: Public, query: MeteorListQuery): Promise<{ rows: MeteorSelect[]; total: number }>;
  /** Inserts through the gate: the create verdict, its payload probes, the insert. */
  create(visibility: Private, input: CreateMeteorRecord, permissions: Iterable<string>, gateDb: GatedDb<SchemaTables>): Promise<MeteorSelect | null>;
  /** Current rows of the given ids, ungated — a live meteor's own reads (load, titles): its access was asked of the gate
   * when the caller joined. */
  findByIds(visibility: Private, ids: string[]): Promise<MeteorSelect[]>;
  /** Writes a live meteor's checkpoint, ungated, on a db that writes on behalf of its last editor: a checkpoint has no
   * request behind it, and every change in it was allowed when it arrived. Nothing matched ⇒ null. */
  updateUngated(visibility: Private, id: string, patch: MeteorPatch, writeDb: NodePgDatabase<Record<string, unknown>>): Promise<MeteorSelect | null>;
  /** Gated bulk lookup — want one? pass `[id]` and read the first row. */
  findByIdsScoped(visibility: Private, ids: string[], scope: Scope<"meteor", "read">, gateDb: GatedDb<SchemaTables>): Promise<MeteorSelect[]>;
  /** The page of rows the read Scope admits; identical WHERE for list + count. */
  findAll(visibility: Private, query: MeteorListQuery, scope: Scope<"meteor", "read">, gateDb: GatedDb<SchemaTables>): Promise<{ rows: MeteorSelect[]; total: number }>;
  /** The rows of these ids the update Scope admits, without writing: a probe. */
  findByIdsWhereCanUpdate(visibility: Private, ids: string[], scope: Scope<"meteor", "update">, gateDb: GatedDb<SchemaTables>): Promise<MeteorSelect[]>;
  /** Scoped write-by-id — null when the Scope admits no such row. */
  update(visibility: Private, id: string, patch: MeteorPatch, scope: Scope<"meteor", "update">, gateDb: GatedDb<SchemaTables>): Promise<MeteorSelect | null>;
  /** Scoped hard delete — what was deleted and when it was created, or null when the Scope admits no such row. */
  delete(visibility: Private, id: string, scope: Scope<"meteor", "delete">, gateDb: GatedDb<SchemaTables>): Promise<{ id: string; createdAt: Date } | null>;
}

export interface DrizzleMeteorRepositoryDeps {
  db: NodePgDatabase<Record<string, unknown>>;
}

export class DrizzleMeteorRepository implements MeteorRepository {
  constructor(private readonly deps: DrizzleMeteorRepositoryDeps) {}

  async findPublishedByIds(visibility: Public, ids: string[]): Promise<MeteorSelect[]> {
    void visibility; // leaf
    if (ids.length === 0) return [];
    return this.deps.db
      .select()
      .from(meteor)
      .where(and(inArray(meteor.id, ids), eq(meteor.status, "published")));
  }

  async findAllPublished(visibility: Public, query: MeteorListQuery): Promise<{ rows: MeteorSelect[]; total: number }> {
    void visibility; // leaf
    const where = and(
      eq(meteor.status, "published"),
      query.search ? ilike(meteor.name, `%${query.search}%`) : undefined,
    );
    return this.page(where, query);
  }

  async create(
    visibility: Private,
    input: CreateMeteorRecord,
    permissions: Iterable<string>,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<MeteorSelect | null> {
    void visibility; // leaf
    const now = new Date();
    // The gate asks the engine for the create verdict, runs its payload
    // probes and inserts. Denied ⇒ null (the gate never throws).
    const row = await gateDb.create("meteor", permissions, {
      id: input.id,
      organizationId: input.organizationId,
      createdBy: input.createdBy,
      name: input.name,
      description: input.description ?? null,
      diameterKm: input.diameterKm ?? null,
      discoveredAt: input.discoveredAt ?? null,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    });
    return (row as MeteorSelect | null) ?? null;
  }

  async findByIds(visibility: Private, ids: string[]): Promise<MeteorSelect[]> {
    void visibility; // leaf
    if (ids.length === 0) return [];
    return this.deps.db.select().from(meteor).where(inArray(meteor.id, ids));
  }

  async updateUngated(visibility: Private, id: string, patch: MeteorPatch, writeDb: NodePgDatabase<Record<string, unknown>>): Promise<MeteorSelect | null> {
    void visibility; // leaf
    const [row] = await writeDb.update(meteor).set({ ...patch, updatedAt: new Date() }).where(eq(meteor.id, id)).returning();
    return row ?? null;
  }

  async findByIdsScoped(
    visibility: Private,
    ids: string[],
    scope: Scope<"meteor", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<MeteorSelect[]> {
    void visibility; // leaf
    if (ids.length === 0) return [];
    // The read Scope is the access boundary; narrow it (AND) to the requested
    // ids. The gated handle executes it.
    const rows = await gateDb.read("meteor", scope).where(inArray(meteor.id, ids)).rows();
    return rows as MeteorSelect[];
  }

  async findAll(
    visibility: Private,
    query: MeteorListQuery,
    scope: Scope<"meteor", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<{ rows: MeteorSelect[]; total: number }> {
    void visibility; // leaf
    // The engine's read Scope decides which meteors are visible; the list
    // query composes over those ids. Materialize the admitted ids through the
    // gated handle, then run the display filters + pagination against them.
    const admitted = (await gateDb.read("meteor", scope).rows()) as { id: string }[];
    const admittedIds = admitted.map((r) => r.id);
    if (admittedIds.length === 0) return { rows: [], total: 0 };
    const where = and(
      inArray(meteor.id, admittedIds),
      query.search ? ilike(meteor.name, `%${query.search}%`) : undefined,
    );
    return this.page(where, query);
  }

  async findByIdsWhereCanUpdate(
    visibility: Private,
    ids: string[],
    scope: Scope<"meteor", "update">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<MeteorSelect[]> {
    void visibility; // leaf
    // The gate's non-mutating probe, one id at a time: "may this row be updated?".
    const found = await Promise.all(ids.map((id) => gateDb.findRowsByIdWhereCanUpdate("meteor", scope, id)));
    return found.flat() as MeteorSelect[];
  }

  async update(
    visibility: Private,
    id: string,
    patch: MeteorPatch,
    scope: Scope<"meteor", "update">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<MeteorSelect | null> {
    void visibility; // leaf
    // The gated handle fuses the update Scope into the write: the row is touched
    // only when the Scope admits it. Denied / no such row ⇒ null.
    const row = await gateDb.update("meteor", scope, id, {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.diameterKm !== undefined ? { diameterKm: patch.diameterKm } : {}),
      ...(patch.discoveredAt !== undefined ? { discoveredAt: patch.discoveredAt } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      updatedAt: new Date(),
    });
    return (row as MeteorSelect | null) ?? null;
  }

  async delete(
    visibility: Private,
    id: string,
    scope: Scope<"meteor", "delete">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<{ id: string; createdAt: Date } | null> {
    void visibility; // leaf
    // The gate hands back only the id, and the row is gone after it: when it
    // was created is read first and only returned if the delete is admitted.
    const [found] = await this.deps.db.select({ createdAt: meteor.createdAt }).from(meteor).where(eq(meteor.id, id)).limit(1);
    // Hard delete fused with the delete Scope. Denied / no such row ⇒ null.
    const row = await gateDb.delete("meteor", scope, id);
    return row && found ? { id, createdAt: found.createdAt } : null;
  }

  /** One WHERE for the count and the page; `id` is the stable tiebreaker. */
  private async page(where: ReturnType<typeof and>, query: MeteorListQuery) {
    const [counted] = await this.deps.db.select({ value: count() }).from(meteor).where(where);
    const rows = await this.deps.db
      .select()
      .from(meteor)
      .where(where)
      .orderBy(asc(meteor.name), asc(meteor.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
    return { rows, total: counted?.value ?? 0 };
  }
}
