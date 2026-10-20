// Type-level negatives — each `@ts-expect-error` MUST fail to compile. These are
// the four enforcement guarantees of the library. If any line ever compiles,
// `tsc --noEmit` (test:types) fails because the expected error disappeared.
//
// This file is checked by `tsc`, NOT run by vitest (it has no runtime asserts).

import { createGatedDb, type Private, type Public } from "../src/index";
import { makeAc } from "./fixture/ac";
import { tables, type SessionBag } from "./fixture/db";

const engine = makeAc();
const gate = createGatedDb<typeof tables>({} as any, { tables, engine });

const bag = {
  session: { user: { id: "naruto", email: "n@x.io" }, organization: { id: "altar", type: "company" } },
} satisfies SessionBag;
const roles = ["default", "employee"];

const noteRead = engine.resolveRead(roles, "note", bag);
const noteShareRead = engine.resolveRead(roles, "note_share", bag);
const noteUpdate = engine.resolveUpdate(roles, "note", bag);

// (sanity — these MUST compile: the correct scope into the matching call)
gate(bag).read("note", noteRead);
gate(bag).update("note", noteUpdate, "note-1", { text: "ok" });

// ── (1) a fabricated / plain-object scope passed to `read` ──
// A hand-built object can't carry the private brand symbol → type error.
const fabricated = { base: undefined as any, idSubqueries: [] };
// @ts-expect-error — fabricated scope lacks the unforgeable brand
gate(bag).read("note", fabricated);

// ── (2) a wrong-ENTITY scope (a note_share read-scope into a note read) ──
// @ts-expect-error — Scope<"note_share","read"> is not a Scope<"note","read">
gate(bag).read("note", noteShareRead);

// ── (3) a wrong-ACTION scope (a read-scope passed to `update`) ──
// @ts-expect-error — Scope<"note","read"> is not a Scope<"note","update">
gate(bag).update("note", noteRead, "note-1", { text: "x" });

// ── (4) escalation: a `Public` token where `Private` is required ──
declare function privateOnly(v: Private): void;
const pub: Public = { visibility: "public" };
// @ts-expect-error — Public is not assignable to Private (no escalation)
privateOnly(pub);

// (sanity — Private IS assignable where Public is required; must compile)
declare function publicOk(v: Public): void;
const priv: Private = { visibility: "public", secret: true };
publicOk(priv);
