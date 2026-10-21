/**
 * Loads the Finger Food catalog reviewed in the slice-design exploration `data-cleansing` (v40) into the database:
 * the ontology, the components, the menu line templates with their components, the ontology mappings and the distribution rule sets.
 * The exploration stays the source: this reads its data files and applies the review edits saved in its state.json.
 * Ids are uuid5 of the names, so a re-run writes the same rows (upsert by id). Nothing else is touched: no vendors, no stock, no templates, no history.
 *
 *   pnpm tsx scripts/seed-finger-food-catalog.ts [--dir <path to the v40 folder>] [--org <organization id of the catering company>]
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import { sql } from "drizzle-orm";
import { db, closeDb } from "../src/db";
import { ffCateringCompany, ffComponent, ffDistributionRuleSet, ffMenuLineTemplate, ffMenuLineTemplateComponent, ffOntologyMapping, ffOntologyTerm } from "@modules/finger-food/models";
import { uomOrganization } from "@modules/user-organization-mgmt/models";

const arg = (k: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const DIR = arg("--dir") ?? join(process.env.HOME ?? "", "DEV/OmniChord-26/slice-design/projects/FINGER-FOOD/slices/finger-food/explorations/data-cleansing/v40");
const read = <T>(f: string): T => JSON.parse(readFileSync(join(DIR, f), "utf8")) as T;

// uuid5-like, stable on the name: a re-run gives the same ids
const NS = "finger-food:";
const id = (...k: string[]) => { const h = createHash("sha1").update(NS + k.join("|")).digest("hex"); return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${h.slice(18, 20)}-${h.slice(20, 32)}`; };

type Node = { id: string; label: string; parent: string | null };
type Comp = { name: string; unit: string; reusable: boolean };
type MenuItem = { name: string; unit: string; price: number; vat_rate: number; components: { name: string; quantity: number; for_every: number }[] };
type Mapping = { ontology_term_id: string; entity_type: string; entity_id: string };
type Rule = { selector: string[]; unit?: string; quantity?: number; for_every?: number; percent?: number; splits: Rule[] };
type State = { components?: Record<string, { deleted?: boolean; name?: string; unit?: string; reusable?: boolean; terms?: string[] }>; menu?: Record<string, { deleted?: boolean; name?: string; components?: MenuItem["components"]; terms?: string[]; price?: number; vat_rate?: number }> };

async function main() {
  const nodes = read<{ nodes: Node[] }>("data/ontology.json").nodes;
  const comps = read<{ components: Comp[] }>("data/components.json").components;
  const menu = read<{ menuItems: MenuItem[] }>("data/menu-items.json").menuItems;
  const mappings = read<{ mappings: Mapping[] }>("data/ontology-mapping.json").mappings;
  const rules = read<{ sets: { event_type: string; rules: Rule[] }[] }>("data/distribution-rules.json").sets;
  const state = read<State>("state.json");

  // the catering company: the organization given, or the first organization of type company
  let orgId = arg("--org") ?? (await db.select({ id: uomOrganization.id }).from(uomOrganization).where(sql`${uomOrganization.type} = 'company'`).limit(1))[0]?.id;
  if (!orgId) {
    // no organization of type company yet: Finger Food is created, with a stable id
    orgId = id("organization", "finger-food");
    await db.insert(uomOrganization).values({ id: orgId, type: "company", name: "Finger Food", createdAt: new Date(), updatedAt: new Date() }).onConflictDoNothing();
  }
  const companyId = id("catering_company", orgId);
  await db.insert(ffCateringCompany).values({ id: companyId, organizationId: orgId }).onConflictDoNothing();

  // the ontology, parents first
  const termId = (key: string) => id("term", key);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const depth = (n: Node): number => (n.parent ? 1 + depth(byId.get(n.parent)!) : 0);
  for (const n of [...nodes].sort((a, b) => depth(a) - depth(b))) {
    await db.insert(ffOntologyTerm).values({ id: termId(n.id), cateringCompanyId: companyId, name: n.label, parentId: n.parent ? termId(n.parent) : null })
      .onConflictDoUpdate({ target: ffOntologyTerm.id, set: { name: n.label, parentId: n.parent ? termId(n.parent) : null } });
  }

  // the components, with the review edits
  const compId = (name: string) => id("component", name);
  const liveComps = comps.filter((c) => !state.components?.[c.name]?.deleted).map((c) => ({ key: c.name, ...c, ...(state.components?.[c.name] ?? {}) }));
  for (const c of liveComps) {
    await db.insert(ffComponent).values({ id: compId(c.key), name: c.name ?? c.key, unit: c.unit as never, reusable: c.reusable })
      .onConflictDoUpdate({ target: ffComponent.id, set: { name: c.name ?? c.key, unit: c.unit as never, reusable: c.reusable } });
  }

  // the menu line templates and their components, with the review edits
  const tplId = (name: string) => id("menu_line_template", name);
  const liveMenu = menu.filter((m) => !state.menu?.[m.name]?.deleted).map((m) => ({ key: m.name, ...m, ...(state.menu?.[m.name] ?? {}) }));
  for (const m of liveMenu) {
    await db.insert(ffMenuLineTemplate).values({ id: tplId(m.key), name: m.name ?? m.key, price: String(m.price), vatRate: String(m.vat_rate) })
      .onConflictDoUpdate({ target: ffMenuLineTemplate.id, set: { name: m.name ?? m.key, price: String(m.price), vatRate: String(m.vat_rate) } });
    await db.delete(ffMenuLineTemplateComponent).where(sql`${ffMenuLineTemplateComponent.menuLineTemplateId} = ${tplId(m.key)}`);
    for (const c of m.components) {
      if (!liveComps.some((x) => x.key === c.name)) throw new Error(`${m.key}: component ${c.name} is not in the catalog`);
      await db.insert(ffMenuLineTemplateComponent).values({ id: id("mltc", m.key, c.name), menuLineTemplateId: tplId(m.key), componentId: compId(c.name), quantity: String(c.quantity), forEvery: String(c.for_every) });
    }
  }

  // the mappings: the file, overridden per entity by the review's terms
  const rows: { ontologyTermId: string; entityType: string; entityId: string }[] = [];
  const termsOf = (type: string, key: string) => {
    const edited = type === "component" ? state.components?.[key]?.terms : state.menu?.[key]?.terms;
    return edited ?? mappings.filter((x) => x.entity_type === type && x.entity_id === key).map((x) => x.ontology_term_id);
  };
  for (const c of liveComps) for (const t of new Set(termsOf("component", c.key))) rows.push({ ontologyTermId: termId(t), entityType: "component", entityId: compId(c.key) });
  for (const m of liveMenu) for (const t of new Set(termsOf("menu_line_template", m.key))) rows.push({ ontologyTermId: termId(t), entityType: "menu_line_template", entityId: tplId(m.key) });
  for (const t of new Set(rows.map((r) => r.ontologyTermId))) if (!byId.has([...byId.keys()].find((k) => termId(k) === t) ?? "")) throw new Error(`mapping to an unknown term ${t}`);
  await db.delete(ffOntologyMapping).where(sql`${ffOntologyMapping.entityType} in ('component', 'menu_line_template')`);
  for (const r of rows) await db.insert(ffOntologyMapping).values({ id: id("map", r.ontologyTermId, r.entityType, r.entityId), ...r }).onConflictDoNothing();

  // the distribution rule sets: the selectors swap term keys for term ids
  const swap = (r: Rule): Rule => ({ ...r, selector: r.selector.map((t) => { if (!byId.has(t)) throw new Error(`rule selector ${t} is not a term`); return termId(t); }), splits: r.splits.map(swap) });
  for (const s of rules) {
    await db.insert(ffDistributionRuleSet).values({ id: id("rule_set", s.event_type), cateringCompanyId: companyId, eventTypeTermId: termId(s.event_type), rules: s.rules.map(swap) })
      .onConflictDoUpdate({ target: ffDistributionRuleSet.id, set: { rules: s.rules.map(swap) } });
  }

  const count = async (t: string) => (await db.execute(sql.raw(`select count(*)::int as n from "${t}"`))).rows[0]?.n;
  for (const t of ["catering_company", "ontology_term", "component", "menu_line_template", "menu_line_template_component", "ontology_mapping", "distribution_rule_set"]) console.log(t.padEnd(30), await count(t));
  console.log("files:", nodes.length, "terms;", liveComps.length, "components;", liveMenu.length, "menu items;", liveMenu.reduce((n, m) => n + m.components.length, 0), "template components;", rows.length, "mappings;", rules.length, "rule sets");
}

main().then(() => closeDb()).catch((e) => { console.error(e); closeDb(); process.exit(1); });
