#!/usr/bin/env node
// ── Prowd Lint Runner ──────────────────────────────────────────────
// One Config, One Pipeline, One Output.
//
// 1. Discovers control sets (global + packages)
// 2. Infers owner from file location
// 3. Routes controls to processors (parallel)
// 4. Merges all violations
// 5. Outputs unified JSON report

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import type { LintReport, LintViolation, LoadedControlSet } from "./types.ts";

// Processors
import { processImportExportControls } from "./processors/import-export.processor.ts";
import { processContentPatternControls } from "./processors/content-patterns.processor.ts";
import { processMetricControls } from "./processors/metrics.processor.ts";
import { processStructureControls } from "./processors/structure.processor.ts";
import { processDomainOwnershipControls } from "./processors/domain-ownership.processor.ts";
import { processEslintControls } from "./processors/eslint.processor.ts";
import { processMarkupValidationControls } from "./processors/markup-validation.processor.ts";
import { processJsxExternalAllowlistControls } from "./processors/jsx-external-allowlist.processor.ts";
import { processJsxAstControls } from "./processors/jsx-ast.processor.ts";
import { processCastBoundaryControls } from "./processors/cast-boundary.processor.ts";
import { processDslCoherenceControls } from "./processors/dsl-coherence.processor.ts";
import { processPatternTagsControls } from "./processors/pattern-tags.processor.ts";
import { processLayerDisciplineControls } from "./processors/layer-discipline.processor.ts";

// ── Constants ────────────────────────────────────────────────────

const GLOBAL_CONTROLS_PATH = "scripts/lint/lint-controls.ts";

const PACKAGE_CONTROL_GLOBS = [
  "shared/libs/*/lint-controls.ts",
  "apps/main/slices/*/*/lint-controls.ts",
];

const IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.git/**",
  "**/__test__/**",
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/*.spec.ts",
  "**/*.spec.tsx",
  "**/*.gen.ts",
  "**/*.gen.tsx",
  "**/*.d.ts",
  "**/__proof__/**",
  "**/___ref__*/**",
  "_meta/**",
  "_reference/**",
  // Not runtime code: archived trees and design explorations carry the OLD
  // scaffolding by definition and must not be linted against the new one.
  "_archive/**",
  "slice-design/**",
  "team-cockpit/**",
  "scripts/**",
];

// ── Owner inference ──────────────────────────────────────────────

