import { describe, expect, it } from "vitest";
import { z } from "zod";
import { slot, validateInput, validateOutput } from "..";

const slots = {
  document: slot({ formats: ["format-pdf"], limits: { "constraint-bytes": 100 } }),
  skipped: slot("type-structured-content", { schema: z.array(z.number()) }),
};
const head = (sizes: Record<string, number>) => async (ref: string) => (ref in sizes ? { bytes: sizes[ref] } : null);

describe("validateInput", () => {
  it("accepts a ref in an accepted format and fills bytes", async () => {
    const r = await validateInput(slots, { document: { type: "type-text", format: "format-pdf", ref: "a" }, skipped: { type: "type-structured-content", value: [1] } }, head({ a: 40 }));
    expect(r.error).toBeNull();
    if (!r.error) expect((r.values.document as { bytes: number }).bytes).toBe(40);
  });

  it("names the format when the format is not accepted", async () => {
    const r = await validateInput(slots, { document: { type: "type-text", format: "format-mp3", ref: "a" }, skipped: { type: "type-structured-content", value: [] } }, head({ a: 1 }));
    expect(r.error?.code).toBe("format_not_accepted");
  });

  it("rejects a missing ref", async () => {
    const r = await validateInput(slots, { document: { type: "type-text", format: "format-pdf", ref: "nope" }, skipped: { type: "type-structured-content", value: [] } }, head({}));
    expect(r.error?.code).toBe("ref_not_found");
  });

  it("rejects an input over the slot's byte limit", async () => {
    const r = await validateInput(slots, { document: { type: "type-text", format: "format-pdf", ref: "a" }, skipped: { type: "type-structured-content", value: [] } }, head({ a: 101 }));
    expect(r.error?.code).toBe("input_too_large");
    expect(r.error?.details).toEqual({ "constraint-bytes": 100, bytes: 101 });
  });

  it("without head (inside a run) it looks nothing up and checks the size the ref carries", async () => {
    const ok = await validateInput(slots, { document: { type: "type-text", format: "format-pdf", ref: "never-stored" }, skipped: { type: "type-structured-content", value: [] } });
    expect(ok.error).toBeNull();
    const big = await validateInput(slots, { document: { type: "type-text", format: "format-pdf", ref: "a", bytes: 101 }, skipped: { type: "type-structured-content", value: [] } });
    expect(big.error?.code).toBe("input_too_large");
  });

  it("rejects an inline value that fails the slot's schema", async () => {
    const r = await validateInput(slots, { document: { type: "type-text", format: "format-pdf", ref: "a" }, skipped: { type: "type-structured-content", value: ["x"] } }, head({ a: 1 }));
    expect(r.error?.code).toBe("input_invalid");
  });
});

describe("validateOutput", () => {
  const out = { pages: slot("type-image", { many: true, formats: ["format-png"] }) };
  it("accepts a matching output", () => {
    expect(validateOutput(out, { pages: [{ type: "type-image", format: "format-png", ref: "1" }] }).error).toBeNull();
  });
  it("rejects a wrong shape", () => {
    expect(validateOutput(out, { pages: { type: "type-image", format: "format-png", ref: "1" } }).error?.code).toBe("output_invalid");
  });
});
