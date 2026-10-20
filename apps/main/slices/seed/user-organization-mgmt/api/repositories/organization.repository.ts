/**
 * Organization repository — data access for `organization`.
 */

import { and, asc, count, eq, ilike, inArray, isNull, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  GatedDb,
  Private,
  Public,
  Scope,
  SchemaTables,
} from "@libs/gated-scoped-ac";
import {
  uomOrganization,
  type UomOrganizationSelect,
} from "../models/organization.model";

export interface FindAllOrganizationsQuery {
  search?: string;
  type?: string;
  /** Matches the metadata `status` key; an unset key counts as "active". */
  status?: string;
  page: number;
  pageSize: number;
}

export interface CreateOrganizationRecord {
  type: string;
  name: string;
  logo?: string;
  metadata?: Record<string, unknown>;
}

export interface OrganizationPatch {
  name?: string;
  logo?: string | null;
  metadata?: Record<string, unknown>;
}

export interface OrganizationRepository {
  /** AC42: reached only via `organizationService.create` (a private write). */
  create(
    visibility: Private,
    input: CreateOrganizationRecord,
  ): Promise<UomOrganizationSelect>;
  /** Bulk lookup — want one? pass `[id]` and read the first row. Ungated narrow
   * accessor (org facts for other services); the gated read is `findByIdsScoped`.
   * AC42: Public — `organizationService.getOrg` is reached by the public
   * invitation capability view (`getPublicView`), so this leaf must accept a
   * public flow too. */
  findByIds(visibility: Public, ids: string[]): Promise<UomOrganizationSelect[]>;
  /** Gated bulk lookup — the same by-id read, but the engine's read Scope admits
   * the rows and the gated handle executes it (the getById surface). AC42:
   * private — only the authenticated `getById` reaches this. */
  findByIdsScoped(
    visibility: Private,
    ids: string[],
    scope: Scope<"organization", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomOrganizationSelect[]>;
  /** Singleton enforcement: how many orgs of this type exist. AC42: reached
   * only from the private `create` flow. */
  countByType(visibility: Private, type: string): Promise<number>;
  /** Directory listing — name search + type filter, paginated, name-ordered.
   * The engine's read Scope admits the org ids; the display query composes over
   * them (search/type/status/pagination). AC42: private-only surface. */
  findAll(
    visibility: Private,
    query: FindAllOrganizationsQuery,
    scope: Scope<"organization", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<{ rows: UomOrganizationSelect[]; total: number }>;
  /** Scoped write-by-id — the gated handle fuses the update Scope into the
   * statement; returns the row, or null when the Scope admits no such row.
   * AC42: private-only surface. */
  update(
    visibility: Private,
    id: string,
    patch: OrganizationPatch,
    scope: Scope<"organization", "update">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomOrganizationSelect | null>;
  /** Update-scope probe — the rows a caller's update Scope admits for this id.
   * Non-mutating, for an update whose write happens elsewhere (the logo
   * presign: the browser PUTs to storage and `update` stores the URL later);
   * the service reads emptiness as "denied". AC42: private-only surface. */
  findRowsByIdWhereCanUpdate(
    visibility: Private,
    id: string,
    scope: Scope<"organization", "update">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<Record<string, unknown>[]>;
  /** No route reaches this yet — untouched by AC42 threading. */
  delete(id: string): Promise<void>;
}

export interface DrizzleOrganizationRepositoryDeps {
  db: NodePgDatabase<Record<string, unknown>>;
  createId: () => string;
}

export class DrizzleOrganizationRepository implements OrganizationRepository {
  constructor(private readonly deps: DrizzleOrganizationRepositoryDeps) {}

  async create(
    visibility: Private,
    input: CreateOrganizationRecord,
  ): Promise<UomOrganizationSelect> {
    void visibility; // leaf — the demand was enforced at the caller
    const now = new Date();
    const row = {
      id: this.deps.createId(),
      type: input.type,
      name: input.name,
      logo: input.logo ?? null,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await this.deps.db.insert(uomOrganization).values(row);
    return row;
  }

  async findByIds(
    visibility: Public,
    ids: string[],
  ): Promise<UomOrganizationSelect[]> {
    void visibility; // leaf
    if (ids.length === 0) return [];
    return this.deps.db
      .select()
      .from(uomOrganization)
      .where(
        and(inArray(uomOrganization.id, ids), isNull(uomOrganization.deletedAt)),
      );
  }

  async findByIdsScoped(
    visibility: Private,
    ids: string[],
    scope: Scope<"organization", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomOrganizationSelect[]> {
    void visibility; // leaf
    if (ids.length === 0) return [];
    // The read Scope is the access boundary; narrow it (AND) to the requested
    // ids + live rows (AC12 — narrow-only). The gated handle executes it.
    const rows = await gateDb
      .read("organization", scope)
      .where(
        and(inArray(uomOrganization.id, ids), isNull(uomOrganization.deletedAt))!,
      )
      .rows();
    return rows as UomOrganizationSelect[];
  }

  async countByType(visibility: Private, type: string): Promise<number> {
    void visibility; // leaf
    const [row] = await this.deps.db
      .select({ value: count() })
      .from(uomOrganization)
      .where(
        and(
          eq(uomOrganization.type, type),
          isNull(uomOrganization.deletedAt),
        ),
      );
    return row?.value ?? 0;
  }

  async findAll(
    visibility: Private,
    query: FindAllOrganizationsQuery,
    scope: Scope<"organization", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<{ rows: UomOrganizationSelect[]; total: number }> {
    void visibility; // leaf
    // The engine's read Scope decides which orgs are visible; the directory
    // query composes over those ids. Materialize the admitted ids through the
    // gated handle, then run the display filters (search/type/status) +
    // pagination against them — identical WHERE for list + count (API5).
    const admitted = (await gateDb.read("organization", scope).rows()) as {
      id: string;
    }[];
    const admittedIds = admitted.map((r) => r.id);
    if (admittedIds.length === 0) return { rows: [], total: 0 };
    const where = and(
      inArray(uomOrganization.id, admittedIds),
      isNull(uomOrganization.deletedAt),
      query.search
        ? ilike(uomOrganization.name, `%${query.search}%`)
        : undefined,
      query.type ? eq(uomOrganization.type, query.type) : undefined,
      query.status
        ? query.status === "active"
          ? sql`coalesce(${uomOrganization.metadata}->>'status', 'active') = 'active'`
          : sql`${uomOrganization.metadata}->>'status' = ${query.status}`
        : undefined,
    );
    const [counted] = await this.deps.db
      .select({ value: count() })
      .from(uomOrganization)
      .where(where);
    const rows = await this.deps.db
      .select()
      .from(uomOrganization)
      .where(where)
      .orderBy(asc(uomOrganization.name))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
    return { rows, total: counted?.value ?? 0 };
  }

  async update(
    visibility: Private,
    id: string,
    patch: OrganizationPatch,
    scope: Scope<"organization", "update">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomOrganizationSelect | null> {
    void visibility; // leaf
    // The gated handle fuses the update Scope into the write: the row is touched
    // only when the Scope admits it. Denied / no such row ⇒ null (the service
    // decides what that means — the gate never throws).
    const row = await gateDb.update("organization", scope, id, {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.logo !== undefined ? { logo: patch.logo } : {}),
      ...(patch.metadata !== undefined ? { metadata: patch.metadata } : {}),
      updatedAt: new Date(),
    });
    return (row as UomOrganizationSelect | null) ?? null;
  }

  async findRowsByIdWhereCanUpdate(
    visibility: Private,
    id: string,
    scope: Scope<"organization", "update">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<Record<string, unknown>[]> {
    void visibility; // leaf
    return gateDb.findRowsByIdWhereCanUpdate("organization", scope, id);
  }

  /** Soft delete — marks the row deleted; reads filter `deletedAt is null`. */
  async delete(id: string): Promise<void> {
    await this.deps.db
      .update(uomOrganization)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(uomOrganization.id, id));
  }
}
