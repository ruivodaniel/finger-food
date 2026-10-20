/**
 * TARGET vs CONTEXT over HTTP — `/organizations/:orgId/…`.
 *
 * The target org is the `:orgId` in the URL; the context is the caller's active
 * org (the validated x-active-organization header) that the scoped-AC bag is
 * built from. Access control resolves the one against the other, so the
 * question these cases answer is: acting in org A, what can a caller do to
 * org B?
 *
 * Altitude: the module's REAL router, services and drizzle repos, mounted with
 * `mountUserOrgApi`, behind its REAL scoped-AC hydration middleware, against
 * the REAL config + engine + gated-db on PGlite (the harness seed). Only the
 * session lookup is stubbed — kratos is out of scope, as in the harness — and
 * the stub keeps the session service's rule: the header is honored only when it
 * names one of the caller's memberships. The gate middleware (obligations) is
 * not mounted; it is orthogonal to target vs context.
 *
 * TST4: the shipping config is the subject — including the system admin's
 * cross-org reads on `view_all_orgs`: every org's details
 * (`read_all_organizations_system`) and every org's members
 * (`read_all_members_system`).
 */

import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import { accessControlConfig } from "@configs/access-control";
import {
  uomInvitation,
  uomMembership,
  uomOrganization,
} from "@modules/user-organization-mgmt/models";

import { makeDb, type TestDb } from "./harness";
import { call, makeUomApp, type UomApp } from "./uom-app";

// ── engine ───────────────────────────────────────────────────────────────────
/** The shipping config, unchanged. */
const shippingConfig = accessControlConfig;

// ── app ──────────────────────────────────────────────────────────────────────
// The slice over HTTP (uom-app.ts): real router + AC middleware, session stub.
let db: TestDb;

function makeApp(config: typeof shippingConfig) {
  return makeUomApp(db, config);
}

type App = UomApp;

async function memberIds(app: App, orgId: string, who: { as: string; actingIn?: string | null }) {
  const res = await call(app, "GET", `/organizations/${orgId}/members`, who);
  expect(res.status).toBe(200);
  return (res.body.rows as { userId: string }[]).map((r) => r.userId).sort();
}

// Harness seed: org-a (company: u-owner-a, u-mgr-a, u-std-a), org-b (company:
// u-owner-b), org-p (platform_admin), org-s (system_admin: u-sys as owner).
const MANAGER_IN_A = { as: "u-mgr-a", actingIn: "org-a" };
const SYSADMIN = { as: "u-sys", actingIn: "org-s" };

