// ── Pattern Tags Processor ───────────────────────────────────────────
// Enforces the closed authorized set of access-control pattern tags
// ([PATTERN:X] comments) across service and repository files.
//
// Three enforcement layers:
//   1. Unauthorized tag    — [PATTERN:X] where X ∉ authorized list → ERROR
//   2. Tag requirements    — tagged method body missing a required call → ERROR
//   3. Naked call          — guarded engine call in a non-private, untagged method → ERROR
//
// Method body extraction uses line-level net-brace tracking with a "committed"
// flag: depth > 0 at end-of-line commits the scanner into the method body.
// This correctly ignores inline type literals { id: string } (net = 0 on same line).

import { glob } from "glob";
import type { LintViolation, LoadedControlSet, PatternTagsConfig } from "../types.ts";
import { readFile, pathMatchesPattern } from "../utils/files.ts";

interface ProcessorContext {
  rootDir: string;
  allSourceGlobs: string[];
  ignorePatterns: string[];
}

// ── String stripping ────────────────────────────────────────────────
// Remove quoted string and template literal contents before brace counting.

function stripStrings(line: string): string {
  return line.replace(
    /`[^`\\]*(?:\\.[^`\\]*)*`|'[^'\\]*(?:\\.[^'\\]*)*'|"[^"\\]*(?:\\.[^"\\]*)*"/g,
    '""',
  );
}

// ── Net brace delta on a single line ────────────────────────────────

function netBraces(line: string): number {
  const safe = stripStrings(line);
  let net = 0;
  for (const ch of safe) {
    if (ch === "{") net++;
    else if (ch === "}") net--;
  }
  return net;
}

// ── Method body extraction ───────────────────────────────────────────
// Starting from tagLineIdx (0-indexed), scan forward to find the method
// signature and extract its full body.
//
// Returns null if no method body is found within 5 lines of the tag.

interface ExtractedMethod {
  signatureText: string;
  bodyText: string;
  isPrivate: boolean;
  signatureLine: number; // 1-indexed line of signature start
  bodyStartLine: number; // 1-indexed
  bodyEndLine: number;   // 1-indexed
}

function extractMethodBody(lines: string[], tagLineIdx: number): ExtractedMethod | null {
  // Find the first non-blank, non-comment line after the tag
  let sigStart = -1;
  for (let i = tagLineIdx + 1; i < Math.min(tagLineIdx + 8, lines.length); i++) {
    const trimmed = lines[i].trimStart();
    if (trimmed === "" || trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
    sigStart = i;
    break;
  }
  if (sigStart === -1) return null;

  // Collect lines from sigStart using committed-brace approach.
  // The "committed" flag fires when depth first goes > 0 (body { opens).
  let depth = 0;
  let committed = false;
  let bodyStartLine = -1;
  let bodyEndLine = -1;
  const sigLines: string[] = [];
  const bodyLines: string[] = [];

  for (let i = sigStart; i < lines.length; i++) {
    const net = netBraces(lines[i]);
    depth += net;

    if (!committed) {
      sigLines.push(lines[i]);
      if (depth > 0) {
        committed = true;
        bodyStartLine = i + 1; // 1-indexed
        bodyLines.push(lines[i]);
      }
    } else {
      bodyLines.push(lines[i]);
      if (depth <= 0) {
        bodyEndLine = i + 1; // 1-indexed
        break;
      }
    }
  }

  if (!committed || bodyEndLine === -1) return null;

  const signatureText = sigLines.join("\n");
  const isPrivate = /\bprivate\b/.test(signatureText) || /\bprotected\b/.test(signatureText);

  return {
    signatureText,
    bodyText: bodyLines.join("\n"),
    isPrivate,
    signatureLine: sigStart + 1,
    bodyStartLine,
    bodyEndLine,
  };
}

// ── Find enclosing method for a given line ────────────────────────────
// Scans backward from lineIdx (0-indexed) to find the method that contains it.
// Returns info about the enclosing method, or null if not found within 250 lines.
//
// Algorithm: scan backward tracking brace depth (reversed: } opens, { closes).
// When depth goes negative, we've found the opening { of the innermost enclosing block.
// If that block looks like a method signature, we're done.
// If it looks like a nested block (if/for/arrow fn), reset depth and keep scanning.

interface EnclosingMethod {
  isPrivate: boolean;
  tagLine: number | null; // 1-indexed
  tag: string | null;
  signatureText: string;
}

function findEnclosingMethod(lines: string[], lineIdx: number): EnclosingMethod | null {
  let depth = 0;

  for (let i = lineIdx - 1; i >= Math.max(0, lineIdx - 250); i--) {
    const safe = stripStrings(lines[i]);
    // Scan characters in reverse
    for (let j = safe.length - 1; j >= 0; j--) {
      if (safe[j] === "}") depth++;
      else if (safe[j] === "{") depth--;
    }

    if (depth < 0) {
      // This line contains the opening { of an enclosing block.
      const line = lines[i];

      // Case A: single-line signature  →  "async foo(...) {"
      // Case B: multi-line signature ending with closing paren  →  ") {"  or  "): ReturnType {"
      //         The actual method name is on a preceding line.
      // Case C: nested block (if/for/arrow fn)  →  reset and keep scanning.

      let sigStartLine = i; // where the method name lives

      if (!isClassMethodSignature(line)) {
        // Check if this looks like a multi-line param list closer:
        // ") {", "): ReturnType {", ") : ReturnType {"
        const trimmed = line.trimStart();
        const isParamListCloser = /^\)\s*(?::\s*[\w<>[\]|&., \n?]+)?\s*\{/.test(trimmed);

        if (isParamListCloser) {
          // Scan backward to find the line with the method name + opening (
          let found = false;
          for (let j = i - 1; j >= Math.max(0, i - 20); j--) {
            const prev = lines[j];
            if (isClassMethodSignature(prev)) {
              sigStartLine = j;
              found = true;
              break;
            }
            // Stop if we hit a closing brace (end of previous method)
            if (/^\s*\}/.test(prev)) break;
          }
          if (!found) {
            depth = 0;
            continue;
          }
        } else {
          // Nested block (if/for/switch/arrow fn) — reset and keep scanning.
          depth = 0;
          continue;
        }
      }

      // Collect full signature text from sigStartLine to i (inclusive)
      let sigText = lines.slice(sigStartLine, i + 1).join("\n");

      const isPrivate =
        /\bprivate\b/.test(sigText) || /\bprotected\b/.test(sigText);

      // Look for a preceding [PATTERN:X] tag — scan backward from sigStartLine
      let tagLine: number | null = null;
      let tag: string | null = null;
      for (let j = sigStartLine - 1; j >= Math.max(0, sigStartLine - 8); j--) {
        const prev = lines[j];
        const tagMatch = prev.match(/\/\/\s*\[(AC:[^\]]+)\]/);
        if (tagMatch) {
          tagLine = j + 1; // 1-indexed
          tag = tagMatch[1].trim();
          break;
        }
        if (!/^\s*(\/\/|$)/.test(prev)) break;
      }

      return { isPrivate, tagLine, tag, signatureText: sigText };
    }
  }

  return null;
}

// ── Method signature detector ────────────────────────────────────────
// Returns true if the line looks like a class method declaration
// (as opposed to a nested arrow function, if/for block, etc.).

function isClassMethodSignature(line: string): boolean {
  const trimmed = line.trimStart();
  // Must not be a comment
  if (trimmed.startsWith("//") || trimmed.startsWith("*")) return false;
  // Must not be a plain closing brace or decorator
  if (/^\}/.test(trimmed) || trimmed.startsWith("@")) return false;
  // Arrow functions assigned to properties: skip (they're private by convention)
  if (/=\s*(?:async\s+)?\(/.test(line) || /=\s*(?:async\s+)?function/.test(line)) return false;
  // Control flow keywords must not be mistaken for method names
  if (/^\s*(if|else|for|while|switch|do|try|catch|finally|return|throw|case)\b/.test(line)) return false;
  // Must match: optional modifiers + identifier + ( pattern
  // Modifiers: private, protected, public, static, override, abstract, async, readonly
  return /^\s*(?:(?:private|protected|public|static|override|abstract|async|readonly)\s+)*\w[\w$]*\s*[(<]/.test(
    line,
  );
}

// ── Check 1: Unauthorized tags ────────────────────────────────────────

function checkUnauthorizedTags(
  lines: string[],
  file: string,
  authorized: string[],
  controlId: string,
  owner: string,
): LintViolation[] {
  const violations: LintViolation[] = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/\/\/\s*\[(AC:[^\]]+)\]/);
    if (!match) continue;
    const tag = match[1].trim();
    if (!authorized.includes(tag)) {
      violations.push({
        id: controlId,
        owner,
        processor: "pattern-tags",
        severity: "error",
        file,
        lines: [i + 1],
        message: `Unknown pattern tag [${tag}]. Authorized patterns: ${authorized.join(", ")}.`,
      });
    }
  }
  return violations;
}

