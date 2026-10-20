// ── Cast Boundary Processor ────────────────────────────────────────
// Enforces that `as X` casts only appear in files registered on a
// boundary allowlist. Comment-only gating is insufficient — a comment
// can be forged; file membership in the allowlist cannot.
//
// Semantics:
//   File in list + correct `// boundary: X` comment  → PASS
//   File in list + missing comment                    → WARN  (doc debt)
//   File in list + wrong-boundary comment             → WARN  (doc mismatch)
//   File NOT in any list                              → ERROR
//   `as const`, `as never`, import/export aliases     → always exempt
//
// Config source: global control set `"cast-boundary"` key.

import type { CastBoundaryConfig, LintViolation, LoadedControlSet } from "../types.ts";
import { getSourceFiles, readFile, pathMatchesPattern } from "../utils/files.ts";

interface ProcessorContext {
  rootDir: string;
  allSourceGlobs: string[];
  ignorePatterns: string[];
}

// ── Cast detection patterns ──────────────────────────────────────
// Mirrors the existing require-boundary-comment-on-cast rule.
// Matches:
//   ` as TypeName`  (TypeName starts with capital / _ / $)
//   ` as {`         (inline object type literal)
//   ` as (`         (parenthesised type)
// Excludes via lookahead: `as const`, `as never`, `as unknown`
// Lowercase names (string, number, boolean, etc.) never start with [A-Z_$].
const CAST_PATTERNS: RegExp[] = [
  / as (?!const\b|never\b|unknown\b)[A-Z_$][A-Za-z0-9_$]*/,
  / as \{/,
  / as \(/,
];

// Matches `// boundary: SomeName` anywhere on a line
const BOUNDARY_COMMENT_RE = /\/\/\s*boundary:\s*(\w+)/;

// import/export declaration lines — `as Y` in these is an alias, not a cast
const IMPORT_EXPORT_LINE_RE = /^\s*(?:import|export)\s/;

// ── Always-exempt paths ──────────────────────────────────────────
// Test files are already excluded by runner IGNORE_PATTERNS, but listed
// here explicitly for clarity. Stub modules and POC apps are deferred.
const ALWAYS_EXEMPT: string[] = [
  "**/__test__/**",
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/*.spec.ts",
  "**/*.spec.tsx",
  "**/__proof__/**",
  "apps/main/shared/web/src/routes/sandbox/**",
  "apps/main/slices/seed/notifications/**",
  "apps/main/shared/mobile/**",
];

export async function processCastBoundaryControls(
  controlSets: LoadedControlSet[],
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  // Config lives on the global control set only
  const globalCs = controlSets.find((cs) => cs.owner === "global");
  const config = globalCs?.controls["cast-boundary"] as CastBoundaryConfig | undefined;
  if (!config || config.enabled === false) return [];

  // Flatten allowlist into { boundary, path } pairs for fast lookup
  const allowEntries: Array<{ boundary: string; path: string | string[] }> = [];
  for (const [boundary, entries] of Object.entries(config.allowLists)) {
    if (!entries) continue;
    for (const entry of entries) {
      allowEntries.push({ boundary, path: entry.path });
    }
  }

  const files = await getSourceFiles(ctx.rootDir, ctx.allSourceGlobs, ctx.ignorePatterns);
  const violations: LintViolation[] = [];

  for (const file of files) {
    // Skip always-exempt paths
    if (pathMatchesPattern(file, ALWAYS_EXEMPT)) continue;

    const content = readFile(ctx.rootDir, file);
    if (!content) continue;

    // Determine which boundaries are allowed for this file
    const allowedBoundaries = allowEntries
      .filter((e) => pathMatchesPattern(file, e.path))
      .map((e) => e.boundary);

    const lines = content.split("\n");

    let inImportExportBlock = false;

  for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip pure comment lines
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

      // Skip import/export declaration lines — `as Y` there is an alias.
      // Also track multi-line import/export blocks: `import {\n  X as Y,\n}`.
      if (IMPORT_EXPORT_LINE_RE.test(line)) {
        const opens = (line.match(/\{/g) ?? []).length;
        const closes = (line.match(/\}/g) ?? []).length;
        if (opens > closes) inImportExportBlock = true;
        continue;
      }

      // Inside a multi-line import/export block — specifier lines are aliases, not casts.
      if (inImportExportBlock) {
        if (trimmed.startsWith("}")) inImportExportBlock = false;
        continue;
      }

      // Check for cast
      const hasCast = CAST_PATTERNS.some((p) => { p.lastIndex = 0; return p.test(line); });
      if (!hasCast) continue;

      // ── File not on any allowlist → ERROR ──────────────────
      if (allowedBoundaries.length === 0) {
        violations.push({
          id: "cast-boundary",
          owner: "global",
          processor: "cast-boundary",
          severity: "error",
          file,
          lines: [i + 1],
          message:
            "`as` cast in a file not registered on any boundary allowlist. " +
            "Either rewrite using proper types / runtime validation, or add this file " +
            "to the appropriate allowlist (BetterAuth, Hono, Drizzle, TanStack, Test) " +
            "in `scripts/lint/lint-controls.ts`.",
        });
        continue;
      }

      // ── File is allowlisted — check documentation comment ──
      // Accept comment on the same line OR the immediately preceding non-blank line.
      const sameLineMatch = line.match(BOUNDARY_COMMENT_RE);
      let commentBoundary: string | null = null;

      if (sameLineMatch) {
        commentBoundary = sameLineMatch[1];
      } else {
        let j = i - 1;
        while (j >= 0 && lines[j].trim() === "") j--;
        if (j >= 0) {
          const prevMatch = lines[j].match(BOUNDARY_COMMENT_RE);
          if (prevMatch) commentBoundary = prevMatch[1];
        }
      }

      if (!commentBoundary) {
        // Missing comment → WARN (documentation debt)
        violations.push({
          id: "cast-boundary",
          owner: "global",
          processor: "cast-boundary",
          severity: "warn",
          file,
          lines: [i + 1],
          message:
            `\`as\` cast at a ${allowedBoundaries.join("/")} boundary is missing a ` +
            `\`// boundary: ${allowedBoundaries[0]}\` documentation comment.`,
        });
      } else if (!allowedBoundaries.includes(commentBoundary)) {
        // Wrong boundary comment → WARN (doc mismatch)
        violations.push({
          id: "cast-boundary",
          owner: "global",
          processor: "cast-boundary",
          severity: "warn",
          file,
          lines: [i + 1],
          message:
            `\`// boundary: ${commentBoundary}\` does not match the registered boundaries ` +
            `for this file (${allowedBoundaries.join(", ")}). Update the comment.`,
        });
      }
      // else: boundary comment matches allowlist → PASS, no violation
    }
  }

  return violations;
}