beforeEach(async () => {
  db = await makeDb();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("org detail — GET /organizations/:orgId (shipping config)", () => {
  test("a company manager reads its own org, and another org is a 404", async () => {
    const app = makeApp(shippingConfig);
    const own = await call(app, "GET", "/organizations/org-a", MANAGER_IN_A);
    expect(own.status).toBe(200);
    expect(own.body.name).toBe("Alpha");
    const other = await call(app, "GET", "/organizations/org-b", MANAGER_IN_A);
    expect(other.status).toBe(404);
  });

  test("a system admin acting in the system org reads an org it is not a member of", async () => {
    // read_all_organizations_system (view_all_orgs) admits every org row.
    const app = makeApp(shippingConfig);
    const res = await call(app, "GET", "/organizations/org-b", SYSADMIN);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Bravo");
  });

  test("the grant comes from the context: the same system admin with no active org gets a 404", async () => {
    const app = makeApp(shippingConfig);
    const res = await call(app, "GET", "/organizations/org-b", { as: "u-sys" });
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("members — GET /organizations/:orgId/members (shipping config)", () => {
  test("a company manager lists its own org's members, and none of another org's", async () => {
    const app = makeApp(shippingConfig);
    expect(await memberIds(app, "org-a", MANAGER_IN_A)).toEqual([
      "u-mgr-a",
      "u-owner-a",
      "u-std-a",
    ]);
    expect(await memberIds(app, "org-b", MANAGER_IN_A)).toEqual([]);
  });

  test("a member of both A and B sees B's members only while acting in B", async () => {
    // Permissions come from the ACTIVE org's roles, and every member read is
    // pinned to it — so being a member of B is not enough while acting in A.
    await addMembership("m-mgr-a-in-b", "u-mgr-a", "org-b", ["company_standard"]);
    const app = makeApp(shippingConfig);
    expect(await memberIds(app, "org-b", MANAGER_IN_A)).toEqual([]);
    expect(await memberIds(app, "org-b", { as: "u-mgr-a", actingIn: "org-b" })).toEqual([
      "u-mgr-a",
      "u-owner-b",
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("members — the system admin's cross-org read (read_all_members_system)", () => {
  test("a system admin acting in the system org lists another org's members", async () => {
    const app = makeApp(shippingConfig);
    expect(await memberIds(app, "org-b", SYSADMIN)).toEqual(["u-owner-b"]);
    expect(await memberIds(app, "org-a", SYSADMIN)).toEqual([
      "u-mgr-a",
      "u-owner-a",
      "u-std-a",
    ]);
  });

  test("the grant needs the system-admin context, and nobody else gains it", async () => {
    const app = makeApp(shippingConfig);
    expect(await memberIds(app, "org-b", { as: "u-sys" })).toEqual([]);
    expect(await memberIds(app, "org-b", MANAGER_IN_A)).toEqual([]);
  });

  test("reading is all it grants: the system admin still cannot remove another org's member", async () => {
    const app = makeApp(shippingConfig);
    await addMembership("m-std-b", "u-std-a", "org-b", ["company_standard"]);
    const res = await call(app, "DELETE", "/organizations/org-b/members/u-std-a", SYSADMIN);
    expect(res.status).toBe(403);
    expect(await memberIds(app, "org-b", SYSADMIN)).toEqual(["u-owner-b", "u-std-a"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("writes stay inside the active org (shipping config)", () => {
  test("invite: a company manager invites into its own org, never into another named in the URL", async () => {
    const app = makeApp(shippingConfig);
    const invite = { email: "new@ext.io", roles: ["company_standard"] };

    const own = await call(app, "POST", "/organizations/org-a/invitations", MANAGER_IN_A, invite);
    expect(own.status).toBe(201);

    const other = await call(app, "POST", "/organizations/org-b/invitations", MANAGER_IN_A, {
      ...invite,
      roles: ["company_owner"],
    });
    expect(other.status).toBe(403);
    const bInvites = await db
      .select()
      .from(uomInvitation)
      .where(eq(uomInvitation.organizationId, "org-b"));
    expect(bInvites.map((i) => i.id)).toEqual(["inv-b1"]); // the seed's, nothing new
  });

  test("logo upload: presigned for the manager's own org only", async () => {
    const app = makeApp(shippingConfig);
    const body = { contentType: "image/png" };
    const own = await call(app, "POST", "/organizations/org-a/logo-upload", MANAGER_IN_A, body);
    expect(own.status).toBe(200);
    expect(own.body.publicUrl).toContain("organizations/org-a/");
    const other = await call(app, "POST", "/organizations/org-b/logo-upload", MANAGER_IN_A, body);
    expect(other.status).toBe(403);
  });

  test("rename: another org named in the URL is refused and left unchanged", async () => {
    const app = makeApp(shippingConfig);
    const res = await call(app, "PATCH", "/organizations/org-b", MANAGER_IN_A, { name: "HIJACK" });
    expect(res.status).toBe(403);
    const [orgB] = await db
      .select()
      .from(uomOrganization)
      .where(eq(uomOrganization.id, "org-b"));
    expect(orgB.name).toBe("Bravo");
  });
});

// ── seed helpers ─────────────────────────────────────────────────────────────
async function addMembership(id: string, userId: string, organizationId: string, roles: string[]) {
  const T0 = new Date("2026-01-01T00:00:00.000Z");
  await db.insert(uomMembership).values({
    id,
    userId,
    organizationId,
    roles,
    createdAt: T0,
    updatedAt: T0,
    deletedAt: null,
  });
}
