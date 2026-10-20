/**
 * Membership repository — data access for `member` (the physical table name;
 * the code entity is Membership — UOM1). Renaming the table needs a migration.
 */

import {
  and,
  arrayContains,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
} from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  GatedDb,
  Private,
  Scope,
  SchemaTables,
} from "@libs/gated-scoped-ac";
import { uomMembership, type UomMembershipSelect } from "../models/membership.model";
import {
  uomOrganization,
  type UomOrganizationSelect,
} from "../models/organization.model";
import {
  uomUserContact,
  uomUserProfile,
  type UserContactPayload,
} from "../models/user.model";

export interface MembershipWithOrganization {
  member: UomMembershipSelect;
  organization: UomOrganizationSelect;
}

export interface MembershipWithProfile {
  member: UomMembershipSelect;
  name: string | null;
  image: string | null;
  /** The member's default contact, when seeded. */
  contact: UserContactPayload | null;
}

export interface PageMembersQuery {
  search?: string;
  page: number;
  pageSize: number;
}

export interface MembershipRepository {
  /** AC42: reached only via `membershipService.addMember` (private-only —
   * org-create seat + invitation-accept seat, neither a public flow). */
  create(
    visibility: Private,
    input: {
      organizationId: string;
      userId: string;
      roles: string[];
    },
  ): Promise<UomMembershipSelect>;
  /** Bulk lookup — want one? pass `[id]` and read the first row. No route
   * reaches this yet — untouched by AC42 threading. */
  findByIds(ids: string[]): Promise<UomMembershipSelect[]>;
  /** Every membership row, paginated (API5). Page, size AND order come from
   * the caller — the repo never decides sorting. No route reaches this yet —
   * untouched by AC42 threading. */
  findAll(query: {
    page: number;
    pageSize: number;
    order: "asc" | "desc";
  }): Promise<{ rows: UomMembershipSelect[]; total: number }>;
  /** AC42: private — `addMember` (seat) and `assertMembership` (self/manage). */
  findByOrgIdAndUserId(
    visibility: Private,
    organizationId: string,
    userId: string,
  ): Promise<UomMembershipSelect | null>;
  /** How many members hold this role — last-owner protection's count. AC42:
   * private-only surface. */
  countByRole(
    visibility: Private,
    organizationId: string,
    role: string,
  ): Promise<number>;
  /** Members joined to their profiles — name search, paginated. The engine's
   * read Scope admits the membership rows; the display join composes over them.
   * AC42: private-only surface. */
  findAllByOrgIds(
    visibility: Private,
    organizationIds: string[],
    query: PageMembersQuery,
    scope: Scope<"membership", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<{ rows: MembershipWithProfile[]; total: number }>;
  /** Memberships joined to their org — the gate's facts (token-less, session
   * resolution) and `/me/memberships` (private, threaded). AC42: private — the
   * loosest demand covering the one genuinely-threaded caller; the token-less
   * session-resolution caller passes `PRIVATE` directly (never split a
   * signature for this — rule 5). */
  findAllByUserIds(
    visibility: Private,
    userIds: string[],
  ): Promise<MembershipWithOrganization[]>;
  /** Raw role write-by-id — the ungated seat path (owner seating, re-invite
   * merge). The gated member-management write is `updateScoped`. AC42: private
   * — reached only from `addMember`'s merge branch. */
  update(visibility: Private, id: string, roles: string[]): Promise<void>;
  /** Scoped role write-by-id — the gated handle fuses the update Scope into the
   * statement; returns the row, or null when the Scope admits no such row.
   * AC42: private-only surface. */
  updateScoped(
    visibility: Private,
    id: string,
    roles: string[],
    scope: Scope<"membership", "update">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomMembershipSelect | null>;
  /** Raw soft delete — the ungated self-removal path (a member leaving keeps the
   * row as history, UOM8). Managing ANOTHER member gates via `findRowsByIdWhereCanDelete`.
   * AC42: private-only surface. */
  delete(visibility: Private, id: string): Promise<void>;
  /** Delete-scope probe — the rows a caller's delete Scope admits for this id.
   * Non-mutating (membership removal is a soft delete, so the write itself stays
   * `delete`): the service reads emptiness as "denied". AC42: private-only surface. */
  findRowsByIdWhereCanDelete(
    visibility: Private,
    id: string,
    scope: Scope<"membership", "delete">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<Record<string, unknown>[]>;
}

export interface DrizzleMembershipRepositoryDeps {
  db: NodePgDatabase<Record<string, unknown>>;
  createId: () => string;
}

export class DrizzleMembershipRepository implements MembershipRepository {
  constructor(private readonly deps: DrizzleMembershipRepositoryDeps) {}

  async create(
    visibility: Private,
    input: {
      organizationId: string;
      userId: string;
      roles: string[];
    },
  ): Promise<UomMembershipSelect> {
    void visibility; // leaf
    const now = new Date();
    const row = {
      id: this.deps.createId(),
      organizationId: input.organizationId,
      userId: input.userId,
      roles: input.roles,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await this.deps.db.insert(uomMembership).values(row);
    return row;
  }

  async findByIds(ids: string[]): Promise<UomMembershipSelect[]> {
    if (ids.length === 0) return [];
    return this.deps.db
      .select()
      .from(uomMembership)
      .where(
        and(inArray(uomMembership.id, ids), isNull(uomMembership.deletedAt)),
      );
  }

  async findAll(query: {
    page: number;
    pageSize: number;
    order: "asc" | "desc";
  }): Promise<{ rows: UomMembershipSelect[]; total: number }> {
    const [counted] = await this.deps.db
      .select({ value: count() })
      .from(uomMembership)
      .where(isNull(uomMembership.deletedAt));
    const rows = await this.deps.db
      .select()
      .from(uomMembership)
      .where(isNull(uomMembership.deletedAt))
      .orderBy(
        query.order === "asc"
          ? asc(uomMembership.createdAt)
          : desc(uomMembership.createdAt),
      )
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
    return { rows, total: counted?.value ?? 0 };
  }

  async findByOrgIdAndUserId(
    visibility: Private,
    organizationId: string,
    userId: string,
  ): Promise<UomMembershipSelect | null> {
    void visibility; // leaf
    const [row] = await this.deps.db
      .select()
      .from(uomMembership)
      .where(
        and(
          eq(uomMembership.organizationId, organizationId),
          eq(uomMembership.userId, userId),
          isNull(uomMembership.deletedAt),
        ),
      );
    return row ?? null;
  }

  async countByRole(
    visibility: Private,
    organizationId: string,
    role: string,
  ): Promise<number> {
    void visibility; // leaf
    const [row] = await this.deps.db
      .select({ value: count() })
      .from(uomMembership)
      .where(
        and(
          eq(uomMembership.organizationId, organizationId),
          arrayContains(uomMembership.roles, [role]),
          isNull(uomMembership.deletedAt),
        ),
      );
    return row?.value ?? 0;
  }

  // Two-stage members list (UOM14). Stage 1: the engine's read Scope admits the
  // MEMBERSHIP rows — resolved by the caller, executed here through the gated
  // handle. Stage 2: the user ⋈ userProfile ⋈ userContact display enrichment
  // runs as an ordinary join CONSTRAINED to the admitted membership ids. AC7's
  // ideal (the display join itself engine-declared) needs DSL view support that
  // deliberately does not exist yet (AC35), so the enrichment join stays
  // hand-written here — but never widens the row set the Scope admitted.
  async findAllByOrgIds(
    visibility: Private,
    organizationIds: string[],
    query: PageMembersQuery,
    scope: Scope<"membership", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<{ rows: MembershipWithProfile[]; total: number }> {
    void visibility; // leaf
    if (organizationIds.length === 0) return { rows: [], total: 0 };
    // Stage 1 — admitted membership ids, narrowed (AND) to the requested org(s)
    // + live rows (AC12 — narrow-only; the Scope is the access boundary).
    const admitted = (await gateDb
      .read("membership", scope)
      .where(
        and(
          inArray(uomMembership.organizationId, organizationIds),
          isNull(uomMembership.deletedAt),
        )!,
      )
      .rows()) as { id: string }[];
    const admittedIds = admitted.map((m) => m.id);
    if (admittedIds.length === 0) return { rows: [], total: 0 };
    // Stage 2 — enrichment join over exactly those ids + the name search.
    const where = and(
      inArray(uomMembership.id, admittedIds),
      query.search ? ilike(uomUserProfile.name, `%${query.search}%`) : undefined,
    );
    const defaultContactJoin = and(
      eq(uomMembership.userId, uomUserContact.userId),
      eq(uomUserContact.isDefault, true),
    )!;
    const [counted] = await this.deps.db
      .select({ value: count() })
      .from(uomMembership)
      .leftJoin(uomUserProfile, eq(uomMembership.userId, uomUserProfile.userId))
      .where(where);
    const rows = await this.deps.db
      .select({
        member: uomMembership,
        name: uomUserProfile.name,
        image: uomUserProfile.image,
        contact: uomUserContact.contact,
      })
      .from(uomMembership)
      .leftJoin(uomUserProfile, eq(uomMembership.userId, uomUserProfile.userId))
      .leftJoin(uomUserContact, defaultContactJoin)
      .where(where)
      .orderBy(asc(uomMembership.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
    return { rows, total: counted?.value ?? 0 };
  }

  async findAllByUserIds(
    visibility: Private,
    userIds: string[],
  ): Promise<MembershipWithOrganization[]> {
    void visibility; // leaf
    if (userIds.length === 0) return [];
    return this.deps.db
      .select({ member: uomMembership, organization: uomOrganization })
      .from(uomMembership)
      .innerJoin(
        uomOrganization,
        eq(uomMembership.organizationId, uomOrganization.id),
      )
      .where(
        and(
          inArray(uomMembership.userId, userIds),
          isNull(uomMembership.deletedAt),
          isNull(uomOrganization.deletedAt),
        ),
      );
  }

  /** Raw role write-by-id — the ungated seat path (owner seating on org create,
   * re-invite role merge). Member MANAGEMENT gates via `updateScoped`. */
  async update(visibility: Private, id: string, roles: string[]): Promise<void> {
    void visibility; // leaf
    await this.deps.db
      .update(uomMembership)
      .set({ roles, updatedAt: new Date() })
      .where(eq(uomMembership.id, id));
  }

  async updateScoped(
    visibility: Private,
    id: string,
    roles: string[],
    scope: Scope<"membership", "update">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomMembershipSelect | null> {
    void visibility; // leaf
    // The gated handle fuses the update Scope into the write. Denied / no such
    // row ⇒ null (the service decides — the gate never throws).
    const row = await gateDb.update("membership", scope, id, {
      roles,
      updatedAt: new Date(),
    });
    return (row as UomMembershipSelect | null) ?? null;
  }

  /** Soft delete — member removal keeps the row as history (UOM8); reads
   * filter `deletedAt is null`, so re-adding inserts a fresh live row. Ungated:
   * the caller (self-removal) or the delete-scope probe authorizes it. */
  async delete(visibility: Private, id: string): Promise<void> {
    void visibility; // leaf
    await this.deps.db
      .update(uomMembership)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(uomMembership.id, id));
  }

  async findRowsByIdWhereCanDelete(
    visibility: Private,
    id: string,
    scope: Scope<"membership", "delete">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<Record<string, unknown>[]> {
    void visibility; // leaf
    // Non-mutating delete-scope probe — removal is a SOFT delete (an UPDATE
    // set deletedAt), so the gate can't perform the write itself; it answers
    // "may this delete Scope reach the row?" and the service does the soft
    // delete when the probe returns rows.
    return gateDb.findRowsByIdWhereCanDelete("membership", scope, id);
  }
}
