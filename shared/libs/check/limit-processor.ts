// ── PROCESSOR · limit ────────────────────────────────────────────
// A size of an item must not pass a number. The parser gives the sizes (measures); a rule names one and gives the number.
import { z } from "zod";
import { defineProcessor, type Found } from "./processor.ts";

/** {value} what it is, {max} what it may be */
export const LimitParams = z.strictObject({ measure: z.string(), max: z.number(), message: z.string() });

export const limitProcessor = defineProcessor({
  name: "limit",
  params: LimitParams,
  run(work) {
    const out: Found[] = [];
    for (const { item, rules } of work) for (const m of item.facts?.measures ?? []) for (const rule of rules) {
      const p = rule.params!;
      if (p.measure === m.name && m.value > p.max) out.push({ rule: rule.id, item: item.id, at: m.at, message: p.message.replace(/\{value\}/g, String(m.value)).replace(/\{max\}/g, String(p.max)) });
    }
    return out;
  },
});
