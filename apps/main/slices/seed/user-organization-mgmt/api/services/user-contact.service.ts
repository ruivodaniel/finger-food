/**
 * User-contact service — a user's addresses (email / phone / …) as our own
 * rows, so lists can show an address without reaching into the identity
 * provider's store (UOM5).
 *
 * Owns `user_contacts`. WHO may read a contact is the AC engine (resolved read
 * Scope, AC5); the default-contact seed runs pre-session (registration) before
 * any bag exists and stays raw infrastructure.
 */

import type { Ac } from "@libs/gated-scoped-ac";
import type { ScopedAcRequestContext } from "../shared/scoped-ac";
import type { UserContactRepository } from "../repositories/user-contact.repository";
import type {
  UomUserContactSelect,
  UserContactPayload,
} from "../models/user.model";

export interface UserContactServiceDeps {
  userContactRepo: UserContactRepository;
  /** The config-bound engine (AC37: injected, never constructed here). Mints the
   * read Scope the repo executes. */
  engine: Pick<Ac, "resolveRead">;
}

// AC42: token-less throughout. `seedDefault` is reached only from the
// registration self-heal (rule 5); `getDefaultByUserId`/`getDefaultsByUserIds`
// have no caller today — no route mints a token that reaches this service.
export class UserContactService {
  constructor(private readonly deps: UserContactServiceDeps) {}

  /**
   * Seed the user's default contact from the identifier they signed up with —
   * idempotent: a user keeps the first default they were born with. Reached only
   * from the pre-session registration self-heal (user.service) — no bag exists
   * yet, so this is raw infrastructure, not a gated create.
   */
  async seedDefault(
    userId: string,
    contact: UserContactPayload,
  ): Promise<void> {
    const existing = (
      await this.deps.userContactRepo.findAllByUserIds([userId])
    ).find((c) => c.isDefault);
    if (existing) return;
    await this.deps.userContactRepo.create({ userId, contact, isDefault: true });
  }

  /** The user's default contact, or null — the gated read seam. The read Scope
   * is self-pinned (`manage_own_contacts`), so a caller only resolves its own
   * contacts. */
  async getDefaultByUserId(
    ac: ScopedAcRequestContext,
    userId: string,
  ): Promise<UomUserContactSelect | null> {
    // Read pass-through (AC5): the engine resolves the read Scope, the repo
    // executes it through the gated handle.
    const scope = this.deps.engine.resolveRead(
      ac.permissions,
      "user_contact",
      ac.bag,
    );
    const contacts = await this.deps.userContactRepo.findAllByUserIdsScoped(
      [userId],
      scope,
      ac.gateDb,
    );
    return contacts.find((c) => c.isDefault) ?? null;
  }

  /** Default contacts for the given users, keyed by user id — the ungated
   * enrichment seam for callers holding user rows (API12). */
  async getDefaultsByUserIds(
    userIds: string[],
  ): Promise<Map<string, UomUserContactSelect>> {
    const rows = await this.deps.userContactRepo.findAllByUserIds(userIds);
    return new Map(
      rows.filter((row) => row.isDefault).map((row) => [row.userId, row]),
    );
  }
}
