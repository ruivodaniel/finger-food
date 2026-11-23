// ── RULE SCHEMA ──────────────────────────────────────────────────
// How a rule is written: the contract between a processor and its rules. A common part, and a part each processor declares.
// A rule set is checked against it when it is loaded: a rule no processor can read never runs.
import { z } from "zod";
import { ruleCommon, type Rule, type RuleSet } from "./schema.ts";
import type { Processor } from "./processor.ts";

export type RuleProblem = { owner: string; rule: string; message: string };

/** the schema of a rule, for the processors of this system */
export const ruleSchemaOf = (processors: readonly Processor[]) => {
  const byName = new Map(processors.map((p) => [p.name, p]));
  return {
    check(owner: string, rule: unknown): RuleProblem[] {
      const id = typeof (rule as { id?: unknown })?.id === "string" ? (rule as { id: string }).id : "(no id)";
      const name = (rule as { processor?: unknown })?.processor;
      const processor = typeof name === "string" ? byName.get(name) : undefined;
      if (!processor) return [{ owner, rule: id, message: `no processor "${String(name)}": one of ${[...byName.keys()].join(", ")}` }];
      const r = z.strictObject({ ...ruleCommon, params: processor.params }).safeParse(rule);
      return r.success ? [] : r.error.issues.map((i) => ({ owner, rule: id, message: `${i.path.join(".") || "rule"}: ${i.message}` }));
    },
  };
};

/** LOAD: every rule of every set against the rule schema, and no id twice in a set */
export function loadRuleSets(sets: readonly RuleSet[], processors: readonly Processor[]): { sets: RuleSet[]; problems: RuleProblem[] } {
  const schema = ruleSchemaOf(processors), problems: RuleProblem[] = [];
  for (const set of sets) {
    const seen = new Set<string>();
    for (const rule of set.rules as Rule[]) {
      problems.push(...schema.check(set.owner, rule));
      if (seen.has(rule.id)) problems.push({ owner: set.owner, rule: rule.id, message: "this id is written twice in the rule set" });
      seen.add(rule.id);
    }
  }
  return { sets: [...sets], problems };
}
