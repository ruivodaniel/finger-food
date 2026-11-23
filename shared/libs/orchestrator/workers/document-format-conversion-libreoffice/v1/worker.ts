// Office → PDF through LibreOffice headless. Word documents have no pages
// until they are laid out; rendering to PDF first gives page fidelity and one
// downstream path for every document worker.
import { existsSync } from "node:fs";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { EnvelopeError, type NodeWorkerRun } from "@libs/orchestrator-lib-schema";
import { meteredExec } from "../../lib/metered-exec";
import type * as contract from "./contract";

const CANDIDATES = [
  "/Applications/LibreOffice.app/Contents/MacOS/soffice",
  "/usr/bin/soffice",
  "/usr/local/bin/soffice",
  "/opt/homebrew/bin/soffice",
];

export function sofficeBin(configured?: string): string {
  return configured || CANDIDATES.find((p) => existsSync(p)) || "soffice";
}

export const run: NodeWorkerRun<typeof contract> = async (input, cfg, ctx) => {
  const source = await ctx.artifacts.materialize(input.document, ctx.workdir);
  const bin = sofficeBin(ctx.deps.sofficeBin);

  // soffice writes <basename>.pdf into --outdir; a temp dir keeps concurrent
  // conversions apart.
  const tmp = await mkdtemp(path.join(os.tmpdir(), "soffice-"));
  const started = performance.now();
  try {
    const { resources } = await meteredExec(bin, ["--headless", "--norestore", "--convert-to", "pdf", "--outdir", tmp, source], {
      timeout: cfg.timeoutMs,
      env: { ...process.env, HOME: process.env.HOME ?? tmp },
    });
    const produced = (await readdir(tmp)).find((f) => f.toLowerCase().endsWith(".pdf"));
    if (!produced) throw new EnvelopeError({ code: "worker_failed", message: `soffice produced no PDF for ${path.basename(source)}`, retryable: false });
    ctx.report({ measured: "observed", calls: 1, compute: { wallMs: Math.round(performance.now() - started), ...resources } });
    const document = await ctx.artifacts.putFile(path.join(tmp, produced), {
      format: "format-pdf",
      key: ctx.artifacts.key("runs", ctx.runId, ctx.stepKey, "document.pdf"),
      meta: { source: path.basename(source) },
    });
    return { document };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/ENOENT/.test(message)) {
      throw new EnvelopeError({ code: "worker_failed", message: `LibreOffice not found (${bin}). Install it or set SOFFICE_BIN`, retryable: false });
    }
    throw err;
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
};
