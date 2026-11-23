// An ABSENT path never grants (AC1). A bag path the bag does not hold — or holds
// as null — fails closed under every operator, on whichever side of the
// condition it sits:
//
//   target    the rule matches no row and lends no columns (never an error,
//             never a widening)
//   context   the rule is dropped
//   payload   the rule denies
//
// The negations stay null-inclusive for a PRESENT operand (operators.test.ts): a
// NULL column is row data, and it does not contain the value. An absent bag value
// is not data at all — most often a path the middleware never set, or a typo —
// and a negation built on it would grant everyone.

import { afterEach, beforeAll, describe, expect, test } from "vitest";

import { createAc, createGatedDb } from "../src/index";
import { makeTestDb, type TestDb } from "./fixture/db";
import { noteComment, tables } from "./fixture/schema";

let db: TestDb;
beforeAll(async () => {
  db = await makeTestDb();
});

// a caller with no organization and no phone on file
const bag = {
  session: {
    user: { id: "naruto", email: "naruto@altar.io", phone: null },
    organization: null,
  },
};

const OPERATORS = ["is", "isNot", "has", "hasNot"] as const;
const NEGATIONS = ["isNot", "hasNot"] as const;

// both ways a path can be absent: never set, and set to null
const ABSENT = [
  ["unset", "$session.missing.id"],
  ["null", "$session.user.phone"],
] as const;

const ALL_NOTES = ["note-1", "note-2", "note-3", "note-4"];

// one permission, the rules under test
function engineWith(entity: string, action: string, rules: unknown[]) {
  return createAc({
    tables,
    permissions: {
      p: { name: "p", entity, actions: [action], rules } as never,
    },
    forests: {},
    accountBaseline: [{ role: "r", permissions: ["p"] }],
  });
}

async function readIds(entity: string, rules: unknown[]): Promise<string[]> {
  const engine = engineWith(entity, "read", rules);
  const gate = createGatedDb<typeof tables>(db, { tables, engine });
  const scope = engine.resolveRead(["p"], entity as "note", bag);
  const rows = (await gate(bag).read(entity as "note", scope).rows()) as {
    id: string;
  }[];
  return rows.map((r) => r.id).sort();
}

const targetIds = (entity: string, condition: unknown) =>
  readIds(entity, [{ context: [], target: [condition] }]);

// an empty target admits every row, so the context alone decides
const contextIds = (condition: unknown) =>
  readIds("note", [{ context: [condition], target: [] }]);

function createVerdict(payload: unknown[], requestBody: Record<string, unknown>) {
  const engine = engineWith("note_comment", "create", [
    { context: [], target: [], payload },
  ]);
  return engine.allowCreate(["p"], "note_comment", { ...bag, requestBody });
}

