/**
 * User-preferences repository — data access for `user_preferences`, through
 * the gated db only: reads and updates carry the caller's Scope, the insert
 * the caller's permissions (the gate asks the engine for the create verdict).
 * The gate never throws — a denied write comes back null and the service
 * decides what that means.
 */

import { eq } from "drizzle-orm";
import type { GatedDb, Scope, SchemaTables } from "@libs/gated-scoped-ac";
import {
  uomUserPreferences,
  type UomUserPreferencesSelect,
} from "../models/user-preferences.model";

/** The writable columns (everything but the key and the timestamp). A type
 * alias, so it carries the index signature `allowUpdate` takes (AC10). */
export type PreferencesPatch = Partial<
  Omit<UomUserPreferencesSelect, "userId" | "updatedAt">
>;

export interface UserPreferencesRepository {
  /** Gated read of one user's row — null when absent or not admitted. */
  findByUserIdScoped(
    userId: string,
    scope: Scope<"user_preferences", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserPreferencesSelect | null>;
  /** Gated insert of a user's first row — null when the create is denied. */
  createScoped(
    userId: string,
    patch: PreferencesPatch,
    permissions: Iterable<string>,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserPreferencesSelect | null>;
  /** Gated update (fused with the Scope, keyed on `user_id`) — null when the
   * Scope admits no row. */
  updateScoped(
    userId: string,
    patch: PreferencesPatch,
    scope: Scope<"user_preferences", "update">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserPreferencesSelect | null>;
}

export class DrizzleUserPreferencesRepository implements UserPreferencesRepository {
  async findByUserIdScoped(
    userId: string,
    scope: Scope<"user_preferences", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserPreferencesSelect | null> {
    // The read Scope is the boundary; narrowing to one user is AND-only.
    const row = await gateDb
      .read("user_preferences", scope)
      .where(eq(uomUserPreferences.userId, userId))
      .first();
    return (row as UomUserPreferencesSelect | null) ?? null;
  }

  async createScoped(
    userId: string,
    patch: PreferencesPatch,
    permissions: Iterable<string>,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserPreferencesSelect | null> {
    const row = await gateDb.create("user_preferences", permissions, {
      ...patch,
      userId,
      updatedAt: new Date(),
    });
    return (row as UomUserPreferencesSelect | null) ?? null;
  }

  async updateScoped(
    userId: string,
    patch: PreferencesPatch,
    scope: Scope<"user_preferences", "update">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserPreferencesSelect | null> {
    const row = await gateDb.update("user_preferences", scope, userId, {
      ...patch,
      updatedAt: new Date(),
    });
    return (row as UomUserPreferencesSelect | null) ?? null;
  }
}
