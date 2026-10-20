// ── Markup Validation Processor ───────────────────────────────────
// Validates element= and layout= attributes against the programmatic
// dictionary in conventions.ts. Flags any value not in the valid set.
//
// Source of truth: shared/libs/ui/web/theme-engine/conventions.ts
// which exports VALID_ELEMENT_VALUES, VALID_LAYOUT_VALUES, VALID_AXIS_VALUES.

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import type { LintViolation, LoadedControlSet } from "../types.ts";

interface ProcessorContext {
  rootDir: string;
  allSourceGlobs: string[];
  ignorePatterns: string[];
}

// ── Load dictionary from conventions.ts ──────────────────────────

async function loadDictionary(rootDir: string): Promise<{
  elements: Set<string>;
  typography: Set<string>;
  layouts: Set<string>;
  axes: Record<string, Set<string>>;
} | null> {
  const conventionsPath = path.join(rootDir, "shared/libs/ui/web/theme-engine/conventions.ts");
  try {
    const mod = await import(conventionsPath);
    return {
      elements: mod.VALID_ELEMENT_VALUES as Set<string>,
      typography: mod.VALID_TYPOGRAPHY_ELEMENT_VALUES as Set<string>,
      layouts: mod.VALID_LAYOUT_VALUES as Set<string>,
      axes: mod.VALID_AXIS_VALUES as Record<string, Set<string>>,
    };
  } catch {
    return null;
  }
}

// ── Scan files for attribute usage ──────────────────────────────

const ELEMENT_REGEX = /\belement=["']([^"']+)["']/g;
const LAYOUT_REGEX = /\blayout=["']([^"']+)["']/g;
const AXIS_REGEX = /\b(emphasis|status|state|scale)=["']([^"']+)["']/g;

export async function processMarkupValidationControls(
  _controlSets: LoadedControlSet[],
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const dict = await loadDictionary(ctx.rootDir);
  if (!dict) {
    // conventions.ts not found or can't load — skip silently
    return [];
  }

  const violations: LintViolation[] = [];

  // Scan all .tsx files in web code (slices + the web shell)
  const patterns = [
    "apps/main/slices/*/*/web/**/*.tsx",
    "apps/main/shared/web/src/**/*.tsx",
  ];

  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: ctx.rootDir,
      ignore: ctx.ignorePatterns,
    });
    files.push(...matches);
  }

  const uniqueFiles = [...new Set(files)];

  for (const file of uniqueFiles) {
    const absPath = path.join(ctx.rootDir, file);
    let content: string;
    try { content = fs.readFileSync(absPath, "utf-8"); } catch { continue; }

    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

      // Check element= values (valid if in morphological OR typography set)
      for (const match of line.matchAll(ELEMENT_REGEX)) {
        const value = match[1];
        if (!dict.elements.has(value) && !dict.typography.has(value)) {
          const kind = value.startsWith("type--") ? "typography" : "morphological";
          const hint = kind === "typography"
            ? "Add it to the typography type definitions (TypographyTypeKeyE)."
            : "Add it to ELEMENT_FAMILIES in conventions.ts.";
          violations.push({
            id: `markup:invalid-element`,
            owner: "global",
            processor: "markup-validation",
            severity: "error",
            file,
            lines: [i + 1],
            message: `element="${value}" is not in the markup dictionary (${kind}). ${hint}`,
          });
        }
      }

      // Check layout= values
      for (const match of line.matchAll(LAYOUT_REGEX)) {
        const value = match[1];
        if (!dict.layouts.has(value)) {
          violations.push({
            id: "markup:invalid-layout",
            owner: "global",
            processor: "markup-validation",
            severity: "error",
            file,
            lines: [i + 1],
            message: `layout="${value}" is not in the markup dictionary. Valid values are listed in VALID_LAYOUT_VALUES in conventions.ts.`,
          });
        }
      }

      // Check axis attribute values (emphasis, status, state, scale)
      for (const match of line.matchAll(AXIS_REGEX)) {
        const axis = match[1];
        const value = match[2];
        const validSet = dict.axes[axis];
        if (validSet && !validSet.has(value)) {
          violations.push({
            id: `markup:invalid-${axis}`,
            owner: "global",
            processor: "markup-validation",
            severity: "warn",
            file,
            lines: [i + 1],
            message: `${axis}="${value}" is not a valid axis value. Valid: ${[...validSet].join(", ")}.`,
          });
        }
      }
    }
  }

  return violations;
}
