// THE PAYLOAD SLOT — gating a create on the parent the new row points at.
//
// "Append a comment only to a note I authored, or that is shared with me." The
// note id arrives in the REQUEST BODY, which the consumer's middleware puts on
// the bag as `requestBody`; the rule reaches it with the `bag:` subject the DSL
// already had. No new value source, no new operand.
//
// This is the song / song-slice case with the fixture's names.

import { beforeAll, beforeEach, describe, expect, test } from "vitest";

import {
  createAc,
  createGatedDb,
  definePermissions,
  registerPermissions,
} from "../src/index";
import { makeTestDb, type TestDb } from "./fixture/db";
import { noteComment, tables } from "./fixture/schema";

let db: TestDb;
beforeAll(async () => {
  db = await makeTestDb();
});
beforeEach(async () => {
  await db.delete(noteComment);
});

// author-or-shared, as two rules — two rules OR
const appendComment = definePermissions([
  {
    name: "append_note_comment",
    entity: "note_comment",
    actions: ["create"],
    rules: [
      {
        context: [],
        target: [],
        payload: [
          {
            bag: "$requestBody.noteId",
            join: "note",
            where: [
              { field: "note.authorUserId", has: { bag: "$session.user.id" } },
            ],
          },
        ],
      },
      {
        // note_share is keyed by note_id, not by id — `on` earns its keep here
        context: [],
        target: [],
        payload: [
          {
            bag: "$requestBody.noteId",
            join: "note_share",
            on: "noteId",
            where: [
              { field: "note_share.userId", has: { bag: "$session.user.id" } },
            ],
          },
        ],
      },
    ],
  },
]);

const engine = () =>
  createAc({
    tables,
    permissions: registerPermissions([appendComment]),
    forests: { company: [{ role: "commenter", permissions: ["append_note_comment"] }] },
    accountBaseline: [],
  });

// what the middleware will build: the session, plus the parsed body
const bagFor = (userId: string, requestBody: Record<string, unknown>) => ({
  session: {
    user: { id: userId, email: `${userId}@altar.io` },
    organization: { id: "altar", type: "company" },
  },
  requestBody,
});

async function append(userId: string, body: Record<string, unknown>) {
  const ac = engine();
  const gate = createGatedDb<typeof tables>(db, { tables, engine: ac });
  const bag = bagFor(userId, body);
  const perms = ac.resolveEffectivePermissions(["commenter"], bag);
  return gate(bag).create("note_comment", perms, {
    id: `c-${userId}-${body.noteId ?? "none"}`,
    noteId: body.noteId,
    authorUserId: body.authorUserId ?? userId,
    body: "hello",
  } as Record<string, unknown>);
}

const commentCount = async () => (await db.select().from(noteComment)).length;

// ─────────────────────────────────────────────────────────────────────────────
describe("create gated on the parent", () => {
  test("the note's author may append to it", async () => {
    // naruto authored note-3
    const row = await append("naruto", { noteId: "note-3" });
    expect(row).not.toBeNull();
    expect(await commentCount()).toBe(1);
  });

  test("a stranger may NOT append to someone else's note — and nothing is written", async () => {
    // note-1 is kakashi's, and it is not shared with naruto
    expect(await append("naruto", { noteId: "note-1" })).toBeNull();
    expect(await commentCount()).toBe(0);
  });

  test("the OR path: a user the note is shared with may append", async () => {
    // ns-2 shares note-3 with sakura. She authored nothing, so rule 1 denies and
    // rule 2 admits — which is exactly what two rules are for.
    const row = await append("sakura", { noteId: "note-3" });
    expect(row).not.toBeNull();
    expect(await commentCount()).toBe(1);
  });

  test("…and only for the note actually shared with her", async () => {
    expect(await append("sakura", { noteId: "note-1" })).toBeNull();
    expect(await commentCount()).toBe(0);
  });

  test("guessing an id that does not exist is denied, not an error", async () => {
    expect(await append("naruto", { noteId: "note-does-not-exist" })).toBeNull();
    expect(await commentCount()).toBe(0);
  });

  // The load-bearing negative: an absent value must DENY, never compile to an
  // unconstrained query that would match every parent row.
  test("a MISSING parent id in the body denies — it never matches everything", async () => {
    expect(await append("naruto", {})).toBeNull();
    expect(await commentCount()).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("payload conditions that need no query", () => {
  const selfAuthored = registerPermissions([
    definePermissions([
      {
        name: "append_own_comment",
        entity: "note_comment",
        actions: ["create"],
        rules: [
          {
            context: [],
            target: [],
            payload: [
              {
                bag: "$requestBody.authorUserId",
                is: { bag: "$session.user.id" },
              },
            ],
          },
        ],
      },
    ]),
  ]);

  const ac = () =>
    createAc({
      tables,
      permissions: selfAuthored,
      forests: { company: [{ role: "self", permissions: ["append_own_comment"] }] },
      accountBaseline: [],
    });

  test("writing yourself as the author is allowed, in memory, with no probe", () => {
    const e = ac();
    const bag = bagFor("naruto", { authorUserId: "naruto" });
    const verdict = e.allowCreate(
      e.resolveEffectivePermissions(["self"], bag),
      "note_comment",
      bag,
    );
    expect(verdict.allow).toBe(true);
    expect(verdict.requires).toBeUndefined();
  });

  test("writing somebody else as the author is denied", () => {
    const e = ac();
    const bag = bagFor("naruto", { authorUserId: "kakashi" });
    const verdict = e.allowCreate(
      e.resolveEffectivePermissions(["self"], bag),
      "note_comment",
      bag,
    );
    expect(verdict.allow).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("config-load refusals", () => {
  const perm = (over: Record<string, unknown>) =>
    registerPermissions([
      [
        {
          name: "p",
          entity: "note_comment",
          actions: ["create"],
          rules: [{ context: [], target: [], payload: [] }],
          ...over,
        },
      ] as any,
    ]);

  test("payload on anything but create is refused — it would be a silent no-op", () => {
    expect(() =>
      perm({
        actions: ["read"],
        rules: [
          {
            context: [],
            target: [],
            payload: [{ bag: "$requestBody.noteId", is: { value: "x" } }],
          },
        ],
      }),
    ).toThrow(/payload is create-only/);
  });

  test("a `field:` subject in payload is refused — that row does not exist yet", () => {
    expect(() =>
      perm({
        rules: [
          {
            context: [],
            target: [],
            payload: [
              { field: "note_comment.noteId", is: { bag: "$session.user.id" } },
            ],
          },
        ],
      }),
    ).toThrow(/must read the access context/);
  });

  test("a traversal sharing its payload slot is refused", () => {
    expect(() =>
      perm({
        rules: [
          {
            context: [],
            target: [],
            payload: [
              { bag: "$requestBody.authorUserId", is: { bag: "$session.user.id" } },
              {
                bag: "$requestBody.noteId",
                join: "note",
                where: [{ field: "note.authorUserId", has: { bag: "$session.user.id" } }],
              },
            ],
          },
        ],
      }),
    ).toThrow(/must hold exactly that one condition/);
  });
});
