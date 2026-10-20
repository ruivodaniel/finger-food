/**
 * Invitation repository — data access for `invitation`.
 */

import { and, asc, count, desc, eq, gt, inArray, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  GatedDb,
  Private,
  Public,
  Scope,
  SchemaTables,
} from "@libs/gated-scoped-ac";
import {
  uomInvitation,
  type InvitationStatus,
  type UomInvitationSelect,
} from "../models/invitation.model";

export interface CreateInvitationRecord {
  organizationId: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  inviterId: string;
  expiresAt: Date;
}

export interface InvitationRepository {
  /** AC42: reached only via `invitationService.create` (private). */
  create(
    visibility: Private,
    input: CreateInvitationRecord,
  ): Promise<UomInvitationSelect>;
  /** Bulk lookup — want one? pass `[id]` and read the first row. AC42: Public —
   * reached by the public `getPublicView` branch, so the loosest demand covers
   * every caller (the private `revoke` and the token-less accept/reject
   * internals both pass what they hold, per rule 5). */
  findByIds(visibility: Public, ids: string[]): Promise<UomInvitationSelect[]>;
  /** Every invitation row, paginated (API5). Page, size AND order come from
   * the caller — the repo never decides sorting. No route reaches this yet —
   * untouched by AC42 threading. */
  findAll(query: {
    page: number;
    pageSize: number;
    order: "asc" | "desc";
  }): Promise<{ rows: UomInvitationSelect[]; total: number }>;
  /** Org-scoped invitation listing — the engine's read Scope admits the rows
   * (and may narrow the projection); the display query composes over them.
   * AC42: private-only surface. */
  findAllByOrgIds(
    visibility: Private,
    organizationIds: string[],
    scope: Scope<"invitation", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomInvitationSelect[]>;
  /** Pending, unexpired invitations addressed to any of the identifiers. AC42:
   * private-only surface (`getInvitationsByUserId`). */
  findAllByUserIdentifiers(
    visibility: Private,
    identifiers: {
      emails: string[];
      phones: string[];
    },
  ): Promise<UomInvitationSelect[]>;
  /** Raw status write-by-id — the ungated accept/reject path (identifier-matched
   * in the service). Revoke gates via `updateScoped`. AC42: token-less (rule 5
   * — a raw split variant reached only by the accept/reject internals). */
  update(
    id: string,
    status: InvitationStatus,
    invitedUserId?: string,
  ): Promise<void>;
  /** Scoped status write-by-id — the gated handle fuses the update Scope into
   * the statement; returns the row, or null when the Scope admits no such row.
   * AC42: private-only surface. */
  updateScoped(
    visibility: Private,
    id: string,
    status: InvitationStatus,
    scope: Scope<"invitation", "update">,
    gateDb: GatedDb<SchemaTables>,
    invitedUserId?: string,
  ): Promise<UomInvitationSelect | null>;
  /** No route reaches this yet — untouched by AC42 threading. */
  delete(id: string): Promise<void>;
}

export interface DrizzleInvitationRepositoryDeps {
  db: NodePgDatabase<Record<string, unknown>>;
  createId: () => string;
}

export class DrizzleInvitationRepository implements InvitationRepository {
  constructor(private readonly deps: DrizzleInvitationRepositoryDeps) {}

  async create(
    visibility: Private,
    input: CreateInvitationRecord,
  ): Promise<UomInvitationSelect> {
    void visibility; // leaf
    const now = new Date();
    const row = {
      id: this.deps.createId(),
      organizationId: input.organizationId,
      email: input.email,
      phone: input.phone,
      roles: input.roles,
      status: "pending" as const,
      inviterId: input.inviterId,
      invitedUserId: null,
      expiresAt: input.expiresAt,
      createdAt: now,
      updatedAt: now,
    };
    await this.deps.db.insert(uomInvitation).values(row);
    return row;
  }

  async findByIds(
    visibility: Public,
    ids: string[],
  ): Promise<UomInvitationSelect[]> {
    void visibility; // leaf
    if (ids.length === 0) return [];
    return this.deps.db
      .select()
      .from(uomInvitation)
      .where(inArray(uomInvitation.id, ids));
  }

  async findAll(query: {
    page: number;
    pageSize: number;
    order: "asc" | "desc";
  }): Promise<{ rows: UomInvitationSelect[]; total: number }> {
    const [counted] = await this.deps.db
      .select({ value: count() })
      .from(uomInvitation);
    const rows = await this.deps.db
      .select()
      .from(uomInvitation)
      .orderBy(
        query.order === "asc"
          ? asc(uomInvitation.createdAt)
          : desc(uomInvitation.createdAt),
      )
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
    return { rows, total: counted?.value ?? 0 };
  }

  async findAllByOrgIds(
    visibility: Private,
    organizationIds: string[],
    scope: Scope<"invitation", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomInvitationSelect[]> {
    void visibility; // leaf
    if (organizationIds.length === 0) return [];
    // The read Scope is the access boundary (and may narrow the projection —
    // the id doubles as the accept capability); narrow it (AND) to the
    // requested org(s) (AC12) and let the gated handle execute it.
    const rows = await gateDb
      .read("invitation", scope)
      .where(inArray(uomInvitation.organizationId, organizationIds))
      .rows();
    return rows as UomInvitationSelect[];
  }

  async findAllByUserIdentifiers(
    visibility: Private,
    identifiers: {
      emails: string[];
      phones: string[];
    },
  ): Promise<UomInvitationSelect[]> {
    void visibility; // leaf
    const matchers = [
      ...(identifiers.emails.length
        ? [inArray(uomInvitation.email, identifiers.emails)]
        : []),
      ...(identifiers.phones.length
        ? [inArray(uomInvitation.phone, identifiers.phones)]
        : []),
    ];
    if (!matchers.length) return [];
    return this.deps.db
      .select()
      .from(uomInvitation)
      .where(
        and(
          eq(uomInvitation.status, "pending"),
          gt(uomInvitation.expiresAt, new Date()),
          or(...matchers),
        ),
      );
  }

  /** Raw status write-by-id — the ungated accept/reject path (the service
   * identifier-matches the caller). Revoke gates via `updateScoped`. */
  async update(
    id: string,
    status: InvitationStatus,
    invitedUserId?: string,
  ): Promise<void> {
    await this.deps.db
      .update(uomInvitation)
      .set({
        status,
        ...(invitedUserId !== undefined ? { invitedUserId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(uomInvitation.id, id));
  }

  async updateScoped(
    visibility: Private,
    id: string,
    status: InvitationStatus,
    scope: Scope<"invitation", "update">,
    gateDb: GatedDb<SchemaTables>,
    invitedUserId?: string,
  ): Promise<UomInvitationSelect | null> {
    void visibility; // leaf
    // The gated handle fuses the update Scope into the write. Denied / no such
    // row ⇒ null (the service decides — the gate never throws).
    const row = await gateDb.update("invitation", scope, id, {
      status,
      ...(invitedUserId !== undefined ? { invitedUserId } : {}),
      updatedAt: new Date(),
    });
    return (row as UomInvitationSelect | null) ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.deps.db.delete(uomInvitation).where(eq(uomInvitation.id, id));
  }
}
