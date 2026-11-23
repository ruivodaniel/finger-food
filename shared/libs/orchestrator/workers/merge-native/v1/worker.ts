// merge × native: text parts joined in input order, in process, no tool. The
// pipeline orders the parts; this only reads, joins and writes.
import { extensionOf } from "@libs/orchestrator-lib-schema";
import type { WorkerRun } from "@libs/orchestrator-lib-schema";
import type * as contract from "./contract";

export const run: WorkerRun<typeof contract> = async (input, cfg, ctx) => {
  const started = performance.now();
  const decoder = new TextDecoder();
  const texts = await Promise.all(input.parts.map(async (part) => decoder.decode(await ctx.artifacts.getBytes(part)).trim()));
  const kept = texts.filter(Boolean);
  const text = kept.length ? kept.join(cfg.separator) + "\n" : "";

  ctx.report({ measured: "observed", calls: 1, compute: { wallMs: Math.round(performance.now() - started) } });
  return {
    whole: await ctx.artifacts.putBytes(new TextEncoder().encode(text), {
      type: "type-text",
      format: cfg.output,
      key: ctx.artifacts.key("runs", ctx.runId, ctx.stepKey, `text${extensionOf(cfg.output)}`),
      meta: { parts: input.parts.length, emptyParts: input.parts.length - kept.length, chars: text.length },
    }),
  };
};
