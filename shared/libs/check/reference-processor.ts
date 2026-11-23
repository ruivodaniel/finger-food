// ── PROCESSOR · reference ────────────────────────────────────────
// A name an item uses must be a name it may use there: one in scope, or one the item declares for that space of names.
// It knows nothing of what the names are: the parser says each name used, its space and what is in scope; a rule says the space and the words.
import { z } from "zod";
import { defineProcessor, type Found } from "./processor.ts";

/** {name}: the name as the item writes it */
export const ReferenceParams = z.strictObject({ space: z.string(), message: z.string() });

export const referenceProcessor = defineProcessor({
  name: "reference",
  params: ReferenceParams,
  run(work) {
    const out: Found[] = [];
    for (const { item, rules } of work) for (const r of item.facts?.references ?? []) {
      const rule = rules.find((x) => x.params!.space === r.space);
      if (!rule || (r.scope ?? item.facts?.declared?.[r.space] ?? []).includes(r.name)) continue;
      out.push({ rule: rule.id, item: item.id, at: r.at, message: rule.params!.message.replace(/\{name\}/g, r.shown ?? r.name) });
    }
    return out;
  },
});
