/**
 * Name search over profiles and organizations — the UOM slice's real services
 * and drizzle repos (uom-app.ts `mountUom`) on PGlite, with the shipping
 * access-control config. No uom route reaches these; another slice calls them
 * with its caller's request context.
 *
 * What a caller finds is what their read rules admit: the platform owner every
 * profile and org, anyone else only their own (plus whatever their role reads).
 * The search text matches literally: `%` and `_` are not wildcards.
 */

import { PRIVATE } from "@libs/gated-scoped-ac";
import { beforeEach, describe, expect, test } from "vitest";

import { baselineRoles, makeDb, ORGS, USERS, type TestDb } from "./harness";
import { mountUom } from "./uom-app";

let db: TestDb;

beforeEach(async () => {
  db = await makeDb();
});

/** The request context for `userId` acting in `orgId` with `roles` there. */
function actingAs(
  mounted: ReturnType<typeof mountUom>,
  userId: string,
  orgId: string,
  roles: string[],
) {
  const org = ORGS.find((o) => o.id === orgId)!;
  const bag = {
    session: { user: { id: userId }, organization: { id: org.id, type: org.type } },
  };
  const all = [...baselineRoles, ...roles];
  return {
    bag,
    roles: all,
    permissions: mounted.engine.resolveEffectivePermissions(all, bag),
    gateDb: mounted.gate(bag),
  };
}

async function found(
  mounted: ReturnType<typeof mountUom>,
  ctx: ReturnType<typeof actingAs>,
  search: string,
) {
  const { organization, userProfile } = mounted.uom.services;
  const [orgs, people] = await Promise.all([
    organization.searchByName(ctx, PRIVATE, search, 50),
    userProfile.searchByName(ctx, PRIVATE, search, 50),
  ]);
  return {
    orgs: orgs.map((o) => o.id).sort(),
    people: people.map((p) => p.userId).sort(),
  };
}

describe("name search (shipping config)", () => {
  test("the platform owner finds every org and every person", async () => {
    const mounted = mountUom(db);
    const owner = actingAs(mounted, "u-plat", "org-p", ["platform_owner"]);
    expect(await found(mounted, owner, "")).toEqual({
      orgs: ORGS.map((o) => o.id).sort(),
      people: [...USERS].sort(),
    });
  });

  test("a company member finds only their own org and themselves", async () => {
    const mounted = mountUom(db);
    const member = actingAs(mounted, "u-std-a", "org-a", ["company_standard"]);
    expect(await found(mounted, member, "")).toEqual({
      orgs: ["org-a"],
      people: ["u-std-a"],
    });
  });

  test("the platform team without the owner role finds no one else", async () => {
    const mounted = mountUom(db);
    const team = actingAs(mounted, "u-plat", "org-p", ["manage_platform"]);
    expect(await found(mounted, team, "")).toEqual({
      orgs: ["org-p"],
      people: ["u-plat"],
    });
  });

  test("the search narrows what the rules admit, and matches its text literally", async () => {
    const mounted = mountUom(db);
    const owner = actingAs(mounted, "u-plat", "org-p", ["platform_owner"]);
    expect(await found(mounted, owner, "brav")).toEqual({ orgs: ["org-b"], people: [] });
    expect(await found(mounted, owner, "owner-")).toEqual({
      orgs: [],
      people: ["u-owner-a", "u-owner-b"],
    });
    // wildcards in the text are its own characters: no name holds them
    expect(await found(mounted, owner, "%")).toEqual({ orgs: [], people: [] });
    expect(await found(mounted, owner, "_")).toEqual({ orgs: [], people: [] });
  });

  test("only the id and the name come back", async () => {
    const mounted = mountUom(db);
    const owner = actingAs(mounted, "u-plat", "org-p", ["platform_owner"]);
    const { organization, userProfile } = mounted.uom.services;
    expect(await organization.searchByName(owner, PRIVATE, "Bravo", 5)).toEqual([
      { id: "org-b", name: "Bravo" },
    ]);
    expect(await userProfile.searchByName(owner, PRIVATE, "u-std-a", 5)).toEqual([
      { userId: "u-std-a", name: "u-std-a" },
    ]);
  });
});
