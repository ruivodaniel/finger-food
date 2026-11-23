import { describe, expect, it } from "vitest";
import { run } from "../merge-native/v1/worker";
import { makeCtx, putUpload } from "./harness";

const enc = (s: string) => new TextEncoder().encode(s);

describe("merge-native", () => {
  it("joins the parts in input order, drops the empty ones, and writes markdown", async () => {
    const { ctx, artifacts, reports } = await makeCtx();
    const a = await putUpload(artifacts, "a.md", enc("page one\n\n"), "format-markdown");
    const blank = await putUpload(artifacts, "b.txt", enc("  \n"), "format-plaintext");
    const c = await putUpload(artifacts, "c.txt", enc("page three"), "format-plaintext");

    const out = await run({ parts: [a, blank, c] }, { separator: "\n\n", output: "format-markdown" }, ctx);

    expect(out.whole.ref).toBe("orch/derived/runs/run1/step/text.md");
    expect(out.whole.format).toBe("format-markdown");
    expect(new TextDecoder().decode(artifacts.objects.get(out.whole.ref))).toBe("page one\n\npage three\n");
    expect(out.whole.meta).toMatchObject({ parts: 3, emptyParts: 1 });
    expect(reports).toHaveLength(1);
  });

  it("writes an empty text when every part is empty", async () => {
    const { ctx, artifacts } = await makeCtx();
    const blank = await putUpload(artifacts, "b.txt", enc(""), "format-plaintext");

    const out = await run({ parts: [blank] }, { separator: "\n\n", output: "format-plaintext" }, ctx);

    expect(out.whole.ref).toBe("orch/derived/runs/run1/step/text.txt");
    expect(artifacts.objects.get(out.whole.ref)?.byteLength).toBe(0);
  });
});
