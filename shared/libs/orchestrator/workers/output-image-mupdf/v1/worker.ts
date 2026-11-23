// output-image × MuPDF: one image per PDF page through MuPDF's JS build (WASM), in process: no
// Python, no subprocess. Pages render one at a time and upload as they go.
import { pageIndexes } from "../../lib/pages";
import { extensionOf, EnvelopeError, type Ref } from "@libs/orchestrator-lib-schema";
import type { WorkerRun } from "@libs/orchestrator-lib-schema";
import type * as contract from "./contract";

export const run: WorkerRun<typeof contract> = async (input, cfg, ctx) => {
  const mupdf = await import("mupdf");
  const bytes = await ctx.artifacts.getBytes(input.source);
  const started = performance.now();

  let doc: InstanceType<typeof mupdf.Document>;
  try {
    doc = mupdf.Document.openDocument(bytes, "application/pdf");
  } catch (err) {
    throw new EnvelopeError({ code: "worker_failed", message: `mupdf could not open the document: ${err instanceof Error ? err.message : String(err)}`, retryable: false });
  }

  const zoom = cfg.dpi / 72;
  const ext = extensionOf(cfg.format);
  const images: Ref<"type-image">[] = [];
  for (const i of pageIndexes(cfg.pages, doc.countPages())) {
    const pix = doc.loadPage(i).toPixmap(mupdf.Matrix.scale(zoom, zoom), mupdf.ColorSpace.DeviceRGB, false);
    const image = cfg.format === "format-jpeg" ? pix.asJPEG(cfg.quality) : pix.asPNG();
    const n = i + 1;
    images.push(
      await ctx.artifacts.putBytes(image, {
        type: "type-image",
        format: cfg.format,
        key: ctx.artifacts.key("runs", ctx.runId, ctx.stepKey, `${n}${ext}`),
        meta: { page: n, dpi: cfg.dpi, width: pix.getWidth(), height: pix.getHeight() },
      }),
    );
  }

  ctx.report({ measured: "observed", calls: 1, compute: { wallMs: Math.round(performance.now() - started) } });
  return { images };
};
