/**
 * User-contact repository — data access for `user_contacts`.
 *
 * Contacts are a polymorphic payload (email / phone / address) owned by a user
 * (UOM5). They exist so lists can show an address without reaching into the
 * identity provider's store, where the identifiers themselves live.
 */

import { eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  GatedDb,
  Scope,
  SchemaTables,
} from "@libs/gated-scoped-ac";
import {
  uomUserContact,
  type UomUserContactSelect,
  type UserContactPayload,
} from "../models/user.model";

export interface CreateUserContactRecord {
  userId: string;
  contact: UserContactPayload;
  isDefault: boolean;
}

export interface UserContactRepository {
  create(input: CreateUserContactRecord): Promise<UomUserContactSelect>;
  /** Bulk lookup by owning user — plural + array (API6). Default contacts are
   * a `.filter(isDefault)` off this, no dedicated finder. Ungated narrow accessor
   * (pre-session default seed + list enrichment); the gated read is
   * `findAllByUserIdsScoped`. */
  findAllByUserIds(userIds: string[]): Promise<UomUserContactSelect[]>;
  /** Gated bulk lookup — the engine's read Scope admits the rows and the gated
   * handle executes it. */
  findAllByUserIdsScoped(
    userIds: string[],
    scope: Scope<"user_contact", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserContactSelect[]>;
  /** Scoped delete-by-contact-id — fused via the gated handle. Cross-user
   * capable, so the delete Scope (self-pinned by `manage_own_contacts`) is the
   * boundary. No route reaches it yet; the gated surface stands ready. */
  delete(
    id: string,
    scope: Scope<"user_contact", "delete">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<void>;
}

export interface DrizzleUserContactRepositoryDeps {
  db: NodePgDatabase<Record<string, unknown>>;
  createId: () => string;
}

// AC42: token-less. Every current caller (`seedDefault`, the token-less
// registration self-heal) or is simply unreached by any route
// (`getDefaultByUserId`/`getDefaultsByUserIds` have no caller today) — no
// route mints a token that reaches this repository's methods.
export class DrizzleUserContactRepository implements UserContactRepository {
  constructor(private readonly deps: DrizzleUserContactRepositoryDeps) {}

  async create(
    input: CreateUserContactRecord,
  ): Promise<UomUserContactSelect> {
    const row = {
      id: this.deps.createId(),
      userId: input.userId,
      contact: input.contact,
      isDefault: input.isDefault,
      createdAt: new Date(),
    };
    await this.deps.db.insert(uomUserContact).values(row);
    return row;
  }

  async findAllByUserIds(userIds: string[]): Promise<UomUserContactSelect[]> {
    if (userIds.length === 0) return [];
    return this.deps.db
      .select()
      .from(uomUserContact)
      .where(inArray(uomUserContact.userId, userIds));
  }

  async findAllByUserIdsScoped(
    userIds: string[],
    scope: Scope<"user_contact", "read">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<UomUserContactSelect[]> {
    if (userIds.length === 0) return [];
    // The read Scope is the access boundary; narrow it (AND) to the requested
    // users (AC12 — narrow-only). The gated handle executes it.
    const rows = await gateDb
      .read("user_contact", scope)
      .where(inArray(uomUserContact.userId, userIds))
      .rows();
    return rows as UomUserContactSelect[];
  }

  async delete(
    id: string,
    scope: Scope<"user_contact", "delete">,
    gateDb: GatedDb<SchemaTables>,
  ): Promise<void> {
    // Hard delete fused with the delete Scope (keyed on id). Denied / no such
    // row ⇒ no write.
    await gateDb.delete("user_contact", scope, id);
  }
}
