// ── DSL Coherence Processor ─────────────────────────────────────────
// Scans access-control DSL rule files (.ac.ts) for incoherent combinations:
//   - An entity block declares "create" or "delete" in its actions array
//   - AND has a traversal (→) target in the same entity block
//
// resolveForCreateDelete cannot follow traversal hops — the joined entity's
// data is not available at create/delete time. The resolver walks only the
// final field path into the properties dict, silently ignoring the hop.
// This produces a rule that always denies, even when the caller has the role.
//
// The correct split pattern:
//   read/update role  → traversal target allowed (resolveForReadUpdate supports it)
//   create/delete role → direct target or empty target only

import { glob } from "glob";
import type { LintViolation, LoadedControlSet } from "../types.ts";
import { readFile, pathMatchesPattern } from "../utils/files.ts";

interface ProcessorContext {
  rootDir: string;
  allSourceGlobs: string[];
  ignorePatterns: string[];
}

// ── Strip string literals ────────────────────────────────────────────
// Removes quoted string contents before brace-counting so that { and }
// inside string values do not perturb the depth tracker.

function stripStrings(line: string): string {
  return line.replace(/'[^'\\]*(?:\\.[^'\\]*)*'|"[^"\\]*(?:\\.[^"\\]*)*"/g, '""');
}

// ── Entity block scanner ─────────────────────────────────────────────
// Tracks brace depth character-by-character to identify entity blocks
// (depth 3 = inside an OrgTypeRuleMap → role → entity nesting).
//
// Depth levels in a .ac.ts file:
//   0 → top level
//   1 → inside the OrgTypeRuleMap object literal
//   2 → inside a role definition block
//   3 → inside an entity definition block  ← where actions + accessRules live
//   4+ → inside accessRules array items

function scanForTraversalCreateDelete(
  content: string,
  file: string,
  controlId: string,
  controlSeverity: "error" | "warn" | "info",
  controlMessage: string,
  owner: string,
): LintViolation[] {
  const lines = content.split("\n");
  const violations: LintViolation[] = [];

  let depth = 0;
  let inEntityBlock = false;
  let hasCreateOrDelete = false;
  const traversalLines: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const safe = stripStrings(line);

    // Compute depth transitions within this line (character-level, on string-safe copy)
    const depthAtLineStart = depth;
    let lineMaxDepth = depth;

    for (const ch of safe) {
      if (ch === "{") {
        depth++;
        if (depth > lineMaxDepth) lineMaxDepth = depth;
      } else if (ch === "}") {
        depth--;
      }
    }

    const depthAtLineEnd = depth;

    // Did this line enter an entity block (depth crossed from ≤2 to ≥3)?
    const enteredEntity = depthAtLineStart <= 2 && lineMaxDepth >= 3;

    // Did this line exit the entity block (line had depth ≥3 at some point, ended ≤2)?
    const exitedEntity = lineMaxDepth >= 3 && depthAtLineEnd <= 2;

    // Was any part of this line inside an entity block?
    const insideEntity = inEntityBlock && lineMaxDepth >= 3;

    if (enteredEntity && !inEntityBlock) {
      inEntityBlock = true;
      hasCreateOrDelete = false;
      traversalLines.length = 0;
    }

    if (insideEntity || (enteredEntity && !inEntityBlock)) {
      // Check for create/delete in actions (single-line format enforced by DSL convention)
      if (/\bactions\s*:\s*\[/.test(line) && /["'](?:create|delete)["']/.test(line)) {
        hasCreateOrDelete = true;
      }

      // Check for traversal in target (inline — variable references are not detected)
      if (/\btarget\s*:\s*\[/.test(line) && /→/.test(line)) {
        traversalLines.push(lineNum);
      }
    }

    if (exitedEntity && inEntityBlock) {
      if (hasCreateOrDelete && traversalLines.length > 0) {
        for (const tLine of traversalLines) {
          violations.push({
            id: controlId,
            owner,
            processor: "dsl-coherence",
            severity: controlSeverity,
            file,
            lines: [tLine],
            message: controlMessage,
          });
        }
      }
      inEntityBlock = false;
      hasCreateOrDelete = false;
      traversalLines.length = 0;
    }
  }

  return violations;
}

// ── Main export ──────────────────────────────────────────────────────

export async function processDslCoherenceControls(
  controlSets: LoadedControlSet[],
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const violations: LintViolation[] = [];

  for (const cs of controlSets) {
    const controls = cs.controls["dsl-coherence"];
    if (!controls) continue;

    for (const control of controls) {
      if (control.enabled === false) continue;

      const patterns = Array.isArray(control.in) ? control.in : [control.in];

      for (const pattern of patterns) {
        const files = await glob(pattern, {
          cwd: ctx.rootDir,
          ignore: ctx.ignorePatterns,
        });

        for (const file of files) {
          if (control.exceptions?.some((exc) => pathMatchesPattern(file, exc.in))) continue;

          const content = readFile(ctx.rootDir, file);
          if (!content) continue;

          const message =
            control.message ??
            `DSL coherence: entity has "create" or "delete" in actions but the target uses a traversal (→). ` +
            `resolveForCreateDelete cannot follow traversal hops — split into two roles: ` +
            `one with ["read","update"] + traversal target, another with ["create","delete"] + direct or empty target.`;

          violations.push(
            ...scanForTraversalCreateDelete(
              content,
              file,
              control.id,
              control.severity,
              message,
              cs.owner,
            ),
          );
        }
      }
    }
  }

  return violations;
}
