// ── THE RUN ──────────────────────────────────────────────────────
// check(entry points, crawl, follow, kinds, rule sets) → report. The parts in their order: source, expander, parser, resolver, processor, exceptions, report.
import { isOn, type Excepted, type Finding, type Item, type Report, type Rule, type RuleSet } from "./schema.ts";
import type { Processor, Resolve } from "./processor.ts";
import type { Source } from "./source.ts";
import { expand, type Crawl, type Kind, type Listed } from "./expander.ts";
import { loadRuleSets, type RuleProblem } from "./rule-schema.ts";

export type System = {
  source: Source;
  kinds: readonly Kind[];
  /** RESOLVER: made for a run. It asks the source for a thing by its name; the items of the run are given so a name finds what is being checked.
   *  A name resolves to the version the item names, else the latest */
  resolver?: (context: { source: Source; items: readonly Item[] }) => Resolve;
  processors: readonly Processor[];
  ruleSets: readonly RuleSet[];
};
export type Call = {
  entryPoints: readonly string[];
  /** what a container gives: the latest version of each thing inside (the default), or every version */
  crawl?: Crawl;
  /** from each item, everything it uses; off when absent */
  follow?: boolean;
  /** which things are items; absent: every kind of the system */
  kinds?: readonly string[];
  /** which rules run: by the owner of a rule set, by group, by id; absent: all */
  rules?: { owners?: readonly string[]; groups?: readonly string[]; ids?: readonly string[] };
};

/** the first phase alone: the list of items, nothing parsed and nothing checked */
export const list = (call: Call, system: System): { items: Listed[]; missing: string[] } =>
  expand(call.entryPoints, { crawl: call.crawl ?? "latest", follow: call.follow ?? false, kinds: call.kinds ?? system.kinds.filter((k) => k.item !== false).map((k) => k.name) }, system);

export class RuleSetError extends Error {
  problems: RuleProblem[];
  constructor(problems: RuleProblem[]) { super(`the rule sets do not follow the rule schema:\n${problems.map((p) => `  ${p.owner} · ${p.rule}: ${p.message}`).join("\n")}`); this.problems = problems; }
}

type Chosen = { owners?: readonly string[]; groups?: readonly string[]; ids?: readonly string[] };

