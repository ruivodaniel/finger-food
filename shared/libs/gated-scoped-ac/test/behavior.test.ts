// Behavior test — the visibility matrix from `theo/service.behavior.test.ts`,
// reproduced against a REAL pglite db THROUGH `gateDb`: resolve a Scope, read
// through the gate, assert the visible note ids per persona. Plus the write
// gates (create / update / delete allowed vs denied).

import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";

import { makeAc, makeGate } from "./fixture/ac";
import {
  hydrate as hydrateSession,
  hydrateWithRoles as hydrateSessionWithRoles,
  makeTestDb,
  resetNotes,
  tables,
  type Hydrated,
  type TestDb,
} from "./fixture/db";

let db: TestDb;
const engine = makeAc();
let gate: ReturnType<typeof makeGate>;

// Two-step hydration, exactly as the real middleware does it:
//   1. session + roles (USER roles from the user row + membership roles), then
//   2. AC resolves those roles into effective PERMISSIONS — once per request.
// Everything downstream passes permissions, never roles.
type Ctx = Hydrated & { permissions: string[] };
const withPermissions = (h: Hydrated): Ctx => ({
  ...h,
  permissions: engine.resolveEffectivePermissions(h.effectiveRoles, h.bag),
});
const hydrate = (...a: Parameters<typeof hydrateSession>): Ctx =>
  withPermissions(hydrateSession(...a));
const hydrateWithRoles = (...a: Parameters<typeof hydrateSessionWithRoles>): Ctx =>
  withPermissions(hydrateSessionWithRoles(...a));

beforeAll(async () => {
  db = await makeTestDb();
  gate = makeGate(db, engine);
});

beforeEach(async () => {
  await resetNotes(db);
});

// Read the persona's visible notes through the gate (note ∪ note_share union).
async function visibleNoteIds(h: Ctx): Promise<string[]> {
  const scope = engine.resolveRead(h.permissions, "note", h.bag);
  const rows = (await gate(h.bag).read("note", scope).rows()) as { id: string }[];
  return rows.map((r) => r.id).sort();
}

// -------------------------------------------------------------
// READ — visibility is the union of channels the caller can reach
// -------------------------------------------------------------
describe("read visibility (through gateDb)", () => {
  test("employee (naruto) sees own + public + org-shared", async () => {
    expect(await visibleNoteIds(hydrate("naruto"))).toEqual([
      "note-2",
      "note-3",
      "note-4",
    ]);
  });

  test("employee (sakura) sees user-shared + public + org-shared", async () => {
    expect(await visibleNoteIds(hydrate("sakura"))).toEqual([
      "note-2",
      "note-3",
      "note-4",
    ]);
  });

  test("manager (kakashi) sees only own + public + org-shared, not others' private", async () => {
    expect(await visibleNoteIds(hydrate("kakashi"))).toEqual([
      "note-1",
      "note-2",
      "note-4",
    ]);
  });

  test("admin (theo) sees only public + org-shared (notes aren't role-gated)", async () => {
    expect(await visibleNoteIds(hydrate("theo"))).toEqual(["note-2", "note-4"]);
  });

  test("sys_admin (itachi) sees every note", async () => {
    expect(await visibleNoteIds(hydrate("itachi", "hq", "system_admin"))).toEqual([
      "note-1",
      "note-2",
      "note-3",
      "note-4",
    ]);
  });

  test("external (sasuke) sees only public notes", async () => {
    // sasuke has no membership → baseline only (public channel)
    expect(await visibleNoteIds(hydrate("sasuke", null, null))).toEqual([
      "note-2",
    ]);
  });

  // email channel: it opens for an EMPLOYEE whose email is the share target.
  // sasuke@gmail.com is the email target of ns-3 (note-3); granted the employee
  // role in a company org, the email channel opens → public(2) + email(3).
  test("email-shared: an employee sees the note shared to their email", async () => {
    // employee in altar → public(2) + email-to-sasuke(3) + org-shared-to-altar(4)
    const h = hydrateWithRoles("sasuke", ["employee"], "altar", "company");
    expect(await visibleNoteIds(h)).toEqual(["note-2", "note-3", "note-4"]);
  });

  // and WITHOUT the employee role, claiming a company org grants no extra channel:
  // a non-member sees only public, even acting "inside" a company org.
  test("non-member sasuke in a company org still sees only public", async () => {
    expect(await visibleNoteIds(hydrate("sasuke", "altar", "company"))).toEqual([
      "note-2",
    ]);
  });
});

