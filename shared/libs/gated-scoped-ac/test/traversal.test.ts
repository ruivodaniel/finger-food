// Traversal mechanics, independent of the payload slot:
//   · `on` — the FAR-side join column. Without it every traversal lands on the
//     parent's `id`, which is wrong for any table keyed by its parent.
//   · the config-load guard — a slot may hold ONE traversal or a list of direct
//     conditions, never both, because the engine compiles only the first
//     traversal and dropping the rest is a silent GRANT.

import { beforeAll, describe, expect, test } from "vitest";

import { createAc, createGatedDb, definePermissions, registerPermissions } from "../src/index";
import { makeTestDb, type TestDb } from "./fixture/db";
import { tables } from "./fixture/schema";

let db: TestDb;
beforeAll(async () => {
  db = await makeTestDb();
});

// ─────────────────────────────────────────────────────────────────────────────
// `on` — a table keyed by its parent, not by `id`
// ─────────────────────────────────────────────────────────────────────────────
describe("traversal `on` — the far-side join column", () => {
  // note_share is keyed by note_id. Joining note → note_share on the DEFAULT
  // `id` compares "note-2" against "ns-1" and matches nothing; the note ids and
  // the share ids live in different namespaces, so the bug is silent, not loud.
  const readNotesWithAPublicShare = (on?: string) =>
    createAc({
      tables,
      permissions: registerPermissions([
        definePermissions([
          {
            name: "read_publicly_shared_notes",
            entity: "note",
            actions: ["read"],
            rules: [
              {
                context: [],
                target: [
                  {
                    field: "note.id",
                    join: "note_share",
                    ...(on ? { on } : {}),
                    where: { field: "note_share.kind", has: { value: "public" } },
                  },
                ],
              },
            ],
          },
        ]),
      ]),
      forests: { company: [{ role: "reader", permissions: ["read_publicly_shared_notes"] }] },
      accountBaseline: [],
    });

  const bag = { session: { user: { id: "naruto" } }, organization: null };

  test("declaring `on` joins the share table on its parent key", async () => {
    const engine = readNotesWithAPublicShare("noteId");
    const gate = createGatedDb<typeof tables>(db, { tables, engine });
    const perms = engine.resolveEffectivePermissions(["reader"], {
      session: { user: { id: "naruto" }, organization: { id: "altar", type: "company" } },
    });
    const scope = engine.resolveRead(perms, "note", bag);
    const rows = (await gate(bag).read("note", scope).rows()) as { id: string }[];
    // ns-1 is the only public share, and it points at note-2
    expect(rows.map((r) => r.id)).toEqual(["note-2"]);
  });

  test("without `on` the join falls back to `id` and matches nothing", async () => {
    const engine = readNotesWithAPublicShare(); // no `on`
    const gate = createGatedDb<typeof tables>(db, { tables, engine });
    const perms = engine.resolveEffectivePermissions(["reader"], {
      session: { user: { id: "naruto" }, organization: { id: "altar", type: "company" } },
    });
    const scope = engine.resolveRead(perms, "note", bag);
    const rows = (await gate(bag).read("note", scope).rows()) as { id: string }[];
    expect(rows).toHaveLength(0);
  });

  test("an unknown far-side column is an error, not a silent miss", () => {
    const engine = readNotesWithAPublicShare("noSuchColumn");
    expect(() => engine.resolveRead(["read_publicly_shared_notes"], "note", bag)).toThrow(
      /Unknown column: "note_share.noSuchColumn"/,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// the guard — conditions beside a traversal used to be dropped
// ─────────────────────────────────────────────────────────────────────────────
describe("config-load guard — a traversal may not share its slot", () => {
  const withTarget = (target: any[]) => [
    { name: "p", entity: "note", actions: ["read"] as const, rules: [{ context: [], target }] },
  ];

  test("a traversal beside a direct condition is refused at load", () => {
    expect(() =>
      registerPermissions([
        withTarget([
          { field: "note.authorUserId", has: { bag: "$session.user.id" } },
          {
            field: "note.id",
            join: "note_share",
            on: "noteId",
            where: { field: "note_share.kind", has: { value: "public" } },
          },
        ]) as any,
      ]),
    ).toThrow(/must hold exactly that one condition/);
  });

  test("two traversals in one slot are refused — only the first would compile", () => {
    expect(() =>
      registerPermissions([
        withTarget([
          { field: "note.id", join: "note_share", on: "noteId", where: { field: "note_share.kind", has: { value: "public" } } },
          { field: "note.organizationId", join: "organization", where: { field: "organization.type", has: { value: "company" } } },
        ]) as any,
      ]),
    ).toThrow(/2 traversals/);
  });

  test("a lone traversal is fine", () => {
    expect(() =>
      registerPermissions([
        withTarget([
          {
            field: "note.id",
            join: "note_share",
            on: "noteId",
            where: { field: "note_share.kind", has: { value: "public" } },
          },
        ]) as any,
      ]),
    ).not.toThrow();
  });

  test("several direct conditions are fine — they AND, and all of them compile", () => {
    expect(() =>
      registerPermissions([
        withTarget([
          { field: "note.authorUserId", has: { bag: "$session.user.id" } },
          { field: "note.organizationId", has: { bag: "$session.organization.id" } },
        ]) as any,
      ]),
    ).not.toThrow();
  });
});
