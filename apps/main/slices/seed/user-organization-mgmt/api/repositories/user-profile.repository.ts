/**
 * User-profile repository — data access for `user_profile`.
 *
 * The public face of a user (name, avatar) kept separate from the internal
 * user row (UOM4): a profile leaks by design, the user row does not.
 */

import { eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  GatedDb,
  Private,
  Public,
  Scope,
  SchemaTables,
} from "@libs/gated-scoped-ac";
import {
  uomUserProfile,
  type UomUserProfileSelect,
} from "../models/user.model";

// A type alias (not an interface) so it carries an implicit index signature —
// the engine's `allowUpdate` takes `Record<string, unknown>` (AC10 column gate).
export type ProfilePatch = {
  name?: string;
  image?: string;
  /** Merged over the existing config-driven data map. */
  data?: Record<string, unknown>;
};

export interface UserProfileRepository {
  /** AC42: token-less — reached only from the pre-session registration seed
   * (`userProfileService.create`, itself token-less per rule 5). */
  create(userId: string): Promise<void>;
  /** Bulk lookup by owning user — plural + array (API6). Ungated narrow accessor
   * (profile facts for the user aggregate + the pre-session registration seed);
   * the gated read is `findAllByUserIdsScoped`. AC42: Public — reached through
   * `getByUserId`, which `getMe` (public + private callers) also reaches. */
  findAllByUserIds(
    visibility: Public,
    userIds: string[],
  ): Promise<UomUserProfileSelect[]>;
  /** Gated bulk lookup — the engine's read Scope admits the rows and the gated
   * handle executes it. No route reaches `getAllByUserIds` yet — untouched by
   * AC42 threading. */
  findAllByUserIdsScoped(
    userIds: string[],
    scope: Scope<"user_profile", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserProfileSelect[]>;
  /** Raw write-by-user — the pre-session registration seed path (no bag yet);
   * the gated authenticated write is `updateScoped`. AC42: token-less — rule 5
   * (`userProfileService.update` raw). */
  update(userId: string, patch: ProfilePatch): Promise<void>;
  /** Scoped write-by-user — the gated handle fuses the update Scope into the
   * statement (keyed on `user_id`, the pk); null when the Scope admits no row.
   * AC42: private-only surface (`updateOwnProfile` → `updateScoped`). */
  updateScoped(
    visibility: Private,
    userId: string,
    patch: ProfilePatch,
    scope: Scope<"user_profile", "update">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserProfileSelect | null>;
  /** Scoped delete-by-user — fused via the gated handle (keyed on `user_id`).
   * No route reaches it yet; the gated surface stands ready — untouched by
   * AC42 threading. */
  delete(
    userId: string,
    scope: Scope<"user_profile", "delete">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<void>;
}

export interface DrizzleUserProfileRepositoryDeps {
  db: NodePgDatabase<Record<string, unknown>>;
}

export class DrizzleUserProfileRepository implements UserProfileRepository {
  constructor(private readonly deps: DrizzleUserProfileRepositoryDeps) {}

  async create(userId: string): Promise<void> {
    await this.deps.db.insert(uomUserProfile).values({
      userId,
      data: {},
      updatedAt: new Date(),
    });
  }

  async findAllByUserIds(
    visibility: Public,
    userIds: string[],
  ): Promise<UomUserProfileSelect[]> {
    void visibility; // leaf
    if (userIds.length === 0) return [];
    return this.deps.db
      .select()
      .from(uomUserProfile)
      .where(inArray(uomUserProfile.userId, userIds));
  }

  async findAllByUserIdsScoped(
    userIds: string[],
    scope: Scope<"user_profile", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserProfileSelect[]> {
    if (userIds.length === 0) return [];
    // The read Scope is the access boundary; narrow it (AND) to the requested
    // users (AC12 — narrow-only). The gated handle executes it.
    const rows = await gateDb
      .read("user_profile", scope)
      .where(inArray(uomUserProfile.userId, userIds))
      .rows();
    return rows as UomUserProfileSelect[];
  }

  async update(userId: string, patch: ProfilePatch): Promise<void> {
    const [existing] = await this.deps.db
      .select()
      .from(uomUserProfile)
      .where(eq(uomUserProfile.userId, userId));
    await this.deps.db
      .update(uomUserProfile)
      .set({
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.image !== undefined ? { image: patch.image } : {}),
        ...(patch.data !== undefined
          ? { data: { ...(existing?.data ?? {}), ...patch.data } }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(uomUserProfile.userId, userId));
  }

  async updateScoped(
    visibility: Private,
    userId: string,
    patch: ProfilePatch,
    scope: Scope<"user_profile", "update">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserProfileSelect | null> {
    void visibility; // leaf
    // Read the current data map for the JSON merge only; the WRITE is fully
    // gated — the fused update touches the row (by user_id) only when the Scope
    // admits it, else returns null (the service decides — the gate never throws).
    const [existing] = await this.deps.db
      .select()
      .from(uomUserProfile)
      .where(eq(uomUserProfile.userId, userId));
    const row = await gateDb.update("user_profile", scope, userId, {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.image !== undefined ? { image: patch.image } : {}),
      ...(patch.data !== undefined
        ? { data: { ...(existing?.data ?? {}), ...patch.data } }
        : {}),
      updatedAt: new Date(),
    });
    return (row as UomUserProfileSelect | null) ?? null;
  }

  async delete(
    userId: string,
    scope: Scope<"user_profile", "delete">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<void> {
    // Hard delete fused with the delete Scope (keyed on user_id). Denied / no
    // such row ⇒ no write.
    await gateDb.delete("user_profile", scope, userId);
  }
}
