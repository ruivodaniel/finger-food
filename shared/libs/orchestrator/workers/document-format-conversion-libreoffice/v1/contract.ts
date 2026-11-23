import { z } from "zod";
import { type WorkerMeta, slot } from "@libs/orchestrator-lib-schema";

export const meta: WorkerMeta = { capability: "document-format-conversion", vendor: "libreoffice", operation: "soffice --headless --convert-to pdf", runtimes: ["server"] };

export const config = z.object({
  /** the target format (the capability's `to` axis); this version converts office files to PDF */
  to: z.enum(["format-pdf"]).default("format-pdf"),
  timeoutMs: z.number().int().positive().default(180_000),
});

/** absent = the first soffice found on the usual paths, else `soffice` on PATH */
export const deps = z.object({ sofficeBin: z.string().min(1).optional() });

export const input = {
  document: slot({ formats: ["format-docx", "format-doc", "format-odt", "format-pptx"], limits: { "constraint-bytes": 104_857_600 } }),
};

export const output = {
  document: slot({ formats: ["format-pdf"] }),
};
