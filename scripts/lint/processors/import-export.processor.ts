// ── Import-Export Processor ────────────────────────────────────────
// Evaluates ImportExportControl rules against source files.
// Handles both import and export direction.
// Deny + exceptions = allowlist pattern.

import type {
  ImportExportControl,
  LintViolation,
  LoadedControlSet,
  PathPattern,
} from "../types.ts";
import {
  getSourceFiles,
  readFile,
  extractImports,
  extractExports,
  pathMatchesPattern,
  getPackageRoot,
  resolvePackageToPath,
} from "../utils/files.ts";

interface ProcessorContext {
  rootDir: string;
  allSourceGlobs: string[];
  ignorePatterns: string[];
}

export async function processImportExportControls(
  controlSets: LoadedControlSet[],
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const violations: LintViolation[] = [];
  const files = await getSourceFiles(ctx.rootDir, ctx.allSourceGlobs, ctx.ignorePatterns);

  // Collect all controls from all control sets
  const allControls: Array<{ control: ImportExportControl; owner: string }> = [];
  for (const cs of controlSets) {
    if (!cs.controls["import-export"]) continue;
    for (const control of cs.controls["import-export"]) {
      if (control.enabled === false) continue;
      allControls.push({ control, owner: cs.owner });
    }
  }

  if (allControls.length === 0) return violations;

  // Pre-read all file contents and extract imports/exports
  const fileData = new Map<string, {
    content: string;
    imports: ReturnType<typeof extractImports>;
    exports: ReturnType<typeof extractExports>;
  }>();

  for (const file of files) {
    const content = readFile(ctx.rootDir, file);
    fileData.set(file, {
      content,
      imports: extractImports(content),
      exports: extractExports(content),
    });
  }

  // Evaluate each control
  for (const { control, owner } of allControls) {
    if (control.direction === "import") {
      violations.push(...evaluateImportControl(control, owner, files, fileData));
    } else {
      violations.push(...evaluateExportControl(control, owner, files, fileData));
    }
  }

  return violations;
}

// ── Import evaluation ────────────────────────────────────────────

function evaluateImportControl(
  control: ImportExportControl,
  owner: string,
  files: string[],
  fileData: Map<string, { imports: ReturnType<typeof extractImports> }>,
): LintViolation[] {
  const violations: LintViolation[] = [];

  for (const file of files) {
    // Check if this file matches the `from` pattern
    if (control.from && !pathMatchesPattern(file, control.from)) continue;

    const data = fileData.get(file);
    if (!data) continue;

    for (const imp of data.imports) {
      // Check if this import matches the `to` pattern
      if (control.to && !importMatchesTo(imp.path, control.to)) continue;

      // Self-import check. resolveImportToPackageRoot may return several
      // candidate roots pipe-separated ("either of these") — a match on any
      // one of them means the import stays inside its own package.
      if (control.selfImport === "skip") {
        const fileRoot = getPackageRoot(file);
        const importRoot = resolveImportToPackageRoot(imp.path);
        if (fileRoot && importRoot && importRoot.split("|").includes(fileRoot)) continue;
      }

      // Type-only exemption
      if (control.typeOnlyAllowed && imp.isTypeOnly) continue;

      if (control.allow === false) {
        // DENY rule: this import is denied UNLESS an exception matches
        if (isImportExcepted(control, file, imp)) continue;

        // Symbol-level check: if control has symbols, only deny those specific ones
        if (control.symbols && control.symbols.length > 0) {
          const deniedSymbols = imp.symbols.filter((s) =>
            control.symbols!.some((cs) => symbolMatches(s, cs))
          );
          if (deniedSymbols.length === 0) continue;

          for (const sym of deniedSymbols) {
            violations.push({
              id: control.id,
              owner,
              processor: "import-export",
              severity: control.severity,
              file,
              lines: [imp.line],
              message: control.message ?? `Import of "${sym}" from "${imp.path}" is denied. ${control.description}`,
            });
          }
        } else {
          // No symbols specified — deny the entire import
          violations.push({
            id: control.id,
            owner,
            processor: "import-export",
            severity: control.severity,
            file,
            lines: [imp.line],
            message: control.message ?? `Import from "${imp.path}" is denied. ${control.description}`,
          });
        }
      } else {
        // ALLOW rule: only these symbols are allowed, everything else is denied
        if (control.symbols && control.symbols.length > 0) {
          // Check if any symbol wildcard
          if (control.symbols.some((s) => s.name === "*")) continue;

          const disallowedSymbols = imp.symbols.filter((s) =>
            !control.symbols!.some((cs) => symbolMatches(s, cs))
          );

          if (isImportExcepted(control, file, imp)) continue;

          for (const sym of disallowedSymbols) {
            violations.push({
              id: control.id,
              owner,
              processor: "import-export",
              severity: control.severity,
              file,
              lines: [imp.line],
              message: control.message ?? `Import of "${sym}" from "${imp.path}" is not in the allowed list. ${control.description}`,
            });
          }
        }
      }
    }
  }

  return violations;
}

