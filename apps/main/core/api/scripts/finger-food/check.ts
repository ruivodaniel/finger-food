/**
 * Checks what the loaders wrote, and prints it: the rows per table, the invoiced totals per year against the invoice files,
 * the menu items with no components, and what the food rules answer for every menu item.
 * Exits with 1 when a check fails.
 *
 *   pnpm tsx scripts/finger-food/check.ts
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, closeDb } from "../../src/db";
import { ffComponent, ffComponentComposition, ffFoodRuleSet, ffMenuLineTemplate, ffMenuLineTemplateComponent, ffOntologyTerm } from "@product/finger-food/models";
import { jsonl } from "./lib";

type RuleNode = { node: string; except?: string[] };
type FoodRule = { excludes?: RuleNode[]; includes?: RuleNode[]; limits?: unknown[] };
const TABLES = ["catering_company", "ontology_term", "ontology_mapping", "substance", "food_rule_set", "distribution_rule_set", "component", "component_composition", "component_value",
  "menu_line_template", "menu_line_template_component", "proposal_template", "proposal_template_moment", "proposal_template_moment_line", "client", "event", "proposal", "moment",
  "menu_line", "menu_line_component", "proposal_ad_hoc_line", "invoice", "credit_note", "payment", "article", "article_identifier", "article_vendor_price", "vendor", "stock",
  "stock_movement", "stock_allocation", "article_purchase", "operating_centre", "operation", "operation_member", "operation_member_invitation", "team_member", "event_member",
  "logistics_component", "expense", "guideline", "commission_agreement"];

async function main() {
  let failed = 0;
  const fail = (m: string) => { failed++; console.log("FAIL  " + m); };

  console.log("── rows per table ──");
  for (const t of TABLES) { const n = Number((await db.execute(sql.raw(`select count(*)::int as n from "${t}"`))).rows[0]?.n); console.log(t.padEnd(34), n); }

  console.log("\n── invoiced per year: the database against the invoice files (net, credit notes deducted) ──");
  type Inv = { doc_type: string; issue_date: string; net: string };
  const file = new Map<string, number>();
  for (const i of jsonl<Inv>("raw", "invoices.jsonl")) { const y = i.issue_date.slice(0, 4); file.set(y, (file.get(y) ?? 0) + Number(i.net) * (i.doc_type === "NC" ? -1 : 1)); }
  const inDb = new Map<string, number>();
  for (const r of (await db.execute(sql.raw(`select to_char(issued_at,'YYYY') y, sum(net)::float n from invoice group by 1 union all select to_char(issued_at,'YYYY'), -sum(net)::float from credit_note group by 1`))).rows as { y: string; n: number }[]) inDb.set(r.y, (inDb.get(r.y) ?? 0) + r.n);
  for (const y of [...file.keys()].sort()) { const a = file.get(y)!, b = inDb.get(y) ?? 0; console.log(y, "files", a.toFixed(2).padStart(11), "database", b.toFixed(2).padStart(11), Math.abs(a - b) < 0.01 ? "ok" : "DIFFERENT"); if (Math.abs(a - b) >= 0.01) fail(`invoiced ${y}`); }

  console.log("\n── menu items ──");
  const templates = await db.select().from(ffMenuLineTemplate);
  const tplComps = await db.select().from(ffMenuLineTemplateComponent);
  const noComps = templates.filter((t) => !tplComps.some((c) => c.menuLineTemplateId === t.id));
  console.log("menu items", templates.length, "· with no components", noComps.length, "· with no price", templates.filter((t) => t.price == null).length);
  if (noComps.length) fail("menu items with no components: " + noComps.map((t) => t.name).join(", "));

  console.log("\n── what the food rules answer, per menu item ──");
  const terms = await db.select({ id: ffOntologyTerm.id, parentId: ffOntologyTerm.parentId, name: ffOntologyTerm.name }).from(ffOntologyTerm);
  const parent = new Map(terms.map((t) => [t.id, t.parentId]));
  const rootName = (id: string): string => { let t = id; while (parent.get(t)) t = parent.get(t)!; return terms.find((x) => x.id === t)!.name; };
  const under = (term: string, node: string) => { let t: string | null | undefined = term; while (t) { if (t === node) return true; t = parent.get(t); } return false; };
  const hit = (term: string, nodes: RuleNode[]) => nodes.some((n) => under(term, n.node) && !(n.except ?? []).some((e) => under(term, e)));
  const comps = new Map((await db.select().from(ffComponent)).map((c) => [c.id, c]));
  const made = new Map<string, string[]>();
  for (const c of await db.select().from(ffComponentComposition)) made.set(c.componentId, [...(made.get(c.componentId) ?? []), c.ontologyTermId]);
  // a component of materials (a skewer, a cup) is not food: the food rules do not read it
  const isFood = (componentId: string) => (made.get(componentId) ?? []).every((t) => rootName(t) !== "Materials");
  const rules = ((await db.select().from(ffFoodRuleSet))[0]?.rules ?? {}) as Record<string, FoodRule>;
  const tally = new Map<string, Record<string, number>>();
  for (const [key, rule] of Object.entries(rules)) {
    const count: Record<string, number> = {};
    for (const t of templates) {
      const food = tplComps.filter((c) => c.menuLineTemplateId === t.id).map((c) => c.componentId).filter(isFood);
      const ingredients = food.flatMap((c) => made.get(c) ?? []);
      const whole = food.length > 0 && food.every((c) => comps.get(c)!.compositionComplete && (made.get(c) ?? []).length > 0);
      let answer: string;
      if (rule.excludes) answer = ingredients.some((i) => hit(i, rule.excludes!)) ? "no" : whole ? "yes" : "unknown";
      else if (rule.includes) answer = ingredients.some((i) => hit(i, rule.includes!)) ? "present" : whole ? "absent" : "unknown";
      else answer = "unknown (no values)";
      count[answer] = (count[answer] ?? 0) + 1;
    }
    tally.set(key, count);
  }
  for (const [key, count] of tally) console.log(key.padEnd(38), Object.entries(count).map(([a, n]) => `${a} ${n}`).join(" · "));
  const complete = [...comps.values()].filter((c) => c.compositionComplete).length;
  console.log(`\ncomponents ${comps.size} · composition complete ${complete} · partial ${comps.size - complete} · with no composition ${[...comps.keys()].filter((c) => !made.has(c)).length}`);

  console.log(failed ? `\n${failed} check(s) failed` : "\nall checks passed");
  if (failed) process.exitCode = 1;
}

main().then(() => closeDb()).catch((e) => { console.error(e); closeDb(); process.exit(1); });