// ─────────────────────────────────────────────────────────────────────────────
describe("target — an absent operand matches no row", () => {
  describe.each(ABSENT)("operand %s", (_, path) => {
    test.each(OPERATORS)("%s on a scalar column", async (op) => {
      expect(
        await targetIds("note", { field: "note.authorUserId", [op]: { bag: path } }),
      ).toEqual([]);
    });

    test.each(["has", "hasNot"])("%s on an array column", async (op) => {
      expect(
        await targetIds("note", { field: "note.tags", [op]: { bag: path } }),
      ).toEqual([]);
    });

    test.each(["has", "hasNot"])("%s on a jsonb column", async (op) => {
      expect(
        await targetIds("membership", { field: "membership.roles", [op]: { bag: path } }),
      ).toEqual([]);
    });

    test.each(OPERATORS)("%s inside a traversal's where", async (op) => {
      expect(
        await targetIds("note", {
          field: "note.id",
          join: "note_share",
          on: "noteId",
          where: { field: "note_share.userId", [op]: { bag: path } },
        }),
      ).toEqual([]);
    });
  });

  test("the condition drops only its own rule — another rule still contributes", async () => {
    expect(
      await readIds("note", [
        { context: [], target: [{ field: "note.authorUserId", isNot: { bag: "$session.missing.id" } }] },
        { context: [], target: [{ field: "note.authorUserId", is: { bag: "$session.user.id" } }] },
      ]),
    ).toEqual(["note-3"]);
  });

  // a rule that matches no row must not widen the projection: the all-columns
  // permission it sits in contributes no columns to the other one's rows
  test("…and lends no columns to the rows another rule admits", async () => {
    const engine = createAc({
      tables,
      permissions: {
        wide: {
          name: "wide",
          entity: "note",
          actions: ["read"],
          rules: [
            {
              context: [],
              target: [{ field: "note.authorUserId", isNot: { bag: "$session.missing.id" } }],
            },
          ],
        },
        narrow: {
          name: "narrow",
          entity: "note",
          actions: ["read"],
          fields: ["id", "title"],
          rules: [
            {
              context: [],
              target: [{ field: "note.authorUserId", is: { bag: "$session.user.id" } }],
            },
          ],
        },
      },
      forests: {},
      accountBaseline: [],
    });
    const gate = createGatedDb<typeof tables>(db, { tables, engine });
    const scope = engine.resolveRead(["wide", "narrow"], "note", bag);
    expect(await gate(bag).read("note", scope).rows()).toEqual([
      { id: "note-3", title: "Naruto's Draft" },
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("context — an absent value on either side drops the rule", () => {
  describe.each(ABSENT)("path %s", (_, path) => {
    test.each(OPERATORS)("absent subject: %s", async (op) => {
      expect(await contextIds({ bag: path, [op]: { value: "company" } })).toEqual([]);
    });

    test.each(OPERATORS)("absent operand: %s", async (op) => {
      expect(
        await contextIds({ bag: "$session.user.id", [op]: { bag: path } }),
      ).toEqual([]);
    });
  });

  // two absent paths are not "equal": `undefined === undefined` must not grant
  test.each(OPERATORS)("both sides absent: %s", async (op) => {
    expect(
      await contextIds({ bag: "$session.missing.a", [op]: { bag: "$session.missing.b" } }),
    ).toEqual([]);
  });

  // the caller this guards: no organization, against "org type isNot X"
  test("a caller with no organization does not pass `organization.type isNot`", async () => {
    expect(
      await contextIds({ bag: "$session.organization.type", isNot: { value: "system_admin" } }),
    ).toEqual([]);
  });

  test.each(NEGATIONS)("a PRESENT subject still passes %s", async (op) => {
    expect(
      await contextIds({ bag: "$session.user.id", [op]: { value: "kakashi" } }),
    ).toEqual(ALL_NOTES);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("payload, direct — an absent value on either side denies", () => {
  const SUBJECT = "$requestBody.authorUserId";
  const BODIES = [
    ["unset", {}],
    ["null", { authorUserId: null }],
  ] as const;

  describe.each(BODIES)("subject %s", (_, body) => {
    test.each(OPERATORS)("%s", (op) => {
      expect(createVerdict([{ bag: SUBJECT, [op]: { value: "kakashi" } }], body).allow).toBe(
        false,
      );
    });
  });

  describe.each(ABSENT)("operand %s", (_, path) => {
    test.each(OPERATORS)("%s", (op) => {
      expect(
        createVerdict([{ bag: SUBJECT, [op]: { bag: path } }], { authorUserId: "naruto" })
          .allow,
      ).toBe(false);
    });
  });

  test.each(OPERATORS)("both sides absent: %s", (op) => {
    expect(
      createVerdict([{ bag: SUBJECT, [op]: { bag: "$session.missing.id" } }], {}).allow,
    ).toBe(false);
  });

  test.each(NEGATIONS)("a PRESENT subject still passes %s", (op) => {
    expect(
      createVerdict([{ bag: SUBJECT, [op]: { value: "kakashi" } }], { authorUserId: "naruto" })
        .allow,
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("payload, traversal — an absent value on either side denies", () => {
  afterEach(async () => {
    await db.delete(noteComment);
  });

  const traversal = (op: string, operand: unknown) => ({
    bag: "$requestBody.noteId",
    join: "note",
    where: { field: "note.authorUserId", [op]: operand },
  });

  test.each(OPERATORS)("absent subject: %s", (op) => {
    expect(
      createVerdict([traversal(op, { bag: "$session.user.id" })], {}).allow,
    ).toBe(false);
  });

  // the probe runs, so this goes through the gate: no error, no row written
  describe.each(ABSENT)("operand %s", (_, path) => {
    test.each(OPERATORS)("%s", async (op) => {
      const engine = engineWith("note_comment", "create", [
        { context: [], target: [], payload: [traversal(op, { bag: path })] },
      ]);
      const gate = createGatedDb<typeof tables>(db, { tables, engine });
      const row = await gate(bag).create("note_comment", ["p"], {
        id: `c-${op}`,
        noteId: "note-3",
        authorUserId: "naruto",
        body: "hello",
      });
      expect(row).toBeNull();
      expect(await db.select().from(noteComment)).toEqual([]);
    });
  });
});
