// extract × MuPDF: a PDF's text layer, through MuPDF's JS build (WASM), in process. Ported from
// slice-design's convert (server/lib/convert.ts): the structured-text JSON, a
// line per text line and a blank line per block. Not asHTML — that positions
// every fragment absolutely and shatters words; the JSON keeps reading order.
import { pageIndexes } from "../../lib/pages";
import { extensionOf, EnvelopeError } from "@libs/orchestrator-lib-schema";
import type { WorkerRun } from "@libs/orchestrator-lib-schema";
import type * as contract from "./contract";

interface StructuredText {
  blocks?: { type?: string; lines?: { text?: string }[] }[];
}

/** One page's structured-text JSON → its lines, a blank line between blocks. */
export function pageText(json: string): string {
  let out = "";
  for (const b of (JSON.parse(json) as StructuredText).blocks ?? []) {
    if (b.type !== "text") continue;
    for (const l of b.lines ?? []) {
      const t = (l.text ?? "").trimEnd();
      if (t) out += t + "\n";
    }
    out += "\n";
  }
  return out;
}

export const run: WorkerRun<typeof contract> = async (input, cfg, ctx) => {
  const mupdf = await import("mupdf");
  const bytes = await ctx.artifacts.getBytes(input.carrier);
  const started = performance.now();

  let doc: InstanceType<typeof mupdf.Document>;
  try {
    doc = mupdf.Document.openDocument(bytes, "application/pdf");
  } catch (err) {
    throw new EnvelopeError({ code: "worker_failed", message: `mupdf could not open the document: ${err instanceof Error ? err.message : String(err)}`, retryable: false });
  }

  const read = pageIndexes(cfg.pages, doc.countPages());
  const emptyPages: number[] = [];
  let text = "";
  for (const i of read) {
    const page = pageText(doc.loadPage(i).toStructuredText("preserve-whitespace").asJSON());
    if (!page.trim()) emptyPages.push(i + 1);
    text += page + "\n";
  }
  text = text.replace(/\n{3,}/g, "\n\n").trim() + "\n";

  ctx.report({ measured: "observed", calls: 1, compute: { wallMs: Math.round(performance.now() - started) } });
  const ext = extensionOf(cfg.output);
  return {
    content: await ctx.artifacts.putBytes(new TextEncoder().encode(text), {
      type: "type-text",
      format: cfg.output,
      key: ctx.artifacts.key("runs", ctx.runId, ctx.stepKey, `text${ext}`),
      meta: { pages: read.length, chars: text.length, emptyPages },
    }),
  };
};
