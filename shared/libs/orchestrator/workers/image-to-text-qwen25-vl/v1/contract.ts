import { z } from "zod";
import { type WorkerMeta, slot } from "@libs/orchestrator-lib-schema";

export const meta: WorkerMeta = { capability: "image-to-text", vendor: "qwen25-vl", operation: "chat.completions.create (OpenAI-compatible, Ollama)", runtimes: ["server"] };

// This worker transcribes, it does not describe: the output is the image's
// text and nothing else, as plain text or as markdown that keeps the page's
// structure (headings, lists, tables). The instruction is config: how the work
// is done.
export const config = z.object({
  /** plain text, or markdown that keeps the page's structure */
  output: z.enum(["format-plaintext", "format-markdown"]).default("format-plaintext"),
  /** the prompt; absent = the one for the output format (worker.ts) */
  instructions: z.string().optional(),
  model: z.string().default("qwen2.5vl:3b"),
  maxTokens: z.number().int().positive().max(8192).default(1024),
  temperature: z.number().min(0).max(2).default(0),
  concurrency: z.number().int().min(1).max(8).default(2),
  /** per image; the endpoint answers or the step fails, no silent client retries */
  timeoutMs: z.number().int().positive().default(4 * 60_000),
});

/** the OpenAI-compatible endpoint serving the model (Ollama locally) */
export const deps = z.object({ apiKey: z.string().min(1), baseUrl: z.string().url() });

export const input = {
  image: slot("type-image", { many: true, formats: ["format-png", "format-jpeg", "format-webp"], limits: { "constraint-bytes": 10_485_760 } }),
};

export const output = (cfg: z.infer<typeof config>) => ({
  text: slot("type-text", { many: true, formats: [cfg.output] }),
});
