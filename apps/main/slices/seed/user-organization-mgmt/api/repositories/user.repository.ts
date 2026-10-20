/**
 * User repository — data access for `user`.
 *
 * The internal user row only: a user exists independent of its authentication
 * identifiers (UOM2). Profile and contacts are their own entities with their
 * own repositories (API4) — reach them through their services (API12).
 */

import { and, eq, inArray, isNull } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  GatedDb,
  Public,
  Scope,
  SchemaTables,
} from "@libs/gated-scoped-ac";
import { uomUser, type UomUserSelect } from "../models/user.model";

export interface UserRepository {
  /** AC42: token-less — reached only from `findOrCreateByIdentityId`, the
   * registration self-heal (rule 5); no route mints a token for it. */
  create(input: { identityId: string }): Promise<UomUserSelect>;
  /** Bulk lookup — want one? pass `[id]` and read the first row. AC42: Public —
   * `getMe` (reached by both the public credential surface and the private
   * `/me` surface) is the loosest of its several callers. */
  findByIds(visibility: Public, ids: string[]): Promise<UomUserSelect[]>;
  /** Identity-provider keyed lookup — not our primary key, so not a bulk id
   * lookup (see spec §8 C3). AC42: token-less — reached only from session
   * resolution and the registration self-heal (rule 5). */
  findByIdentityId(identityId: string): Promise<UomUserSelect | null>;
  /** Scoped soft delete — the delete Scope (self-pinned by `delete_own_account`)
   * decides whether the row may be removed; no row admitted ⇒ no write. No route
   * reaches it yet (the ban/delete lifecycle, UOM8) — the gated surface stands
   * ready for one. */
  delete(
    id: string,
    scope: Scope<"user", "delete">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<void>;
}

export interface DrizzleUserRepositoryDeps {
  db: NodePgDatabase<Record<string, unknown>>;
  createId: () => string;
}

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly deps: DrizzleUserRepositoryDeps) {}

  async create(input: { identityId: string }): Promise<UomUserSelect> {
    const now = new Date();
    const row = {
      id: this.deps.createId(),
      identityId: input.identityId,
      status: "active" as const,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await this.deps.db.insert(uomUser).values(row);
    return row;
  }

  async findByIds(visibility: Public, ids: string[]): Promise<UomUserSelect[]> {
    void visibility; // leaf
    if (ids.length === 0) return [];
    return this.deps.db
      .select()
      .from(uomUser)
      .where(and(inArray(uomUser.id, ids), isNull(uomUser.deletedAt)));
  }

  async findByIdentityId(identityId: string): Promise<UomUserSelect | null> {
    const [user] = await this.deps.db
      .select()
      .from(uomUser)
      .where(
        and(eq(uomUser.identityId, identityId), isNull(uomUser.deletedAt)),
      );
    return user ?? null;
  }

  /** Soft delete — clears the row from live reads; the identifier becomes
   * reusable (identity_id is unique among live users only). Soft (an UPDATE),
   * so the gate can't fuse the write: probe the delete Scope, then soft-delete
   * the admitted row (self only, per `delete_own_account`). */
  async delete(
    id: string,
    scope: Scope<"user", "delete">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<void> {
    const admitted = await gateDb.findRowsByIdWhereCanDelete("user", scope, id);
    if (admitted.length === 0) return;
    await this.deps.db
      .update(uomUser)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(uomUser.id, id));
  }
}
