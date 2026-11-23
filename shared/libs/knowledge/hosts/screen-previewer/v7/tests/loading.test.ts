// The states of a read in a UI document, by TanStack Query's names: `isLoading.<name>`, `isFetching.<name>`, `isRefetching.<name>`, `isError.<name>`, `error.<name>`, `isPlaceholderData.<name>`. The words live in the UI as data library; they are tested here,
// where the UI rules can be run (the check system, shared/libs/check), with the live screen's answers that give them.
import { describe, expect, it } from "vitest";
import { findingsIn } from "../../ui-system";
import type { Doc } from "../../../../../ui/ui-data/v3/types";
import { createAnswers } from "../live-screen/answers";

const doc = (bind: string): Doc => ({
  kind: "page", schemaVersion: 1, name: "list", version: 1,
  data: { rows: { source: "GET /api/rows" } },
  root: { type: "Stack", children: [{ type: "Text", when: { bind }, props: { children: "…" } }] },
} as unknown as Doc);
/** what the rules of the language of a UI document find in it */
const issues = async (d: Doc) => (await findingsIn([{ name: d.name, kind: d.kind, document: d }], ["language"]))[d.name];

describe("the states of a read, in a document", () => {
  for (const word of ["isLoading", "isFetching", "isRefetching", "isError", "error", "isPlaceholderData"]) {
    it(`${word} is in scope`, async () => expect(await issues(doc(`${word}.rows`))).toEqual([]));
    it(`${word} names a read of the document`, async () => expect(await issues(doc(`${word}.other`))).toEqual([`"${word}.other" names no read of this document`]));
  }
});

describe("placeholderData", () => {
  const withPlaceholder = (value: string): Doc => ({ ...doc("isPlaceholderData.rows"), data: { rows: { source: "GET /api/rows", placeholderData: value } } } as unknown as Doc);
  it("is keepPreviousData", async () => expect(await issues(withPlaceholder("keepPreviousData"))).toEqual([]));
  it("is nothing else", async () => expect(await issues(withPlaceholder("whatever"))).toEqual([`placeholderData is keepPreviousData ("whatever")`]));
});

describe("the states of a read, as the live screen gives them", () => {
  const later = () => new Promise((r) => setTimeout(r, 0));
  it("isLoading until the first answer, then neither loading nor fetching", async () => {
    const a = createAnswers(async () => [1], () => {});
    expect(a.status("GET /rows", {})).toEqual({ isLoading: true, isFetching: true, isRefetching: false, isError: false, error: null });
    a.read("GET /rows", {});
    expect(a.status("GET /rows", {}).isLoading).toBe(true);
    await a.settled();
    expect(a.status("GET /rows", {})).toEqual({ isLoading: false, isFetching: false, isRefetching: false, isError: false, error: null });
  });
  it("isRefetching while it is asked again: the last answer stays on screen", async () => {
    const a = createAnswers(async () => [1], () => {});
    a.read("GET /rows", {}); await a.settled();
    a.again();
    expect(a.read("GET /rows", {})).toEqual([1]);
    expect(a.status("GET /rows", {})).toEqual({ isLoading: false, isFetching: true, isRefetching: true, isError: false, error: null });
    await a.settled();
    expect(a.status("GET /rows", {}).isRefetching).toBe(false);
  });
  it("error when the API answers with one, with its status; the answer it had stays, and the next answer clears the error", async () => {
    let fail = false;
    const a = createAnswers(async () => { if (fail) throw Object.assign(new Error("not allowed"), { status: 403 }); return [1]; }, () => {});
    a.read("GET /rows", {}); await a.settled();
    fail = true; a.again(); a.read("GET /rows", {}); await a.settled(); await later();
    expect(a.status("GET /rows", {})).toEqual({ isLoading: false, isFetching: false, isRefetching: false, isError: true, error: { status: 403, message: "not allowed" } });
    expect(a.read("GET /rows", {})).toEqual([1]);
    fail = false; a.again(); a.read("GET /rows", {}); await a.settled();
    expect(a.status("GET /rows", {}).error).toBeNull();
  });
  it("a request with other params is another read: isLoading, not isRefetching", async () => {
    const a = createAnswers(async () => [1], () => {});
    a.read("GET /rows", { page: 1 }); await a.settled();
    expect(a.status("GET /rows", { page: 2 })).toEqual({ isLoading: true, isFetching: true, isRefetching: false, isError: false, error: null });
  });
});
