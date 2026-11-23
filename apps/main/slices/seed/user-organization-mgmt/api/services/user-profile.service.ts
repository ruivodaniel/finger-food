/**
 * User-profile service — the public face of a user (name, avatar) kept
 * separate from the internal user row (UOM4).
 *
 * Owns `user_profile`. WHO may read/update a profile is the AC engine
 * (`allowUpdate` verdict + resolved read/update Scopes, AC5/AC6/AC10); the
 * pre-session registration seam (create) runs before any bag exists and stays
 * raw infrastructure.
 */

import type { Ac, Private, Public, ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import type {
  ProfilePatch,
  UserProfileRepository,
} from "../repositories/user-profile.repository";
import type { UomUserProfileSelect } from "../models/user.model";
import type { ModuleErrors } from "../shared/module-errors";

export interface UserProfileServiceDeps {
  userProfileRepo: UserProfileRepository;
  /** The config-bound engine (AC37: injected, never constructed here). Mints the
   * read/update Scopes the repo executes and the update verdict. */
  engine: Pick<Ac, "resolveRead" | "resolveUpdate" | "allowUpdate">;
  errors: ModuleErrors;
}

export class UserProfileService {
  constructor(private readonly deps: UserProfileServiceDeps) {}

  /** Seed the empty profile that every user is born with. Reached only from the
   * pre-session registration self-heal (user.service) — no bag exists yet, so
   * this is raw infrastructure, not a gated create. */
  async create(userId: string): Promise<void> {
    await this.deps.userProfileRepo.create(userId);
  }

  /** Profiles for the given users, keyed by user id — the gated enrichment seam
   * for callers holding user rows (API12: they never touch our repo). The read
   * Scope is self-pinned (`manage_own_profile`), so a caller only resolves its
   * own profile. */
  async getAllByUserIds(
    ac: ScopedAcRequestContext,
    userIds: string[],
  ): Promise<Map<string, UomUserProfileSelect>> {
    // Read pass-through (AC5): the engine resolves the read Scope, the repo
    // executes it through the gated handle.
    const scope = this.deps.engine.resolveRead(
      ac.permissions,
      "user_profile",
      ac.bag,
    );
    const rows = await this.deps.userProfileRepo.findAllByUserIdsScoped(
      userIds,
      scope,
      ac.gateDb,
    );
    return new Map(rows.map((row) => [row.userId, row]));
  }

  /** The profile row, or null — the ungated narrow accessor the user aggregate
   * reads (getMe/getProfile run on the public pre-session path). AC42: Public —
   * `getMe` (public + private callers) is the loosest demand reaching this. */
  async getByUserId(
    visibility: Public,
    userId: string,
  ): Promise<UomUserProfileSelect | null> {
    const [row] = await this.deps.userProfileRepo.findAllByUserIds(
      visibility,
      [userId],
    );
    return row ?? null;
  }

  /** Names of the given users, keyed by user id — what another slice shows for
   * a person it holds only the id of (credits, payment). A profile without a
   * name is named by its user id; an unknown id is left out. AC42: Public — a
   * profile leaks by design (UOM4). */
  async namesByIds(
    visibility: Public,
    userIds: string[],
  ): Promise<Map<string, string>> {
    const rows = await this.deps.userProfileRepo.findAllByUserIds(
      visibility,
      userIds,
    );
    return new Map(rows.map((row) => [row.userId, row.name ?? row.userId]));
  }

  /** People whose profile name contains `search`, name-ordered — only the
   * profiles the caller's read rules admit. AC42: Private. */
  async searchByName(
    ac: ScopedAcRequestContext,
    visibility: Private,
    search: string,
    limit: number,
  ): Promise<Array<{ userId: string; name: string }>> {
    // Read pass-through (AC5): the engine resolves the read Scope, the repo
    // executes it.
    const scope = this.deps.engine.resolveRead(
      ac.permissions,
      "user_profile",
      ac.bag,
    );
    return this.deps.userProfileRepo.searchByName(
      visibility,
      search,
      limit,
      scope,
      ac.gateDb,
    );
  }

  /** Gated write — the authenticated `/me/profile` path and the name given at
   * registration. Cheap in-memory column verdict first (AC10), then the scoped
   * row write; denied ⇒ forbidden. */
  async updateScoped(
    ac: ScopedAcRequestContext,
    visibility: Private,
    userId: string,
    patch: ProfilePatch,
  ): Promise<void> {
    const verdict = this.deps.engine.allowUpdate(
      ac.permissions,
      "user_profile",
      patch,
      ac.bag,
    );
    if (!verdict.allow) {
      throw this.deps.errors.forbidden(verdict.reason ?? "cannot update profile");
    }
    const scope = this.deps.engine.resolveUpdate(
      ac.permissions,
      "user_profile",
      ac.bag,
    );
    const updated = await this.deps.userProfileRepo.updateScoped(
      visibility,
      userId,
      patch,
      scope,
      ac.gateDb,
    );
    // null ⇒ the Scope admitted no such row (denied, AC6/AC9).
    if (!updated) throw this.deps.errors.forbidden("cannot update profile");
  }
}
