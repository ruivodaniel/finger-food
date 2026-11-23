// ── PROCESSOR · version ──────────────────────────────────────────
// A thing an item uses is at its latest version, or the item is said to be behind. It knows nothing of what the things are or of where they
// are stored: the run says, for each thing an item names, the version the item gets and the latest that exists; a rule gives the words.
import { z } from "zod";
import { defineProcessor, type Found } from "./processor.ts";

/** {name}: the thing, as the item names it · {thing}: where the thing is · {version}: the version the item gets · {latest}: the latest that exists ·
 *  {through}: what stands between, when the item does not name the version itself (a thing's default) */
export const VersionParams = z.strictObject({ message: z.string(), through: z.string().optional() });

export const versionProcessor = defineProcessor({
  name: "version",
  params: VersionParams,
  run(work) {
    const out: Found[] = [];
    for (const { item, rules } of work) {
      const rule = rules[0];
      if (!rule) continue;
      for (const n of item.facts?.named ?? []) {
        if (n.version >= n.latest) continue;
        const words = (t: string) => t.replace(/\{name\}/g, n.name).replace(/\{thing\}/g, n.thing).replace(/\{version\}/g, String(n.version)).replace(/\{latest\}/g, String(n.latest)).replace(/\{through\}/g, n.through ?? "");
        out.push({ rule: rule.id, item: item.id, at: n.at, subject: n.thing, message: words(rule.params!.message) + (n.through && rule.params!.through ? words(rule.params!.through) : "") });
      }
    }
    return out;
  },
});
