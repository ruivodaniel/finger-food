// MuPDF runs for real (WASM, in process) on the two-page fixture: page 1 has a
// text layer (REQ-001), page 2 is a scan with none.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { pageText, run } from "../extract-mupdf/v1/worker";
import { makeCtx, putUpload } from "./harness";

const FIXTURE = path.resolve(__dirname, "fixtures/two-page-scan.pdf");

describe("extract-mupdf", () => {
  it("reads the text layer to markdown and lists the pages that had none", async () => {
    const { ctx, artifacts, reports } = await makeCtx();
    const carrier = await putUpload(artifacts, "a.pdf", new Uint8Array(await readFile(FIXTURE)), "format-pdf");

    const out = await run({ carrier }, { target_kind: "text", output: "format-markdown" }, ctx);

    expect(out.content.ref).toBe("orch/derived/runs/run1/step/text.md");
    expect(out.content.format).toBe("format-markdown");
    expect(new TextDecoder().decode(artifacts.objects.get(out.content.ref))).toContain("REQ-001");
    expect(out.content.meta).toMatchObject({ pages: 2, emptyPages: [2] });
    expect(reports).toHaveLength(1);
  });

  it("honours the page range and the plaintext format", async () => {
    const { ctx, artifacts } = await makeCtx();
    const carrier = await putUpload(artifacts, "a.pdf", new Uint8Array(await readFile(FIXTURE)), "format-pdf");

    const out = await run({ carrier }, { target_kind: "text", output: "format-plaintext", pages: "2" }, ctx);

    expect(out.content.ref).toBe("orch/derived/runs/run1/step/text.txt");
    expect(out.content.meta).toMatchObject({ pages: 1, emptyPages: [2] });
  });

  it("keeps lines and puts a blank line between blocks", () => {
    const json = JSON.stringify({ blocks: [{ type: "text", lines: [{ text: "a  " }, { text: "b" }] }, { type: "image" }, { type: "text", lines: [{ text: "c" }] }] });
    expect(pageText(json)).toBe("a\nb\n\nc\n\n");
  });
});
