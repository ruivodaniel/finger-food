// What the compiler cannot check in the vocabulary: a type's `contains` names
// other types of the same object. Formats, constraints and the capabilities'
// canonical slots are checked by `satisfies` at build time.
import { describe, expect, it } from "vitest";
import { FORMAT_BY_EXTENSION, FORMAT_IDS, FORMATS, TYPE_IDS, TYPES, extensionOf } from "..";

describe("ontology vocabulary", () => {
  it("every type contains known types", () => {
    const known = new Set<string>(TYPE_IDS);
    for (const [id, t] of Object.entries(TYPES)) for (const c of t.contains) expect(known.has(c), `${id} contains ${c}`).toBe(true);
  });

  it("every format carries at least one type", () => {
    for (const f of FORMAT_IDS) expect(FORMATS[f].packages.length, f).toBeGreaterThan(0);
  });

  it("has no document type: a document is a format", () => {
    expect(TYPE_IDS).not.toContain("type-text-document");
    expect(TYPE_IDS).not.toContain("type-multimedia-document");
  });

  it("maps extensions both ways", () => {
    expect(extensionOf("format-jpeg")).toBe(".jpg");
    expect(extensionOf("format-base64")).toBe("");
    expect(FORMAT_BY_EXTENSION.get(".jpeg")).toBe("format-jpeg");
    expect(FORMAT_BY_EXTENSION.get(".htm")).toBe("format-html");
  });
});