// ── Check 2: Tag requirements ──────────────────────────────────────────

function checkTagRequirements(
  lines: string[],
  file: string,
  config: PatternTagsConfig,
  controlId: string,
  owner: string,
): LintViolation[] {
  const violations: LintViolation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const tagMatch = lines[i].match(/\/\/\s*\[(AC:[^\]]+)\]/);
    if (!tagMatch) continue;
    const tag = tagMatch[1].trim();

    const defn = config.definitions.find((d) => d.name === tag);
    if (!defn) continue; // unauthorized tags handled in check 1

    // File constraint check
    if (defn.in) {
      const patterns = Array.isArray(defn.in) ? defn.in : [defn.in];
      const matchesFile = patterns.some((p) => pathMatchesPattern(file, p));
      if (!matchesFile) {
        violations.push({
          id: controlId,
          owner,
          processor: "pattern-tags",
          severity: "error",
          file,
          lines: [i + 1],
          message: `[${tag}] is only valid in files matching: ${patterns.join(", ")}. Found in: ${file}`,
        });
        continue;
      }
    }

    // Extract method body
    const method = extractMethodBody(lines, i);
    if (!method) continue; // no method follows — can't check

    const body = method.bodyText;

    // Requirement checks
    if (defn.requires) {
      for (const req of defn.requires) {
        const patterns = Array.isArray(req.match) ? req.match : [req.match];
        const found = patterns.some((p) => new RegExp(p).test(body));
        if (!found) {
          const patternDesc =
            patterns.length === 1
              ? `/${patterns[0]}/`
              : `one of: ${patterns.map((p) => `/${p}/`).join(", ")}`;
          violations.push({
            id: controlId,
            owner,
            processor: "pattern-tags",
            severity: "error",
            file,
            lines: [method.signatureLine],
            message: `[${tag}] method missing required ${req.description} (${patternDesc}).`,
          });
        }
      }
    }

    // Coherence checks
    if (defn.coherence) {
      for (const rule of defn.coherence) {
        const m1 = body.match(new RegExp(rule.extract1));
        if (!m1) continue; // extract1 didn't match — rule doesn't activate

        if (rule.checkIn !== undefined) {
          // Conditional presence check: extract1 matched → checkIn must also match
          if (!new RegExp(rule.checkIn).test(body)) {
            violations.push({
              id: controlId,
              owner,
              processor: "pattern-tags",
              severity: "error",
              file,
              lines: [method.signatureLine],
              message: `[${tag}] coherence failure — ${rule.description}.`,
            });
          }
        } else if (rule.extract2 !== undefined) {
          // Value equality check: extract1[1] must equal extract2[1]
          const m2 = body.match(new RegExp(rule.extract2));
          if (m2 && m1[1] !== m2[1]) {
            violations.push({
              id: controlId,
              owner,
              processor: "pattern-tags",
              severity: "error",
              file,
              lines: [method.signatureLine],
              message:
                `[${tag}] coherence failure — ${rule.description}: ` +
                `"${m1[1]}" vs "${m2[1]}".`,
            });
          }
        }
      }
    }
  }

  return violations;
}