// -------------------------------------------------------------
// HYDRATION — roles → permissions, and the baseline is a REAL role
// -------------------------------------------------------------
describe("hydration (roles → permissions)", () => {
  test("baseline permissions come from the user's `default` role, not injected", () => {
    const h = hydrate("naruto");
    expect(h.effectiveRoles).toContain("default"); // real role off the user row
    expect(h.permissions).toContain("view_public_notes");

    // strip the role → the permission goes with it. If baseline were injected
    // "by magic" this would still be granted.
    const stripped = engine.resolveEffectivePermissions(
      h.effectiveRoles.filter((r) => r !== "default"),
      h.bag,
    );
    expect(stripped).not.toContain("view_public_notes");
  });

  test("org-type path is injected, not hardcoded — a custom path resolves the forest", async () => {
    const { createAc } = await import("../src/index");
    const { tables } = await import("./fixture/schema");
    const custom = createAc({
      tables,
      permissions: {
        p: { name: "p", entity: "note", actions: ["read"], rules: [{ context: [], target: [] }] },
      },
      forests: { company: [{ role: "r", permissions: ["p"] }] },
      accountBaseline: [],
      orgTypePath: "$tenant.kind", // nothing to do with "session.organization"
    });
    const bag = { tenant: { kind: "company" } };
    expect(custom.resolveEffectivePermissions(["r"], bag)).toEqual(["p"]);
    expect(custom.resolveEffectivePermissions(["r"], { tenant: { kind: "other" } })).toEqual([]);
  });
});

// -------------------------------------------------------------
// READ — the JOIN (traversal) permission via company_auditor
// -------------------------------------------------------------
describe("traversal read (company_auditor)", () => {
  test("company_auditor sees every note in a company org (via note→organization join)", async () => {
    // audit_company_notes: notes whose org.type = company. note-4 is in konoha
    // (company) too, so all four orgs are companies except hq → note-1..4 visible.
    const h = hydrateWithRoles("theo", ["company_auditor"], "altar", "company");
    const ids = await visibleNoteIds(h);
    expect(ids).toEqual(["note-1", "note-2", "note-3", "note-4"]);
  });
});

// -------------------------------------------------------------
// CREATE — any company member; non-members denied
// -------------------------------------------------------------
describe("create gate", () => {
  test("member (naruto) can create a note in own org", async () => {
    const h = hydrate("naruto");
    const row = (await gate(h.bag).create("note", h.permissions, {
      id: "note-new",
      organizationId: "altar",
      authorUserId: "naruto",
      title: "New",
      text: "",
    })) as { id: string };
    expect(row.id).toBe("note-new");
  });

  test("external (sasuke, no org) cannot create a note — returns null, never throws", async () => {
    const h = hydrate("sasuke", null, null);
    const row = await gate(h.bag).create("note", h.permissions, {
      id: "note-sneaky",
      organizationId: "altar",
      authorUserId: "sasuke",
      title: "Sneaky",
      text: "",
    });
    expect(row).toBeNull();
    // and nothing was written
    const all = (await db.select().from(tables.note)) as { id: string }[];
    expect(all.map((r) => r.id)).not.toContain("note-sneaky");
  });
});

