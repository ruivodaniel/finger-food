// ── RULE SETS · owned by location ────────────────────────────────
// A rule set is written beside what it rules, in a file with a fixed name, and found by where it is: nobody lists the rule sets.
// The file exports `version` and `rules`; the owner is read from its place.
import { matches, type Rule, type RuleSet } from "./schema.ts";
import type { Source } from "./source.ts";

/** the places a rule set may be, each a path with `*` for one folder: "shared/libs/*​/rules/rule-set.ts" */
export async function discoverRuleSets(source: Source, places: readonly string[], ownerOf: (id: string) => string): Promise<RuleSet[]> {
  const found = new Set<string>();
  for (const place of places) {
    let at = [""];
    for (const part of place.split("/")) {
      const next: string[] = [];
      for (const a of at) {
        if (!part.includes("*")) { const id = a ? `${a}/${part}` : part; if (source.locate(id) !== undefined) next.push(id); continue; }
        if (source.holds(a || ".")) for (const c of source.children(a || ".")) if (matches(c, a ? `${a}/${part}` : part)) next.push(c);
      }
      at = next;
    }
    at.filter((id) => !source.holds(id)).forEach((id) => found.add(id));
  }
  const sets: RuleSet[] = [];
  for (const id of [...found].sort()) {
    const mod = (await source.load(id)) as { version?: number; rules?: Rule[] };
    if (typeof mod.version !== "number" || !Array.isArray(mod.rules)) throw new Error(`${id} is not a rule set: it exports \`version\` (a number) and \`rules\` (a list)`);
    sets.push({ owner: ownerOf(id), version: mod.version, rules: mod.rules });
  }
  return sets;
}

/** the owner of a rule set, by where it is: a library, a slice, or the whole repository */
export const ownerByPlace = (id: string): string => {
  const lib = /^shared\/libs\/([^/]+)\//.exec(id); if (lib) return `lib/${lib[1]}`;
  const slice = /^apps\/[^/]+\/slices\/([^/]+)\/([^/]+)\//.exec(id); if (slice) return `${slice[1]}/${slice[2]}`;
  return "global";
};
