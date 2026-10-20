/**
 * Deny-by-default integration harness.
 *
 * Mounts the REAL shipping access-control stack against a REAL Postgres
 * (PGlite, in-memory — no docker), mirroring `apps/main/api/src/access-control.ts`
 * exactly:
 *   - the REAL production config           (`@configs/access-control`)
 *   - the REAL engine + gated-db           (`@libs/gated-scoped-ac`)
 *   - the REAL drizzle models              (`@modules/user-organization-mgmt/models`)
 *   - the REAL `idColumns` wiring          (`user_profile` keyed on `userId`)
 *
 * Bags are built directly, exactly as the hydration middleware builds them
 * (kratos is not involved): `{ session: { user: { id }, organization: {id,type}|null } }`
 * with `roles = [...baselineRoles, ...activeMembershipRoles]` and permissions
 * resolved ONCE via `engine.resolveEffectivePermissions` — the two-step
 * hydration the middleware performs (`create-scoped-ac-middleware.ts`).
 *
 * The tables map, entity vocabulary, and `idColumns` are copied verbatim from
 * `apps/main/api/src/access-control.ts`; if that wiring drifts, these tests drift
 * with it (that is the point — they guard the shipping wiring).
 */

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import {
  createAc,
  createGatedDb,
  type SchemaTables,
} from "@libs/gated-scoped-ac";
import { accessControlConfig } from "@configs/access-control";
import {
  uomConsentRecord,
  uomInvitation,
  uomLegalDocument,
  uomMembership,
  uomOrganization,
  uomUser,
  uomUserContact,
  uomUserPreferences,
  uomUserProfile,
} from "@modules/user-organization-mgmt/models";

// entity name (config vocabulary) → drizzle table. Verbatim from access-control.ts.
export const tables: SchemaTables = {
  organization: uomOrganization,
  membership: uomMembership,
  invitation: uomInvitation,
  user: uomUser,
  user_profile: uomUserProfile,
  user_preferences: uomUserPreferences,
  user_contact: uomUserContact,
  legal_document: uomLegalDocument,
  consent_record: uomConsentRecord,
};

// Verbatim from access-control.ts: `user_profile` and `user_preferences` have
// no `id` column (pk is `userId`), so the gate must match their fused writes on
// `user_id`.
export const idColumns = {
  user_profile: "userId",
  user_preferences: "userId",
} as const;

// Roles every authenticated request always carries (the account baseline),
// derived from config exactly like the app shell does.
export const baselineRoles = accessControlConfig.accountBaseline.map(
  (node) => node.role,
);

export type TestDb = ReturnType<typeof drizzle> & { $client: PGlite };
export type Engine = ReturnType<typeof createAc>;
export type Gate = ReturnType<typeof createGatedDb<SchemaTables>>;

// The engine is pure (db-independent) — build it once from the real config.
export function makeEngine(): Engine {
  return createAc({ ...accessControlConfig, tables });
}

export function makeGate(db: TestDb, engine: Engine): Gate {
  return createGatedDb(db, { tables, engine, idColumns });
}

// ── deterministic seed ───────────────────────────────────────────────────────
const T0 = new Date("2026-01-01T00:00:00.000Z");
const FUTURE = new Date("2030-01-01T00:00:00.000Z"); // invitations: unexpired

export const ORGS = [
  { id: "org-a", type: "company", name: "Alpha" },
  { id: "org-b", type: "company", name: "Bravo" },
  { id: "org-p", type: "platform_admin", name: "Platform Admin" },
  { id: "org-s", type: "system_admin", name: "System" },
] as const;

export const USERS = [
  "u-owner-a",
  "u-mgr-a",
  "u-std-a",
  "u-owner-b",
  "u-legal",
  "u-plat",
  "u-sys",
  "u-nobody",
] as const;

// membership roles use the REAL config's membership-role vocabulary.
export const MEMBERSHIPS = [
  { id: "m-owner-a", userId: "u-owner-a", organizationId: "org-a", roles: ["company_owner"] },
  { id: "m-mgr-a", userId: "u-mgr-a", organizationId: "org-a", roles: ["company_manager"] },
  { id: "m-std-a", userId: "u-std-a", organizationId: "org-a", roles: ["company_standard"] },
  { id: "m-owner-b", userId: "u-owner-b", organizationId: "org-b", roles: ["company_owner"] },
  { id: "m-legal", userId: "u-legal", organizationId: "org-p", roles: ["manage_legal_docs"] },
  { id: "m-plat", userId: "u-plat", organizationId: "org-p", roles: ["manage_platform"] },
  { id: "m-sys", userId: "u-sys", organizationId: "org-s", roles: ["system_admin_owner"] },
] as const;

export const INVITATIONS = [
  { id: "inv-a1", organizationId: "org-a", email: "invitee1@ext.io", phone: null, inviterId: "u-mgr-a" },
  { id: "inv-a2", organizationId: "org-a", email: null, phone: "+1000", inviterId: "u-mgr-a" },
  { id: "inv-b1", organizationId: "org-b", email: "invitee-b@ext.io", phone: null, inviterId: "u-owner-b" },
] as const;

// `type` uses a real member of the legal-document enum (LEGAL_CONSENT_TYPES);
// both rows share it — a versioned chain for one (type, platform) scope.
export const LEGAL = {
  published: { id: "ld-pub", type: "termsAndConditions", version: 1, title: "Terms v1" },
  draft: { id: "ld-draft", type: "termsAndConditions", version: 2, title: "Terms v2 (draft)" },
} as const;

