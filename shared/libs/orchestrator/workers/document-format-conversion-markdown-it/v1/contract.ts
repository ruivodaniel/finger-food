import { z } from "zod";
import { type WorkerMeta, slot } from "@libs/orchestrator-lib-schema";

export const meta: WorkerMeta = { capability: "document-format-conversion", vendor: "markdown-it", operation: "MarkdownIt({ html: false, breaks: true }).render(markdown)", runtimes: ["server", "client"] };

export const config = z.object({
  /** the target format (the capability's `to` axis); this version renders markdown to HTML */
  to: z.enum(["format-html"]).default("format-html"),
  /** a whole page (doctype, title, a readable style) or only the body's HTML */
  page: z.boolean().default(true),
  /** the page title; absent = the first line of the text */
  title: z.string().max(200).optional(),
});

// Markdown in, HTML out. Raw HTML inside the markdown is escaped, never passed
// through: the text comes from documents we did not write.
export const input = {
  document: slot({ formats: ["format-markdown"], limits: { "constraint-bytes": 20_971_520 } }),
};

export const output = {
  document: slot({ formats: ["format-html"] }),
};
