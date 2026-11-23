import { describe, expect, it } from "vitest";
import { z } from "zod";
import { slot, slotValueSchema, type SlotValues } from "..";

describe("slot()", () => {
  it("a content slot is typed by its type", () => {
    const s = slot("type-image", { many: true, formats: ["format-png", "format-jpeg"], limits: { "constraint-bytes": 10 } });
    expect(s.types).toEqual(["type-image"]);
    expect(s.many).toBe(true);
    expect(s.file).toBe(false);
  });

  it("a file slot is typed by the types its formats carry", () => {
    const s = slot({ formats: ["format-pdf", "format-docx"] });
    expect(s.file).toBe(true);
    expect([...s.types].sort()).toEqual(["type-image", "type-table", "type-text", "type-visualization"]);
  });

  it("rejects a format that does not carry the slot's type", () => {
    expect(() => slot("type-audio", { formats: ["format-png"] })).toThrow(/does not carry/);
  });

  it("the value schema accepts a ref in an accepted format and rejects others", () => {
    const schema = slotValueSchema(slot({ formats: ["format-pdf"] }));
    expect(schema.safeParse({ type: "type-text", format: "format-pdf", ref: "uploads/a.pdf" }).success).toBe(true);
    expect(schema.safeParse({ type: "type-text", format: "format-mp3", ref: "uploads/a.mp3" }).success).toBe(false);
  });

  it("a content slot without formats accepts any format carrying its type", () => {
    const schema = slotValueSchema(slot("type-text"));
    expect(schema.safeParse({ type: "type-text", format: "format-markdown", ref: "r" }).success).toBe(true);
    expect(schema.safeParse({ type: "type-text", format: "format-png", ref: "r" }).success).toBe(false);
  });

  it("a schema slot accepts an inline value that matches and a ref", () => {
    const s = slot("type-structured-content", { schema: z.array(z.number().int()) });
    const schema = slotValueSchema(s);
    expect(schema.safeParse({ type: "type-structured-content", value: [1, 2] }).success).toBe(true);
    expect(schema.safeParse({ type: "type-structured-content", value: ["x"] }).success).toBe(false);
    expect(schema.safeParse({ type: "type-structured-content", format: "format-json", ref: "r" }).success).toBe(true);
  });

  it("many wraps the value in an array", () => {
    const schema = slotValueSchema(slot("type-image", { many: true }));
    expect(schema.safeParse([{ type: "type-image", format: "format-png", ref: "1.png" }]).success).toBe(true);
    expect(schema.safeParse({ type: "type-image", format: "format-png", ref: "1.png" }).success).toBe(false);
  });

  it("SlotValues infers refs, arrays and inline values", () => {
    const slots = {
      document: slot({ formats: ["format-pdf"] }),
      pages: slot("type-image", { many: true }),
      skipped: slot("type-structured-content", { schema: z.array(z.number()) }),
    };
    const v: SlotValues<typeof slots> = {
      document: { type: "type-text", format: "format-pdf", ref: "a" },
      pages: [{ type: "type-image", format: "format-png", ref: "1" }],
      skipped: { type: "type-structured-content", value: [2] },
    };
    expect(v.pages.length).toBe(1);
    expect(Object.keys(slots)).toEqual(["document", "pages", "skipped"]);
  });
});
