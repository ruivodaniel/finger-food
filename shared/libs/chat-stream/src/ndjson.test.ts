import { describe, expect, it } from "vitest";
import { ndjsonLine, NdjsonLimitError, readNdjson } from "./ndjson";

/** A body that arrives in these pieces. */
function body(...pieces: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const piece of pieces) controller.enqueue(encoder.encode(piece));
      controller.close();
    },
  });
}

async function readAll(stream: ReadableStream<Uint8Array>, limits = { maxLineBytes: 1024, maxTotalBytes: 4096 }) {
  const values: unknown[] = [];
  for await (const value of readNdjson(stream, limits)) values.push(value);
  return values;
}

describe("readNdjson", () => {
  it("reads each line's value, even when a piece ends mid-line", async () => {
    const lines = ndjsonLine({ seq: 0 }) + ndjsonLine({ seq: 1 });
    expect(await readAll(body(lines.slice(0, 5), lines.slice(5, 14), lines.slice(14)))).toEqual([{ seq: 0 }, { seq: 1 }]);
  });

  it("skips blank lines and reads a last line without its newline", async () => {
    expect(await readAll(body('{"a":1}\n\n', '{"a":2}'))).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("refuses a line longer than the limit, newline or not", async () => {
    await expect(readAll(body(`"${"x".repeat(50)}"\n`), { maxLineBytes: 20, maxTotalBytes: 4096 })).rejects.toBeInstanceOf(NdjsonLimitError);
    await expect(readAll(body("x".repeat(50)), { maxLineBytes: 20, maxTotalBytes: 4096 })).rejects.toBeInstanceOf(NdjsonLimitError);
  });

  it("refuses a body longer than the limit", async () => {
    const many = Array.from({ length: 20 }, (_, i) => ndjsonLine({ i })).join("");
    await expect(readAll(body(many), { maxLineBytes: 100, maxTotalBytes: 50 })).rejects.toBeInstanceOf(NdjsonLimitError);
  });

  it("throws on a line that is not JSON", async () => {
    await expect(readAll(body("not json\n"))).rejects.toBeInstanceOf(SyntaxError);
  });
});
