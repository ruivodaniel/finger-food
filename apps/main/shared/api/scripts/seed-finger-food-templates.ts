/**
 * The proposal templates of FINGER FOOD, learned from the history: four moment shapes (the menu items that repeat most in each kind of moment)
 * and four proposal templates (the moment sequences the proposals repeat most). Each template moment maps to its event type through the ontology.
 * Stable ids; a re-run rewrites the same rows. Run after the catalog loader.
 *
 *   pnpm tsx scripts/seed-finger-food-templates.ts
 */
import "dotenv/config";
import { createHash } from "crypto";
import { eq, inArray } from "drizzle-orm";
import { db, closeDb } from "../src/db";
import { ffCateringCompany, ffMenuLineTemplate, ffOntologyMapping, ffOntologyTerm, ffProposalTemplate, ffProposalTemplateMoment, ffProposalTemplateMomentLine } from "@modules/finger-food/models";

const id = (...k: string[]) => { const h = createHash("sha1").update("finger-food:templates:" + k.join("|")).digest("hex"); return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${h.slice(18, 20)}-${h.slice(20, 32)}`; };

// the moment shapes: the menu line templates by name, in the order they are served
const MOMENTS: Record<string, { type: string; lines: string[] }> = {
  "Coffee break": { type: "Coffee break", lines: ["croissant brioche c/ queijo", "croissant brioche c/ fiambre", "vol-au-vent de guacamole c/ azeitona", "folhado de salsicha", "pastéis de nata", "bolachinhas bacalhaus", "folhado de chocolate", "espetadas de fruta", "água", "água aromatizada", "sumo de compal", "café café", "café descafeinado"] },
  "Welcome coffee": { type: "Coffee break", lines: ["café café", "café descafeinado", "água", "pastéis de nata", "palmiers"] },
  "Almoço volante": { type: "Catering", lines: ["creme de cenoura", "miniaturas fritas · bolinhos de bacalhau", "miniaturas fritas · croquetes de vitela", "miniaturas fritas · rissóis de camarão", "miniaturas fritas · chamuças", "arroz de pato", "bacalhau c/ natas", "quinoa c/ legumes salteados", "brownie c/ nozes e caramelo salgado", "brigadeiros", "ovos moles", "espetadas de fruta", "água", "sumo de compal", "café café", "café descafeinado"] },
  "Cocktail": { type: "Cocktail", lines: ["tábua de queijos c/ frutos secos", "tábua de enchidos c/ azeitonas", "espetada de mozarela, cherry, manjericão e azeitona", "bolinhos de bacalhau c/ espeto de cherry c/ azeitona", "rissóis de camarão", "croissant brioche c/ queijo", "croissant brioche c/ fiambre", "vol-au-vent de guacamole c/ azeitona", "pastéis de nata", "brownie c/ nozes e caramelo salgado", "brigadeiros", "espetadas de fruta", "água", "sumo de laranja natural", "espumante", "cerveja sagres"] },
};
// the proposal templates: a sequence of moment shapes
const TEMPLATES: Record<string, string[]> = {
  "Coffee break": ["Coffee break"],
  "Coffee break manhã e tarde": ["Coffee break", "Coffee break"],
  "Dia completo": ["Coffee break", "Almoço volante", "Coffee break"],
  "Cocktail": ["Cocktail"],
};

async function main() {
  const company = (await db.select().from(ffCateringCompany).limit(1))[0];
  if (!company) throw new Error("run seed-finger-food-catalog first");
  const tpl = new Map((await db.select().from(ffMenuLineTemplate)).map((t) => [t.name, t.id]));
  const terms = new Map((await db.select().from(ffOntologyTerm)).map((t) => [t.name, t.id]));
  for (const m of Object.values(MOMENTS)) for (const l of m.lines) if (!tpl.has(l)) throw new Error(`no menu line template named ${l}`);
  let moments = 0, lines = 0;
  for (const [name, shapes] of Object.entries(TEMPLATES)) {
    const pid = id("proposal_template", name);
    await db.insert(ffProposalTemplate).values({ id: pid, cateringCompanyId: company.id, name }).onConflictDoUpdate({ target: ffProposalTemplate.id, set: { name } });
    const old = await db.select({ id: ffProposalTemplateMoment.id }).from(ffProposalTemplateMoment).where(eq(ffProposalTemplateMoment.proposalTemplateId, pid));
    if (old.length) { const ids = old.map((o) => o.id); await db.delete(ffProposalTemplateMomentLine).where(inArray(ffProposalTemplateMomentLine.proposalTemplateMomentId, ids)); await db.delete(ffOntologyMapping).where(inArray(ffOntologyMapping.entityId, ids)); await db.delete(ffProposalTemplateMoment).where(inArray(ffProposalTemplateMoment.id, ids)); }
    for (const [pos, shape] of shapes.entries()) {
      const mid = id("proposal_template_moment", name, String(pos)); const m = MOMENTS[shape];
      await db.insert(ffProposalTemplateMoment).values({ id: mid, proposalTemplateId: pid, position: pos });
      await db.insert(ffOntologyMapping).values({ id: id("map", mid), ontologyTermId: terms.get(m.type)!, entityType: "proposal_template_moment", entityId: mid });
      for (const [lp, l] of m.lines.entries()) { await db.insert(ffProposalTemplateMomentLine).values({ id: id("line", mid, l), proposalTemplateMomentId: mid, menuLineTemplateId: tpl.get(l)!, position: lp }); lines++; }
      moments++;
    }
  }
  console.log({ templates: Object.keys(TEMPLATES).length, moments, lines });
}
main().then(() => closeDb()).catch((e) => { console.error(e); closeDb(); process.exit(1); });