/** RESOLVER, PROCESSOR, EXCEPTIONS: the items, already read, against the rules chosen */
async function judge(items: Item[], system: System, rules: Chosen | undefined): Promise<Pick<Report, "rules" | "findings" | "excepted">> {
  // the rules first: a rule set that does not follow the rule schema stops the run
  const loaded = loadRuleSets(system.ruleSets, system.processors);
  if (loaded.problems.length) throw new RuleSetError(loaded.problems);
  const chosen = loaded.sets.filter((s) => !rules?.owners || rules.owners.includes(s.owner));
  const runs = (r: Rule) => r.enabled !== false && (!rules?.groups || (r.group !== undefined && rules.groups.includes(r.group))) && (!rules?.ids || rules.ids.includes(r.id));
  const kindOf = new Map(system.kinds.map((k) => [k.name, k]));
  // what each item is: its kind, and the names the source gives it
  for (const item of items) item.is ??= { ...system.source.what(item.id), kind: item.kind };
  const isOf = new Map(items.map((i) => [i.id, i.is]));
  // RESOLVER
  const resolve: Resolve = system.resolver ? system.resolver({ source: system.source, items }) : () => undefined;
  // what the processors read: each item's facts, with what it names resolved
  for (const item of items) item.facts = kindOf.get(item.kind)!.facts?.(item.value, item.id, resolve);
  // …and, for each versioned thing it names, the version it gets and the latest that exists. A name that leads to a thing's own default (a module
  // beside its versions, followed through and never checked) is followed to the version that default points at. A module that gathers many
  // things (a library's index) is not a use of each of them. A file of the thing itself is not a use of it
  const source = system.source, kindAt = (id: string) => system.kinds.find((k) => k.is(id));
  const behind = (id: string): string[] => {
    if (source.version(id)) return [id];
    const kind = kindAt(id), holder = id.slice(0, id.lastIndexOf("/"));
    if (kind?.item !== false || !kind.names) return [];
    return kind.names(source.read(id), id).flatMap((n) => source.find(n, id)).filter((next) => source.version(next)?.thing === holder);
  };
  for (const item of items) {
    const kind = kindOf.get(item.kind)!;
    if (!kind.names || item.raw === undefined) continue;
    const own = source.version(item.id)?.thing, named: NonNullable<NonNullable<Item["facts"]>["named"]> = [], said = new Set<string>();
    for (const n of kind.names(item.raw, item.id)) for (const first of source.find(n, item.id)) for (const id of behind(first)) {
      const v = source.version(id)!;
      if (v.thing === own || said.has(`${v.thing}@${v.version}`)) continue;
      said.add(`${v.thing}@${v.version}`);
      named.push({ as: n.as, name: n.name, thing: v.thing, version: v.version, latest: v.latest, ...(id !== first ? { through: first } : {}) });
    }
    if (named.length) item.facts = { ...(item.facts ?? {}), named };
  }

  // PROCESSOR
  const findings: Finding[] = [], excepted: Excepted[] = [];
  const ownerOf = new Map<string, { owner: string; rule: Rule }>();
  for (const set of chosen) for (const rule of set.rules) ownerOf.set(`${rule.processor}\u0000${rule.id}`, { owner: set.owner, rule });
  for (const processor of system.processors) {
    const mine = chosen.flatMap((s) => s.rules).filter((r) => r.processor === processor.name && runs(r));
    if (!mine.length) continue;
    const work = items
      .filter((i) => !processor.kinds || processor.kinds.includes(i.kind))
      .map((item) => ({ item, rules: mine.filter((r) => (!r.kinds || r.kinds.includes(item.kind)) && (r.on === undefined || isOn(item.is, r.on)) && !isOn(item.is, r.notOn)) }))
      .filter((w) => w.rules.length);
    for (const f of await processor.run(work, { resolve })) {
      const known = ownerOf.get(`${processor.name}\u0000${f.rule}`);
      if (!known) throw new Error(`processor "${processor.name}" returned a finding for "${f.rule}", which is no rule of its`);
      // EXCEPTIONS: on the rule, for the things it names. One that carries an id holds only where the item names that id; one that lists what it allows, only for those
      const e = (known.rule.exceptions ?? []).find((x) => isOn(isOf.get(f.item), x.on) && (x.id === undefined || x.id === f.marker) && (x.allows === undefined || (f.subject !== undefined && x.allows.includes(f.subject))));
      if (e) excepted.push({ rule: f.rule, item: f.item, at: f.at, exception: [e.id, e.name].filter(Boolean).join(" ") || (f.subject ? `${f.subject} allowed` : "exception"), reason: e.reason });
      else findings.push({ rule: f.rule, processor: processor.name, owner: known.owner, group: known.rule.group, severity: f.severity ?? known.rule.severity, item: f.item, at: f.at, message: f.message });
    }
  }
  return { rules: Object.fromEntries(chosen.map((s) => [s.owner, s.version])), findings, excepted };
}

/** the whole run: from the entry points to the report */
export async function check(call: Call, system: System): Promise<Report & { missing: string[] }> {
  // SOURCE, EXPANDER
  const { items: listed, missing } = list(call, system);
  // PARSER
  const kindOf = new Map(system.kinds.map((k) => [k.name, k]));
  const items: Item[] = await Promise.all(listed.map(async (l) => { const raw = system.source.read(l.id), kind = kindOf.get(l.kind)!; return { ...l, raw, value: kind.parse ? await kind.parse(raw, l.id, system.source) : raw }; }));
  // RESOLVER, PROCESSOR, EXCEPTIONS, REPORT
  return { ...(await judge(items, system, call.rules)), items: listed, missing };
}

/** values in hand, with no entry point to reach them from (what is about to be written, a value made in a test): each is an item of the kind given, judged like any other */
export async function checkValues(values: readonly { id: string; kind: string; value: unknown }[], system: System, rules?: Chosen): Promise<Report> {
  const items: Item[] = values.map((v) => ({ ...v }));
  return { ...(await judge(items, system, rules)), items: values.map(({ id, kind }) => ({ id, kind })) };
}
