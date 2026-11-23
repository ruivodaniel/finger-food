import { writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { makeCtx, putUpload } from "./harness";

const exec = vi.fn();
vi.mock("../lib/metered-exec", async (actual) => ({ ...(await actual<object>()), meteredExec: (...args: unknown[]) => exec(...args) }));

const { run, sofficeBin } = await import("../document-format-conversion-libreoffice/v1/worker");
const cfg = { to: "format-pdf" as const, timeoutMs: 1000 };

describe("document-format-conversion-libreoffice", () => {
  it("converts through soffice into a temp dir and uploads the pdf", async () => {
    exec.mockImplementation(async (_bin: string, args: string[]) => {
      const outdir = args[args.indexOf("--outdir") + 1]!;
      await writeFile(path.join(outdir, "doc.pdf"), "%PDF-1.4 fake");
      return { stdout: "", stderr: "", resources: { cpuMs: 12, maxRssBytes: 1000 } };
    });
    const { ctx, artifacts, reports } = await makeCtx({ sofficeBin: "/bin/soffice" });
    const document = await putUpload(artifacts, "doc.docx", new TextEncoder().encode("docx"), "format-docx");

    const out = await run({ document }, cfg, ctx);

    expect(out.document.format).toBe("format-pdf");
    expect(out.document.ref).toBe("orch/derived/runs/run1/step/document.pdf");
    expect(artifacts.objects.has(out.document.ref)).toBe(true);
    expect(exec.mock.calls[0]?.[0]).toBe("/bin/soffice");
    expect(reports[0]?.compute?.cpuMs).toBe(12);
  });

  it("fails as worker_failed when soffice produces nothing", async () => {
    exec.mockResolvedValue({ stdout: "", stderr: "", resources: {} });
    const { ctx, artifacts } = await makeCtx({ sofficeBin: "/bin/soffice" });
    const document = await putUpload(artifacts, "doc.docx", new Uint8Array(1), "format-docx");
    await expect(run({ document }, cfg, ctx)).rejects.toMatchObject({ error: { code: "worker_failed" } });
  });

  it("names the missing binary on ENOENT", async () => {
    exec.mockRejectedValue(new Error("spawn soffice ENOENT"));
    const { ctx, artifacts } = await makeCtx({});
    const document = await putUpload(artifacts, "doc.docx", new Uint8Array(1), "format-docx");
    await expect(run({ document }, cfg, ctx)).rejects.toThrow(/LibreOffice not found/);
  });

  it("prefers the configured binary over the candidates", () => {
    expect(sofficeBin("/x/soffice")).toBe("/x/soffice");
  });
});