// ── Export evaluation ────────────────────────────────────────────

function evaluateExportControl(
  control: ImportExportControl,
  owner: string,
  files: string[],
  fileData: Map<string, { exports: ReturnType<typeof extractExports> }>,
): LintViolation[] {
  const violations: LintViolation[] = [];

  for (const file of files) {
    // Check if this file matches the `from` pattern
    if (control.from && !pathMatchesPattern(file, control.from)) continue;

    const data = fileData.get(file);
    if (!data) continue;

    if (control.allow === false) {
      // DENY rule: these exports are denied UNLESS excepted
      for (const exp of data.exports) {
        if (isExportExcepted(control, exp)) continue;

        // If control has specific symbols, only deny those
        if (control.symbols && control.symbols.length > 0) {
          if (!control.symbols.some((cs) => symbolMatches(exp.name, cs))) continue;
        }

        violations.push({
          id: control.id,
          owner,
          processor: "import-export",
          severity: control.severity,
          file,
          lines: [exp.line],
          message: control.message ?? `Export of "${exp.name}" is denied. ${control.description}`,
        });
      }
    }
  }

  return violations;
}

// ── Matching helpers ─────────────────────────────────────────────

function importMatchesTo(importPath: string, toPattern: PathPattern): boolean {
  // A `to` list means "any of these" — a rule can name both the file glob
  // (relative imports) and the package specifier (bare imports) for one target.
  if (Array.isArray(toPattern)) {
    return toPattern.some((p) => importMatchesTo(importPath, p));
  }

  // Direct package match: "drizzle-orm", "@prowd/scoped-ac"
  if (!toPattern.includes("*") && !toPattern.includes("/")) {
    return importPath === toPattern || importPath.startsWith(toPattern + "/");
  }

  // Package with subpath: "@prowd/scoped-ac/adapters/drizzle", "@prowd/scoped-ac/adapters/hono"
  if (toPattern.startsWith("@") && !toPattern.includes("*")) {
    return importPath === toPattern || importPath.startsWith(toPattern + "/");
  }

  // Glob pattern on file paths: "**/repositories/**"
  // For relative imports, we need to check the import path segments
  if (toPattern.includes("*")) {
    return pathMatchesPattern(importPath, toPattern);
  }

  return importPath === toPattern;
}

interface SymbolLike {
  name: string;
  kind?: string;
}

function symbolMatches(symbolName: string | SymbolLike, controlSymbol: SymbolLike): boolean {
  const name = typeof symbolName === "string" ? symbolName : symbolName.name;
  if (controlSymbol.name === "*") return true;
  if (controlSymbol.name !== name) return false;
  // If control specifies a kind, check it
  if (controlSymbol.kind && typeof symbolName !== "string" && symbolName.kind) {
    return controlSymbol.kind === symbolName.kind;
  }
  return true;
}

function isImportExcepted(
  control: ImportExportControl,
  file: string,
  imp: { path: string; symbols: string[] },
): boolean {
  if (!control.exceptions) return false;

  for (const exc of control.exceptions) {
    // Check `from` exception: the importing file must match
    if (exc.from && !pathMatchesPattern(file, exc.from)) continue;

    // Check `to` exception: the import target must match
    if (exc.to && !importMatchesTo(imp.path, exc.to)) continue;

    // Check symbol exception: if symbols specified, only except those
    if (exc.symbols && exc.symbols.length > 0) {
      const allImportedAreExcepted = imp.symbols.every((s) =>
        exc.symbols!.some((es) => symbolMatches(s, es))
      );
      if (!allImportedAreExcepted) continue;
    }

    return true; // Exception matches
  }

  return false;
}

function isExportExcepted(
  control: ImportExportControl,
  exp: { name: string; kind: string },
): boolean {
  if (!control.exceptions) return false;

  for (const exc of control.exceptions) {
    if (exc.symbols && exc.symbols.length > 0) {
      if (exc.symbols.some((es) => symbolMatches({ name: exp.name, kind: exp.kind }, es))) {
        return true;
      }
    }
  }

  return false;
}

// Single source of truth for package-specifier → path-root mapping.
// A pipe-separated result means "either of these roots".
function resolveImportToPackageRoot(importPath: string): string | null {
  return resolvePackageToPath(importPath);
}
