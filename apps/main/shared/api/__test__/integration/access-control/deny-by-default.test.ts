/**
 * DENY-BY-DEFAULT PROOF (spec §8) — the shipping access-control config is live.
 *
 * Altitude & why (TST): these mount the REAL config + engine + gated-db + the
 * module's REAL drizzle models against a REAL Postgres (PGlite), driving the
 * engine/gate primitives the swapped repos call (`resolveRead/Update/Delete`,
 * `allowCreate/allowUpdate`, `gate.read/update/delete/create/…CanDelete`). That
 * is the layer where default-deny is ENFORCED, and it is the same pattern the
 * lib proves itself with (`gated-scoped-ac/test/behavior.test.ts`). The repos
 * are module-internal (not exported from `./api`), and their thin narrowing +
 * the services' `null → forbidden` / empty → 404 mapping is already covered by
 * the module's own unit suite; what those mocked-repo unit tests CANNOT show —
 * and what this proves — is that the real config's rules deny/admit the right
 * ROWS against real SQL. TST3 (assert the unauthorized path) is the spine here:
 * every case pairs a DENY with the matching ALLOW.
 *
 * TST4: the default-deny cases run the PRODUCTION config unchanged (that is the
 * subject under test). The one field-restriction case builds a purpose-built
 * test-only permission (no production permission sets `fields`) — the edge-case
 * config lives in the test, never the seed baseline, exactly as TST4 requires.
 *
 * kratos is down and out of scope: bags are constructed directly (the hydration
 * middleware's shape). What an e2e HTTP test would add on top is listed at the
 * bottom of the builder's report, not here.
 */

import { and, eq, inArray, isNotNull, isNull, desc } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";

import {
  createAc,
  createGatedDb,
} from "@libs/gated-scoped-ac";
import {
  uomConsentRecord,
  uomInvitation,
  uomLegalDocument,
  uomMembership,
  uomOrganization,
  uomUserProfile,
} from "@modules/user-organization-mgmt/models";

import {
  hydrate,
  idColumns,
  LEGAL,
  makeDb,
  makeEngine,
  makeGate,
  tables,
  type Engine,
  type Gate,
  type TestDb,
} from "./harness";

let engine: Engine; // pure — built once from the real config
let db: TestDb;
let gate: Gate;

beforeAll(() => {
  engine = makeEngine();
});

beforeEach(async () => {
  // Fresh db per test: several cases mutate (update/delete/publish/revoke), so
  // isolation is by re-seed, and every id is deterministic.
  db = await makeDb();
  gate = makeGate(db, engine);
});

