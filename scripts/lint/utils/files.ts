// ── File System Utilities for Lint Processors ─────────────────────
// No config dependencies. Processors pass in what they need.

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

/** Get all source files matching globs, excluding ignore patterns */
export async function getSourceFiles(
  rootDir: string,
  sourceGlobs: string[],
  ignorePatterns: string[],
): Promise<string[]> {
  const files: string[] = [];
  for (const pattern of sourceGlobs) {
    const matches = await glob(pattern, {
      cwd: rootDir,
      ignore: ignorePatterns,
    });
    files.push(...matches);
  }
  return [...new Set(files)].sort();
}

/** Read file contents, returning empty string if file doesn't exist */
export function readFile(rootDir: string, relativePath: string): string {
  try {
    return fs.readFileSync(path.join(rootDir, relativePath), "utf-8");
  } catch {
    return "";
  }
}

/** Count lines in a file */
export function countLines(content: string): number {
  if (content.length === 0) return 0;
  return content.split("\n").length;
}

/** List immediate children (files only) in a directory */
export function listFilesInDir(dirPath: string): string[] {
  try {
    return fs
      .readdirSync(dirPath, { withFileTypes: true })
      .filter((d) => d.isFile())
      .map((d) => d.name);
  } catch {
    return [];
  }
}

/** List immediate subdirectories */
export function listDirsInDir(dirPath: string): string[] {
  try {
    return fs
      .readdirSync(dirPath, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== "node_modules" && d.name !== "dist")
      .map((d) => d.name);
  } catch {
    return [];
  }
}

/** Extract all import/export paths from file content */
export function extractImports(content: string): Array<{
  path: string;
  line: number;
  isTypeOnly: boolean;
  symbols: string[];
}> {
  const imports: Array<{ path: string; line: number; isTypeOnly: boolean; symbols: string[] }> = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Static imports: import { Foo, Bar } from "..."
    const staticImport = line.match(/^import\s+(type\s+)?(.+?)\s+from\s+['"]([^'"]+)['"]/);
    if (staticImport) {
      const isTypeOnly = !!staticImport[1];
      const importClause = staticImport[2];
      const importPath = staticImport[3];
      const symbols = extractSymbolNames(importClause);
      imports.push({ path: importPath, line: i + 1, isTypeOnly, symbols });
      continue;
    }

    // Re-exports: export { Foo } from "..."
    const reExport = line.match(/^export\s+(type\s+)?(.+?)\s+from\s+['"]([^'"]+)['"]/);
    if (reExport) {
      const isTypeOnly = !!reExport[1];
      const exportClause = reExport[2];
      const importPath = reExport[3];
      const symbols = extractSymbolNames(exportClause);
      imports.push({ path: importPath, line: i + 1, isTypeOnly, symbols });
      continue;
    }

    // Dynamic imports: import("...")
    const dynamicImport = line.match(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (dynamicImport) {
      imports.push({ path: dynamicImport[1], line: i + 1, isTypeOnly: false, symbols: [] });
    }
  }

  return imports;
}

/** Extract symbol names from an import clause like "{ Foo, type Bar, Baz as Qux }" */
function extractSymbolNames(clause: string): string[] {
  const braceMatch = clause.match(/\{([^}]+)\}/);
  if (!braceMatch) return [];
  return braceMatch[1]
    .split(",")
    .map((s) => s.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim())
    .filter(Boolean);
}

/** Extract all export declarations from file content */
export function extractExports(content: string): Array<{
  name: string;
  kind: "type" | "function" | "const" | "class" | "enum" | "re-export";
  line: number;
}> {
  const exports: Array<{ name: string; kind: "type" | "function" | "const" | "class" | "enum" | "re-export"; line: number }> = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // export type Foo
    const typeMatch = line.match(/^\s*export\s+type\s+(\w+)/);
    if (typeMatch) { exports.push({ name: typeMatch[1], kind: "type", line: i + 1 }); continue; }

    // export interface Foo
    const ifaceMatch = line.match(/^\s*export\s+interface\s+(\w+)/);
    if (ifaceMatch) { exports.push({ name: ifaceMatch[1], kind: "type", line: i + 1 }); continue; }

    // export function foo
    const funcMatch = line.match(/^\s*export\s+(?:async\s+)?function\s+(\w+)/);
    if (funcMatch) { exports.push({ name: funcMatch[1], kind: "function", line: i + 1 }); continue; }

    // export const foo
    const constMatch = line.match(/^\s*export\s+const\s+(\w+)/);
    if (constMatch) { exports.push({ name: constMatch[1], kind: "const", line: i + 1 }); continue; }

    // export class Foo
    const classMatch = line.match(/^\s*export\s+class\s+(\w+)/);
    if (classMatch) { exports.push({ name: classMatch[1], kind: "class", line: i + 1 }); continue; }

    // export enum Foo
    const enumMatch = line.match(/^\s*export\s+enum\s+(\w+)/);
    if (enumMatch) { exports.push({ name: enumMatch[1], kind: "enum", line: i + 1 }); continue; }

    // export { Foo, Bar } (re-exports without from — local re-exports)
    const reExportLocal = line.match(/^\s*export\s+\{([^}]+)\}\s*;?\s*$/);
    if (reExportLocal) {
      const names = reExportLocal[1].split(",").map((s) => s.trim().split(/\s+as\s+/).pop()!.trim()).filter(Boolean);
      for (const name of names) {
        exports.push({ name, kind: "re-export", line: i + 1 });
      }
      continue;
    }

    // export * from "..." — we can't know individual names, skip
    // export { Foo } from "..." — re-export with source
    const reExportFrom = line.match(/^\s*export\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]/);
    if (reExportFrom) {
      const names = reExportFrom[1].split(",").map((s) => s.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop()!.trim()).filter(Boolean);
      for (const name of names) {
        exports.push({ name, kind: "re-export", line: i + 1 });
      }
    }
  }

  return exports;
}

