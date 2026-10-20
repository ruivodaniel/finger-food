// ── Structure Processor ───────────────────────────────────────────
// Evaluates StructureControl rules: file/folder existence, naming.

import * as path from "path";
import { glob } from "glob";
import type {
  StructureControl,
  LintViolation,
  LoadedControlSet,
} from "../types.ts";
import {
  listFilesInDir,
  pathMatchesPattern,
} from "../utils/files.ts";

interface ProcessorContext {
  rootDir: string;
  ignorePatterns: string[];
}

export async function processStructureControls(
  controlSets: LoadedControlSet[],
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const violations: LintViolation[] = [];

  // Collect all controls
  const allControls: Array<{ control: StructureControl; owner: string }> = [];
  for (const cs of controlSets) {
    if (!cs.controls.structure) continue;
    for (const control of cs.controls.structure) {
      if (control.enabled === false) continue;
      allControls.push({ control, owner: cs.owner });
    }
  }

  if (allControls.length === 0) return violations;

  for (const { control, owner } of allControls) {
    switch (control.type) {
      case "required":
        violations.push(...await checkRequired(control, owner, ctx));
        break;
      case "forbidden":
        violations.push(...await checkForbidden(control, owner, ctx));
        break;
      case "naming":
        violations.push(...await checkNaming(control, owner, ctx));
        break;
    }
  }

  return violations;
}

async function checkRequired(
  control: StructureControl,
  owner: string,
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const violations: LintViolation[] = [];

  // Resolve the glob to find matching paths
  const matches = await glob(control.path, { cwd: ctx.rootDir });

  if (matches.length === 0) {
    violations.push({
      id: control.id,
      owner,
      processor: "structure",
      severity: control.severity,
      file: control.path,
      message: control.message ?? `Required path "${control.path}" does not exist. ${control.description}`,
    });
    return violations;
  }

  // Check mustNotBeEmpty
  if (control.mustNotBeEmpty) {
    for (const match of matches) {
      const absPath = path.join(ctx.rootDir, match);
      const files = listFilesInDir(absPath);
      if (files.length === 0) {
        violations.push({
          id: control.id,
          owner,
          processor: "structure",
          severity: control.severity,
          file: match,
          message: control.message ?? `Required directory "${match}" is empty. ${control.description}`,
        });
      }
    }
  }

  return violations;
}

async function checkForbidden(
  control: StructureControl,
  owner: string,
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const violations: LintViolation[] = [];

  const matches = await glob(control.path, {
    cwd: ctx.rootDir,
    ignore: ctx.ignorePatterns,
  });

  for (const match of matches) {
    const fileName = path.basename(match);

    // Check allowed exceptions
    if (control.allowedFiles && control.allowedFiles.includes(fileName)) continue;

    // Check path exceptions
    if (control.exceptions?.some((exc) => pathMatchesPattern(match, exc.path))) continue;

    violations.push({
      id: control.id,
      owner,
      processor: "structure",
      severity: control.severity,
      file: match,
      message: control.message ?? `File "${match}" is not allowed here. ${control.description}`,
    });
  }

  return violations;
}

async function checkNaming(
  control: StructureControl,
  owner: string,
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const violations: LintViolation[] = [];
  if (!control.pattern) return violations;

  // Find directories matching the path
  const dirs = await glob(control.path, {
    cwd: ctx.rootDir,
    ignore: ctx.ignorePatterns,
  });

  // Build regex from glob pattern
  const patternRegex = new RegExp(
    "^" + control.pattern
      .replace(/\./g, "\\.")
      .replace(/\*/g, ".*") + "$"
  );

  for (const dir of dirs) {
    const absDir = path.join(ctx.rootDir, dir);
    const files = listFilesInDir(absDir).filter(
      (f) => (f.endsWith(".ts") || f.endsWith(".tsx"))
        && f !== "index.ts"
        && !f.endsWith(".test.ts")
        && !f.endsWith(".spec.ts")
    );

    for (const file of files) {
      if (!patternRegex.test(file)) {
        // Check exceptions
        const fullPath = `${dir}${file}`;
        if (control.exceptions?.some((exc) => pathMatchesPattern(fullPath, exc.path))) continue;

        violations.push({
          id: control.id,
          owner,
          processor: "structure",
          severity: control.severity,
          file: `${dir}${file}`,
          message: control.message ?? `File "${file}" does not match pattern "${control.pattern}". ${control.description}`,
        });
      }
    }
  }

  return violations;
}
