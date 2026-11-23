// Image → text through Qwen2.5-VL on an OpenAI-compatible endpoint (Ollama
// locally). One call per image, a few in flight; one text artifact per image,
// in input order: plain text, or markdown with the page's structure.
import OpenAI from "openai";
import pLimit from "p-limit";
import { extensionOf, FORMATS, type Ref } from "@libs/orchestrator-lib-schema";
import type { WorkerRun } from "@libs/orchestrator-lib-schema";
import type * as contract from "./contract";

/** The prompt for each output format, when the config names none. */
export const PROMPTS = {
  "format-plaintext":
    "Transcribe all text in this image exactly as it appears, preserving the reading order and line breaks. " +
    "Output only the transcribed text. Do not add any introduction, explanation, summary, heading or commentary, " +
    "and do not use markdown formatting such as ** or bullet characters that are not in the image. " +
    "If the image contains no text, output nothing.",
  "format-markdown":
    "Transcribe this page as GitHub-flavoured markdown, keeping every word exactly as it appears, in reading order. " +
    "Use # headings for titles and section headings, - for bullet lists, 1. for numbered lists, and markdown tables " +
    "(| a | b |) for anything laid out in rows and columns, including two-column label and value layouts. " +
    "Output only the markdown: no introduction, explanation or commentary, and no code fence. " +
    "If the page has no text, output nothing.",
} as const;

// Small models still occasionally wrap the answer in a ``` block.
export function stripFence(text: string): string {
  const fenced = text.trim().match(/^```[a-z]*\n([\s\S]*?)\n?```$/i);
  return (fenced ? fenced[1] : text).trim();
}

export const run: WorkerRun<typeof contract> = async (input, cfg, ctx) => {
  const client = new OpenAI({ apiKey: ctx.deps.apiKey, baseURL: ctx.deps.baseUrl, timeout: cfg.timeoutMs, maxRetries: 0 });
  const limit = pLimit(cfg.concurrency);
  const instructions = cfg.instructions ?? PROMPTS[cfg.output];

  const one = async (image: Ref<"type-image">, index: number): Promise<Ref<"type-text">> => {
    const bytes = await ctx.artifacts.getBytes(image);
    const mime = FORMATS[image.format].mime.split(";")[0];
    const dataUrl = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
    const started = performance.now();
    const response = await client.chat.completions.create({
      model: cfg.model,
      max_tokens: cfg.maxTokens,
      temperature: cfg.temperature,
      messages: [{ role: "user", content: [{ type: "text", text: instructions }, { type: "image_url", image_url: { url: dataUrl } }] }],
    });
    const usage = response.usage;
    ctx.report({
      measured: usage ? "reported" : "observed",
      calls: 1,
      model: cfg.model,
      tokens: usage ? { input: usage.prompt_tokens, output: usage.completion_tokens } : undefined,
      compute: { wallMs: Math.round(performance.now() - started) },
    });
    const text = stripFence(response.choices[0]?.message?.content ?? "");
    const page = typeof image.meta?.page === "number" ? image.meta.page : index + 1;
    return ctx.artifacts.putBytes(new TextEncoder().encode(text), {
      type: "type-text",
      format: cfg.output,
      key: ctx.artifacts.key("runs", ctx.runId, ctx.stepKey, `${page}${extensionOf(cfg.output)}`),
      meta: { model: cfg.model, chars: text.length, page, source: image.ref },
    });
  };

  const text = await Promise.all(input.image.map((img, i) => limit(() => one(img, i))));
  return { text };
};