/** Check if a file path matches a glob pattern (simple minimatch-like) */
export function pathMatchesPattern(filePath: string, pattern: string | string[]): boolean {
  if (Array.isArray(pattern)) {
    return pattern.some((p) => pathMatchesPattern(filePath, p));
  }
  // Convert glob to regex
  const regexStr = pattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, "<<<GLOBSTAR>>>")
    .replace(/\*/g, "[^/]*")
    .replace(/<<<GLOBSTAR>>>/g, ".*");
  return new RegExp(`^${regexStr}$`).test(filePath);
}

/** Check if a file path matches any of the given glob patterns */
export function pathMatchesAny(filePath: string, patterns: string[]): boolean {
  return patterns.some((p) => pathMatchesPattern(filePath, p));
}

/** Extract the package root from a file path for self-import detection */
export function getPackageRoot(filePath: string): string | null {
  // apps/main/slices/seed/notifications/api/x.ts → apps/main/slices/seed/notifications
  const sliceMatch = filePath.match(/^(apps\/main\/slices\/(?:seed|product)\/[^/]+)\//);
  if (sliceMatch) return sliceMatch[1];
  const sharedMatch = filePath.match(/^(shared\/(?:libs|contracts)\/[^/]+)\//);
  if (sharedMatch) return sharedMatch[1];
  const configMatch = filePath.match(/^(configs\/(?:libs\/)?[^/]+)\//);
  return configMatch ? configMatch[1] : null;
}

/**
 * Resolve a package import string to a file system path prefix.
 * A pipe-separated result means "either of these roots" — the caller compares
 * the importing file's root against each.
 */
export function resolvePackageToPath(importPath: string): string | null {
  // @modules/notifications/api → apps/main/slices/seed/notifications   (today)
  // @seed/notifications        → apps/main/slices/seed/notifications   (target)
  // @product/digest            → apps/main/slices/product/digest       (target)
  // @libs/storage              → shared/libs/storage
  // @configs/user-organization-mgmt → configs/user-organization-mgmt

  const slicePrefix = (prefix: string, tier: "seed" | "product") => {
    const pkgName = importPath.slice(prefix.length).split("/")[0];
    return `apps/main/slices/${tier}/${pkgName}`;
  };

  // @modules/* is the pre-rename spelling of a seed slice. Both tiers are
  // returned because the name alone does not say which tier owns it.
  if (importPath.startsWith("@modules/")) {
    const pkgName = importPath.slice("@modules/".length).split("/")[0];
    return `apps/main/slices/seed/${pkgName}|apps/main/slices/product/${pkgName}`;
  }
  if (importPath.startsWith("@seed/")) return slicePrefix("@seed/", "seed");
  if (importPath.startsWith("@product/")) return slicePrefix("@product/", "product");

  if (importPath.startsWith("@libs/")) {
    const pkgName = importPath.slice("@libs/".length).split("/")[0];
    return `shared/libs/${pkgName}`;
  }

  if (importPath.startsWith("@configs/")) {
    const pkgName = importPath.slice("@configs/".length).split("/")[0];
    return `configs/${pkgName}`;
  }

  if (importPath.startsWith("@apps/")) {
    const appName = importPath.slice("@apps/".length).split("/")[0];
    // @apps/api and @apps/web-main are main's shells; the rest are top-level apps.
    if (appName === "api") return "apps/main/shared/api";
    if (appName === "web-main") return "apps/main/shared/web";
    return `apps/${appName}`;
  }

  return null;
}
