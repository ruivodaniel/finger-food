// THE GATE OF THE UI RULES: every UI document and every theme of the library through the check system (shared/libs/check), against the backlog.
// THE SCAN: by default the latest version of each thing. `UI_RULES_SCAN=all`: every version.
// THE BACKLOG (shared/libs/ui/rules/backlog.json): what was found when the check was built, a count for each item. It only ever gets shorter.
// An item that is not in the backlog passes with nothing found. An item in the backlog never has more than its count.
// `UI_RULES_REPORT=all`: the count of every item with something found. `UI_RULES_REPORT=<part of a path>`: what was found in those items.
import { describe, expect, it } from "vitest";
import { check, gate, stale } from "../../../../../check";
import backlog from "../../../../../ui/rules/backlog.json";
import { system } from "../../ui-system";

const scan = process.env.UI_RULES_SCAN ?? "latest";
const report = await check({ entryPoints: ["shared/libs/ui/web/primitives", "shared/libs/ui/web/patterns", "shared/libs/ui/themes"], kinds: ["data", "theme"], crawl: scan === "all" ? "all" : "latest" }, system);
const known = (backlog as { rules: number; items: Record<string, number> }).items;
const items = report.items.map((i) => i.id), found = report.findings.filter((f) => f.severity !== "info");
const over = new Map(gate(items, report.findings, known).map((r) => [r.item, r]));
const countOf = (item: string) => found.filter((f) => f.item === item).length;

const show = process.env.UI_RULES_REPORT;
if (show) for (const item of items) {
  const f = found.filter((x) => x.item === item); if (!f.length) continue;
  if (show === "all") console.log(`${f.length}\t${item}`);
  else if (item.includes(show)) { console.log(`\n${item}: ${f.length} found`); for (const x of f) console.log(`  [${x.rule}] ${x.at ?? ""}: ${x.message}`); }
}

describe(`the UI rules (version ${report.rules["lib/ui"]}), scan: ${scan}`, () => {
  it("there are items", () => expect(items.length).toBeGreaterThan(0));
  it("the backlog was made with these rules", () => expect((backlog as { rules: number }).rules).toBe(report.rules["lib/ui"]));
  for (const item of items) {
    if (item in known) it(`${item}: no more than the backlog says (${known[item]})`, () => expect(countOf(item)).toBeLessThanOrEqual(known[item]));
    else it(`${item} passes`, () => expect(over.get(item)?.found ?? 0).toBe(0));
  }
  // only where the default scan runs: every item the backlog names is scanned and still has something found
  if (scan === "latest") it("the backlog names only items of the scan that still have something found", () => expect(stale(items, report.findings, known)).toEqual([]));
});
