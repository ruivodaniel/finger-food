import { z } from "zod";
import { pageRange } from "../../lib/pages";
import { type WorkerMeta, slot } from "@libs/orchestrator-lib-schema";

export const meta: WorkerMeta = { capability: "output-image", vendor: "mupdf", operation: "Page.toPixmap → asPNG | asJPEG (mupdf.js, WASM)", runtimes: ["server"] };

export const config = z.object({
  dpi: z.number().int().min(72).max(300).default(144),
  format: z.enum(["format-png", "format-jpeg"]).default("format-png"),
  /** "1-12,40" — 1-based pages to render; absent = all */
  pages: pageRange.optional(),
  /** jpeg only */
  quality: z.number().int().min(1).max(100).default(85),
});

// A PDF's pages rendered as images, one per page, in page order.
export const input = {
  source: slot({ formats: ["format-pdf"], limits: { "constraint-bytes": 104_857_600 } }),
};

export const output = (cfg: z.infer<typeof config>) => ({
  images: slot("type-image", { many: true, formats: [cfg.format] }),
});