// ── Check 3: Naked engine calls ────────────────────────────────────────
// Finds guarded calls that appear outside tagged or private methods.

function checkNakedCalls(
  lines: string[],
  file: string,
  config: PatternTagsConfig,
  controlId: string,
  owner: string,
): LintViolation[] {
  if (!config.guardedCalls?.length) return [];
  const violations: LintViolation[] = [];

  for (const guardedCall of config.guardedCalls) {
    // Check file scope
    const filePatterns = Array.isArray(guardedCall.in) ? guardedCall.in : [guardedCall.in];
    if (!filePatterns.some((p) => pathMatchesPattern(file, p))) continue;

    const callRegex = new RegExp(guardedCall.match);

    for (let i = 0; i < lines.length; i++) {
      if (!callRegex.test(lines[i])) continue;

      // Find the enclosing method
      const enclosing = findEnclosingMethod(lines, i);
      if (!enclosing) continue; // can't determine context — skip

      // Private/protected methods are exempt (internal helpers)
      if (enclosing.isPrivate) continue;

      // Tagged methods are authorized
      if (enclosing.tag && config.authorized.includes(enclosing.tag)) continue;

      violations.push({
        id: controlId,
        owner,
        processor: "pattern-tags",
        severity: "error",
        file,
        lines: [i + 1],
        message:
          `Naked ${guardedCall.description} call outside a tagged or private method. ` +
          `Add a // [AC:X] tag before the method (authorized: ${config.authorized.join(", ")}). See docs/01_reference/access-control.md#patterns.`,
      });
    }
  }

  return violations;
}

