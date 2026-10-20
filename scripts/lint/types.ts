// ── Lint Control System — Type Definitions ────────────────────────
//
// Six processors. One ControlSet shape used everywhere.
// Owner is inferred from file location, never declared.
//
// Processors:
//   1. import-export      — who can import/export what, through which paths and symbols
//   2. content-patterns   — what text patterns should/shouldn't appear in source files
//   3. metrics            — size limits for files, folders, functions
//   4. structure          — file/folder existence, naming, placement
//   5. layer-discipline   — universal layer ordering (model<repo<service<router, api<hooks<components<pages)
//   5. domain-ownership   — what terms, types, schemas belong to whom and where
//   6. eslint             — delegated to ESLint AST engine

// ── Primitives ─────────────────────────────────────────────────────

export type Severity = "error" | "warn" | "info";

/**
 * Glob-style path, always relative from repo root.
 * Examples:
 *   "apps/main/slices/[star]/[star]/[star][star]"
 *   "shared/libs/scoped-ac/src/index.ts"
 *   "@prowd/scoped-ac"              (package import string)
 *   "apps/[star][star]"
 *   "drizzle-orm"                   (npm package)
 */
export type PathPattern = string | string[];

/**
 * A named symbol with optional kind qualifier.
 * Kind lets the processor distinguish a type from a function with the same name.
 */
export interface SymbolItem {
  name: string;
  kind?: "type" | "function" | "const" | "class" | "enum";
  // omitted kind = match any kind with that name
}

// ── 1. Import-Export Controls ──────────────────────────────────────

export interface ImportExportException {
  from?: PathPattern;
  to?: PathPattern;
  reason: string;
  symbols?: SymbolItem[];
}

export interface ImportExportControl {
  id: string;
  severity: Severity;
  description: string;
  message?: string;
  /** If false, this control is skipped by the processor. Default: true. */
  enabled?: boolean;

  direction: "import" | "export";

  /** false = deny (violation if matched). true = allow (violation if NOT matched). */
  allow: boolean;

  /** For imports: the file doing the importing. For exports: the file exporting. */
  from?: PathPattern;

  /** For imports: what is being imported (package path or file glob). */
  to?: PathPattern;

  /** Specific symbols this control covers. If omitted, applies to ALL symbols. */
  symbols?: SymbolItem[];

  /** If true, type-only imports are exempt from a deny rule. */
  typeOnlyAllowed?: boolean;

  /** If "skip", self-imports (file and target in same package) are not violations. */
  selfImport?: "skip";

  exceptions?: ImportExportException[];
}

// ── 2. Content Pattern Controls ───────────────────────────────────

export interface ContentPatternException {
  in?: PathPattern;
  reason: string;
}

export interface ContentPatternControl {
  id: string;
  severity: Severity;
  description: string;
  message?: string;
  enabled?: boolean;

  /**
   * "line"          = match individual lines, flag each match.
   * "block"         = match consecutive lines, flag when threshold met.
   * "co-occurrence" = if trigger patterns appear in a function body,
   *                   must_coexist patterns must also appear. If not → violation.
   */
  type: "line" | "block" | "co-occurrence";

  /** Regex pattern(s) to match. For "co-occurrence" type, these are the trigger patterns. */
  match: string | string[];

  /** For "co-occurrence": patterns that must also exist in the same function body as the trigger. */
  mustCoexist?: string[];

  /** For "block" type: minimum consecutive matching lines to trigger. */
  minLines?: number;

  /** Scope to files in this path. */
  in?: PathPattern;

  /** Exclude files in this path. */
  notIn?: PathPattern;

  /**
   * For "line" type only: if this regex matches on the same line OR the
   * immediately preceding non-blank line, the violation is suppressed.
   * Used for "require an annotation comment" rules.
   */
  skipIfNearby?: string;

  exceptions?: ContentPatternException[];
}

