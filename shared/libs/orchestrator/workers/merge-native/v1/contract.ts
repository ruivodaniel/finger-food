import { z } from "zod";
import { type WorkerMeta, slot } from "@libs/orchestrator-lib-schema";

export const meta: WorkerMeta = { capability: "merge", vendor: "native", operation: "decode each part, drop the empty ones, join them in input order (TypeScript, in process)", runtimes: ["server", "client"] };

export const config = z.object({
  /** what goes between two parts */
  separator: z.string().default("\n\n"),
  output: z.enum(["format-markdown", "format-plaintext"]).default("format-markdown"),
});

// Text parts joined into one text, in input order: the caller orders them. An
// empty part (a blank scanned page) is dropped.
export const input = {
  parts: slot("type-text", { many: true, formats: ["format-markdown", "format-plaintext"] }),
};

export const output = (cfg: z.infer<typeof config>) => ({
  whole: slot("type-text", { formats: [cfg.output] }),
});
