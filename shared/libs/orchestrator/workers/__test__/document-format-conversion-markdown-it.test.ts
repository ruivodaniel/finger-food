import { describe, expect, it } from "vitest";
import { run, titleOf } from "../document-format-conversion-markdown-it/v1/worker";
import { makeCtx, putUpload } from "./harness";

const enc = (s: string) => new TextEncoder().encode(s);
const cfg = { to: "format-html" as const, page: true };

describe("document-format-conversion-markdown-it", () => {
  it("renders markdown to a standalone page, titled by its first line", async () => {
    const { ctx, artifacts, reports } = await makeCtx();
    const md = await putUpload(artifacts, "a.md", enc("Section 1  User Requirements\n\nREQ-001  Track batches.\nREQ-002  Sign on start.\n"), "format-markdown");

    const out = await run({ document: md }, cfg, ctx);

    expect(out.document.ref).toBe("orch/derived/runs/run1/step/document.html");
    expect(out.document.format).toBe("format-html");
    const html = new TextDecoder().decode(artifacts.objects.get(out.document.ref));
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain("<title>Section 1  User Requirements</title>");
    // one line per text line: a line break stays a line break
    expect(html).toContain("REQ-001  Track batches.<br>\nREQ-002  Sign on start.");
    expect(reports).toHaveLength(1);
  });

  it("escapes raw HTML in the text instead of passing it through", async () => {
    const { ctx, artifacts } = await makeCtx();
    const md = await putUpload(artifacts, "a.md", enc('Hello <script>alert("x")</script>'), "format-markdown");

    const out = await run({ document: md }, { ...cfg, page: false }, ctx);

    const html = new TextDecoder().decode(artifacts.objects.get(out.document.ref));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<!doctype html>");
  });

  it("takes the title from the first line, heading marks removed", () => {
    expect(titleOf("\n\n# Contract\nbody")).toBe("Contract");
    expect(titleOf("")).toBe("Document");
  });
});
