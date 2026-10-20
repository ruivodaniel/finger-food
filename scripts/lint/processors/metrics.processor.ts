// ── Metrics Processor ─────────────────────────────────────────────
// Evaluates MetricControl rules: file lines, folder files,
// function lines, function params.

import * as path from "path";
import { glob } from "glob";
import type {
  MetricControl,
  LintViolation,
  LoadedControlSet,
} from "../types.ts";
import {
  getSourceFiles,
  readFile,
  countLines,
  listFilesInDir,
  pathMatchesPattern,
} from "../utils/files.ts";
import { extractFunctions } from "../utils/ast.ts";

interface ProcessorContext {
  rootDir: string;
  allSourceGlobs: string[];
  ignorePatterns: string[];
}

export async function processMetricControls(
  controlSets: LoadedControlSet[],
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const violations: LintViolation[] = [];

  // Collect all controls
  const allControls: Array<{ control: MetricControl; owner: string }> = [];
  for (const cs of controlSets) {
    if (!cs.controls.metrics) continue;
    for (const control of cs.controls.metrics) {
      if (control.enabled === false) continue;
      allControls.push({ control, owner: cs.owner });
    }
  }

  if (allControls.length === 0) return violations;

  const files = await getSourceFiles(ctx.rootDir, ctx.allSourceGlobs, ctx.ignorePatterns);

  for (const { control, owner } of allControls) {
    switch (control.type) {
      case "file-lines":
        violations.push(...await checkFileLines(control, owner, files, ctx));
        break;
      case "folder-files":
        violations.push(...await checkFolderFiles(control, owner, files, ctx));
        break;
      case "function-lines":
        violations.push(...await checkFunctionLines(control, owner, files, ctx));
        break;
      case "function-params":
        violations.push(...await checkFunctionParams(control, owner, files, ctx));
        break;
    }
  }

  return violations;
}

function getThresholds(control: MetricControl, file: string): { warn: number; error: number } {
  // Check exceptions for overrides
  if (control.exceptions) {
    for (const exc of control.exceptions) {
      if (pathMatchesPattern(file, exc.in)) {
        return {
          warn: exc.override?.warn ?? control.warn,
          error: exc.override?.error ?? control.error,
        };
      }
    }
  }
  return { warn: control.warn, error: control.error };
}

function isInScope(control: MetricControl, file: string): boolean {
  if (!control.in) return true;
  return pathMatchesPattern(file, control.in);
}

async function checkFileLines(
  control: MetricControl,
  owner: string,
  files: string[],
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const violations: LintViolation[] = [];

  for (const file of files) {
    if (!isInScope(control, file)) continue;

    const content = readFile(ctx.rootDir, file);
    const lines = countLines(content);
    const thresholds = getThresholds(control, file);

    if (lines > thresholds.error) {
      violations.push({
        id: control.id,
        owner,
        processor: "metrics",
        severity: "error",
        file,
        message: control.message ?? `File has ${lines} lines (max ${thresholds.error}). Decompose.`,
      });
    } else if (lines > thresholds.warn) {
      violations.push({
        id: control.id,
        owner,
        processor: "metrics",
        severity: "warn",
        file,
        message: control.message ?? `File has ${lines} lines (review threshold: ${thresholds.warn}).`,
      });
    }
  }

  return violations;
}

async function checkFolderFiles(
  control: MetricControl,
  owner: string,
  files: string[],
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const violations: LintViolation[] = [];

  // Collect unique directories
  const dirs = new Set<string>();
  for (const file of files) {
    if (!isInScope(control, file)) continue;
    dirs.add(path.dirname(file));
  }

  for (const dir of dirs) {
    const absDir = path.join(ctx.rootDir, dir);
    const fileCount = listFilesInDir(absDir).filter(
      (f) => f.endsWith(".ts") || f.endsWith(".tsx")
    ).length;

    const thresholds = getThresholds(control, dir);

    if (fileCount > thresholds.error) {
      violations.push({
        id: control.id,
        owner,
        processor: "metrics",
        severity: "error",
        file: dir,
        message: control.message ?? `Folder has ${fileCount} files (max ${thresholds.error}). Create sub-folders.`,
      });
    } else if (fileCount > thresholds.warn) {
      violations.push({
        id: control.id,
        owner,
        processor: "metrics",
        severity: "warn",
        file: dir,
        message: control.message ?? `Folder has ${fileCount} files (review threshold: ${thresholds.warn}).`,
      });
    }
  }

  return violations;
}

async function checkFunctionLines(
  control: MetricControl,
  owner: string,
  files: string[],
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const violations: LintViolation[] = [];

  for (const file of files) {
    if (!isInScope(control, file)) continue;

    const content = readFile(ctx.rootDir, file);
    const functions = extractFunctions(content);
    const thresholds = getThresholds(control, file);

    for (const fn of functions) {
      if (fn.lineCount > thresholds.error) {
        violations.push({
          id: control.id,
          owner,
          processor: "metrics",
          severity: "error",
          file,
          lines: [fn.line],
          message: control.message ?? `Function "${fn.name}" is ${fn.lineCount} lines (max ${thresholds.error}).`,
        });
      } else if (fn.lineCount > thresholds.warn) {
        violations.push({
          id: control.id,
          owner,
          processor: "metrics",
          severity: "warn",
          file,
          lines: [fn.line],
          message: control.message ?? `Function "${fn.name}" is ${fn.lineCount} lines (review threshold: ${thresholds.warn}).`,
        });
      }
    }
  }

  return violations;
}

async function checkFunctionParams(
  control: MetricControl,
  owner: string,
  files: string[],
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const violations: LintViolation[] = [];

  for (const file of files) {
    if (!isInScope(control, file)) continue;

    const content = readFile(ctx.rootDir, file);
    const functions = extractFunctions(content);
    const thresholds = getThresholds(control, file);

    for (const fn of functions) {
      if (fn.paramCount > thresholds.error) {
        violations.push({
          id: control.id,
          owner,
          processor: "metrics",
          severity: "error",
          file,
          lines: [fn.line],
          message: control.message ?? `Function "${fn.name}" has ${fn.paramCount} params (max ${thresholds.error}). Use options object.`,
        });
      } else if (fn.paramCount > thresholds.warn) {
        violations.push({
          id: control.id,
          owner,
          processor: "metrics",
          severity: "warn",
          file,
          lines: [fn.line],
          message: control.message ?? `Function "${fn.name}" has ${fn.paramCount} params (review threshold: ${thresholds.warn}).`,
        });
      }
    }
  }

  return violations;
}
