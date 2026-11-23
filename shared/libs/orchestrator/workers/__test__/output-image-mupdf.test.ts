// MuPDF runs for real (WASM, in process) on the two-page fixture.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { run } from "../output-image-mupdf/v1/worker";
import { makeCtx, putUpload } from "./harness";

const FIXTURE = path.resolve(__dirname, "fixtures/two-page-scan.pdf");
const PNG = [0x89, 0x50, 0x4e, 0x47];
const JPEG = [0xff, 0xd8, 0xff];

describe("output-image-mupdf", () => {
  it("uploads one png per page, in order, with the page number in meta", async () => {
    const { ctx, artifacts, reports } = await makeCtx();
    const source = await putUpload(artifacts, "a.pdf", new Uint8Array(await readFile(FIXTURE)), "format-pdf");

    const out = await run({ source }, { dpi: 72, format: "format-png", quality: 85 }, ctx);

    expect(out.images.map((p) => p.ref)).toEqual(["orch/derived/runs/run1/step/1.png", "orch/derived/runs/run1/step/2.png"]);
    expect(out.images.map((p) => p.meta?.page)).toEqual([1, 2]);
    expect(out.images[0]?.type).toBe("type-image");
    expect([...artifacts.objects.get(out.images[0]!.ref)!.slice(0, 4)]).toEqual(PNG);
    expect(reports[0]?.compute?.wallMs).toBeGreaterThanOrEqual(0);
  });

  it("renders only the pages asked for, as jpeg when configured", async () => {
    const { ctx, artifacts } = await makeCtx();
    const source = await putUpload(artifacts, "a.pdf", new Uint8Array(await readFile(FIXTURE)), "format-pdf");

    const out = await run({ source }, { dpi: 72, format: "format-jpeg", quality: 80, pages: "2" }, ctx);

    expect(out.images.map((p) => p.ref)).toEqual(["orch/derived/runs/run1/step/2.jpg"]);
    expect([...artifacts.objects.get(out.images[0]!.ref)!.slice(0, 3)]).toEqual(JPEG);
  });

  it("fails as worker_failed on bytes that are not a pdf", async () => {
    const { ctx, artifacts } = await makeCtx();
    const source = await putUpload(artifacts, "a.pdf", new TextEncoder().encode("not a pdf"), "format-pdf");
    await expect(run({ source }, { dpi: 72, format: "format-png", quality: 85 }, ctx)).rejects.toMatchObject({ error: { code: "worker_failed" } });
  });
});
