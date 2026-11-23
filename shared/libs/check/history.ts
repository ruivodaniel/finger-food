// ── REPORT · the run history ─────────────────────────────────────
// Every run is kept: the report as it was, under its moment, and one line in the index. Node only.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Report } from "./schema.ts";

export type RunLine = { id: string; at: string; call: unknown; rules: Report["rules"]; items: number; findings: { error: number; warn: number; info: number }; excepted: number };

/** writes <dir>/<id>.json and adds the run to <dir>/index.json, the newest first, the last `keep` kept in the index */
export function record(dir: string, call: unknown, report: Report, keep = 100): RunLine {
  const at = new Date().toISOString(), id = at.replace(/[:.]/g, "-");
  const count = (s: string) => report.findings.filter((f) => f.severity === s).length;
  const line: RunLine = { id, at, call, rules: report.rules, items: report.items.length, findings: { error: count("error"), warn: count("warn"), info: count("info") }, excepted: report.excepted.length };
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${id}.json`), JSON.stringify({ ...line, report }, null, 1));
  const index = join(dir, "index.json");
  let lines: RunLine[] = [];
  if (existsSync(index)) { try { lines = JSON.parse(readFileSync(index, "utf-8")) as RunLine[]; } catch { lines = []; } }
  writeFileSync(index, JSON.stringify([line, ...lines].slice(0, keep), null, 1));
  return line;
}