function inferOwner(controlFilePath: string): string {
  // scripts/lint/lint-controls.ts → "global"
  if (controlFilePath.startsWith("scripts/lint/")) return "global";

  // shared/libs/scoped-ac/lint-controls.ts → "lib/scoped-ac"
  const libMatch = controlFilePath.match(/^shared\/libs\/([^/]+)\//);
  if (libMatch) return `lib/${libMatch[1]}`;

  // apps/main/slices/seed/user-organization-mgmt/lint-controls.ts → "seed/user-organization-mgmt"
  // apps/main/slices/product/digest/lint-controls.ts            → "product/digest"
  const sliceMatch = controlFilePath.match(/^apps\/main\/slices\/(seed|product)\/([^/]+)\//);
  if (sliceMatch) return `${sliceMatch[1]}/${sliceMatch[2]}`;

  return "unknown";
}

// ── Discovery ────────────────────────────────────────────────────

async function discoverControlSets(rootDir: string): Promise<LoadedControlSet[]> {
  const controlSets: LoadedControlSet[] = [];

  // Load global control set
  const globalAbsPath = path.join(rootDir, GLOBAL_CONTROLS_PATH);
  try {
    const mod = await import(globalAbsPath);
    const controls = mod.default ?? mod.controls;
    if (controls) {
      controlSets.push({
        filePath: globalAbsPath,
        packageDir: "scripts/lint",
        owner: "global",
        controls,
      });
    }
  } catch (err) {
    console.error("Failed to load global controls:", err);
  }

  // Load package control sets
  for (const pattern of PACKAGE_CONTROL_GLOBS) {
    const matches = await glob(pattern, { cwd: rootDir });
    for (const match of matches) {
      try {
        const absPath = path.join(rootDir, match);
        const mod = await import(absPath);
        const controls = mod.default ?? mod.controls;
        if (controls) {
          controlSets.push({
            filePath: absPath,
            packageDir: path.dirname(match),
            owner: inferOwner(match),
            controls,
          });
        }
      } catch (err) {
        console.error(`Failed to load controls: ${match}`, err);
      }
    }
  }

  return controlSets;
}

// ── Merge source globs ───────────────────────────────────────────

function mergeSourceGlobs(controlSets: LoadedControlSet[]): string[] {
  const globs: string[] = [];
  for (const cs of controlSets) {
    for (const g of cs.controls.sourceGlobs) {
      // Package globs are relative to package dir
      if (cs.owner === "global") {
        globs.push(g);
      } else {
        globs.push(`${cs.packageDir}/${g}`);
      }
    }
  }
  return [...new Set(globs)];
}

// ── Aggregate violations ─────────────────────────────────────────
// Collapse multiple violations of the same control ID + same file + same message
// into a single violation with all line numbers listed.
// Different messages = different findings = separate entries.

function aggregateViolations(violations: LintViolation[]): LintViolation[] {
  const map = new Map<string, LintViolation>();

  for (const v of violations) {
    const key = `${v.id}::${v.file}::${v.message}`;
    const existing = map.get(key);

    if (existing) {
      const existingLines = existing.lines ?? [];
      const newLines = v.lines ?? [];
      existing.lines = [...existingLines, ...newLines];
    } else {
      map.set(key, { ...v, lines: v.lines ?? [] });
    }
  }

  return [...map.values()];
}

// ── Build report ─────────────────────────────────────────────────

function buildReport(violations: LintViolation[], durationMs: number): LintReport {
  const summary = { errors: 0, warnings: 0, infos: 0, total: violations.length };
  const byOwner: LintReport["byOwner"] = {};
  const byProcessor: LintReport["byProcessor"] = {};

  for (const v of violations) {
    if (v.severity === "error") summary.errors++;
    else if (v.severity === "warn") summary.warnings++;
    else summary.infos++;

    if (!byOwner[v.owner]) byOwner[v.owner] = { errors: 0, warnings: 0, infos: 0 };
    if (!byProcessor[v.processor]) byProcessor[v.processor] = { errors: 0, warnings: 0, infos: 0 };

    const ownerBucket = byOwner[v.owner];
    const procBucket = byProcessor[v.processor];

    if (v.severity === "error") { ownerBucket.errors++; procBucket.errors++; }
    else if (v.severity === "warn") { ownerBucket.warnings++; procBucket.warnings++; }
    else { ownerBucket.infos++; procBucket.infos++; }
  }

  return { timestamp: new Date().toISOString(), durationMs, summary, byOwner, byProcessor, violations };
}

// ── Main ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startTime = Date.now();
  const rootDir = path.resolve(import.meta.dirname ?? ".", "../..");

  console.log("Prowd Lint — One Config, One Pipeline, One Output\n");

  // 1. Discover control sets
  const controlSets = await discoverControlSets(rootDir);
  console.log(`  Control sets: ${controlSets.length}`);
  for (const cs of controlSets) {
    console.log(`    - ${cs.owner} (${cs.packageDir})`);
  }

  // 2. Merge source globs
  const allSourceGlobs = mergeSourceGlobs(controlSets);
  const processorCtx = { rootDir, allSourceGlobs, ignorePatterns: IGNORE_PATTERNS };

  // 3. Run all processors in parallel
  console.log("\n  Running processors...\n");

  const results = await Promise.allSettled([
    processImportExportControls(controlSets, processorCtx)
      .then((v) => { console.log(`  import-export: ${v.length} violation(s)`); return v; }),
    processContentPatternControls(controlSets, processorCtx)
      .then((v) => { console.log(`  content-patterns: ${v.length} violation(s)`); return v; }),
    processMetricControls(controlSets, processorCtx)
      .then((v) => { console.log(`  metrics: ${v.length} violation(s)`); return v; }),
    processStructureControls(controlSets, { rootDir, ignorePatterns: IGNORE_PATTERNS })
      .then((v) => { console.log(`  structure: ${v.length} violation(s)`); return v; }),
    processDomainOwnershipControls(controlSets, processorCtx)
      .then((v) => { console.log(`  domain-ownership: ${v.length} violation(s)`); return v; }),
    processEslintControls(controlSets, processorCtx)
      .then((v) => { console.log(`  eslint: ${v.length} violation(s)`); return v; })
      .catch((err) => { console.error("  eslint processor failed:", err); return [] as LintViolation[]; }),
    processMarkupValidationControls(controlSets, processorCtx)
      .then((v) => { console.log(`  markup-validation: ${v.length} violation(s)`); return v; }),
    // JSX External Allowlist — iterate controls from all control sets
    (async () => {
      const all: LintViolation[] = [];
      for (const cs of controlSets) {
        const controls = cs.controls["jsx-external-allowlist"];
        if (!controls) continue;
        for (const config of controls) {
          if (config.enabled === false) continue;
          const v = await processJsxExternalAllowlistControls(config, processorCtx);
          all.push(...v);
        }
      }
      console.log(`  jsx-external-allowlist: ${all.length} violation(s)`);
      return all;
    })(),
    // JSX AST — extract config from global controls
    (async () => {
      const globalCs = controlSets.find((cs) => cs.owner === "global");
      const config = globalCs?.controls["jsx-ast"];
      if (!config) return [] as LintViolation[];
      const v = await processJsxAstControls(config, processorCtx);
      console.log(`  jsx-ast: ${v.length} violation(s)`);
      return v;
    })(),
    // Cast boundary — allowlist-gated `as` cast enforcement
    processCastBoundaryControls(controlSets, processorCtx)
      .then((v) => { console.log(`  cast-boundary: ${v.length} violation(s)`); return v; }),
    // DSL coherence — detect incoherent role declarations in .ac.ts files
    processDslCoherenceControls(controlSets, processorCtx)
      .then((v) => { console.log(`  dsl-coherence: ${v.length} violation(s)`); return v; }),
    // Pattern tags — enforce closed authorized set of [PATTERN:X] tags on guarded engine calls
    processPatternTagsControls(controlSets, processorCtx)
      .then((v) => { console.log(`  pattern-tags: ${v.length} violation(s)`); return v; }),
    // Layer discipline — universal layer ordering invariant (model<repo<service<router, api<hooks<components<pages)
    processLayerDisciplineControls(controlSets, processorCtx)
      .then((v) => { console.log(`  layer-discipline: ${v.length} violation(s)`); return v; }),
  ]);

  // 4. Merge all violations
  const allViolations: LintViolation[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allViolations.push(...result.value);
    } else {
      console.error("  Processor failed:", result.reason);
    }
  }

  // 5. Aggregate + build report
  const aggregated = aggregateViolations(allViolations);
  const durationMs = Date.now() - startTime;
  const report = buildReport(aggregated, durationMs);

  // Print summary
  console.log("\n────────────────────────────────────────────");
  console.log(`  Errors:   ${report.summary.errors}`);
  console.log(`  Warnings: ${report.summary.warnings}`);
  console.log(`  Infos:    ${report.summary.infos}`);
  console.log(`  Duration: ${durationMs}ms`);
  console.log("────────────────────────────────────────────\n");

  // Print violations (errors and warnings)
  for (const v of aggregated) {
    if (v.severity === "info") continue;
    const sev = v.severity === "error" ? "ERROR" : "WARN ";
    const lineInfo = v.lines && v.lines.length > 0 ? `:${v.lines[0]}` + (v.lines.length > 1 ? ` (+${v.lines.length - 1} more)` : "") : "";
    const loc = `${v.file}${lineInfo}`;
    console.log(`  ${sev} [${v.id}] ${loc}`);
    console.log(`         ${v.message}`);
  }

  // 6. Write JSON report
  const reportDir = path.join(rootDir, "scripts/lint");
  const reportPath = path.join(reportDir, ".lint-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Write historical run
  const runsDir = path.join(reportDir, "runs");
  fs.mkdirSync(runsDir, { recursive: true });
  const runId = report.timestamp.replace(/[:.]/g, "-");
  fs.writeFileSync(path.join(runsDir, `${runId}.json`), JSON.stringify(report, null, 2));

  // Update runs index
  const indexPath = path.join(runsDir, "index.json");
  let index: Array<{ id: string; timestamp: string; summary: typeof report.summary }> = [];
  if (fs.existsSync(indexPath)) {
    try { index = JSON.parse(fs.readFileSync(indexPath, "utf-8")); } catch { index = []; }
  }
  index.unshift({ id: runId, timestamp: report.timestamp, summary: report.summary });
  if (index.length > 100) index = index.slice(0, 100);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

  console.log(`\n  Report: scripts/lint/.lint-report.json`);
  console.log(`  Run: scripts/lint/runs/${runId}.json`);

  if (report.summary.errors > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Lint runner failed:", err);
  process.exit(2);
});
