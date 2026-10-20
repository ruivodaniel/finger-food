// ── AST Utilities for Lint Rules ───────────────────────────────────
// Lightweight TypeScript parsing without the full compiler API.
// Uses regex-based extraction for speed — good enough for lint heuristics.

// ── Interface/Type field extraction ──────────────────────────────

export interface ExtractedField {
  name: string;
  typeAnnotation: string;
  optional: boolean;
}

export interface ExtractedInterface {
  name: string;
  fields: ExtractedField[];
  line: number;
  exported: boolean;
}

/**
 * Extract interface and type object literal declarations from file content.
 * Handles:
 *   export interface Foo { bar: string; baz?: number; }
 *   export type Foo = { bar: string; baz?: number; }
 * Does NOT handle complex mapped types, generics with constraints, etc.
 */
export function extractInterfaces(content: string): ExtractedInterface[] {
  const results: ExtractedInterface[] = [];
  const lines = content.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Match: export interface Foo { or export type Foo = {
    const interfaceMatch = line.match(/^(\s*export\s+)?interface\s+(\w+)(?:<[^>]*>)?\s*(?:extends\s+[^{]*)?\{/);
    const typeObjMatch = line.match(/^(\s*export\s+)?type\s+(\w+)(?:<[^>]*>)?\s*=\s*\{/);

    const match = interfaceMatch || typeObjMatch;
    if (match) {
      const name = match[2];
      const exported = !!match[1]?.includes("export");
      const startLine = i + 1;

      // Collect the body until we find the closing brace
      let braceCount = 0;
      let bodyLines: string[] = [];
      let j = i;

      while (j < lines.length) {
        const l = lines[j];
        for (const ch of l) {
          if (ch === "{") braceCount++;
          if (ch === "}") braceCount--;
        }
        bodyLines.push(l);
        if (braceCount === 0 && bodyLines.length > 0) break;
        j++;
      }

      // Parse fields from body
      const fields = parseFieldsFromBody(bodyLines.join("\n"));

      if (fields.length > 0) {
        results.push({ name, fields, line: startLine, exported });
      }

      i = j + 1;
      continue;
    }

    i++;
  }

  return results;
}

function parseFieldsFromBody(body: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  // Remove the outer braces
  const inner = body.replace(/^[^{]*\{/, "").replace(/\}[^}]*$/, "");

  // Split by semicolons and newlines, handling nested objects
  const fieldLines = inner.split(/[;\n]/).map((l) => l.trim()).filter(Boolean);

  for (const line of fieldLines) {
    // Skip comments, methods, index signatures
    if (line.startsWith("//") || line.startsWith("*") || line.startsWith("/*")) continue;
    if (line.includes("(") && line.includes(")")) continue; // method signatures
    if (line.startsWith("[")) continue; // index signatures

    // Match: fieldName?: Type or fieldName: Type
    const fieldMatch = line.match(/^(\w+)(\?)?:\s*(.+?)(?:;?\s*$)/);
    if (fieldMatch) {
      fields.push({
        name: fieldMatch[1],
        optional: !!fieldMatch[2],
        typeAnnotation: fieldMatch[3].trim().replace(/;$/, ""),
      });
    }
  }

  return fields;
}

// ── Function extraction ──────────────────────────────────────────

export interface ExtractedFunction {
  name: string;
  line: number;
  lineCount: number;
  paramCount: number;
  exported: boolean;
  hasExplicitReturnType: boolean;
}

/**
 * Extract function declarations and arrow function assignments.
 * Counts lines and parameters.
 */
export function extractFunctions(content: string): ExtractedFunction[] {
  const results: ExtractedFunction[] = [];
  const lines = content.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Match: [export] [async] function name(params)[: ReturnType] {
    const funcMatch = line.match(
      /^(\s*export\s+)?(?:async\s+)?function\s+(\w+)\s*(?:<[^>]*>)?\s*\(([^)]*)\)([^{]*)\{/
    );
    // Match: [export] const name = [async] (params)[: ReturnType] => {
    const arrowMatch = line.match(
      /^(\s*export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)([^=]*?)(?:=>|=>\s*\{)/
    );
    // Match: [export] const name = [async] (params)[: ReturnType] => { (multi-line params)
    // Also: [export] const name = function(params) {
    const constFuncMatch = !arrowMatch
      ? line.match(/^(\s*export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?function\s*(?:<[^>]*>)?\s*\(([^)]*)\)([^{]*)\{/)
      : null;

    const match = funcMatch || arrowMatch || constFuncMatch;
    if (match) {
      const exported = !!match[1]?.includes("export");
      const name = match[2];
      const paramsStr = match[3];
      const afterParams = match[4] || "";
      const startLine = i;

      // Count params (split by comma, ignoring empty)
      const params = paramsStr
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0 && p !== "");
      const paramCount = params.length;

      // Check for explicit return type
      const hasExplicitReturnType = /:\s*\S/.test(afterParams.replace(/\s*=>\s*$/, "").trim());

      // Find the end of the function body
      let braceCount = 0;
      let j = i;
      let foundOpen = false;

      while (j < lines.length) {
        for (const ch of lines[j]) {
          if (ch === "{") {
            braceCount++;
            foundOpen = true;
          }
          if (ch === "}") braceCount--;
        }
        if (foundOpen && braceCount === 0) break;
        j++;
      }

      const lineCount = j - startLine + 1;

      results.push({
        name,
        line: startLine + 1,
        lineCount,
        paramCount,
        exported,
        hasExplicitReturnType,
      });

      i = j + 1;
      continue;
    }

    i++;
  }

  return results;
}

// ── Shape similarity ─────────────────────────────────────────────

/**
 * Compute Jaccard similarity between two sets of field names.
 * Returns a value between 0 (no overlap) and 1 (identical).
 */
export function fieldNameSimilarity(a: ExtractedField[], b: ExtractedField[]): number {
  if (a.length === 0 || b.length === 0) return 0;

  const setA = new Set(a.map((f) => f.name));
  const setB = new Set(b.map((f) => f.name));

  let intersection = 0;
  for (const name of setA) {
    if (setB.has(name)) intersection++;
  }

  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}