// ── 3. Metric Controls ────────────────────────────────────────────

export interface MetricException {
  in: PathPattern;
  reason: string;
  override?: { warn?: number; error?: number };
}

export interface MetricControl {
  id: string;
  description?: string;
  message?: string;
  enabled?: boolean;

  type: "file-lines" | "folder-files" | "function-lines" | "function-params";

  warn: number;
  error: number;

  /** Scope to files/folders in this path. */
  in?: PathPattern;

  exceptions?: MetricException[];
}

// ── 4. Structure Controls ─────────────────────────────────────────

export interface StructureException {
  path: PathPattern;
  reason: string;
}

export interface StructureControl {
  id: string;
  severity: Severity;
  description: string;
  message?: string;
  enabled?: boolean;

  /**
   * "required" — this path must exist (and optionally not be empty).
   * "forbidden" — files matching this path must NOT exist.
   * "naming" — files in this directory must match the pattern.
   */
  type: "required" | "forbidden" | "naming";

  /** The path to check. */
  path: PathPattern;

  /** For "naming": file name glob pattern to enforce. */
  pattern?: string;

  /** For "required": directory must also contain files. */
  mustNotBeEmpty?: boolean;

  /** For "forbidden": file names that are allowed despite the rule. */
  allowedFiles?: string[];

  exceptions?: StructureException[];
}

// ── 5. Domain Ownership Controls ──────────────────────────────────

export interface DomainOwnershipException {
  in?: PathPattern;
  reason: string;
  terms?: string[];
}

export interface DomainOwnershipControl {
  id: string;
  severity: Severity;
  description: string;
  message?: string;
  enabled?: boolean;

  /**
   * What to scan for:
   *   "schema-names"      — Drizzle pgTable() table name arguments
   *   "type-names"        — exported type/interface names (exact match)
   *   "function-names"    — exported function names (exact match)
   *   "file-names"        — substrings in file names
   *   "declaration-names" — any declaration (export function/const/class/type/interface/enum) containing term as substring
   *   "shape-similarity"  — interface field overlap with named types
   */
  type: "schema-names" | "type-names" | "function-names" | "file-names" | "declaration-names" | "shape-similarity";

  /** The terms/names to look for. */
  terms: string[];

  /** false = deny these terms everywhere (use exceptions to carve out where they're allowed). */
  allow: boolean;

  /** Where to look. Defaults to all source files if omitted. */
  path?: PathPattern;

  /** For "shape-similarity": minimum field overlap ratio (0-1) to trigger. */
  threshold?: number;

  exceptions?: DomainOwnershipException[];
}

// ── 6. ESLint Controls ────────────────────────────────────────────

export type EslintRuleValue = string | [string, ...unknown[]];

export interface EslintControls {
  /** Master switch — set to false to disable the ESLint processor entirely. */
  enabled?: boolean;

  /** ESLint rules to apply. */
  rules?: Record<string, EslintRuleValue>;

  /** Override global ESLint rules for this owner's scope. */
  overrides?: Record<string, EslintRuleValue>;
}

// ── 7. JSX External Allowlist Controls ────────────────────────────

export interface JsxExternalAllowlistControl {
  id: string;
  severity: Severity;
  description: string;
  message?: string;
  enabled?: boolean;

  /** Files to scan. */
  in: PathPattern;

  /** External packages allowed to provide JSX components. */
  allowedPackages: string[];

  /** Files/patterns to skip. */
  exceptions?: Array<{ in: string; reason: string }>;
}

// ── 8. JSX AST Controls ──────────────────────────────────────────

export interface JsxAstRule {
  id: string;
  severity: Severity;
  description: string;
  message: string;
  enabled?: boolean;
}

export interface JsxAstConfig {
  in: PathPattern;
  exceptions?: Array<{ in: string; reason: string }>;
  rules: JsxAstRule[];
}

