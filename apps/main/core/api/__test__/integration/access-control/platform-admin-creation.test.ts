/**
 * WHO FOUNDS WHICH ORGANIZATION — the shipping access-control config, live
 * against a real Postgres (PGlite), through the gate.
 *
 * Each org type a user may found has its own create permission: a signed-in
 * user founds a company (`create_company_organization`); only the system
 * admin, acting in the System Admin org, founds the Platform Admin org
 * (`create_platform_admin_organization`). Every DENY is paired with the
 * matching ALLOW (TST3).
 */

import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";

import { uomOrganization } from "@modules/user-organization-mgmt/models";

import { hydrate, makeDb, makeEngine, makeGate, type Engine, type Gate, type TestDb } from "./harness";

let engine: Engine;
let db: TestDb;
let gate: Gate;

beforeAll(() => {
  engine = makeEngine();
});

beforeEach(async () => {
  db = await makeDb();
  gate = makeGate(db, engine);
});

const orgRow = (id: string, type: string) => ({
  id,
  type,
  name: `Org ${id}`,
  logo: null,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
});

async function exists(id: string): Promise<boolean> {
  return (await db.select().from(uomOrganization).where(eq(uomOrganization.id, id))).length > 0;
}

describe("founding an organization", () => {
  test("a signed-in user founds a company (allow), not a Platform Admin org (deny, nothing written)", async () => {
    const nobody = hydrate(engine, "u-nobody", null);
    expect(await gate(nobody.bag).create("organization", nobody.permissions, orgRow("org-new-c", "company"))).not.toBeNull();
    expect(await gate(nobody.bag).create("organization", nobody.permissions, orgRow("org-new-p", "platform_admin"))).toBeNull();
    expect(await exists("org-new-p")).toBe(false);
  });

  test("the system admin, acting in the System Admin org, founds the Platform Admin org (allow)", async () => {
    const sys = hydrate(engine, "u-sys", "org-s");
    expect(await gate(sys.bag).create("organization", sys.permissions, orgRow("org-new-p", "platform_admin"))).not.toBeNull();
  });

  test("outside the System Admin org, the system admin cannot (deny)", async () => {
    const sys = hydrate(engine, "u-sys", null);
    expect(await gate(sys.bag).create("organization", sys.permissions, orgRow("org-new-p", "platform_admin"))).toBeNull();
    expect(await exists("org-new-p")).toBe(false);
  });

  test("the early verdict per type — what the create dropdown lists", () => {
    const creatable = (userId: string, activeOrgId: string | null) => {
      const ctx = hydrate(engine, userId, activeOrgId);
      return ["company", "platform_admin", "musical_project", "system_admin"].filter(
        (type) => engine.allowCreate(ctx.permissions, "organization", { ...ctx.bag, requestBody: { type } }).allow,
      );
    };
    expect(creatable("u-nobody", null)).toEqual(["company"]);
    expect(creatable("u-sys", "org-s")).toEqual(["company", "platform_admin"]);
  });
});
