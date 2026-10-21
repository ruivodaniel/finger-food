/**
 * Loads the history of FINGER FOOD (the proposals, invoices and payments extracted from Gonçalo's documents) into the database, on top of the catalog.
 *   clients, events, proposals (state sent), moments (typed by their service), menu lines copied from the menu line templates the history's names
 *   resolve to (components, price, VAT, terms), or proposal ad hoc lines for the names that resolve to nothing and for the price lines as written;
 *   invoices with their credit notes and payments, linked to the event of the same client around the invoice date, or to an event of their own.
 * Reads data/raw of the finger-food repo (llm/<quote>.json, invoices, invoice_lines, payments, history_to_menu_items.json, document_folders.json).
 * Ids are stable (hash of the source ids), so a re-run rewrites the same rows. Every id starts from the "history" namespace, which tells it from what the app writes.
 *
 *   pnpm tsx scripts/seed-finger-food-history.ts [--raw <path to data/raw>]
 */
import "dotenv/config";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { db, closeDb } from "../src/db";
import { ffCateringCompany, ffClient, ffCreditNote, ffDistributionRuleSet, ffEvent, ffInvoice, ffMenuLine, ffMenuLineComponent, ffMenuLineTemplate, ffMenuLineTemplateComponent, ffMoment, ffOntologyMapping, ffOntologyTerm, ffPayment, ffProposal, ffProposalAdHocLine } from "@modules/finger-food/models";

