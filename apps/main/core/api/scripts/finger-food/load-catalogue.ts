/**
 * Loads the catalogue of FINGER FOOD into the database. Everything is read from the repository's data folder:
 *   data/ontology-v04    the ingredients tree (2 258 ingredients and their branches, English, with aliases)
 *   data/catalogue       the components, the menu items, the segments, the event types and the distribution rules, as reviewed
 *   data/composition     what each component is made of, and the food rules
 * It writes: the catering company, the ontology (ingredients, materials, segments, event type), the substances, the food rule set,
 * the components with their composition, the menu line templates with their components and segments, the distribution rule sets.
 * Ids are stable, so a re-run rewrites the same rows. Nothing else is touched.
 *
 *   pnpm tsx scripts/finger-food/load-catalogue.ts
 */
import "dotenv/config";
import { inArray, sql } from "drizzle-orm";
import { db, closeDb } from "../../src/db";
import {
  ffCateringCompany, ffComponent, ffComponentComposition, ffDistributionRuleSet, ffFoodRuleSet, ffMenuLineTemplate,
  ffMenuLineTemplateComponent, ffOntologyMapping, ffOntologyTerm, ffSubstance,
} from "@product/finger-food/models";
import { uomOrganization } from "@modules/user-organization-mgmt/models";
import { inChunks, readJson, readText, stableId } from "./lib";

const id = stableId("catalogue");
const COMPANY = "Finger Food";

type V4Term = { id: string; name: string; aliases: string[]; parent_id: string | null };
type Node = { id: string; label: string; parent: string | null };
type Comp = { name: string; unit: string; reusable: boolean };
type MenuItem = { name: string; unit: string; price: number; vat_rate: number; components: { name: string; quantity: number; for_every: number }[] };
type Mapping = { ontology_term_id: string; entity_type: string; entity_id: string };
type Rule = { selector: string[]; unit?: string; quantity?: number; for_every?: number; percent?: number; splits: Rule[] };
type Review = {
  components?: Record<string, { deleted?: boolean; name?: string; unit?: string; reusable?: boolean }>;
  menu?: Record<string, { deleted?: boolean; name?: string; components?: MenuItem["components"]; terms?: string[]; price?: number; vat_rate?: number }>;
};
type RuleNode = { node: string; except?: string[] };
type FoodRule = { excludes?: RuleNode[]; includes?: RuleNode[]; limits?: unknown[] };

/** The V4 roots that hold ingredients, and the terms the catalogue needs that V4 lacks. */
const V4_ROOTS = ["Food identity", "Chemical identity", "Beverage families"];
const ADDED: { name: string; under: string }[] = [
  { name: "Caper", under: "Herbs and edible flowers" },
  { name: "Sulphites", under: "Salts and mineral substances" },
];
const MATERIALS: [string, string | null][] = [
  ["Wood", null], ["Bamboo", null], ["Glass", null], ["Ceramic", null], ["Metal", null], ["Paper", null], ["Fabric", null], ["Plastic", null], ["Acrylic", "Plastic"],
];
const SUBSTANCES = ["Energy", "Fat", "Saturated fat", "Carbohydrates", "Sugars", "Fibre", "Protein", "Salt", "Alcohol", "Caffeine", "Sulphites"];