// ── Main export ──────────────────────────────────────────────────────

export async function processPatternTagsControls(
  controlSets: LoadedControlSet[],
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const violations: LintViolation[] = [];

  for (const cs of controlSets) {
    const config = cs.controls["pattern-tags"];
    if (!config || config.enabled === false) continue;

    // Collect files to scan: union of guardedCall in-patterns + definition in-patterns
    const filePatterns = new Set<string>();
    for (const defn of config.definitions) {
      const pats = defn.in ? (Array.isArray(defn.in) ? defn.in : [defn.in]) : [];
      for (const p of pats) filePatterns.add(p);
    }
    for (const gc of config.guardedCalls ?? []) {
      const pats = Array.isArray(gc.in) ? gc.in : [gc.in];
      for (const p of pats) filePatterns.add(p);
    }

    // Also scan all source globs for unauthorized tag detection
    for (const g of ctx.allSourceGlobs) filePatterns.add(g);

    // Deduplicate and resolve files
    const allFiles = new Set<string>();
    for (const pattern of filePatterns) {
      const matches = await glob(pattern, {
        cwd: ctx.rootDir,
        ignore: ctx.ignorePatterns,
      });
      for (const f of matches) allFiles.add(f);
    }

    for (const file of allFiles) {
      if (config.exceptions?.some((exc) => {
        const pats = Array.isArray(exc.in) ? exc.in : [exc.in];
        return pats.some((p) => pathMatchesPattern(file, p));
      })) continue;

      const content = readFile(ctx.rootDir, file);
      if (!content) continue;
      const lines = content.split("\n");

      violations.push(...checkUnauthorizedTags(lines, file, config.authorized, "pattern-tags-auth", cs.owner));
      violations.push(...checkTagRequirements(lines, file, config, "pattern-tags-req", cs.owner));
      violations.push(...checkNakedCalls(lines, file, config, "pattern-tags-naked", cs.owner));
    }
  }

  return violations;
}
