// ── THE CHECK SYSTEM · the shapes ────────────────────────────────
// One system checks code and data. Its parts, in the order a run takes them:
//   SOURCE      entry point → item. The only part that knows the storage (files, database rows)
//   EXPANDER    item → more items: what is under it (contain), what it uses (follow). It asks the source for each
//   PARSER      item → what a processor reads (code → a tree, a theme file → its value; a row is already a value)
//   RESOLVER    what the item names → its contract, at the version asked
//   PROCESSOR   items and rules in, findings out. Pure: it reads no file and no database
//   EXCEPTIONS  a finding a rule's exception allows is dropped, and reported with its reason
//   REPORT      one finding shape, the rules version, the gate, the run history
// and its data: a RULE (one shape), a RULE SET (the rules of one owner, one version), the RULE SCHEMA (the contract
// between a processor and its rules) and a DATA SCHEMA (the shape of what is stored as a row, a parameter of a rule).
// This file imports only zod and uses explicit .ts imports nowhere else than inside this folder: it runs on Node as it is, and in a bundler.
import { z } from "zod";
import type { Facts } from "./facts.ts";

export const Severity = z.enum(["error", "warn", "info"]);
export type Severity = z.infer<typeof Severity>;

/** a path pattern, or several: `*` is one segment, `**` is any depth. Matched against an item's id */
export const PathPattern = z.union([z.string(), z.array(z.string())]);
export type PathPattern = z.infer<typeof PathPattern>;

/** what a thing is, as the source says it: its kind, and the names it goes by (a primitive, a pattern, a slice…). Never where it is stored */
export type Is = Record<string, string>;
/** which things: every key given must hold. `true`: the thing has that name, whatever it is. A string: it is exactly that one. Several: any of them */
const One = z.record(z.string(), z.union([z.string(), z.literal(true)]));
export const On = z.union([One, z.array(One)]);
export type On = z.infer<typeof On>;

/** an exception, on the rule it is an exception to: the things it holds for, what it allows there, and the reason. A thing is named, never located.
 *  `allows`: what may be found, by its name (an element, a package…); absent: anything the rule finds.
 *  `id`: when the item names the exception where it is used (a comment in code), it holds only there. `name`, `note`: for the people who read the report */
export const Exception = z.strictObject({
  id: z.string().optional(),
  name: z.string().optional(),
  on: On,
  allows: z.array(z.string()).optional(),
  note: z.string().optional(),
  reason: z.string(),
});
export type Exception = z.infer<typeof Exception>;

/** what every rule has, whatever its processor. The part a processor declares is `params` */
export const ruleCommon = {
  id: z.string(),
  /** the engine that runs it */
  processor: z.string(),
  severity: Severity,
  description: z.string(),
  message: z.string().optional(),
  /** false: the rule is skipped */
  enabled: z.boolean().optional(),
  /** the group a caller can ask for by name */
  group: z.string().optional(),
  /** the things it applies to, by what they are; absent: every item its processor reads */
  on: On.optional(),
  /** the things it never applies to, by what they are */
  notOn: On.optional(),
  /** the kinds of item it applies to; absent: every kind its processor reads */
  kinds: z.array(z.string()).optional(),
  exceptions: z.array(Exception).optional(),
};
export const RuleCommon = z.object({ ...ruleCommon, params: z.unknown().optional() });
export type Rule<P = unknown> = Omit<z.infer<typeof RuleCommon>, "params"> & { params?: P };

/** the rules of one owner, beside what they rule */
export type RuleSet = { owner: string; version: number; rules: Rule[] };

/** one thing to check, whatever its storage. `id`: where it is (a path from the root, a row id). `value`: what the parser made of it */
export type Item<V = unknown> = { id: string; kind: string; /** what it is, as the source says it, with its kind */ is?: Is; /** the item that led to it, when follow reached it */ via?: string; raw?: string; value: V; /** what the processors read (facts.ts) */ facts?: Facts };

export type Finding = {
  rule: string;
  processor: string;
  owner: string;
  group?: string;
  severity: Severity;
  item: string;
  /** where in the item: a line, or a path in its tree */
  at?: string;
  message: string;
  /** the exception the item names at this place (a comment in code): it lifts the finding only if the rule lists it */
  marker?: string;
  /** what was found, by its name (an element, a package): what an exception allows by name */
  subject?: string;
};
/** an exception that was used: reported, never silent */
export type Excepted = { rule: string; item: string; at?: string; exception: string; reason: string };

export type Report = {
  /** the version of every rule set that ran, by owner */
  rules: Record<string, number>;
  items: { id: string; kind: string; via?: string }[];
  findings: Finding[];
  excepted: Excepted[];
};

const asList = (p: PathPattern | undefined): string[] => (p === undefined ? [] : Array.isArray(p) ? p : [p]);
const compiled = new Map<string, RegExp>();
const regexOf = (pattern: string) => {
  if (!compiled.has(pattern)) compiled.set(pattern, new RegExp("^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*\/?/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*") + "$"));
  return compiled.get(pattern)!;
};
/** is the thing one of these? */
export const isOn = (is: Is | undefined, on: On | undefined): boolean => (Array.isArray(on) ? on : on ? [on] : []).some((one) => Object.entries(one).every(([k, v]) => is?.[k] !== undefined && (v === true || is[k] === v)));

/** does the id stand under the pattern(s)? Used to find rule sets by their place, never by a rule */
export const matches = (id: string, pattern: PathPattern | undefined): boolean => asList(pattern).some((p) => regexOf(p).test(id));