const DDL = `
  CREATE TABLE organization (
    id TEXT PRIMARY KEY, type TEXT NOT NULL, name TEXT NOT NULL, logo TEXT,
    metadata JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL, deleted_at TIMESTAMP
  );
  CREATE TABLE "user" (
    id TEXT PRIMARY KEY, identity_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active', created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL, deleted_at TIMESTAMP
  );
  CREATE TABLE member (
    id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, user_id TEXT NOT NULL,
    roles TEXT[] NOT NULL, created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL, deleted_at TIMESTAMP
  );
  CREATE TABLE invitation (
    id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, email TEXT, phone TEXT,
    roles TEXT[] NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
    inviter_id TEXT NOT NULL, invited_user_id TEXT, expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL, updated_at TIMESTAMP NOT NULL
  );
  CREATE TABLE user_profile (
    user_id TEXT PRIMARY KEY, name TEXT, image TEXT,
    data JSONB NOT NULL DEFAULT '{}', updated_at TIMESTAMP NOT NULL
  );
  CREATE TABLE user_contacts (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, contact JSONB NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP NOT NULL
  );
  CREATE TABLE legal_document (
    id TEXT PRIMARY KEY, type TEXT NOT NULL, org_type_id TEXT,
    version INTEGER NOT NULL, title TEXT NOT NULL, content_html TEXT NOT NULL,
    published_at TIMESTAMP, created_at TIMESTAMP NOT NULL
  );
  CREATE TABLE consent_record (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, legal_document_id TEXT NOT NULL,
    legal_document_type TEXT NOT NULL, legal_document_version INTEGER NOT NULL,
    org_type_id TEXT, context TEXT NOT NULL, consented_at TIMESTAMP NOT NULL,
    ip_address TEXT, user_agent TEXT
  );
  CREATE TYPE preference_source AS ENUM ('system', 'explicit');
  CREATE TABLE user_preferences (
    user_id TEXT PRIMARY KEY, locale_source preference_source, locale_value TEXT,
    timezone_source preference_source, timezone_value TEXT,
    currency_value TEXT, country_value TEXT, updated_at TIMESTAMP NOT NULL
  );
`;

export async function makeDb(): Promise<TestDb> {
  const client = new PGlite();
  const db = drizzle(client) as unknown as TestDb;
  await client.exec(DDL);

  await db.insert(uomOrganization).values(
    ORGS.map((o) => ({
      id: o.id,
      type: o.type,
      name: o.name,
      logo: null,
      metadata: {},
      createdAt: T0,
      updatedAt: T0,
      deletedAt: null,
    })),
  );

  await db.insert(uomUser).values(
    USERS.map((id) => ({
      id,
      identityId: `identity-${id}`,
      status: "active" as const,
      createdAt: T0,
      updatedAt: T0,
      deletedAt: null,
    })),
  );

  await db.insert(uomUserProfile).values(
    USERS.map((id) => ({
      userId: id,
      name: id,
      image: null,
      data: {},
      updatedAt: T0,
    })),
  );

  await db.insert(uomMembership).values(
    MEMBERSHIPS.map((m) => ({
      id: m.id,
      organizationId: m.organizationId,
      userId: m.userId,
      roles: [...m.roles],
      createdAt: T0,
      updatedAt: T0,
      deletedAt: null,
    })),
  );

  await db.insert(uomInvitation).values(
    INVITATIONS.map((inv) => ({
      id: inv.id,
      organizationId: inv.organizationId,
      email: inv.email,
      phone: inv.phone,
      roles: ["company_standard"],
      status: "pending" as const,
      inviterId: inv.inviterId,
      invitedUserId: null,
      expiresAt: FUTURE,
      createdAt: T0,
      updatedAt: T0,
    })),
  );

  await db.insert(uomLegalDocument).values([
    {
      id: LEGAL.published.id,
      type: LEGAL.published.type,
      orgTypeId: null,
      version: LEGAL.published.version,
      title: LEGAL.published.title,
      contentHtml: "<p>terms v1</p>",
      publishedAt: T0, // PUBLISHED
      createdAt: T0,
    },
    {
      id: LEGAL.draft.id,
      type: LEGAL.draft.type,
      orgTypeId: null,
      version: LEGAL.draft.version,
      title: LEGAL.draft.title,
      contentHtml: "<p>terms v2</p>",
      publishedAt: null, // DRAFT
      createdAt: T0,
    },
  ]);

  return db;
}

// ── bag hydration — mirrors create-scoped-ac-middleware.ts ────────────────────
export interface Ctx {
  bag: {
    session: {
      user: { id: string };
      organization: { id: string; type: string } | null;
    };
  };
  roles: string[];
  permissions: string[];
}

/**
 * Build the request context for `userId` acting in `activeOrgId` (or with no
 * active org). Active-org roles + org type come from the seeded membership —
 * the same server-side resolution the session middleware does; a client can
 * only act in an org it is really a member of (so we never fabricate roles).
 */
export function hydrate(
  engine: Engine,
  userId: string,
  activeOrgId: string | null = null,
): Ctx {
  const org = activeOrgId ? ORGS.find((o) => o.id === activeOrgId) ?? null : null;
  const mem = activeOrgId
    ? MEMBERSHIPS.find(
        (m) => m.userId === userId && m.organizationId === activeOrgId,
      ) ?? null
    : null;
  const bag: Ctx["bag"] = {
    session: {
      user: { id: userId },
      organization: org ? { id: org.id, type: org.type } : null,
    },
  };
  const roles = [...baselineRoles, ...(mem ? [...mem.roles] : [])];
  const permissions = engine.resolveEffectivePermissions(roles, bag);
  return { bag, roles, permissions };
}