// ── 9. Cast Boundary Controls ─────────────────────────────────────
// File-allowlist-gated enforcement of `as` casts.
// Files not on any list get ERROR. Files on a list with no comment get WARN.
// Files on a list with a wrong-boundary comment get WARN.
// Files on a list with a correct comment PASS.
// `as const`, `as never`, import/export aliases are always exempt.
//
// Closed boundary list: BetterAuth | Hono | Drizzle | TanStack | Test

export interface CastBoundaryEntry {
  /** Glob pattern (relative to repo root) of the file(s) allowed at this boundary. */
  path: PathPattern;
  /** One-sentence rationale for why this file is at this boundary. */
  rationale: string;
}

export interface CastBoundaryAllowLists {
  BetterAuth?: CastBoundaryEntry[];
  Hono?: CastBoundaryEntry[];
  Drizzle?: CastBoundaryEntry[];
  TanStack?: CastBoundaryEntry[];
  Test?: CastBoundaryEntry[];
}

export interface CastBoundaryConfig {
  /** Master switch. Default: true. */
  enabled?: boolean;
  allowLists: CastBoundaryAllowLists;
}

// ── 10. DSL Coherence Controls ────────────────────────────────────
// Scans access-control DSL rule files (.ac.ts) for incoherent role declarations.
// Currently detects: entity blocks that declare create/delete actions
// AND have a traversal (→) target in the same block.
// resolveForCreateDelete cannot follow traversal hops at create/delete time.

export interface DslCoherenceException {
  in: PathPattern;
  reason: string;
}

export interface DslCoherenceControl {
  id: string;
  severity: Severity;
  description: string;
  message?: string;
  enabled?: boolean;

  /** Glob pattern(s) for DSL rule files to scan (relative to repo root). */
  in: PathPattern;

  exceptions?: DslCoherenceException[];
}

// ── 11. Pattern Tags Controls ─────────────────────────────────────
// Enforces a closed, authorized set of access-control pattern tags
// (e.g. [PATTERN:W1·S]) across service and repository files.
//
// Three enforcement layers:
//   1. Unauthorized tags   — any [PATTERN:X] not in authorized list → ERROR
//   2. Tag requirements    — tagged method body must contain required calls → ERROR
//   3. Naked calls         — guarded engine call outside a tagged/private method → ERROR

export interface PatternRequirement {
  /**
   * Regex(es) the method body must contain.
   * A string[] means at least one must match (OR). A string = must match (AND).
   */
  match: string | string[];
  description: string;
}

export interface PatternCoherenceRule {
  /** Regex with capture group applied to the method body to extract a value. */
  extract1: string;
  /**
   * Regex with capture group — must equal extract1's capture. Mutually exclusive with checkIn.
   * Used for: "entity in call A must match entity in call B."
   */
  extract2?: string;
  /**
   * Regex — if extract1 matches, this pattern must also be found in the body. Mutually exclusive with extract2.
   * Used for: "if audit logs action X, gate call Y must be present."
   */
  checkIn?: string;
  description: string;
}

export interface PatternDefinition {
  /** Pattern tag name, e.g. "W1·S". */
  name: string;
  description: string;
  /** File glob(s) where this tag is valid. Violation if tag appears elsewhere. */
  in?: PathPattern;
  /** Calls/patterns that must appear in the tagged method's body. */
  requires?: PatternRequirement[];
  /** Pairwise match rules — extracted strings must be equal. */
  coherence?: PatternCoherenceRule[];
}

export interface PatternGuardedCall {
  /** Regex that matches the guarded engine call. */
  match: string;
  description: string;
  /** File glob(s) to scan for naked calls. */
  in: PathPattern;
}

export interface PatternTagsConfig {
  /** Master switch. Default: true. */
  enabled?: boolean;
  /** Closed authorized list of pattern names. Any other tag → ERROR. */
  authorized: string[];
  /** Per-pattern definitions (requirements + coherence). */
  definitions: PatternDefinition[];
  /** Engine calls that must always appear inside a tagged (or private) method. */
  guardedCalls?: PatternGuardedCall[];
  exceptions?: Array<{ in: PathPattern; reason: string }>;
}

