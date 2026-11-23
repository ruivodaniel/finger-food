// pnpm ui:check <entry point> [<entry point> …] [--crawl=latest|all] [--follow] [--kinds=code,data,theme] [--rules=markup,composition,language,theme,versions] [--list] [--all]
// The UI through the check system (shared/libs/check; the UI's kinds and rule set: shared/libs/ui/rules). The caller sets the whole scope with the arguments:
//   entry points   a folder, or one thing. One thing may name its version: …/avatar/v3
//   --crawl        what a folder gives: latest (default), the latest version of each thing inside · all: every version
//   --follow       from each item, everything it uses, whatever its kind, primitives included: the version it names, else the latest
//   --kinds        which things are items: code (.tsx), data (ui_data.json), theme (a theme file). All when absent
//   --rules        which groups of rules run. All when absent
//   --list         the list of items only, with what led to each; nothing is checked
//   --all          every line; without it, findings are counted by rule and the first of each is shown
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const args = process.argv.slice(2), flag = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split("=")[1], every = args.includes("--all");
const entries = args.filter((a) => !a.startsWith("--"));
if (!entries.length) { console.error("usage: pnpm ui:check <file or folder> [<file or folder> …] [--crawl=latest|all] [--follow] [--kinds=…] [--rules=…] [--list] [--all]"); process.exit(2); }
const host = resolve("shared/libs/knowledge/hosts/screen-previewer"), out = join(mkdtempSync(join(tmpdir(), "ui-check-")), "found.json");
const env = { ...process.env, UI_CHECK_TARGET: entries.map((t) => resolve(t)).join("\n"), UI_CHECK_OUT: out };
for (const [name, key] of [["kinds", "UI_CHECK_KINDS"], ["crawl", "UI_CHECK_CRAWL"], ["rules", "UI_CHECK_RULES"]]) if (flag(name)) env[key] = flag(name);
if (args.includes("--follow")) env.UI_CHECK_FOLLOW = "1";
if (args.includes("--list")) env.UI_CHECK_ONLY = "list";
const run = spawnSync("npx", ["vitest", "run", "--root", host, "--config", join(host, "vitest.config.ts"), "v5/tests/ui-check"], { encoding: "utf-8", env });
if (!existsSync(out)) { console.error(run.stdout + run.stderr); process.exit(2); }
const r = JSON.parse(readFileSync(out, "utf-8"));
if (r.error) { console.error(r.error); process.exit(2); }
const count = (k) => r.items.filter((i) => i.kind === k).length;
console.log(`UI rules ${r.rules} · ${r.entryPoints.join(" + ")}\ncrawl: ${r.crawl} · follow: ${r.follow ? "on" : "off"} · kinds: ${r.kinds.join(", ")}${r.listOnly ? "" : ` · rules: ${r.groups.join(", ")}`}`);
console.log(`items: ${r.items.length} (${["code", "data", "theme"].map((k) => `${count(k)} ${k}`).join(", ")})`);
const reached = r.items.filter((i) => i.via);
if (r.listOnly) { for (const i of r.items) console.log(`  ${i.kind.padEnd(5)} ${i.file}${i.via ? `\n          from ${i.via}` : ""}`); process.exit(0); }
if (reached.length) { console.log(`\nreached by following: ${reached.length}`); for (const i of every ? reached : reached.slice(0, 8)) console.log(`  ${i.kind.padEnd(5)} ${i.file}\n          from ${i.via}`); if (!every && reached.length > 8) console.log(`  … ${reached.length - 8} more (--all, or --list for the list alone)`); }
const show = (title, list, line) => {
  if (!list.length) return;
  console.log(`\n${title}: ${list.length}`);
  if (every) { for (const x of list) console.log("  " + line(x)); return; }
  const by = new Map(); for (const x of list) { const k = `${x.check ?? "exception"} · ${x.rule ?? x.exception}`; by.set(k, [...(by.get(k) ?? []), x]); }
  for (const [k, xs] of [...by].sort((a, b) => b[1].length - a[1].length)) console.log(`  ${String(xs.length).padStart(4)}  ${k}\n        ${line(xs[0])}`);
};
show("found", r.findings, (f) => `${f.item}${f.at ? " · " + f.at : ""}: ${f.message}`);
// a warning is listed and never fails the run
show("warnings", r.warnings ?? [], (f) => `${f.item}${f.at ? " · " + f.at : ""}: ${f.message}`);
show("exceptions used", r.excepted, (e) => `${e.item} · ${e.at}: ${e.exception}`);
show("not ruled yet", r.notRuled, (f) => `${f.item}${f.at ? " · " + f.at : ""}: ${f.message}`);
for (const n of r.notBuilt) console.log(`\nnot built: ${n}`);
if (!r.findings.length) console.log("\nnothing found");
process.exit(r.findings.length ? 1 : 0);