async function main() {
  const v4 = readJson<V4Term[]>("ontology-v04", "ontology_term.json");
  const v4Ingredient = new Set(readJson<{ ontology_term_id: string }[]>("ontology-v04", "ingredient_term.json").map((m) => m.ontology_term_id));
  const nodes = readJson<{ nodes: Node[] }>("catalogue", "ontology.json").nodes;
  const comps = readJson<{ components: Comp[] }>("catalogue", "components.json").components;
  const menu = readJson<{ menuItems: MenuItem[] }>("catalogue", "menu-items.json").menuItems;
  const mappings = readJson<{ mappings: Mapping[] }>("catalogue", "ontology-mapping.json").mappings;
  const ruleSets = readJson<{ sets: { event_type: string; rules: Rule[] }[] }>("catalogue", "distribution-rules.json").sets;
  const review = readJson<Review>("catalogue", "review-state.json");
  const foodRules = readJson<{ rules: Record<string, FoodRule> }>("composition", "food-rules.json").rules;

  // ── the catering company ──
  let orgId = (await db.select({ id: uomOrganization.id }).from(uomOrganization).where(sql`${uomOrganization.type} = 'company' and ${uomOrganization.name} = ${COMPANY}`).limit(1))[0]?.id;
  if (!orgId) {
    orgId = id("organization", COMPANY);
    await db.insert(uomOrganization).values({ id: orgId, type: "company", name: COMPANY, metadata: {}, createdAt: new Date(), updatedAt: new Date() }).onConflictDoNothing();
  }
  const companyId = id("catering_company", orgId);
  await db.insert(ffCateringCompany).values({ id: companyId, organizationId: orgId }).onConflictDoNothing();

  // ── the ontology: four trees under four roots ──
  type Term = { id: string; cateringCompanyId: string; name: string; aliases: string[] | null; parentId: string | null };
  const terms: Term[] = [];
  const root = (name: string) => { const t = { id: id("root", name), cateringCompanyId: companyId, name, aliases: null, parentId: null }; terms.push(t); return t.id; };
  const rIngredients = root("Ingredients"), rMaterials = root("Materials"), rSegments = root("Segments"), rEventType = root("Event type");

  // ingredients: the V4 trees, with V4's own ids
  const v4ById = new Map(v4.map((t) => [t.id, t]));
  const v4RootOf = (t: V4Term): V4Term => (t.parent_id ? v4RootOf(v4ById.get(t.parent_id)!) : t);
  const kept = v4.filter((t) => V4_ROOTS.includes(v4RootOf(t).name));
  for (const t of kept) terms.push({ id: t.id, cateringCompanyId: companyId, name: t.name, aliases: t.aliases.length ? t.aliases : null, parentId: t.parent_id ?? rIngredients });
  // a name finds its term: the ingredient identity first, any kept term otherwise
  const ingredientByName = new Map<string, string>();
  for (const t of kept) if (!v4Ingredient.has(t.id)) ingredientByName.set(t.name.toLowerCase(), t.id);
  for (const t of kept) if (v4Ingredient.has(t.id)) ingredientByName.set(t.name.toLowerCase(), t.id);
  // an alias finds the term too, when no term has that name
  for (const t of kept) for (const a of t.aliases) if (!ingredientByName.has(a.toLowerCase())) ingredientByName.set(a.toLowerCase(), t.id);
  for (const a of ADDED) {
    const parent = ingredientByName.get(a.under.toLowerCase()); if (!parent) throw new Error(`added term ${a.name}: no term ${a.under}`);
    const t = { id: id("ingredient", a.name), cateringCompanyId: companyId, name: a.name, aliases: null, parentId: parent }; terms.push(t); ingredientByName.set(a.name.toLowerCase(), t.id);
  }
  // materials
  const materialByName = new Map<string, string>();
  for (const [name] of MATERIALS) materialByName.set(name.toLowerCase(), id("material", name));
  for (const [name, parent] of MATERIALS) terms.push({ id: materialByName.get(name.toLowerCase())!, cateringCompanyId: companyId, name, aliases: null, parentId: parent ? materialByName.get(parent.toLowerCase())! : rMaterials });
  // segments and event types: the two subtrees of the reviewed catalogue, with its own names
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const isUnder = (n: Node, top: string): boolean => (n.parent === top ? true : n.parent ? isUnder(nodeById.get(n.parent)!, top) : false);
  const catTermId = new Map<string, string>([["segmentos", rSegments], ["tipo_evento", rEventType]]);
  for (const n of nodes) if (isUnder(n, "segmentos") || isUnder(n, "tipo_evento")) catTermId.set(n.id, id("term", n.id));
  for (const n of nodes) if (isUnder(n, "segmentos") || isUnder(n, "tipo_evento")) terms.push({ id: catTermId.get(n.id)!, cateringCompanyId: companyId, name: n.label, aliases: null, parentId: catTermId.get(n.parent!)! });

  // no two terms with one name under one parent
  const seen = new Set<string>();
  for (const t of terms) { const k = `${t.parentId}|${t.name}`; if (seen.has(k)) throw new Error(`two terms named ${t.name} under one parent`); seen.add(k); }
  // parents first
  const termById = new Map(terms.map((t) => [t.id, t]));
  const depth = (t: Term): number => (t.parentId ? 1 + depth(termById.get(t.parentId)!) : 0);
  const byDepth = new Map<number, Term[]>();
  for (const t of terms) { const d = depth(t); byDepth.set(d, [...(byDepth.get(d) ?? []), t]); }
  for (const d of [...byDepth.keys()].sort((a, b) => a - b))
    await inChunks(byDepth.get(d)!, 1000, (slice) => db.insert(ffOntologyTerm).values(slice).onConflictDoUpdate({ target: ffOntologyTerm.id, set: { name: sql`excluded.name`, aliases: sql`excluded.aliases`, parentId: sql`excluded.parent_id` } }));

  // ── substances ──
  await db.insert(ffSubstance).values(SUBSTANCES.map((name) => ({ id: id("substance", name), name }))).onConflictDoNothing();

  // ── the food rules: names become term ids ──
  const node = (name: string) => { const t = ingredientByName.get(name.toLowerCase()); if (!t) throw new Error(`food rule: no ingredient term named ${name}`); return t; };
  const swapNodes = (list?: RuleNode[]) => list?.map((n) => ({ node: node(n.node), ...(n.except ? { except: n.except.map(node) } : {}) }));
  const rules = Object.fromEntries(Object.entries(foodRules).map(([key, r]) => [key, { ...(r.excludes ? { excludes: swapNodes(r.excludes) } : {}), ...(r.includes ? { includes: swapNodes(r.includes) } : {}), ...(r.limits ? { limits: r.limits } : {}) }]));
  await db.insert(ffFoodRuleSet).values({ id: id("food_rule_set", companyId), cateringCompanyId: companyId, rules }).onConflictDoUpdate({ target: ffFoodRuleSet.id, set: { rules } });

  // ── the components, with the review edits, and what each is made of ──
  const composition = new Map<string, { complete: boolean; names: string[]; material: boolean }>();
  let inMaterials = false;
  for (const raw of readText("composition", "components.txt").split("\n")) {
    const line = raw.trim();
    if (line === "[materials]") { inMaterials = true; continue; }
    if (!line || line.startsWith("#") || !line.includes(" = ")) continue;
    const [name, list] = [line.slice(0, line.indexOf(" = ")), line.slice(line.indexOf(" = ") + 3)];
    composition.set(name, { complete: list.startsWith("!"), names: list.replace(/^!/, "").split(";").map((x) => x.trim()).filter(Boolean), material: inMaterials });
  }
  const compId = (key: string) => id("component", key);
  const liveComps = comps.filter((c) => !review.components?.[c.name]?.deleted).map((c) => ({ key: c.name, ...c, ...(review.components?.[c.name] ?? {}) }));
  const compRows = liveComps.map((c) => {
    const made = composition.get(c.key); if (!made) throw new Error(`no composition line for the component ${c.key}`);
    return { id: compId(c.key), name: c.name ?? c.key, unit: c.unit as never, reusable: c.reusable, compositionComplete: made.complete };
  });
  await inChunks(compRows, 500, (slice) => db.insert(ffComponent).values(slice).onConflictDoUpdate({ target: ffComponent.id, set: { name: sql`excluded.name`, unit: sql`excluded.unit`, reusable: sql`excluded.reusable`, compositionComplete: sql`excluded.composition_complete` } }));
  const compositionRows = liveComps.flatMap((c) => {
    const made = composition.get(c.key)!;
    return [...new Set(made.names)].map((n) => {
      const term = (made.material ? materialByName : ingredientByName).get(n.toLowerCase());
      if (!term) throw new Error(`${c.key}: no ${made.material ? "material" : "ingredient"} term named ${n}`);
      return { id: id("composition", c.key, n), componentId: compId(c.key), ontologyTermId: term, presence: "contains" as const, source: "read from the name of the component, by hand; no label was read" };
    });
  });
  await db.delete(ffComponentComposition).where(inArray(ffComponentComposition.componentId, compRows.map((c) => c.id)));
  await inChunks(compositionRows, 1000, (slice) => db.insert(ffComponentComposition).values(slice));

  // ── the menu line templates and their components, with the review edits ──
  const tplId = (key: string) => id("menu_line_template", key);
  const liveMenu = menu.filter((m) => !review.menu?.[m.name]?.deleted).map((m) => ({ key: m.name, ...m, ...(review.menu?.[m.name] ?? {}) }));
  const names = new Set<string>();
  for (const m of liveMenu) { const n = m.name ?? m.key; if (names.has(n)) throw new Error(`two menu items named ${n}`); names.add(n); }
  await inChunks(liveMenu.map((m) => ({ id: tplId(m.key), name: m.name ?? m.key, price: String(m.price), vatRate: String(m.vat_rate) })), 500, (slice) =>
    db.insert(ffMenuLineTemplate).values(slice).onConflictDoUpdate({ target: ffMenuLineTemplate.id, set: { name: sql`excluded.name`, price: sql`excluded.price`, vatRate: sql`excluded.vat_rate` } }));
  const tplComps = liveMenu.flatMap((m) => m.components.map((c) => {
    if (!liveComps.some((x) => x.key === c.name)) throw new Error(`${m.key}: the component ${c.name} is not in the catalogue`);
    return { id: id("mltc", m.key, c.name), menuLineTemplateId: tplId(m.key), componentId: compId(c.name), quantity: String(c.quantity), forEvery: String(c.for_every) };
  }));
  await db.delete(ffMenuLineTemplateComponent).where(inArray(ffMenuLineTemplateComponent.menuLineTemplateId, liveMenu.map((m) => tplId(m.key))));
  await inChunks(tplComps, 1000, (slice) => db.insert(ffMenuLineTemplateComponent).values(slice));

  // ── a menu line template is in its segments: the file, or the review's own choice ──
  const segRows = liveMenu.flatMap((m) => {
    const keys = review.menu?.[m.key]?.terms ?? mappings.filter((x) => x.entity_type === "menu_line_template" && x.entity_id === m.key).map((x) => x.ontology_term_id);
    return [...new Set(keys)].filter((k) => { const n = nodeById.get(k); return n && isUnder(n, "segmentos"); })
      .map((k) => ({ id: id("map", catTermId.get(k)!, "menu_line_template", tplId(m.key)), ontologyTermId: catTermId.get(k)!, entityType: "menu_line_template", entityId: tplId(m.key) }));
  });
  await db.delete(ffOntologyMapping).where(sql`${ffOntologyMapping.entityType} = 'menu_line_template'`);
  await inChunks(segRows, 1000, (slice) => db.insert(ffOntologyMapping).values(slice));

  // ── the distribution rule sets: the selectors swap term keys for term ids ──
  const swap = (r: Rule): Rule => ({ ...r, selector: r.selector.map((k) => { const t = catTermId.get(k); if (!t) throw new Error(`distribution rule: ${k} is not a segment`); return t; }), splits: r.splits.map(swap) });
  for (const s of ruleSets) {
    const type = catTermId.get(s.event_type); if (!type) throw new Error(`distribution rule set: ${s.event_type} is not an event type`);
    await db.insert(ffDistributionRuleSet).values({ id: id("rule_set", s.event_type), cateringCompanyId: companyId, eventTypeTermId: type, rules: s.rules.map(swap) })
      .onConflictDoUpdate({ target: ffDistributionRuleSet.id, set: { rules: s.rules.map(swap) } });
  }

  console.log({
    terms: terms.length, ingredients: kept.length + ADDED.length, materials: MATERIALS.length, substances: SUBSTANCES.length, foodRules: Object.keys(rules).length,
    components: compRows.length, componentsComplete: compRows.filter((c) => c.compositionComplete).length, compositionLines: compositionRows.length,
    menuItems: liveMenu.length, menuItemComponents: tplComps.length, menuItemsInASegment: new Set(segRows.map((r) => r.entityId)).size, distributionRuleSets: ruleSets.length,
  });
}

main().then(() => closeDb()).catch((e) => { console.error(e); closeDb(); process.exit(1); });
