// The word diff. It lives in the slice's shared code, which the web side draws.
import { describe, expect, it } from "vitest";
import { diffWords } from "../../shared/word-diff";

const show = (from: string, to: string) => diffWords(from, to).map(({ type, value }) => (type === "added" ? `+${value}` : type === "removed" ? `-${value}` : value)).join("");

describe("diffWords", () => {
  it("says what stayed, what left and what came", () => {
    expect(show("A note", "A reminder")).toBe("A -note+reminder");
  });

  it("a word added in the middle leaves the others alone", () => {
    expect(show("buy eggs", "buy fresh eggs")).toBe("buy +fresh+ eggs");
  });

  it("from nothing, all added; to nothing, all removed", () => {
    expect(show("", "new")).toBe("+new");
    expect(show("old", "")).toBe("-old");
  });

  it("the same text has no changes", () => {
    expect(diffWords("same text", "same text").every(({ type }) => type === "unchanged")).toBe(true);
  });
});
