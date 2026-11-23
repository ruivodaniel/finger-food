// THE RUNNER OF `pnpm ui:check`: the UI through the check system (shared/libs/check). Run through `pnpm ui:check`, never by hand.
// It reads UI_CHECK_TARGET (the entry points, one on each line), UI_CHECK_CRAWL (latest, all; latest when absent), UI_CHECK_FOLLOW (1: on; off when absent),
// UI_CHECK_KINDS (code, data, theme; all when absent), UI_CHECK_RULES (the groups of rules: markup, composition, language, theme, versions; all when absent),
// UI_CHECK_ONLY=list (the list of items, nothing checked), and writes the result to UI_CHECK_OUT as JSON.
// Every run that checks is kept in the run history (shared/libs/check/runs).
import { writeFileSync } from "node:fs";
import { relative } from "node:path";
import { it } from "vitest";
import { check, list, type Crawl } from "../../../../../check";
import { record } from "../../../../../check/history";
import { KINDS, type KindName } from "../../../../../ui/rules/kinds";
import { GROUPS } from "../../../../../ui/rules/rule-set";
import { RUNS, repo, system } from "../../ui-system";

const pick = <T extends string>(value: string | undefined, all: readonly T[]): T[] => (value ? value.split(",") : [...all]).filter((x): x is T => (all as readonly string[]).includes(x));
const entryPoints = (process.env.UI_CHECK_TARGET ?? "").split("\n").filter(Boolean), out = process.env.UI_CHECK_OUT;
const kinds = pick<KindName>(process.env.UI_CHECK_KINDS, KINDS), groups = pick(process.env.UI_CHECK_RULES, GROUPS);
const crawl = (process.env.UI_CHECK_CRAWL ?? "latest") as Crawl, follow = process.env.UI_CHECK_FOLLOW === "1";

it("check", async () => {
  if (!entryPoints.length || !out) return;
  const call = { entryPoints, crawl, follow, kinds, rules: { groups } };
  const head = { entryPoints: entryPoints.map((t) => relative(repo, t) || "."), crawl, follow, kinds, groups };
  const items = (l: { id: string; kind: string; via?: string }[]) => l.map((i) => ({ file: i.id, kind: i.kind, ...(i.via ? { via: i.via } : {}) }));
  try {
    if (process.env.UI_CHECK_ONLY === "list") { const l = list(call, system); writeFileSync(out, JSON.stringify(l.missing.length ? { error: `no such file or folder: ${l.missing.join(", ")}` } : { ...head, rules: system.ruleSets[0].version, items: items(l.items), listOnly: true })); return; }
    const r = await check(call, system);
    if (!r.missing.length) record(RUNS, head, r);
    if (r.missing.length) { writeFileSync(out, JSON.stringify({ error: `no such file or folder: ${r.missing.join(", ")}` })); return; }
    const line = (f: (typeof r.findings)[number]) => ({ item: f.item, at: f.at, check: f.group, rule: f.rule, message: f.message });
    writeFileSync(out, JSON.stringify({ ...head, rules: r.rules["lib/ui"], items: items(r.items),
      findings: r.findings.filter((f) => f.severity === "error").map(line), warnings: r.findings.filter((f) => f.severity === "warn").map(line), notRuled: r.findings.filter((f) => f.severity === "info").map(line), excepted: r.excepted, notBuilt: [] }));
  } catch (e) { writeFileSync(out, JSON.stringify({ error: (e as Error).message })); }
});
