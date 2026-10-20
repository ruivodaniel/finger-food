// The four operators, against a real db.
//
//   has / hasNot   "this value is in this column" — the same whether the column
//                  holds one value (=), an array (= ANY), or a jsonb array (@>).
//                  Shape-independent by design: a column going from text to
//                  text[] must not touch a rule (AC32).
//   is / isNot     strict single value; refuses a collection at boot.
//
// The load-bearing negative is `has` on a string: it is EQUALITY, never
// containment. Substring semantics silently over-grant.

import { beforeAll, describe, expect, test } from "vitest";

import { createAc, createGatedDb } from "../src/index";
import { makeTestDb, type TestDb } from "./fixture/db";
import { tables } from "./fixture/schema";

let db: TestDb;
beforeAll(async () => {
  db = await makeTestDb();
});

const bag = {
  session: {
    user: { id: "naruto", email: "naruto@altar.io" },
    organization: { id: "altar", type: "company" },
  },
};

// one permission, one rule, one condition — the condition under test
function engineWith(entity: string, condition: unknown) {
  return createAc({
    tables,
    permissions: {
      p: {
        name: "p",
        entity,
        actions: ["read"],
        rules: [{ context: [], target: [condition as never] }],
      },
    },
    forests: {},
    accountBaseline: [{ role: "r", permissions: ["p"] }],
  });
}

async function idsMatching(entity: string, condition: unknown): Promise<string[]> {
  const engine = engineWith(entity, condition);
  const gate = createGatedDb<typeof tables>(db, { tables, engine });
  const perms = engine.resolveEffectivePermissions(["r"], bag);
  const scope = engine.resolveRead(perms, entity as "note", bag);
  const rows = (await gate(bag).read(entity as "note", scope).rows()) as {
    id: string;
  }[];
  return rows.map((r) => r.id).sort();
}

// ─────────────────────────────────────────────────────────────────────────────
describe("has — scalar column", () => {
  test("matches on equality", async () => {
    expect(
      await idsMatching("note", {
        field: "note.title",
        has: { value: "Roadmap Q3" },
      }),
    ).toEqual(["note-1"]);
  });

  // THE security test. "Roadmap Q3" contains "Roadmap"; `has` must not care.
  test("does NOT match a substring", async () => {
    expect(
      await idsMatching("note", {
        field: "note.title",
        has: { value: "Roadmap" },
      }),
    ).toEqual([]);
  });

  // the shape of the real exploit this forecloses: a shorter email must not
  // match a longer one that ends with it
  test("does NOT match an email that merely ends with the caller's", async () => {
    expect(
      await idsMatching("user", {
        field: "user.email",
        has: { value: "o@altar.io" },
      }),
    ).toEqual([]);
  });
});

describe("has — collection columns", () => {
  test("array column: matches an element", async () => {
    expect(
      await idsMatching("note", { field: "note.tags", has: { value: "urgent" } }),
    ).toEqual(["note-1", "note-3"]);
  });

  test("array column: a non-member matches nothing", async () => {
    expect(
      await idsMatching("note", { field: "note.tags", has: { value: "nope" } }),
    ).toEqual([]);
  });

  test("jsonb array column: matches an element", async () => {
    // membership.roles is jsonb holding string[]
    expect(
      await idsMatching("membership", {
        field: "membership.roles",
        has: { value: "employee" },
      }),
    ).toEqual(["mem-kakashi-konoha", "mem-naruto-altar", "mem-sakura-altar"]);
  });

  test("the SAME rule text works on both shapes — that is the point", async () => {
    const arrayHit = await idsMatching("note", {
      field: "note.tags",
      has: { value: "hiring" },
    });
    const jsonHit = await idsMatching("membership", {
      field: "membership.roles",
      has: { value: "admin" },
    });
    expect(arrayHit).toEqual(["note-2"]);
    expect(jsonHit).toEqual(["mem-theo-altar"]);
  });
});

describe("hasNot / isNot — null-inclusive", () => {
  // note-4 has tags NULL. A NULL column does not contain "urgent", so it must
  // satisfy hasNot; SQL's bare NOT would silently drop it.
  test("hasNot on an array includes rows whose column is NULL", async () => {
    expect(
      await idsMatching("note", {
        field: "note.tags",
        hasNot: { value: "urgent" },
      }),
    ).toEqual(["note-2", "note-4"]);
  });

  test("isNot on a scalar excludes only the matching row", async () => {
    expect(
      await idsMatching("note", {
        field: "note.authorUserId",
        isNot: { value: "naruto" },
      }),
    ).toEqual(["note-1", "note-2", "note-4"]);
  });

  test("isNot includes rows whose column is NULL", async () => {
    // note_share.user_id is NULL on every share except ns-2
    expect(
      await idsMatching("note_share", {
        field: "note_share.userId",
        isNot: { value: "sakura" },
      }),
    ).toEqual(["ns-1", "ns-3", "ns-4"]);
  });
});

describe("is — the strict opt-in", () => {
  test("behaves as equality on a scalar", async () => {
    expect(
      await idsMatching("note", {
        field: "note.authorUserId",
        is: { bag: "$session.user.id" },
      }),
    ).toEqual(["note-3"]);
  });

  test("refuses an array column at BOOT, not at request time", () => {
    expect(() =>
      engineWith("note", { field: "note.tags", is: { value: "urgent" } }),
    ).toThrow(/`is` on "note.tags" — that column holds a array/);
  });

  test("refuses a jsonb column at boot too", () => {
    expect(() =>
      engineWith("membership", {
        field: "membership.roles",
        isNot: { value: "admin" },
      }),
    ).toThrow(/holds a json/);
  });
});

describe("a condition with no operator is refused", () => {
  test("throws naming the four", async () => {
    await expect(
      idsMatching("note", { field: "note.title", equals: "Roadmap Q3" }),
    ).rejects.toThrow(/no operator \(is \| isNot \| has \| hasNot\)/);
  });
});