// -------------------------------------------------------------
// UPDATE — author only (no manager override)
// -------------------------------------------------------------
describe("update gate", () => {
  test("author (naruto) can edit own note-3", async () => {
    const h = hydrate("naruto");
    const scope = engine.resolveUpdate(h.permissions, "note", h.bag);
    const row = (await gate(h.bag).update("note", scope, "note-3", {
      text: "edited by author",
    })) as { text: string };
    expect(row.text).toBe("edited by author");
  });

  test("manager (kakashi) cannot edit an employee's note-3 — null, and the row is untouched", async () => {
    const h = hydrate("kakashi");
    const scope = engine.resolveUpdate(h.permissions, "note", h.bag);
    const row = await gate(h.bag).update("note", scope, "note-3", {
      text: "hijacked",
    });
    expect(row).toBeNull();
    const [after] = (await db
      .select()
      .from(tables.note)
      .where(eq(tables.note.id, "note-3"))) as { text: string }[];
    expect(after.text).not.toBe("hijacked");
  });

  test("employee (naruto) cannot edit kakashi's note-1", async () => {
    const h = hydrate("naruto");
    const scope = engine.resolveUpdate(h.permissions, "note", h.bag);
    expect(
      await gate(h.bag).update("note", scope, "note-1", { text: "hijacked" }),
    ).toBeNull();
  });
});

// -------------------------------------------------------------
// THE COLUMN GATE — update's first gate, in memory, before any query
// -------------------------------------------------------------
describe("column gate (allowUpdate)", () => {
  test("no field list on the permission ⇒ all columns writable", () => {
    const h = hydrate("naruto");
    expect(
      engine.allowUpdate(h.permissions, "note", { title: "x", text: "y" }, h.bag).allow,
    ).toBe(true);
  });

  test("a field list restricts which columns may be written", async () => {
    const { createAc } = await import("../src/index");
    const { tables: t } = await import("./fixture/schema");
    const limited = createAc({
      tables: t,
      permissions: {
        edit_note_title: {
          name: "edit_note_title",
          entity: "note",
          actions: ["read", "update"],
          fields: ["title"], // fieldsForReadUpdate — read AND update
          rules: [{ context: [], target: [] }],
        },
      },
      forests: { company: [{ role: "titler", permissions: ["edit_note_title"] }] },
      accountBaseline: [],
    });
    const h = hydrate("naruto");
    const perms = limited.resolveEffectivePermissions(["titler"], h.bag);

    expect(limited.allowUpdate(perms, "note", { title: "ok" }, h.bag).allow).toBe(true);

    const denied = limited.allowUpdate(perms, "note", { text: "nope" }, h.bag);
    expect(denied.allow).toBe(false);
    expect(denied.reason).toContain("text");
  });

  test("no applicable update permission ⇒ denied", () => {
    const h = hydrate("sasuke", null, null); // no membership
    expect(engine.allowUpdate(h.permissions, "note", { title: "x" }, h.bag).allow).toBe(
      false,
    );
  });
});

// -------------------------------------------------------------
// WRITE PROBES — non-mutating, return ROWS (never a boolean)
// -------------------------------------------------------------
describe("findRowsByIdWhereCanUpdate / …CanDelete", () => {
  test("author (naruto) gets the row back for own note-3", async () => {
    const h = hydrate("naruto");
    const scope = engine.resolveUpdate(h.permissions, "note", h.bag);
    const rows = await gate(h.bag).findRowsByIdWhereCanUpdate("note", scope, "note-3");
    expect(rows).toHaveLength(1);
    expect((rows[0] as { id: string }).id).toBe("note-3");
  });

  test("employee (naruto) gets NO rows for kakashi's note-1", async () => {
    const h = hydrate("naruto");
    const scope = engine.resolveUpdate(h.permissions, "note", h.bag);
    expect(
      await gate(h.bag).findRowsByIdWhereCanUpdate("note", scope, "note-1"),
    ).toHaveLength(0);
  });

  test("delete probe uses the delete scope", async () => {
    const h = hydrate("naruto");
    const scope = engine.resolveDelete(h.permissions, "note", h.bag);
    expect(
      await gate(h.bag).findRowsByIdWhereCanDelete("note", scope, "note-3"),
    ).toHaveLength(1);
  });
});

