// ── PROCESSOR ────────────────────────────────────────────────────
// An engine: items and rules in, findings out. Pure: it reads no file and no database. It declares the part of a rule it understands (`params`),
// which is its half of the rule schema, and the kinds of item it reads.
import type { z } from "zod";
import type { Item, Rule } from "./schema.ts";
import type { Named } from "./source.ts";

/** what a processor returns for one rule and one place; the run adds the rule's own fields (processor, owner, severity, group) */
export type Found = { rule: string; item: string; at?: string; message: string; marker?: string; /** what was found, by its name */ subject?: string; /** over the rule's own severity (a thing no rule covers yet is "info") */ severity?: "error" | "warn" | "info" };

export type Processor<P = unknown> = {
  name: string;
  /** the parameters a rule of this processor carries: the processor's half of the contract */
  params: z.ZodType<P>;
  /** the kinds of item it reads; absent: any */
  kinds?: readonly string[];
  /** every item it reads, with the rules that apply to each already chosen by the run (enabled, in scope, of this processor) */
  run(items: { item: Item; rules: Rule<P>[] }[], context: { resolve: Resolve }): Found[] | Promise<Found[]>;
};
/** RESOLVER: what an item names → its contract, at the version it names (absent: the latest) */
export type Resolve = (named: Named) => unknown;

export const defineProcessor = <P>(p: Processor<P>): Processor<P> => p;
