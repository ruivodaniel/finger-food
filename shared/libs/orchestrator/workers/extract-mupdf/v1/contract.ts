import { z } from "zod";
import { pageRange } from "../../lib/pages";
import { type WorkerMeta, slot } from "@libs/orchestrator-lib-schema";

export const meta: WorkerMeta = { capability: "extract", vendor: "mupdf", operation: "Page.toStructuredText → asJSON → lines (mupdf.js, WASM)", runtimes: ["server"] };

export const config = z.object({
  /** what to extract from the carrier; this version extracts the text layer */
  target_kind: z.enum(["text"]).default("text"),
  output: z.enum(["format-markdown", "format-plaintext"]).default("format-markdown"),
  /** "1-12,40" — 1-based pages to read; absent = all */
  pages: pageRange.optional(),
});

// A PDF's own text layer, in reading order. No OCR: a scanned page comes out
// empty and is listed in the content ref's meta as `emptyPages`.
export const input = {
  carrier: slot({ formats: ["format-pdf"], limits: { "constraint-bytes": 104_857_600 } }),
};

export const output = (cfg: z.infer<typeof config>) => ({
  content: slot("type-text", { formats: [cfg.output] }),
});
