// ── JSX External Allowlist Processor ──────────────────────────────
// Enforces: if a JSX element resolves to an identifier imported from
// an external npm package, that package must be in the approved allowlist.
//
// Internal imports (relative, @prowd/*, @/) are ignored — those files
// are linted under the same rules in their own pass.
//
// Handles: named imports, default imports, namespace imports (Icons.Plus),
// aliased imports (Button as Foo).

import type { LintViolation, JsxExternalAllowlistControl } from "../types.ts";
import { getSourceFiles, readFile, pathMatchesPattern } from "../utils/files.ts";

// Re-export for backwards compat
export type JsxExternalAllowlistConfig = JsxExternalAllowlistControl;

interface ProcessorContext {
  rootDir: string;
  allSourceGlobs: string[];
  ignorePatterns: string[];
}

// ── Import parsing ──────────────────────────────────────────────────

interface ImportedIdentifier {
  /** The local name used in JSX (after aliasing). */
  localName: string;
  /** "named" | "default" | "namespace" */
  kind: "named" | "default" | "namespace";
  /** The package/path it was imported from. */
  source: string;
  /** Line number of the import statement. */
  line: number;
}

// Match: import { A, B as C, type D } from "pkg"
// Match: import Default from "pkg"
// Match: import * as NS from "pkg"
// Match: import Default, { A } from "pkg"
const IMPORT_RE = /^import\s+(.+?)\s+from\s+['"]([^'"]+)['"]/;

function parseImports(content: string): ImportedIdentifier[] {
  const result: ImportedIdentifier[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("import")) continue;

    const match = line.match(IMPORT_RE);
    if (!match) continue;

    const specPart = match[1];
    const source = match[2];
    const lineNum = i + 1;

    // Namespace: import * as NS from "pkg"
    const nsMatch = specPart.match(/^\*\s+as\s+(\w+)$/);
    if (nsMatch) {
      result.push({ localName: nsMatch[1], kind: "namespace", source, line: lineNum });
      continue;
    }

    // Split default and named: import Default, { A, B as C } from "pkg"
    const braceStart = specPart.indexOf("{");
    let defaultPart = "";
    let namedPart = "";

    if (braceStart >= 0) {
      defaultPart = specPart.slice(0, braceStart).replace(/,\s*$/, "").trim();
      const braceEnd = specPart.indexOf("}");
      namedPart = braceEnd >= 0 ? specPart.slice(braceStart + 1, braceEnd) : "";
    } else {
      // Could be: import Default from "pkg" OR import * as NS from "pkg" (already handled)
      defaultPart = specPart.trim();
    }

    // Default import
    if (defaultPart && !defaultPart.startsWith("type ")) {
      result.push({ localName: defaultPart, kind: "default", source, line: lineNum });
    }

    // Named imports
    if (namedPart) {
      const names = namedPart.split(",").map((s) => s.trim()).filter(Boolean);
      for (const name of names) {
        // Skip type-only imports: "type Foo" or "type Foo as Bar"
        if (name.startsWith("type ")) continue;

        const aliasMatch = name.match(/^(\w+)\s+as\s+(\w+)$/);
        if (aliasMatch) {
          result.push({ localName: aliasMatch[2], kind: "named", source, line: lineNum });
        } else if (/^\w+$/.test(name)) {
          result.push({ localName: name, kind: "named", source, line: lineNum });
        }
      }
    }
  }

  return result;
}

// ── External detection ──────────────────────────────────────────────

function isExternalPackage(source: string): boolean {
  // Relative imports
  if (source.startsWith(".")) return false;
  // Internal workspace packages and aliases
  if (source.startsWith("@prowd/")) return false;
  if (source.startsWith("@Prowd/")) return false;
  if (source.startsWith("@/")) return false;
if (source.startsWith("@configs/")) return false;
  // It's an npm package
  return true;
}

function getPackageName(source: string): string {
  // @scope/pkg/path → @scope/pkg
  if (source.startsWith("@")) {
    const parts = source.split("/");
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : source;
  }
  // pkg/path → pkg
  return source.split("/")[0];
}

// ── JSX scanning ────────────────────────────────────────────────────

interface JsxUsage {
  identifier: string;
  line: number;
}

// Match JSX elements: <Foo, <Foo.Bar, <NS.Component
const JSX_ELEMENT_RE = /<([A-Z]\w*)(?:\.(\w+))?[\s/>]/g;

function findJsxUsages(content: string): JsxUsage[] {
  const result: JsxUsage[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip comments
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

    let match;
    JSX_ELEMENT_RE.lastIndex = 0;
    while ((match = JSX_ELEMENT_RE.exec(line)) !== null) {
      // For <NS.Component>, the identifier to resolve is "NS"
      // For <Button>, the identifier is "Button"
      result.push({ identifier: match[1], line: i + 1 });
    }
  }

  return result;
}

// ── Allowlist matching ──────────────────────────────────────────────

function isAllowedPackage(pkg: string, allowlist: string[]): boolean {
  for (const allowed of allowlist) {
    if (allowed.endsWith("/*")) {
      // @tanstack/* → matches @tanstack/react-router, @tanstack/react-query, etc.
      const prefix = allowed.slice(0, -2);
      if (pkg.startsWith(prefix + "/") || pkg === prefix) return true;
    } else if (pkg === allowed) {
      return true;
    }
  }
  return false;
}

// ── Processor entry point ───────────────────────────────────────────

export async function processJsxExternalAllowlistControls(
  config: JsxExternalAllowlistConfig,
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  if (config.enabled === false) return [];

  const violations: LintViolation[] = [];
  const files = await getSourceFiles(ctx.rootDir, ctx.allSourceGlobs, ctx.ignorePatterns);

  // Only scan .tsx files (JSX)
  const tsxFiles = files.filter((f) => f.endsWith(".tsx"));

  for (const file of tsxFiles) {
    // Scope check
    if (!pathMatchesPattern(file, config.in)) continue;

    // Exception check
    if (config.exceptions?.some((ex) => pathMatchesPattern(file, ex.in))) continue;

    const content = readFile(ctx.rootDir, file);
    if (!content) continue;

    // 1. Parse imports → build map of local identifiers from external packages
    const imports = parseImports(content);
    const externalIdentifiers = new Map<string, { source: string; pkg: string; line: number }>();

    for (const imp of imports) {
      if (!isExternalPackage(imp.source)) continue;
      const pkg = getPackageName(imp.source);
      if (isAllowedPackage(pkg, config.allowedPackages)) continue;
      externalIdentifiers.set(imp.localName, { source: imp.source, pkg, line: imp.line });
    }

    if (externalIdentifiers.size === 0) continue;

    // 2. Find JSX usages and check against external map
    const jsxUsages = findJsxUsages(content);

    for (const usage of jsxUsages) {
      const ext = externalIdentifiers.get(usage.identifier);
      if (!ext) continue;

      violations.push({
        id: config.id,
        owner: "global",
        processor: "jsx-external-allowlist",
        severity: config.severity,
        file,
        lines: [usage.line],
        message: config.message
          ?? `<${usage.identifier}> resolves to "${ext.pkg}" which is not in the approved UI allowlist. Use @libs/web-components or @libs/web-layouts instead.`,
      });
    }
  }

  return violations;
}