const arg = (k: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const RAW = arg("--raw") ?? join(process.env.HOME ?? "", "DEV/finger-food/data/raw");
const jsonl = <T>(f: string): T[] => readFileSync(join(RAW, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as T);
const id = (...k: string[]) => { const h = createHash("sha1").update("finger-food:history:" + k.join("|")).digest("hex"); return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${h.slice(18, 20)}-${h.slice(20, 32)}`; };
const norm = (t: string) => (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const dec = (n: number) => n.toFixed(3);

type Price = { label?: string; unit_price?: number; quantity?: number; line_total?: number; vat_rate?: number };
type Quote = { quote_id: string; client?: string; event_dates: { day?: number; month?: number; year?: number }[]; place?: string; moments: { name_as_written?: string; service_type?: string; guests?: number; menu_lines: { segment: string; items: { text: string; quantity?: number }[] }[]; prices: Price[] }[]; prices_not_in_a_moment: Price[]; total?: number };
type Invoice = { id: string; number: string; doc_type: string; issue_date: string; due_date?: string; customer_name: string; customer_tax_id?: string; payment_terms?: string; net: string; vat: string; gross: string; cancelled?: boolean };
type Payment = { entity: string; issue_date: string; gross: number; received_date?: string; cancelled: boolean };
type Rule = { selector: string[]; unit: string; quantity: number; for_every: number; splits: { selector: string[]; percent: number; splits: unknown[] }[] };

async function main() {
  const company = (await db.select().from(ffCateringCompany).limit(1))[0];
  if (!company) throw new Error("run seed-finger-food-catalog first");
  const quotes = readdirSync(join(RAW, "llm")).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(RAW, "llm", f), "utf8")) as Quote);
  const invoices = jsonl<Invoice>("invoices.jsonl"), payments = jsonl<Payment>("payments.jsonl");
  const resolve = JSON.parse(readFileSync(join(RAW, "history_to_menu_items.json"), "utf8")) as Record<string, string[]>;

  // the catalog, by name
  const templates = await db.select().from(ffMenuLineTemplate);
  const tpl = new Map(templates.map((t) => [t.name, t]));
  const tplComps = await db.select().from(ffMenuLineTemplateComponent);
  const compsOf = (tplId: string) => tplComps.filter((c) => c.menuLineTemplateId === tplId);
  const terms = await db.select().from(ffOntologyTerm);
  const termByName = new Map(terms.map((t) => [t.name, t]));
  const tplTerms = await db.select().from(ffOntologyMapping).where(eq(ffOntologyMapping.entityType, "menu_line_template"));
  const termsOf = (tplId: string) => tplTerms.filter((m) => m.entityId === tplId).map((m) => m.ontologyTermId);
  const parentOf = new Map(terms.map((t) => [t.id, t.parentId]));
  const under = (termId: string, ancestor: string): boolean => { let t: string | null | undefined = termId; while (t) { if (t === ancestor) return true; t = parentOf.get(t); } return false; };
  // the rule sets by event type; a moment's service picks the type
  const ruleSets = await db.select().from(ffDistributionRuleSet);
  const eventType = (service?: string) => termByName.get(service === "lunch" || service === "dinner" || service === "delivery" ? "Catering" : service === "cocktail" ? "Cocktail" : "Coffee break")!;
  const unitOf = (rules: Rule[], tplId: string): { unit: string; quantity: number; selector: string } | null => {
    const mine = termsOf(tplId);
    for (const r of rules) if (r.selector.every((s) => mine.some((t) => under(t, s)))) return { unit: r.unit, quantity: r.quantity / r.for_every, selector: r.selector.join("+") };
    return null;
  };

  // clients: proposals and invoices merged by normalized name; the tax id from the invoices
  const clientId = (name: string) => id("client", norm(name) || "sem nome");
  const clientNames = new Map<string, { name: string; taxId?: string; kind: "company" | "individual" }>();
  for (const q of quotes) { const n = (q.client ?? "").trim() || "Sem nome"; const k = norm(n); if (!clientNames.has(k)) clientNames.set(k, { name: n, kind: /\b(universidade|lda|s\.a|associa|instituto|câmara|camara|centro|escola|clube|empresa|unipessoal)\b/i.test(n) ? "company" : "individual" }); }
  for (const i of invoices) { const k = norm(i.customer_name); const c = clientNames.get(k); if (c) { c.taxId ??= i.customer_tax_id; c.kind = "company"; } else clientNames.set(k, { name: i.customer_name.trim(), taxId: i.customer_tax_id, kind: i.customer_tax_id && i.customer_tax_id.startsWith("5") ? "company" : "individual" }); }
  for (const [k, c] of clientNames) await db.insert(ffClient).values({ id: clientId(k), cateringCompanyId: company.id, name: c.name, kind: c.kind, taxId: c.taxId }).onConflictDoUpdate({ target: ffClient.id, set: { name: c.name, kind: c.kind, taxId: c.taxId } });

  // the year of a proposal with none written: the year of an invoice of the same client, else the latest invoice year
  const invYears = new Map<string, number[]>();
  for (const i of invoices) { const k = norm(i.customer_name); invYears.set(k, [...(invYears.get(k) ?? []), Number(i.issue_date.slice(0, 4))]); }
  const latestYear = Math.max(...invoices.map((i) => Number(i.issue_date.slice(0, 4))));
  const dateOf = (q: Quote, d: { day?: number; month?: number; year?: number }) => { const y = d.year ?? invYears.get(norm(q.client ?? ""))?.at(-1) ?? latestYear; return new Date(Date.UTC(y, (d.month ?? 1) - 1, d.day ?? 1)); };
  const timeIn = (s?: string) => { const m = /(\d{1,2})\s*h\s*(\d{2})?/i.exec(s ?? ""); return m ? Number(m[1]) + Number(m[2] ?? 0) / 60 : null; };
  const defaultHour = (service?: string) => (service === "lunch" ? 13 : service === "dinner" ? 20 : service === "cocktail" ? 18 : 10);

  let stats = { events: 0, proposals: 0, moments: 0, lines: 0, adhoc: 0, priceLines: 0 };
  const eventOfClient = new Map<string, { id: string; at: Date }[]>();
  for (const q of quotes) {
    const dates = q.event_dates.length ? q.event_dates.map((d) => dateOf(q, d)) : [new Date(Date.UTC(latestYear, 0, 1))];
    const starts = new Date(Math.min(...dates.map((d) => +d))), ends = new Date(Math.max(...dates.map((d) => +d)) + 86400000 - 1000);
    const cid = clientId(q.client ?? ""), eid = id("event", q.quote_id), pid = id("proposal", q.quote_id);
    await db.insert(ffEvent).values({ id: eid, clientId: cid, startsAt: starts, endsAt: ends, place: q.place ?? null, stage: "lead" }).onConflictDoUpdate({ target: ffEvent.id, set: { clientId: cid, startsAt: starts, endsAt: ends, place: q.place ?? null } });
    eventOfClient.set(norm(q.client ?? ""), [...(eventOfClient.get(norm(q.client ?? "")) ?? []), { id: eid, at: starts }]);
    await db.insert(ffProposal).values({ id: pid, eventId: eid, number: 1, sentAt: starts, state: "sent" }).onConflictDoUpdate({ target: ffProposal.id, set: { eventId: eid, sentAt: starts } });
    stats.events++; stats.proposals++;
    // the moments: wipe and rewrite the proposal's lines
    const oldMoments = await db.select({ id: ffMoment.id }).from(ffMoment).where(eq(ffMoment.proposalId, pid));
    if (oldMoments.length) { const mids = oldMoments.map((m) => m.id); const oldLines = await db.select({ id: ffMenuLine.id }).from(ffMenuLine).where(inArray(ffMenuLine.momentId, mids)); if (oldLines.length) { await db.delete(ffMenuLineComponent).where(inArray(ffMenuLineComponent.menuLineId, oldLines.map((l) => l.id))); await db.delete(ffOntologyMapping).where(sql`${ffOntologyMapping.entityType} = 'menu_line' and ${ffOntologyMapping.entityId} in ${oldLines.map((l) => l.id)}`); await db.delete(ffMenuLine).where(inArray(ffMenuLine.momentId, mids)); } await db.delete(ffOntologyMapping).where(sql`${ffOntologyMapping.entityType} = 'moment' and ${ffOntologyMapping.entityId} in ${mids}`); await db.delete(ffMoment).where(inArray(ffMoment.id, mids)); }
    await db.delete(ffProposalAdHocLine).where(eq(ffProposalAdHocLine.proposalId, pid));
    let pos = 0, adPos = 0;
    for (const [mi, m] of q.moments.entries()) {
      const mid = id("moment", q.quote_id, String(mi));
      const day = dates[Math.min(mi, dates.length - 1)]; const h = timeIn(m.name_as_written) ?? defaultHour(m.service_type);
      const mStart = new Date(+day + h * 3600000), mEnd = new Date(+mStart + 2 * 3600000);
      const guests = m.guests ?? m.prices.find((p) => (p.quantity ?? 0) >= 5)?.quantity ?? 0;
      await db.insert(ffMoment).values({ id: mid, proposalId: pid, startsAt: mStart, endsAt: mEnd, guests: Math.round(guests), position: pos++ });
      const type = eventType(m.service_type);
      await db.insert(ffOntologyMapping).values({ id: id("map", "moment", mid, type.id), ontologyTermId: type.id, entityType: "moment", entityId: mid }).onConflictDoNothing();
      const rules = (ruleSets.find((r) => r.eventTypeTermId === type.id)?.rules ?? []) as Rule[];
      // the lines: each name resolves to menu items (several when it listed alternatives), or goes ad hoc
      const lines: { tplId: string; text: string }[] = []; const adhoc: string[] = [];
      for (const l of m.menu_lines) for (const it of l.items) { const names = resolve[norm(it.text)] ?? []; const found = names.map((n) => tpl.get(n)).filter(Boolean); if (found.length) for (const t of found) { if (!lines.some((x) => x.tplId === t!.id)) lines.push({ tplId: t!.id, text: it.text }); } else adhoc.push(it.text); }
      // the per-guest quantity from the rule set: the rule's total shared by the lines matching its selector
      const share = new Map<string, number>(); const sel = lines.map((l) => unitOf(rules, l.tplId));
      for (const s of sel) if (s) share.set(s.selector, (share.get(s.selector) ?? 0) + 1);
      // the price of the moment as written overrides the templates: scale so the lines add up to it
      const pax = m.prices.filter((p) => p.unit_price && (p.quantity ?? 0) >= 5 && p.unit_price < 80).reduce((s, p) => s + (p.unit_price ?? 0), 0);
      const tplTotal = lines.reduce((s, l, i) => s + Number(tpl.get(templates.find((t) => t.id === l.tplId)!.name)!.price ?? 0) * (sel[i] ? sel[i]!.quantity / (share.get(sel[i]!.selector) ?? 1) : 1), 0);
      const scale = pax > 0 && tplTotal > 0 ? pax / tplTotal : 1;
      for (const [li, l] of lines.entries()) {
        const t = templates.find((x) => x.id === l.tplId)!; const s = sel[li];
        const qty = s ? s.quantity / (share.get(s.selector) ?? 1) : 1; const unit = s?.unit ?? "piece";
        const lid = id("menu_line", mid, t.id);
        await db.insert(ffMenuLine).values({ id: lid, momentId: mid, quantity: dec(qty), unit: unit as never, price: t.price == null ? null : (Number(t.price) * scale).toFixed(2), vatRate: t.vatRate, note: l.text !== t.name ? l.text : null, position: li });
        for (const c of compsOf(t.id)) await db.insert(ffMenuLineComponent).values({ id: id("mlc", lid, c.componentId), menuLineId: lid, componentId: c.componentId, quantity: c.quantity, forEvery: c.forEvery });
        for (const tid of termsOf(t.id)) await db.insert(ffOntologyMapping).values({ id: id("map", "menu_line", lid, tid), ontologyTermId: tid, entityType: "menu_line", entityId: lid }).onConflictDoNothing();
        stats.lines++;
      }
      for (const text of adhoc) { await db.insert(ffProposalAdHocLine).values({ id: id("adhoc", mid, text, String(adPos)), proposalId: pid, description: `${m.name_as_written ?? "momento " + (mi + 1)}: ${text}`, quantity: "1", price: "0", vatRate: "13", position: adPos++ }); stats.adhoc++; }
      // the price lines as written, kept as ad hoc lines with no price when they are the per-guest price already spread on the menu lines
      for (const p of m.prices) { const onLines = p.unit_price && (p.quantity ?? 0) >= 5 && p.unit_price < 80 && lines.length > 0; await db.insert(ffProposalAdHocLine).values({ id: id("price", mid, p.label ?? "", String(adPos)), proposalId: pid, description: `${m.name_as_written ?? ""} · ${p.label ?? "preço"} (${p.unit_price ?? "?"} € x ${p.quantity ?? "?"})${onLines ? " — spread on the menu lines" : ""}`, quantity: dec(onLines ? 0 : p.quantity ?? 1), price: (p.unit_price ?? 0).toFixed(2), vatRate: String(p.vat_rate ?? 13), position: adPos++ }); stats.priceLines++; }
      stats.moments++;
    }
    for (const p of q.prices_not_in_a_moment ?? []) { await db.insert(ffProposalAdHocLine).values({ id: id("price", pid, p.label ?? "", String(adPos)), proposalId: pid, description: `${p.label ?? "preço"} (${p.unit_price ?? "?"} € x ${p.quantity ?? "?"})`, quantity: dec(p.quantity ?? 1), price: (p.unit_price ?? 0).toFixed(2), vatRate: String(p.vat_rate ?? 13), position: adPos++ }); stats.priceLines++; }
  }

  // invoices: to the event of the same client nearest the issue date (within 60 days), else an event of their own; the event's stage follows
  let inv = 0, cn = 0, pay = 0, own = 0;
  const invoiceEvent = new Map<string, string>();
  const byTotal = quotes.filter((q) => q.total).map((q) => ({ eid: id("event", q.quote_id), total: q.total!, at: new Date(Math.min(...(q.event_dates.length ? q.event_dates.map((d) => dateOf(q, d)) : [new Date(Date.UTC(latestYear, 0, 1))]).map((d) => +d))) }));
  const taken = new Set<string>();
  for (const i of invoices.filter((x) => x.doc_type === "FA")) {
    const k = norm(i.customer_name), at = new Date(i.issue_date);
    // the proposal's client is the contact, the invoice's the billing entity: an invoice meets its proposal by the amount (gross or net) within 120 days
    const near = byTotal.filter((e) => !taken.has(e.eid) && (Math.abs(e.total - Number(i.gross)) < 1 || Math.abs(e.total - Number(i.net)) < 1) && Math.abs(+e.at - +at) < 120 * 86400000).sort((a, b) => Math.abs(+a.at - +at) - Math.abs(+b.at - +at))[0];
    let eid = near?.eid; if (eid) taken.add(eid);
    if (!eid) { eid = id("event", "invoice", i.id); own++; await db.insert(ffEvent).values({ id: eid, clientId: clientId(k), startsAt: at, endsAt: new Date(+at + 86400000 - 1000), stage: "invoiced" }).onConflictDoNothing(); }
    const paid = payments.some((p) => p.received_date && !p.cancelled && Math.abs(p.gross - Number(i.gross)) < 0.05 && p.issue_date === i.issue_date);
    await db.update(ffEvent).set({ stage: paid ? "paid" : "invoiced" }).where(eq(ffEvent.id, eid));
    await db.insert(ffInvoice).values({ id: id("invoice", i.id), eventId: eid, number: i.number, issuedAt: at, dueAt: i.due_date ? new Date(i.due_date) : null, paymentTerms: i.payment_terms ?? null, net: Number(i.net).toFixed(2), vat: Number(i.vat).toFixed(2), total: Number(i.gross).toFixed(2), cancelledAt: i.cancelled ? at : null })
      .onConflictDoUpdate({ target: ffInvoice.id, set: { eventId: eid, net: Number(i.net).toFixed(2), vat: Number(i.vat).toFixed(2), total: Number(i.gross).toFixed(2) } });
    invoiceEvent.set(i.id, eid); inv++;
  }
  for (const i of invoices.filter((x) => x.doc_type === "NC")) {
    const k = norm(i.customer_name); const base = invoices.filter((x) => x.doc_type === "FA" && norm(x.customer_name) === k && x.issue_date <= i.issue_date).sort((a, b) => (a.issue_date < b.issue_date ? 1 : -1))[0];
    if (!base) continue;
    await db.insert(ffCreditNote).values({ id: id("credit_note", i.id), invoiceId: id("invoice", base.id), number: i.number, issuedAt: new Date(i.issue_date), net: Number(i.net).toFixed(2), vat: Number(i.vat).toFixed(2), total: Number(i.gross).toFixed(2) }).onConflictDoNothing(); cn++;
  }
  for (const p of payments.filter((x) => x.received_date && !x.cancelled)) {
    // the payment list names the entity its own way: an invoice is the same amount on the same day, else the same amount within 90 days
    const i = invoices.find((x) => x.doc_type === "FA" && x.issue_date === p.issue_date && Math.abs(Number(x.gross) - p.gross) < 0.05) ?? invoices.find((x) => x.doc_type === "FA" && Math.abs(Number(x.gross) - p.gross) < 0.05 && Math.abs(+new Date(x.issue_date) - +new Date(p.issue_date)) < 90 * 86400000);
    if (!i) continue;
    await db.insert(ffPayment).values({ id: id("payment", i.id, p.received_date!), invoiceId: id("invoice", i.id), receivedAt: new Date(p.received_date!), amount: p.gross.toFixed(2) }).onConflictDoNothing(); pay++;
  }
  console.log({ clients: clientNames.size, ...stats, invoices: inv, invoicesWithOwnEvent: own, creditNotes: cn, paymentsMatched: pay, paymentsInFile: payments.length });
}

main().then(() => closeDb()).catch((e) => { console.error(e); closeDb(); process.exit(1); });
