// ── Domain Ownership Processor ─────────────────────────────────────
// Evaluates DomainOwnershipControl rules: checks if terms, types,
// schemas, function names exist only where they're allowed.

import { glob } from "glob";
import type {
  DomainOwnershipControl,
  LintViolation,
  LoadedControlSet,
} from "../types.ts";
import {
  getSourceFiles,
  readFile,
  pathMatchesPattern,
} from "../utils/files.ts";
import {
  extractInterfaces,
  extractFunctions as extractFunctionDeclarations,
  fieldNameSimilarity,
} from "../utils/ast.ts";

interface ProcessorContext {
  rootDir: string;
  allSourceGlobs: string[];
  ignorePatterns: string[];
}

export async function processDomainOwnershipControls(
  controlSets: LoadedControlSet[],
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const violations: LintViolation[] = [];

  // Collect all controls
  const allControls: Array<{ control: DomainOwnershipControl; owner: string }> = [];
  for (const cs of controlSets) {
    if (!cs.controls["domain-ownership"]) continue;
    for (const control of cs.controls["domain-ownership"]) {
      if (control.enabled === false) continue;
      allControls.push({ control, owner: cs.owner });
    }
  }

  if (allControls.length === 0) return violations;

  const files = await getSourceFiles(ctx.rootDir, ctx.allSourceGlobs, ctx.ignorePatterns);

  for (const { control, owner } of allControls) {
    switch (control.type) {
      case "schema-names":
        violations.push(...checkSchemaNames(control, owner, files, ctx));
        break;
      case "type-names":
        violations.push(...checkTypeNames(control, owner, files, ctx));
        break;
      case "function-names":
        violations.push(...checkFunctionNames(control, owner, files, ctx));
        break;
      case "file-names":
        violations.push(...checkFileNames(control, owner, files));
        break;
      case "declaration-names":
        violations.push(...checkDeclarationNames(control, owner, files, ctx));
        break;
      case "shape-similarity":
        violations.push(...checkShapeSimilarity(control, owner, files, ctx));
        break;
    }
  }

  return violations;
}

// ── Exception check ──────────────────────────────────────────────

function isExcepted(
  control: DomainOwnershipControl,
  filePath: string,
  term?: string,
): boolean {
  if (!control.exceptions) return false;
  return control.exceptions.some((exc) => {
    if (exc.in && !pathMatchesPattern(filePath, exc.in)) return false;
    if (exc.terms && term && !exc.terms.includes(term)) return false;
    return true;
  });
}

// ── Schema names ─────────────────────────────────────────────────

function checkSchemaNames(
  control: DomainOwnershipControl,
  owner: string,
  files: string[],
  ctx: ProcessorContext,
): LintViolation[] {
  const violations: LintViolation[] = [];

  for (const file of files) {
    if (control.path && !pathMatchesPattern(file, control.path)) continue;

    const content = readFile(ctx.rootDir, file);
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      // Match pgTable("table_name", ...)
      const tableMatch = lines[i].match(/pgTable\s*\(\s*["']([^"']+)["']/);
      if (!tableMatch) continue;

      const tableName = tableMatch[1].toLowerCase();

      for (const term of control.terms) {
        if (!tableName.includes(term.toLowerCase())) continue;
        if (isExcepted(control, file, term)) continue;

        if (control.allow === false) {
          violations.push({
            id: control.id,
            owner,
            processor: "domain-ownership",
            severity: control.severity,
            file,
            lines: [i + 1],
            message: control.message ?? `Table "${tableMatch[1]}" contains domain term "${term}" owned by ${owner}. ${control.description}`,
          });
        }
        break; // One violation per table per control
      }
    }
  }

  return violations;
}

// ── Type names ───────────────────────────────────────────────────

function checkTypeNames(
  control: DomainOwnershipControl,
  owner: string,
  files: string[],
  ctx: ProcessorContext,
): LintViolation[] {
  const violations: LintViolation[] = [];

  for (const file of files) {
    if (control.path && !pathMatchesPattern(file, control.path)) continue;

    const content = readFile(ctx.rootDir, file);
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match exported type/interface declarations
      const typeMatch = line.match(/^\s*export\s+(?:type|interface)\s+(\w+)/);
      if (!typeMatch) continue;

      const typeName = typeMatch[1];

      for (const term of control.terms) {
        if (typeName !== term) continue;
        if (isExcepted(control, file, term)) continue;

        if (control.allow === false) {
          violations.push({
            id: control.id,
            owner,
            processor: "domain-ownership",
            severity: control.severity,
            file,
            lines: [i + 1],
            message: control.message ?? `Type "${typeName}" is owned by ${owner}. ${control.description}`,
          });
        }
      }
    }
  }

  return violations;
}

// ── Function names ───────────────────────────────────────────────

