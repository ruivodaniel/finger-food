// ── Layer Discipline Processor ─────────────────────────────────────
// Enforces the universal layer-ordering invariant:
//   a file at layer N cannot import from a file at layer N+
//   within the same stack.
//
// Two canonical stacks (configured in lint-controls.ts):
//   API:  model → repository → service → router → middleware
//   WEB:  api   → hooks      → components → pages
//
// Cross-stack imports are not evaluated here — those are zone rules.
// Files not matching any layer in a stack are transparent (ignored).

import * as fs from "fs";
import * as path from "path";
import type {
  LayerDisciplineConfig,
  LayerStack,
  LintViolation,
  LoadedControlSet,
} from "../types.ts";
import {
  getSourceFiles,
  readFile,
  extractImports,
  pathMatchesPattern,
} from "../utils/files.ts";

interface ProcessorContext {
  rootDir: string;
  allSourceGlobs: string[];
  ignorePatterns: string[];
}

export async function processLayerDisciplineControls(
  controlSets: LoadedControlSet[],
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const globalCs = controlSets.find((cs) => cs.owner === "global");
  const config = globalCs?.controls["layer-discipline"] as LayerDisciplineConfig | undefined;
  if (!config || config.enabled === false || !config.stacks.length) return [];

  const violations: LintViolation[] = [];
  const files = await getSourceFiles(ctx.rootDir, ctx.allSourceGlobs, ctx.ignorePatterns);

  // Pre-build layer index: file → { stack, layerIndex, layerName }
  type LayerHit = { stack: LayerStack; layerIndex: number; layerName: string };
  const layerCache = new Map<string, LayerHit>();

  for (const file of files) {
    const hit = resolveFileLayer(file, config.stacks);
    if (hit) layerCache.set(file, hit);
  }

  // Evaluate each file that belongs to a stack
  for (const [file, { stack, layerIndex, layerName }] of layerCache) {
    const content = readFile(ctx.rootDir, file);
    const imports = extractImports(content);

    for (const imp of imports) {
      // Only evaluate relative imports — cross-package is handled by import-export rules
      if (!imp.path.startsWith(".")) continue;

      const resolvedTarget = resolveRelativeImport(imp.path, file, ctx.rootDir);
      if (!resolvedTarget) continue;

      // Target must fall within this stack's scope
      if (!pathMatchesPattern(resolvedTarget, stack.in)) continue;

      // Find target layer (check cache first, then resolve fresh)
      const targetHit: LayerHit | null =
        layerCache.get(resolvedTarget) ??
        resolveFileLayer(resolvedTarget, [stack]);

      if (!targetHit || targetHit.stack.id !== stack.id) continue;

      // Violation: lower layer importing from higher layer
      if (targetHit.layerIndex > layerIndex) {
        if (isExcepted(file, resolvedTarget, stack)) continue;

        violations.push({
          id: `layer-discipline-${stack.id}`,
          owner: "global",
          processor: "layer-discipline",
          severity: stack.severity ?? "error",
          file,
          lines: [imp.line],
          message:
            `Layer violation [${stack.id}]: ` +
            `"${layerName}" (layer ${layerIndex}) imports from ` +
            `"${targetHit.layerName}" (layer ${targetHit.layerIndex}). ` +
            `Stack: ${stack.layers.map((l) => l.name).join(" → ")}.`,
        });
      }
    }
  }

  return violations;
}

// ── Layer resolution ──────────────────────────────────────────────

function resolveFileLayer(
  file: string,
  stacks: LayerStack[],
): { stack: LayerStack; layerIndex: number; layerName: string } | null {
  for (const stack of stacks) {
    if (!pathMatchesPattern(file, stack.in)) continue;
    for (let i = 0; i < stack.layers.length; i++) {
      if (pathMatchesPattern(file, stack.layers[i].match)) {
        return { stack, layerIndex: i, layerName: stack.layers[i].name };
      }
    }
  }
  return null;
}

// ── Relative import resolution ────────────────────────────────────
// Resolves "./foo" or "../bar" relative to the source file,
// returning a repo-relative path with the real extension.

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function resolveRelativeImport(
  importPath: string,
  sourceFile: string,
  rootDir: string,
): string | null {
  const sourceDir = path.dirname(path.join(rootDir, sourceFile));
  const base = path.resolve(sourceDir, importPath);

  // If already has an extension, use as-is
  if (path.extname(base)) {
    const relative = path.relative(rootDir, base).replace(/\\/g, "/");
    return fs.existsSync(path.join(rootDir, relative)) ? relative : null;
  }

  // Try with each extension
  for (const ext of EXTENSIONS) {
    const candidate = base + ext;
    if (fs.existsSync(candidate)) {
      return path.relative(rootDir, candidate).replace(/\\/g, "/");
    }
  }

  // Try index file
  for (const ext of EXTENSIONS) {
    const candidate = path.join(base, `index${ext}`);
    if (fs.existsSync(candidate)) {
      return path.relative(rootDir, candidate).replace(/\\/g, "/");
    }
  }

  return null;
}

// ── Exception check ───────────────────────────────────────────────

function isExcepted(from: string, to: string, stack: LayerStack): boolean {
  return (
    stack.exceptions?.some(
      (ex) => pathMatchesPattern(from, ex.from) && pathMatchesPattern(to, ex.to),
    ) ?? false
  );
}