// ── 12. Layer Discipline Controls ────────────────────────────────
// Universal layer-ordering invariant: a file at layer N cannot import
// from a file at layer N+ within the same stack.
//
// Two canonical stacks:
//   API:  model → repository → service → router → middleware
//   WEB:  api   → hooks      → components → pages
//
// The rule is stack-relative — cross-stack imports are not evaluated here
// (those are zone rules, handled by import-export controls).

export interface LayerDisciplineException {
  /** File doing the importing (glob). */
  from: PathPattern;
  /** File being imported (glob). */
  to: PathPattern;
  reason: string;
}

export interface LayerDefinition {
  /** Human-readable layer name, e.g. "repository", "components". */
  name: string;
  /** Glob pattern(s) matching files at this layer (relative to repo root). */
  match: PathPattern;
}

export interface LayerStack {
  id: string;
  description?: string;
  severity?: Severity;
  /**
   * Scope: only files matching this glob are evaluated for this stack.
   * Files outside this scope are ignored — no false positives for unrelated paths.
   */
  in: PathPattern;
  /**
   * Layers in ascending order: index 0 = lowest, last = highest.
   * A file at index N may only import from files at index ≤ N.
   */
  layers: LayerDefinition[];
  exceptions?: LayerDisciplineException[];
}

export interface LayerDisciplineConfig {
  enabled?: boolean;
  stacks: LayerStack[];
}

// ── Control Set ───────────────────────────────────────────────────
// Same shape everywhere: global, module, library.
// Owner is inferred from file location.

export interface ControlSet {
  /** Source directories to scan, relative to the control set file location. */
  sourceGlobs: string[];

  "import-export"?: ImportExportControl[];
  "content-patterns"?: ContentPatternControl[];
  "metrics"?: MetricControl[];
  "structure"?: StructureControl[];
  "domain-ownership"?: DomainOwnershipControl[];
  "eslint"?: EslintControls;
  "jsx-external-allowlist"?: JsxExternalAllowlistControl[];
  "jsx-ast"?: JsxAstConfig;
  "cast-boundary"?: CastBoundaryConfig;
  "dsl-coherence"?: DslCoherenceControl[];
  "pattern-tags"?: PatternTagsConfig;
  "layer-discipline"?: LayerDisciplineConfig;
}

// ── Violations ─────────────────────────────────────────────────────

export interface LintViolation {
  /** Control ID, e.g., "repo-access" */
  id: string;
  /** Owner inferred from control set location, e.g., "module/user-org-mgmt" */
  owner: string;
  /** Processor that produced this, e.g., "import-export" */
  processor: string;
  severity: Severity;
  /** Relative file path from repo root */
  file: string;
  /** Line numbers where violations occur. Multiple = aggregated same-file same-control. */
  lines?: number[];
  message: string;
  suggestion?: string;
}

// ── Report ─────────────────────────────────────────────────────────

export interface LintReport {
  timestamp: string;
  durationMs: number;
  summary: {
    errors: number;
    warnings: number;
    infos: number;
    total: number;
  };
  byOwner: Record<string, { errors: number; warnings: number; infos: number }>;
  byProcessor: Record<string, { errors: number; warnings: number; infos: number }>;
  violations: LintViolation[];
}

// ── Loaded Control Set ─────────────────────────────────────────────

export interface LoadedControlSet {
  /** Absolute path to the control set file */
  filePath: string;
  /** Relative directory of the package, e.g., "shared/libs/scoped-ac" */
  packageDir: string;
  /** Inferred owner, e.g., "lib/scoped-ac", "module/user-org-mgmt", "global" */
  owner: string;
  /** The control set */
  controls: ControlSet;
}
