// Gives every entry of the database an `owner`: where it lives in the map (main/core, main/slices/<slice>, apps/<app>, libs/<lib>, root/<area>).
// Derived from `subject` (kept as is). Idempotent: run it again and nothing changes. Writes db/entries.json, the flat list the viewer reads.
//   node --experimental-strip-types shared/docs/engine/remap-owner.ts   (or: slice-design/node_modules/.bin/tsx shared/docs/engine/remap-owner.ts)
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DB = join(dirname(fileURLToPath(import.meta.url)), "..", "db");
const KINDS = ["doc", "term", "adr", "standards"] as const;

const SLICES = new Set(["user-organization-mgmt", "notifications", "meteors", "availability-check", "queue", "storage", "workflows", "audit-trail", "team-cockpit", "payment", "credits"]);
const LIBS = new Set(["list-query", "realtime", "gated-scoped-ac", "value-types", "rich-text-editor"]);
export function ownerOf(subject: string | undefined): string {
  if (!subject) return "documentation";
  if (subject === "main") return "main/core";
  if (subject === "slice-design") return "main/slices/product-design";
  if (SLICES.has(subject)) return `main/slices/${subject}`;
  if (subject === "orchestrator") return "orchestrator";
  if (subject === "infra") return "infra";
  if (subject === "docs") return "documentation";
  if (subject === "open-api") return "orchestrator";
  if (subject === "ui") return "libs/ui";
  if (LIBS.has(subject)) return `libs/${subject}`;
  // the root: docs-system entries and open-api terms hang directly under root; infra keeps its own node (five docs)
  if (subject === "infra") return "infra";
  return "documentation";
}

// the skills's activities are documents of their own: one file per activity under db/doc/, skill-<activity-id>.json, owner skills/<group>, empty mapper shape until written
type SkillsFile = { groups: { id: string; title: string; note?: string; groups: { id: string; title: string; activities: { id: string; title: string }[] }[] }[] };
const skills = JSON.parse(readFileSync(join(DB, "skills.json"), "utf-8")) as SkillsFile;
let created = 0;
for (const g of skills.groups) for (const sg of g.groups) for (const a of sg.activities) {
  const path = join(DB, "doc", `skill-${a.id}.json`);
  const owner = `skills/${g.id}/${sg.id}`;
  if (existsSync(path)) {
    // an existing activity follows the skills file: its title and its place
    const d = JSON.parse(readFileSync(path, "utf-8"));
    if (d.title !== a.title || d.owner !== owner) { d.title = a.title; d.owner = owner; d.tags = ["skills", g.id, sg.id]; writeFileSync(path, JSON.stringify(d, null, 1) + "\n"); }
    continue;
  }
  const doc = { id: `doc/skill-${a.id}`, kind: "doc", title: a.title, status: "todo", subject: "skills", owner, tags: ["skills", g.id, sg.id], paths: [], summary: "", docId: `skill-${a.id}`, doc: { axioms: [], purpose: {}, reference: [] } };
  writeFileSync(path, JSON.stringify(doc, null, 1) + "\n"); created++;
}
if (created) console.log(`${created} skills activity docs created`);

type Entry = { id: string; kind: string; title: string; status: string; subject?: string; subjects?: string[]; tags: string[]; paths: string[]; summary?: string; docId?: string; owner?: string; /** the reading position inside its owner folder; set in the doc's JSON, absent = after the ordered ones */ order?: number; /** the audiences the entry is for: seed-contributor, seed-consumer, product-contributor */ audience?: string[]; /** a term belongs to several subjects: every owner it has (the first is `owner`) */ owners?: string[] };
const entries: Entry[] = [];
let changed = 0;
for (const kind of KINDS) {
  const dir = join(DB, kind);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
    const path = join(dir, f);
    const e = JSON.parse(readFileSync(path, "utf-8")) as Entry;
    const owner = e.subject === "skills" ? e.owner! : ownerOf(e.subject ?? e.subjects?.[0]);
    if (e.owner !== owner) {
      // owner goes right after subject(s): rebuild the object so the file reads in order
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(e)) { if (k === "owner") continue; out[k] = v; if (k === "subject" || (k === "subjects" && !("subject" in e))) out.owner = owner; }
      if (!("owner" in out)) out.owner = owner;
      writeFileSync(path, JSON.stringify(out, null, 1) + "\n");
      e.owner = owner; changed++;
    }
    entries.push({ id: e.id, kind: e.kind, title: e.title, status: e.status, subject: e.subject, subjects: e.subjects, tags: e.tags, paths: e.paths ?? [], summary: e.summary, docId: e.docId, owner, ...(e.order !== undefined ? { order: e.order } : {}), ...(e.audience ? { audience: e.audience } : {}), ...(e.subjects ? { owners: [...new Set(e.subjects.map(ownerOf))] } : {}) });
  }
}
writeFileSync(join(DB, "entries.json"), JSON.stringify({ entries }, null, 1) + "\n");
const byOwner = new Map<string, number>();
for (const e of entries) byOwner.set(e.owner!, (byOwner.get(e.owner!) ?? 0) + 1);
console.log(`${entries.length} entries, ${changed} files written`);
for (const [o, n] of [...byOwner].sort()) console.log(`  ${o}: ${n}`);