function checkFunctionNames(
  control: DomainOwnershipControl,
  owner: string,
  files: string[],
  ctx: ProcessorContext,
): LintViolation[] {
  const violations: LintViolation[] = [];

  for (const file of files) {
    if (control.path && !pathMatchesPattern(file, control.path)) continue;

    const content = readFile(ctx.rootDir, file);
    const funcs = extractFunctionDeclarations(content);

    for (const fn of funcs) {
      if (!fn.exported) continue;

      for (const term of control.terms) {
        if (fn.name !== term) continue;
        if (isExcepted(control, file, term)) continue;

        if (control.allow === false) {
          violations.push({
            id: control.id,
            owner,
            processor: "domain-ownership",
            severity: control.severity,
            file,
            lines: [fn.line],
            message: control.message ?? `Function "${fn.name}" is owned by ${owner}. ${control.description}`,
          });
        }
      }
    }
  }

  return violations;
}

// ── File names ───────────────────────────────────────────────────

function checkFileNames(
  control: DomainOwnershipControl,
  owner: string,
  files: string[],
): LintViolation[] {
  const violations: LintViolation[] = [];

  for (const file of files) {
    if (control.path && !pathMatchesPattern(file, control.path)) continue;

    const fileName = file.split("/").pop()?.toLowerCase() ?? "";

    for (const term of control.terms) {
      if (!fileName.includes(term.toLowerCase())) continue;
      if (isExcepted(control, file, term)) continue;

      if (control.allow === false) {
        violations.push({
          id: control.id,
          owner,
          processor: "domain-ownership",
          severity: control.severity,
          file,
          message: control.message ?? `File name contains domain term "${term}" owned by ${owner}. ${control.description}`,
        });
      }
      break;
    }
  }

  return violations;
}

// ── Declaration names (substring match) ──────────────────────────

const DECLARATION_REGEX = /^\s*(?:export\s+)?(?:async\s+)?(?:function|const|let|var|class|type|interface|enum)\s+(\w+)/;

function checkDeclarationNames(
  control: DomainOwnershipControl,
  owner: string,
  files: string[],
  ctx: ProcessorContext,
): LintViolation[] {
  const violations: LintViolation[] = [];
  const lowerTerms = control.terms.map((t) => t.toLowerCase());

  for (const file of files) {
    if (control.path && !pathMatchesPattern(file, control.path)) continue;

    const content = readFile(ctx.rootDir, file);
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(DECLARATION_REGEX);
      if (!match) continue;

      const declName = match[1].toLowerCase();

      for (const term of lowerTerms) {
        if (!declName.includes(term)) continue;
        if (isExcepted(control, file, control.terms[lowerTerms.indexOf(term)])) continue;

        if (control.allow === false) {
          violations.push({
            id: control.id,
            owner,
            processor: "domain-ownership",
            severity: control.severity,
            file,
            lines: [i + 1],
            message: control.message ?? `Declaration "${match[1]}" contains domain term "${control.terms[lowerTerms.indexOf(term)]}" owned by ${owner}. ${control.description}`,
          });
        }
        break; // One violation per declaration
      }
    }
  }

  return violations;
}

// ── Shape similarity ─────────────────────────────────────────────

function checkShapeSimilarity(
  control: DomainOwnershipControl,
  owner: string,
  files: string[],
  ctx: ProcessorContext,
): LintViolation[] {
  const violations: LintViolation[] = [];
  const threshold = control.threshold ?? 0.8;

  // First, find the authoritative interfaces by scanning excepted paths
  const authInterfaces = new Map<string, ReturnType<typeof extractInterfaces>[0]>();

  for (const file of files) {
    if (!isExcepted(control, file)) continue;

    const content = readFile(ctx.rootDir, file);
    const interfaces = extractInterfaces(content);

    for (const iface of interfaces) {
      if (control.terms.includes(iface.name) && iface.fields.length >= 3) {
        authInterfaces.set(iface.name, iface);
      }
    }
  }

  if (authInterfaces.size === 0) return violations;

  // Then scan all files for similar shapes
  for (const file of files) {
    if (control.path && !pathMatchesPattern(file, control.path)) continue;
    if (isExcepted(control, file)) continue;

    const content = readFile(ctx.rootDir, file);
    const interfaces = extractInterfaces(content);

    for (const iface of interfaces) {
      if (iface.fields.length < 3) continue;

      for (const [authName, authIface] of authInterfaces) {
        if (iface.name === authName) continue; // Exact name match handled by type-names check

        const similarity = fieldNameSimilarity(iface.fields, authIface.fields);
        if (similarity >= threshold) {
          violations.push({
            id: control.id,
            owner,
            processor: "domain-ownership",
            severity: control.severity,
            file,
            lines: [iface.line],
            message: control.message ?? `Interface "${iface.name}" has ${Math.round(similarity * 100)}% field overlap with "${authName}" (${owner}). ${control.description}`,
          });
        }
      }
    }
  }

  return violations;
}
