// ── Content Patterns Processor ─────────────────────────────────────
// Evaluates ContentPatternControl rules: regex matching on file content.
// Supports single-line and consecutive-block matching.

import type {
  ContentPatternControl,
  LintViolation,
  LoadedControlSet,
} from "../types.ts";
import {
  getSourceFiles,
  readFile,
  pathMatchesPattern,
} from "../utils/files.ts";

interface ProcessorContext {
  rootDir: string;
  allSourceGlobs: string[];
  ignorePatterns: string[];
}

export async function processContentPatternControls(
  controlSets: LoadedControlSet[],
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const violations: LintViolation[] = [];
  const files = await getSourceFiles(ctx.rootDir, ctx.allSourceGlobs, ctx.ignorePatterns);

  // Collect all controls
  const allControls: Array<{ control: ContentPatternControl; owner: string }> = [];
  for (const cs of controlSets) {
    if (!cs.controls["content-patterns"]) continue;
    for (const control of cs.controls["content-patterns"]) {
      if (control.enabled === false) continue;
      allControls.push({ control, owner: cs.owner });
    }
  }

  if (allControls.length === 0) return violations;

  for (const file of files) {
    const content = readFile(ctx.rootDir, file);
    if (!content) continue;

    for (const { control, owner } of allControls) {
      // Scope check
      if (control.in && !pathMatchesPattern(file, control.in)) continue;
      if (control.notIn && pathMatchesPattern(file, control.notIn)) continue;

      // Exception check
      if (isFileExcepted(control, file)) continue;

      if (control.type === "line") {
        violations.push(...evaluateLine(control, owner, file, content));
      } else if (control.type === "block") {
        violations.push(...evaluateBlock(control, owner, file, content));
      } else if (control.type === "co-occurrence") {
        violations.push(...evaluateCoOccurrence(control, owner, file, content));
      }
    }
  }

  return violations;
}

function evaluateLine(
  control: ContentPatternControl,
  owner: string,
  file: string,
  content: string,
): LintViolation[] {
  const violations: LintViolation[] = [];
  const patterns = Array.isArray(control.match) ? control.match : [control.match];
  const regexes = patterns.map((p) => new RegExp(p));
  const skipRegex = control.skipIfNearby ? new RegExp(control.skipIfNearby) : null;
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

    for (const regex of regexes) {
      regex.lastIndex = 0;
      if (regex.test(line)) {
        // Suppression: same line or immediately preceding non-blank line carries the annotation
        if (skipRegex) {
          skipRegex.lastIndex = 0;
          if (skipRegex.test(line)) break;
          let j = i - 1;
          while (j >= 0 && lines[j].trim() === "") j--;
          if (j >= 0) {
            skipRegex.lastIndex = 0;
            if (skipRegex.test(lines[j])) break;
          }
        }
        violations.push({
          id: control.id,
          owner,
          processor: "content-patterns",
          severity: control.severity,
          file,
          lines: [i + 1],
          message: control.message ?? control.description,
        });
        break; // One violation per line per control
      }
    }
  }

  return violations;
}

function evaluateBlock(
  control: ContentPatternControl,
  owner: string,
  file: string,
  content: string,
): LintViolation[] {
  const violations: LintViolation[] = [];
  const patterns = Array.isArray(control.match) ? control.match : [control.match];
  const regexes = patterns.map((p) => new RegExp(p));
  const minLines = control.minLines ?? 3;
  const lines = content.split("\n");

  let consecutiveCount = 0;
  let blockStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const matchesAny = regexes.some((r) => {
      r.lastIndex = 0;
      return r.test(lines[i]);
    });

    if (matchesAny) {
      if (consecutiveCount === 0) blockStart = i + 1;
      consecutiveCount++;
    } else {
      if (consecutiveCount >= minLines) {
        violations.push({
          id: control.id,
          owner,
          processor: "content-patterns",
          severity: control.severity,
          file,
          lines: [blockStart],
          message: control.message ?? `${consecutiveCount} consecutive matching lines. ${control.description}`,
        });
      }
      consecutiveCount = 0;
    }
  }

  // Check end of file
  if (consecutiveCount >= minLines) {
    violations.push({
      id: control.id,
      owner,
      processor: "content-patterns",
      severity: control.severity,
      file,
      lines: [blockStart],
      message: control.message ?? `${consecutiveCount} consecutive matching lines. ${control.description}`,
    });
  }

  return violations;
}