// -------------------------------------------------------------
// The one sanctioned ungated path — for hydration only
// -------------------------------------------------------------
describe("unscopedForHydration", () => {
  test("hands back the raw handle so hydration can read before AC exists", async () => {
    const raw = gate.unscopedForHydration();
    const rows = (await raw.select().from(tables.note)) as { id: string }[];
    expect(rows.length).toBeGreaterThan(0); // no scope involved
  });
});

// -------------------------------------------------------------
// DELETE — author only
// -------------------------------------------------------------
describe("delete gate", () => {
  test("author (naruto) can delete own note-3", async () => {
    const h = hydrate("naruto");
    const scope = engine.resolveDelete(h.permissions, "note", h.bag);
    expect(await gate(h.bag).delete("note", scope, "note-3")).toEqual({
      id: "note-3",
    });
  });

  test("manager (kakashi) cannot delete an employee's note-3 — null, row survives", async () => {
    const h = hydrate("kakashi");
    const scope = engine.resolveDelete(h.permissions, "note", h.bag);
    expect(await gate(h.bag).delete("note", scope, "note-3")).toBeNull();
    const still = (await db
      .select()
      .from(tables.note)
      .where(eq(tables.note.id, "note-3"))) as unknown[];
    expect(still).toHaveLength(1);
  });
});

// -------------------------------------------------------------
// FIELDS — the column allowlist resolves into the scope and projects
// -------------------------------------------------------------
describe("fields allowlist", () => {
  test("a fields-limited read scope carries its allowlist and projects in SELECT", async () => {
    // resolveRead for `user` (view_own_profile) — all columns here (no fields set),
    // so we assert the all-columns case is undefined, and test projection via a
    // fields-bearing engine below.
    const h = hydrate("naruto");
    const scope = engine.resolveRead(h.permissions, "user", h.bag);
    expect(scope.fields).toBeUndefined(); // no fields on the rule = all columns
  });

  test("explicit fields on a permission union into scope.fields and project", async () => {
    // Build a tiny engine whose note read allows only id + title.
    const { createAc } = await import("../src/index");
    const { tables } = await import("./fixture/schema");
    const limited = createAc({
      tables,
      permissions: {
        read_note_titles: {
          name: "read_note_titles",
          entity: "note",
          actions: ["read"],
          fields: ["id", "title"],
          rules: [{ context: [], target: [] }], // all rows
        },
      },
      forests: { company: [{ role: "reader", permissions: ["read_note_titles"] }] },
      accountBaseline: [],
    });
    const h = hydrate("naruto");
    // role → permissions is the separate hydration step; resolve* takes permissions
    const perms = limited.resolveEffectivePermissions(["reader"], h.bag);
    expect(perms).toEqual(["read_note_titles"]);
    const scope = limited.resolveRead(perms, "note", h.bag);
    expect([...(scope.fields ?? [])].sort()).toEqual(["id", "title"]);

    const limitedGate = makeGate(db, limited);
    const rows = (await limitedGate(h.bag).read("note", scope).rows()) as Record<
      string,
      unknown
    >[];
    expect(rows.length).toBeGreaterThan(0);
    // projection applied: only id + title present
    expect(Object.keys(rows[0]).sort()).toEqual(["id", "title"]);
  });
});