// ─────────────────────────────────────────────────────────────────────────────
// ORGANIZATION — cross-org write + directory row-scoping
// ─────────────────────────────────────────────────────────────────────────────
describe("organization", () => {
  async function visibleOrgIds(ctx: ReturnType<typeof hydrate>): Promise<string[]> {
    const scope = engine.resolveRead(ctx.permissions, "organization", ctx.bag);
    const rows = (await gate(ctx.bag).read("organization", scope).rows()) as {
      id: string;
    }[];
    return rows.map((r) => r.id).sort();
  }

  test("update: active org A can update its OWN org (allow) but CANNOT touch org B by id (deny)", async () => {
    const mgr = hydrate(engine, "u-mgr-a", "org-a");
    expect(
      engine.allowUpdate(mgr.permissions, "organization", { name: "x" }, mgr.bag)
        .allow,
    ).toBe(true);
    const scope = engine.resolveUpdate(mgr.permissions, "organization", mgr.bag);

    // ALLOW — own org
    const own = (await gate(mgr.bag).update("organization", scope, "org-a", {
      name: "Alpha Renamed",
      updatedAt: new Date(),
    })) as { name: string } | null;
    expect(own?.name).toBe("Alpha Renamed");

    // DENY — cross-org (scope is pinned to org-a); nothing written to org-b
    expect(
      await gate(mgr.bag).update("organization", scope, "org-b", {
        name: "HIJACK",
        updatedAt: new Date(),
      }),
    ).toBeNull();
    const [orgB] = (await db
      .select()
      .from(uomOrganization)
      .where(eq(uomOrganization.id, "org-b"))) as { name: string }[];
    expect(orgB.name).toBe("Bravo");
  });

  test("update: a company_standard has no org-update grant — column verdict AND row scope deny", async () => {
    const std = hydrate(engine, "u-std-a", "org-a");
    expect(
      engine.allowUpdate(std.permissions, "organization", { name: "x" }, std.bag)
        .allow,
    ).toBe(false);
    const scope = engine.resolveUpdate(std.permissions, "organization", std.bag);
    expect(
      await gate(std.bag).update("organization", scope, "org-a", {
        name: "x",
        updatedAt: new Date(),
      }),
    ).toBeNull();
  });

  test("getById read-miss: manager reads own org (allow), a foreign org id is an empty/404-shaped miss (deny)", async () => {
    const mgr = hydrate(engine, "u-mgr-a", "org-a");
    const scope = engine.resolveRead(mgr.permissions, "organization", mgr.bag);
    const own = await gate(mgr.bag)
      .read("organization", scope)
      .where(eq(uomOrganization.id, "org-a"))
      .first();
    expect((own as { id: string } | null)?.id).toBe("org-a");
    const foreign = await gate(mgr.bag)
      .read("organization", scope)
      .where(eq(uomOrganization.id, "org-b"))
      .first();
    expect(foreign).toBeNull();
  });

  test("directory row-scoping: no-org caller sees nothing; company sees only its own; system's read_all sees every row", async () => {
    // company_standard has NO break-glass read_all — the all-orgs directory
    // yields only its own scoped row, never the platform list.
    expect(await visibleOrgIds(hydrate(engine, "u-nobody", null))).toEqual([]);
    expect(await visibleOrgIds(hydrate(engine, "u-std-a", "org-a"))).toEqual([
      "org-a",
    ]);
    // system role holds read_all_organizations_system (target = all rows).
    expect(await visibleOrgIds(hydrate(engine, "u-sys", "org-s"))).toEqual([
      "org-a",
      "org-b",
      "org-p",
      "org-s",
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MEMBERSHIP — role.update + remove
// ─────────────────────────────────────────────────────────────────────────────
describe("membership", () => {
  test("role.update: manager updates a member in own org (allow); standard denied by verdict; cross-org denied by row scope (deny)", async () => {
    const mgr = hydrate(engine, "u-mgr-a", "org-a");
    const std = hydrate(engine, "u-std-a", "org-a");

    // DENY — standard has no manage_members grant (column verdict)
    expect(
      engine.allowUpdate(std.permissions, "membership", { roles: ["x"] }, std.bag)
        .allow,
    ).toBe(false);
    const stdScope = engine.resolveUpdate(std.permissions, "membership", std.bag);
    expect(
      await gate(std.bag).update("membership", stdScope, "m-std-a", {
        roles: ["company_manager"],
        updatedAt: new Date(),
      }),
    ).toBeNull();

    // DENY — manager cannot reach a membership in org B (scope pinned to org-a)
    const mgrScope = engine.resolveUpdate(mgr.permissions, "membership", mgr.bag);
    expect(
      await gate(mgr.bag).update("membership", mgrScope, "m-owner-b", {
        roles: ["company_standard"],
        updatedAt: new Date(),
      }),
    ).toBeNull();
    const [memB] = (await db
      .select()
      .from(uomMembership)
      .where(eq(uomMembership.id, "m-owner-b"))) as { roles: string[] }[];
    expect(memB.roles).toEqual(["company_owner"]);

    // ALLOW — manager updates a member in own org
    expect(
      engine.allowUpdate(mgr.permissions, "membership", { roles: ["x"] }, mgr.bag)
        .allow,
    ).toBe(true);
    const updated = (await gate(mgr.bag).update("membership", mgrScope, "m-std-a", {
      roles: ["company_standard"],
      updatedAt: new Date(),
    })) as { id: string } | null;
    expect(updated?.id).toBe("m-std-a");
  });

  test("remove (delete-scope probe): manager may remove a member in own org (allow); standard and cross-org admit no rows (deny)", async () => {
    const mgr = hydrate(engine, "u-mgr-a", "org-a");
    const std = hydrate(engine, "u-std-a", "org-a");

    const mgrScope = engine.resolveDelete(mgr.permissions, "membership", mgr.bag);
    // ALLOW — own org
    expect(
      await gate(mgr.bag).findRowsByIdWhereCanDelete("membership", mgrScope, "m-std-a"),
    ).toHaveLength(1);
    // DENY — cross-org
    expect(
      await gate(mgr.bag).findRowsByIdWhereCanDelete("membership", mgrScope, "m-owner-b"),
    ).toHaveLength(0);

    // DENY — standard has no delete grant at all
    const stdScope = engine.resolveDelete(std.permissions, "membership", std.bag);
    expect(
      await gate(std.bag).findRowsByIdWhereCanDelete("membership", stdScope, "m-std-a"),
    ).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INVITATION — create / list / revoke  (+ the accept_own_invitation NULL branch)
// ─────────────────────────────────────────────────────────────────────────────
describe("invitation", () => {
  async function listOrgInvites(
    ctx: ReturnType<typeof hydrate>,
    orgId: string,
  ): Promise<string[]> {
    const scope = engine.resolveRead(ctx.permissions, "invitation", ctx.bag);
    const rows = (await gate(ctx.bag)
      .read("invitation", scope)
      .where(inArray(uomInvitation.organizationId, [orgId]))
      .rows()) as { id: string }[];
    return rows.map((r) => r.id).sort();
  }

  test("create verdict: manager may invite in its company (allow); standard and no-org caller denied (deny)", () => {
    const mgr = hydrate(engine, "u-mgr-a", "org-a");
    const std = hydrate(engine, "u-std-a", "org-a");
    const nobody = hydrate(engine, "u-nobody", null);
    // The payload rule reads the invitation being written off the bag.
    const into = (ctx: ReturnType<typeof hydrate>, organizationId: string) => ({
      ...ctx.bag,
      requestBody: { organizationId },
    });
    expect(engine.allowCreate(mgr.permissions, "invitation", into(mgr, "org-a")).allow).toBe(
      true,
    );
    expect(engine.allowCreate(std.permissions, "invitation", into(std, "org-a")).allow).toBe(
      false,
    );
    expect(
      engine.allowCreate(nobody.permissions, "invitation", into(nobody, "org-a")).allow,
    ).toBe(false);
  });

  test("create verdict (payload): the invitation must be FOR the active org — another org is denied", () => {
    const mgr = hydrate(engine, "u-mgr-a", "org-a");
    const sys = hydrate(engine, "u-sys", "org-s");
    const into = (ctx: ReturnType<typeof hydrate>, organizationId: string) => ({
      ...ctx.bag,
      requestBody: { organizationId },
    });
    // the context alone would allow both; the payload pins the row to org-a / org-s
    expect(engine.allowCreate(mgr.permissions, "invitation", into(mgr, "org-b")).allow).toBe(
      false,
    );
    expect(engine.allowCreate(sys.permissions, "invitation", into(sys, "org-s")).allow).toBe(
      true,
    );
    expect(engine.allowCreate(sys.permissions, "invitation", into(sys, "org-b")).allow).toBe(
      false,
    );
    // no requestBody ⇒ a missing value never passes
    expect(engine.allowCreate(mgr.permissions, "invitation", mgr.bag).allow).toBe(false);
  });

  test("list: manager sees only its own org's invitations (allow); standard sees none (deny)", async () => {
    const mgr = hydrate(engine, "u-mgr-a", "org-a");
    const std = hydrate(engine, "u-std-a", "org-a");
    expect(await listOrgInvites(mgr, "org-a")).toEqual(["inv-a1", "inv-a2"]);
    expect(await listOrgInvites(std, "org-a")).toEqual([]);
  });

  test("[commit-5 audit] manager list + revoke run the accept_own_invitation NULL branch live — neither widens nor errors", async () => {
    const mgr = hydrate(engine, "u-mgr-a", "org-a");
    // Both feed the invitation read/update scope: the org-match rule
    // (manage_invitations_company) UNION the identifier-match rules
    // (accept_own_invitation). The bag carries no email/phone, so those two
    // rules compile to `col = NULL` and must stay inert.
    expect(mgr.permissions).toContain("manage_invitations_company");
    expect(mgr.permissions).toContain("accept_own_invitation");

    // LIST — run the full scope with NO extra narrowing: the union executes the
    // NULL branch live. It must return exactly org-a's rows, never org-b's, and
    // never throw.
    const readScope = engine.resolveRead(mgr.permissions, "invitation", mgr.bag);
    const listed = (await gate(mgr.bag).read("invitation", readScope).rows()) as {
      id: string;
      organizationId: string;
    }[];
    expect(listed.map((r) => r.id).sort()).toEqual(["inv-a1", "inv-a2"]); // no widening
    expect(listed.every((r) => r.organizationId === "org-a")).toBe(true);

    // REVOKE — own org admitted, cross-org denied; the update scope also runs
    // the NULL branch and must not error.
    const updScope = engine.resolveUpdate(mgr.permissions, "invitation", mgr.bag);
    const revoked = (await gate(mgr.bag).update("invitation", updScope, "inv-a1", {
      status: "revoked",
      updatedAt: new Date(),
    })) as { status: string } | null;
    expect(revoked?.status).toBe("revoked");
    expect(
      await gate(mgr.bag).update("invitation", updScope, "inv-b1", {
        status: "revoked",
        updatedAt: new Date(),
      }),
    ).toBeNull();
  });

  test("revoke: standard's column verdict passes via accept_own_invitation, but the row scope admits nothing — default-deny holds at the row (deny)", async () => {
    const std = hydrate(engine, "u-std-a", "org-a");
    // accept_own_invitation grants invitation UPDATE (to accept one's own), so
    // the cheap column verdict passes — the enforcement is the row scope.
    expect(
      engine.allowUpdate(std.permissions, "invitation", { status: "revoked" }, std.bag)
        .allow,
    ).toBe(true);
    const scope = engine.resolveUpdate(std.permissions, "invitation", std.bag);
    expect(
      await gate(std.bag).update("invitation", scope, "inv-a1", {
        status: "revoked",
        updatedAt: new Date(),
      }),
    ).toBeNull();
    const [inv] = (await db
      .select()
      .from(uomInvitation)
      .where(eq(uomInvitation.id, "inv-a1"))) as { status: string }[];
    expect(inv.status).toBe("pending");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// USER_PROFILE — self vs foreign, keyed on `userId` (the idColumns path)
// ─────────────────────────────────────────────────────────────────────────────
describe("user_profile (idColumns → user_id)", () => {
  test("update: self allowed, a foreign user id is denied (keyed on user_id)", async () => {
    const std = hydrate(engine, "u-std-a", "org-a");
    expect(
      engine.allowUpdate(std.permissions, "user_profile", { name: "New" }, std.bag)
        .allow,
    ).toBe(true);
    const scope = engine.resolveUpdate(std.permissions, "user_profile", std.bag);

    // ALLOW — own profile (fused write matches on user_id)
    const self = (await gate(std.bag).update("user_profile", scope, "u-std-a", {
      name: "New Name",
      updatedAt: new Date(),
    })) as { userId: string; name: string } | null;
    expect(self).toMatchObject({ userId: "u-std-a", name: "New Name" });

    // DENY — another user's profile is outside the self-pinned scope
    expect(
      await gate(std.bag).update("user_profile", scope, "u-mgr-a", {
        name: "HIJACK",
        updatedAt: new Date(),
      }),
    ).toBeNull();
    const [foreign] = (await db
      .select()
      .from(uomUserProfile)
      .where(eq(uomUserProfile.userId, "u-mgr-a"))) as { name: string }[];
    expect(foreign.name).toBe("u-mgr-a");
  });

  test("delete: self allowed, foreign denied — proves idColumns wiring (delete keys AND returns on user_id)", async () => {
    // Without idColumns:{user_profile:"userId"} the gate would key on
    // user_profile.id (a column that does not exist) → a SQL error. A green
    // test here IS the proof the wiring is live.
    const std = hydrate(engine, "u-std-a", "org-a");
    const scope = engine.resolveDelete(std.permissions, "user_profile", std.bag);

    // ALLOW — own profile; the returned id is the user_id
    expect(await gate(std.bag).delete("user_profile", scope, "u-std-a")).toEqual({
      id: "u-std-a",
    });
    expect(
      await db
        .select()
        .from(uomUserProfile)
        .where(eq(uomUserProfile.userId, "u-std-a")),
    ).toHaveLength(0);

    // DENY — another user's profile survives untouched
    expect(await gate(std.bag).delete("user_profile", scope, "u-mgr-a")).toBeNull();
    expect(
      await db
        .select()
        .from(uomUserProfile)
        .where(eq(uomUserProfile.userId, "u-mgr-a")),
    ).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// USER — the scoped soft-delete surface (delete_own_account; no route yet)
// ─────────────────────────────────────────────────────────────────────────────
describe("user (delete_own_account)", () => {
  test("delete-scope probe: self admitted, a foreign user denied", async () => {
    const std = hydrate(engine, "u-std-a", "org-a");
    const scope = engine.resolveDelete(std.permissions, "user", std.bag);
    expect(
      await gate(std.bag).findRowsByIdWhereCanDelete("user", scope, "u-std-a"),
    ).toHaveLength(1);
    expect(
      await gate(std.bag).findRowsByIdWhereCanDelete("user", scope, "u-mgr-a"),
    ).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LEGAL_DOCUMENT — admin list/read/publish  +  the PUBLIC published lookup
// ─────────────────────────────────────────────────────────────────────────────
describe("legal_document", () => {
  async function visibleLegalIds(
    ctx: ReturnType<typeof hydrate>,
  ): Promise<string[]> {
    const scope = engine.resolveRead(ctx.permissions, "legal_document", ctx.bag);
    const rows = (await gate(ctx.bag).read("legal_document", scope).rows()) as {
      id: string;
    }[];
    return rows.map((r) => r.id).sort();
  }

  test("authoring list: platform legal admin sees all versions incl. drafts (allow); company + no-org callers see nothing (deny)", async () => {
    expect(await visibleLegalIds(hydrate(engine, "u-legal", "org-p"))).toEqual([
      "ld-draft",
      "ld-pub",
    ]);
    expect(await visibleLegalIds(hydrate(engine, "u-mgr-a", "org-a"))).toEqual([]);
    expect(await visibleLegalIds(hydrate(engine, "u-nobody", null))).toEqual([]);
  });

  test("authoring read-by-id (draft): platform admin resolves the draft (allow); company caller resolves nothing → 404-shaped (deny)", async () => {
    const legal = hydrate(engine, "u-legal", "org-p");
    const mgr = hydrate(engine, "u-mgr-a", "org-a");
    const legalScope = engine.resolveRead(legal.permissions, "legal_document", legal.bag);
    const mgrScope = engine.resolveRead(mgr.permissions, "legal_document", mgr.bag);
    expect(
      (
        (await gate(legal.bag)
          .read("legal_document", legalScope)
          .where(eq(uomLegalDocument.id, LEGAL.draft.id))
          .first()) as { id: string } | null
      )?.id,
    ).toBe(LEGAL.draft.id);
    expect(
      await gate(mgr.bag)
        .read("legal_document", mgrScope)
        .where(eq(uomLegalDocument.id, LEGAL.draft.id))
        .first(),
    ).toBeNull();
  });

  test("publish: company caller denied (verdict + row), platform admin publishes the draft (allow)", async () => {
    const legal = hydrate(engine, "u-legal", "org-p");
    const mgr = hydrate(engine, "u-mgr-a", "org-a");
    const publishedAt = new Date();

    // DENY first (leaves the draft unpublished for the allow)
    expect(
      engine.allowUpdate(mgr.permissions, "legal_document", { publishedAt }, mgr.bag)
        .allow,
    ).toBe(false);
    const mgrScope = engine.resolveUpdate(mgr.permissions, "legal_document", mgr.bag);
    expect(
      await gate(mgr.bag).update("legal_document", mgrScope, LEGAL.draft.id, {
        publishedAt,
      }),
    ).toBeNull();

    // ALLOW — platform admin
    expect(
      engine.allowUpdate(legal.permissions, "legal_document", { publishedAt }, legal.bag)
        .allow,
    ).toBe(true);
    const legalScope = engine.resolveUpdate(legal.permissions, "legal_document", legal.bag);
    const published = (await gate(legal.bag).update(
      "legal_document",
      legalScope,
      LEGAL.draft.id,
      { publishedAt },
    )) as { publishedAt: Date | null } | null;
    expect(published?.publishedAt).not.toBeNull();
  });

  test("PUBLIC published lookup serves with NO bag/session under default-deny (AC22)", async () => {
    // The ungated public branch (repository findByIds / findLatestVersion): no
    // engine, no scope, no session — it must keep serving published documents.
    const [byId] = (await db
      .select()
      .from(uomLegalDocument)
      .where(inArray(uomLegalDocument.id, [LEGAL.published.id]))) as {
      id: string;
    }[];
    expect(byId.id).toBe(LEGAL.published.id);

    // latest PUBLISHED version for (terms, platform) — the draft is skipped.
    const [latest] = (await db
      .select()
      .from(uomLegalDocument)
      .where(
        and(
          eq(uomLegalDocument.type, LEGAL.published.type),
          isNull(uomLegalDocument.orgTypeId),
          isNotNull(uomLegalDocument.publishedAt),
        ),
      )
      .orderBy(desc(uomLegalDocument.version))
      .limit(1)) as { id: string }[];
    expect(latest.id).toBe(LEGAL.published.id);
    expect(latest.id).not.toBe(LEGAL.draft.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CONSENT_RECORD — scoped create (the create gate is a real grant, not injected)
// ─────────────────────────────────────────────────────────────────────────────
describe("consent_record", () => {
  test("create: an authenticated caller records consent (allow); stripped of its role, denied and nothing written (deny)", async () => {
    const std = hydrate(engine, "u-std-a", "org-a");
    expect(engine.allowCreate(std.permissions, "consent_record", std.bag).allow).toBe(
      true,
    );
    // The grant travels with the `authenticated` baseline role: strip it and
    // record_own_consent is gone (not injected by magic).
    const stripped = engine.resolveEffectivePermissions([], std.bag);
    expect(engine.allowCreate(stripped, "consent_record", std.bag).allow).toBe(false);

    const values = {
      id: "c-allow",
      userId: "u-std-a",
      legalDocumentId: LEGAL.published.id,
      legalDocumentType: LEGAL.published.type,
      legalDocumentVersion: LEGAL.published.version,
      orgTypeId: null,
      context: "registration",
      consentedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    };
    // ALLOW — the gate inserts
    expect(
      await gate(std.bag).create("consent_record", std.permissions, values),
    ).not.toBeNull();
    // DENY — no permissions ⇒ null, and nothing written
    expect(
      await gate(std.bag).create("consent_record", stripped, {
        ...values,
        id: "c-deny",
      }),
    ).toBeNull();
    const rows = (await db.select().from(uomConsentRecord)) as { id: string }[];
    expect(rows.map((r) => r.id)).toEqual(["c-allow"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FIELD RESTRICTION — a `fields` allowlist narrows COLUMNS without denying ROWS.
// Purpose-built test-only config (no production permission sets `fields`; TST4).
// ─────────────────────────────────────────────────────────────────────────────
describe("field restriction (harness-only config)", () => {
  test("a fields-limited read scope returns the rows but only the allowed columns", async () => {
    // A tiny engine over the REAL `organization` model whose read admits every
    // row but projects only id + name.
    const fieldsEngine = createAc({
      tables,
      permissions: {
        read_org_directory: {
          name: "read_org_directory",
          entity: "organization",
          actions: ["read"],
          fields: ["id", "name"],
          rules: [{ context: [], target: [] }], // all rows
        },
      },
      forests: {},
      accountBaseline: [
        { role: "authenticated", permissions: ["read_org_directory"] },
      ],
    });
    const fieldsGate = createGatedDb(db, {
      tables,
      engine: fieldsEngine,
      idColumns,
    });
    const bag = { session: { user: { id: "u-nobody" }, organization: null } };
    const perms = fieldsEngine.resolveEffectivePermissions(["authenticated"], bag);
    expect(perms).toEqual(["read_org_directory"]);

    const scope = fieldsEngine.resolveRead(perms, "organization", bag);
    expect([...(scope.fields ?? [])].sort()).toEqual(["id", "name"]);

    const rows = (await fieldsGate(bag).read("organization", scope).rows()) as Record<
      string,
      unknown
    >[];
    // ROWS are NOT denied — every org comes back…
    expect(rows).toHaveLength(4);
    // …but only the allowed COLUMNS are present (no type / logo / metadata).
    expect(Object.keys(rows[0]).sort()).toEqual(["id", "name"]);
  });
});