function isFileExcepted(control: ContentPatternControl, file: string): boolean {
  if (!control.exceptions) return false;
  return control.exceptions.some((exc) => exc.in && pathMatchesPattern(file, exc.in));
}

// ── Co-occurrence check ──────────────────────────────────────────
// If trigger patterns appear, mustCoexist patterns must also appear
// in the same scope. Scope is function-body for code patterns,
// or the whole file if triggers are found outside function bodies (e.g., imports).

function evaluateCoOccurrence(
  control: ContentPatternControl,
  owner: string,
  file: string,
  content: string,
): LintViolation[] {
  const violations: LintViolation[] = [];
  if (!control.mustCoexist || control.mustCoexist.length === 0) return violations;

  const triggerPatterns = Array.isArray(control.match) ? control.match : [control.match];
  const triggerRegexes = triggerPatterns.map((p) => new RegExp(p));
  const coexistRegexes = control.mustCoexist.map((p) => new RegExp(p));

  const allLines = content.split("\n");

  // First: check at function-body scope
  const functions = extractFunctionBodies(content);
  let foundInFunctions = false;

  for (const fn of functions) {
    const triggerLines: number[] = [];
    for (let i = fn.startLine; i <= fn.endLine; i++) {
      const line = fn.lines[i - fn.startLine];
      if (!line) continue;
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

      for (const regex of triggerRegexes) {
        regex.lastIndex = 0;
        if (regex.test(line)) {
          triggerLines.push(i);
          foundInFunctions = true;
          break;
        }
      }
    }

    if (triggerLines.length === 0) continue;

    const bodyText = fn.lines.join("\n");
    const hasCoexist = coexistRegexes.some((r) => { r.lastIndex = 0; return r.test(bodyText); });

    if (!hasCoexist) {
      for (const triggerLine of triggerLines) {
        violations.push({
          id: control.id, owner, processor: "content-patterns",
          severity: control.severity, file, lines: [triggerLine],
          message: control.message ?? control.description,
        });
      }
    }
  }

  // Second: if no triggers were found in function bodies, check at file scope.
  // This catches cases where the trigger is in imports (outside functions).
  if (!foundInFunctions) {
    const fileTriggerLines: number[] = [];
    for (let i = 0; i < allLines.length; i++) {
      const trimmed = allLines[i].trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
      for (const regex of triggerRegexes) {
        regex.lastIndex = 0;
        if (regex.test(allLines[i])) {
          fileTriggerLines.push(i + 1);
          break;
        }
      }
    }

    if (fileTriggerLines.length > 0) {
      const hasCoexist = coexistRegexes.some((r) => { r.lastIndex = 0; return r.test(content); });
      if (!hasCoexist) {
        violations.push({
          id: control.id, owner, processor: "content-patterns",
          severity: control.severity, file, lines: fileTriggerLines,
          message: control.message ?? control.description,
        });
      }
    }
  }

  return violations;
}

interface FunctionBody {
  startLine: number;
  endLine: number;
  lines: string[];
}

function extractFunctionBodies(content: string): FunctionBody[] {
  const allLines = content.split("\n");
  const functions: FunctionBody[] = [];

  const funcStartPattern = /^\s*(?:export\s+)?(?:async\s+)?(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\(|(?:async\s+)?\w+\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{)/;

  for (let i = 0; i < allLines.length; i++) {
    if (!funcStartPattern.test(allLines[i])) continue;

    // Find the opening brace
    let braceStart = -1;
    for (let j = i; j < Math.min(i + 5, allLines.length); j++) {
      if (allLines[j].includes("{")) {
        braceStart = j;
        break;
      }
    }
    if (braceStart === -1) continue;

    // Count braces to find the closing
    let depth = 0;
    let endLine = braceStart;
    for (let j = braceStart; j < allLines.length; j++) {
      for (const ch of allLines[j]) {
        if (ch === "{") depth++;
        if (ch === "}") depth--;
      }
      if (depth === 0) {
        endLine = j;
        break;
      }
    }

    functions.push({
      startLine: i + 1, // 1-indexed
      endLine: endLine + 1,
      lines: allLines.slice(i, endLine + 1),
    });

    i = endLine; // Skip past this function
  }

  return functions;
}