// -------------------------------------------------------------
// VIEWS — "just another source of info to compute access over".
// No view concept in the lib: it goes in the tables map and every code path
// below is the ordinary table path.
// -------------------------------------------------------------
describe("views are ordinary tables", () => {
  test("a scope resolves over a view and the gate reads it, projection and all", async () => {
    const h = hydrate("naruto");
    const scope = engine.resolveRead(h.permissions, "note_with_author", h.bag);
    const rows = (await gate(h.bag)
      .read("note_with_author", scope)
      .rows()) as Record<string, unknown>[];

    // naruto authored note-3 only — the row gate applied to a view
    expect(rows.map((r) => r.id)).toEqual(["note-3"]);
    // the field list projects the view's columns, incl. the joined-in one
    expect(Object.keys(rows[0]).sort()).toEqual(["authorEmail", "id", "title"]);
    expect(rows[0].authorEmail).toBe("naruto@altar.io");
  });

  test("no permission on the view ⇒ default-deny, same as a table", async () => {
    const h = hydrate("itachi", "hq", "system_admin"); // sys_admin: notes yes, view no
    const scope = engine.resolveRead(h.permissions, "note_with_author", h.bag);
    expect(await gate(h.bag).read("note_with_author", scope).rows()).toHaveLength(0);
  });
});

// -------------------------------------------------------------
// NON-`id` PRIMARY KEY — an entity whose pk is `user_id` (like `user_profile`).
// `idColumns` tells the gate which column carries identity, so the fused write
// keys on `user_id`; without it the gate would emit `eq(profile.id, …)` against
// a column that does not exist.
// -------------------------------------------------------------
describe("idColumns — a non-`id` primary key", () => {
  test("update/delete key (and return) on the declared pk column", async () => {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { pgTable, text } = await import("drizzle-orm/pg-core");
    const { createAc, createGatedDb } = await import("../src/index");

    const profile = pgTable("profile", {
      userId: text("user_id").primaryKey(), // PRIMARY KEY is user_id, never id
      name: text("name"),
    });
    const t = { profile } as const;

    const client = new PGlite();
    const pdb = drizzle(client);
    await client.exec(`CREATE TABLE profile (user_id TEXT PRIMARY KEY, name TEXT);`);
    await pdb
      .insert(profile)
      .values([
        { userId: "theo", name: "Theo" },
        { userId: "kakashi", name: "Kakashi" },
      ]);

    const limited = createAc({
      tables: t,
      permissions: {
        manage_own_profile: {
          name: "manage_own_profile",
          entity: "profile",
          actions: ["read", "update", "delete"],
          rules: [
            {
              context: [],
              target: [
                { field: "profile.userId", has: { bag: "$session.user.id" } },
              ],
            },
          ],
        },
      },
      forests: {},
      accountBaseline: [{ role: "default", permissions: ["manage_own_profile"] }],
    });
    // WITHOUT idColumns the gate keys on `profile.id` (undefined) — this is the
    // one-line affordance the user_profile swap needs.
    const profileGate = createGatedDb(pdb, {
      tables: t,
      engine: limited,
      idColumns: { profile: "userId" },
    });

    const bag = { session: { user: { id: "theo" }, organization: null } };
    const perms = limited.resolveEffectivePermissions(["default"], bag);

    // own row: the scoped update lands, matched on user_id
    const uScope = limited.resolveUpdate(perms, "profile", bag);
    expect(
      await profileGate(bag).update("profile", uScope, "theo", { name: "Theo!" }),
    ).toMatchObject({ userId: "theo", name: "Theo!" });

    // another user's row is outside the self-pinned scope ⇒ null, untouched
    expect(
      await profileGate(bag).update("profile", uScope, "kakashi", { name: "hax" }),
    ).toBeNull();

    // delete keys AND returns on the same pk column
    const dScope = limited.resolveDelete(perms, "profile", bag);
    expect(await profileGate(bag).delete("profile", dScope, "theo")).toEqual({
      id: "theo",
    });
    const survivors = (await pdb.select().from(profile)) as { userId: string }[];
    expect(survivors.map((r) => r.userId)).toEqual(["kakashi"]);
  });
});
