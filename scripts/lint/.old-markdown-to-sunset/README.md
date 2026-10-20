# Prowd Lint System

Deterministic architectural enforcement. One config, one pipeline, one output.

Run: `pnpm lint:arch`

---

## How it works

```
scripts/lint/lint-controls.ts          ← global rules
shared/libs/*/lint-controls.ts         ← per-lib rules
apps/main/slices/*/*/lint-controls.ts      ← per-module rules
         │
         ▼
    runner.ts                          ← discovers all control sets
         │
         ▼  (13 processors, all parallel)
  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
  │      │      │      │      │      │      │      │      │      │      │      │      │      │
  IE     CP     M      S      DO     ESL    MV     JEA    JAST   CB     DSL    PT     DA(×)
  │      │      │      │      │      │      │      │      │      │      │      │      │
  └──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
         │
         ▼
    aggregateViolations()              ← collapse same id+file+message
         │
         ▼
    scripts/lint/.lint-report.json     ← unified JSON output
    scripts/lint/runs/<ts>.json        ← historical run
```

**Processors:**

| Key | File | What it checks |
|-----|------|----------------|
| `IE`   | `import-export.processor.ts`          | Who can import what. Zone isolation, layering, symbol-level rules |
| `CP`   | `content-patterns.processor.ts`       | Line regex, block, co-occurrence rules |
| `M`    | `metrics.processor.ts`                | File/folder/function size limits |
| `S`    | `structure.processor.ts`              | Required/forbidden file paths |
| `DO`   | `domain-ownership.processor.ts`       | Type/function name ownership, no redefinitions |
| `ESL`  | `eslint.processor.ts`                 | Delegates to ESLint Node API |
| `MV`   | `markup-validation.processor.ts`      | `element=` attribute validity, `type--` CSS axis values |
| `JEA`  | `jsx-external-allowlist.processor.ts` | JSX from external packages must be allowlisted |
| `JAST` | `jsx-ast.processor.ts`                | Parent-child JSX structure rules |
| `CB`   | `cast-boundary.processor.ts`          | `as X` casts gated by file allowlist |
| `DSL`  | `dsl-coherence.processor.ts`          | AC DSL rule files: detects create/delete + traversal (→) in same block |
| `PT`   | `pattern-tags.processor.ts`           | Enforces closed authorized set of `[PATTERN:X]` tags across all services and repos |

> `DA` (data-access) from the old doc no longer exists as a standalone processor. Its role is covered by `CP` (content-patterns rules like `canCreate-only-in-services`) and `PT` (pattern-tags).

---

## Control set format

Every `lint-controls.ts` exports a `ControlSet` (`types.ts`):

```ts
import type { ControlSet } from "../../../scripts/lint/types.ts"; // adjust path

const controls: ControlSet = {
  sourceGlobs: ["src/**/*.{ts,tsx}"],   // files to scan (relative to THIS file)

  "import-export": [ /* ImportExportControl[] */ ],
  "content-patterns": [ /* ContentPatternControl[] */ ],
  "metrics": [ /* MetricControl[] */ ],
  "structure": [ /* StructureControl[] */ ],
  "domain-ownership": [ /* DomainOwnershipControl[] */ ],
  "eslint": { /* EslintControls */ },
  "jsx-external-allowlist": [ /* JsxExternalAllowlistControl[] */ ],
  "jsx-ast": { /* JsxAstConfig */ },
  "cast-boundary": { /* CastBoundaryConfig */ },
  "dsl-coherence": [ /* DslCoherenceControl[] */ ],
  "pattern-tags": { /* PatternTagsConfig */ },
};

export default controls;
```

All keys are optional. Owner is inferred from file location — never declared.

---

## Processor reference

### import-export

Controls who can import from whom. Two modes:

```ts
// DENY: violation if the import exists
{
  id: "module-isolation",
  severity: "error",
  direction: "import",
  allow: false,
  from: "apps/main/slices/*/*/**",   // the file doing the importing (glob)
  to: "apps/main/slices/*/*/**",     // what is being imported (glob or package name)
  selfImport: "skip",            // skip if from and to are in the same package
  exceptions: [
    { from: "apps/main/shared/api/src/lib/**", reason: "Infrastructure wrapper." },
    // Symbol-level exception:
    { reason: "Promoted types", symbols: [{ name: "ScopeContext", kind: "type" }] },
  ],
}

// ALLOW: violation if the import does NOT exist
// (rarely used — for enforcing that something must be imported)
{ allow: true, ... }
```

Key fields: `from`, `to`, `allow`, `selfImport`, `typeOnlyAllowed`, `symbols`, `exceptions`.

### content-patterns

Three subtypes:

**`"line"` — match individual lines:**
```ts
{
  id: "no-manual-role-check",
  severity: "warn",
  type: "line",
  match: ["roles\\.includes\\(['\"]"],  // string[] of regexes, any match fires
  in: "apps/main/slices/**",              // PathPattern scope (string or string[])
  skipIfNearby: "//\\s*boundary:",      // suppress if this regex is on same or preceding line
  exceptions: [{ in: "**/middlewares/**", reason: "Middleware implements role resolution." }],
}
```

**`"block"` — consecutive matching lines:**
```ts
{
  id: "no-commented-code",
  severity: "warn",
  type: "block",
  match: ["^\\s*//"],
  minLines: 3,     // default 3
}
```

**`"co-occurrence"` — trigger patterns must coexist with required patterns in same function:**
```ts
{
  id: "service-cud-must-gate",
  severity: "warn",
  type: "co-occurrence",
  match: ["this\\.repo\\.(create|update|delete)\\("],   // triggers
  mustCoexist: ["\\.checkWriteScope\\(", "\\.canCreate\\("], // must also appear
  in: "**/services/**",
}
```

### metrics

```ts
{
  id: "max-file-lines",
  enabled: false,            // toggle without deleting
  type: "file-lines",        // "file-lines" | "folder-files" | "function-lines" | "function-params"
  warn: 300,
  error: 500,
  in: "shared/libs/scoped-ac/**",   // optional scope
  exceptions: [
    { in: "src/resolver/**", reason: "Cohesive algorithm", override: { error: 700 } },
  ],
}
```

### structure

```ts
// Must exist:
{ id: "module-has-shared-types", type: "required", path: "apps/main/slices/*/*/shared/types/", mustNotBeEmpty: true }

// Must not exist:
{ id: "no-stray-root-files", type: "forbidden", path: "apps/main/slices/*/*/*.ts",
  allowedFiles: ["lint-controls.ts", "index.ts"] }
```

### domain-ownership

```ts
{
  id: "scope-type-authority",
  type: "type-names",    // "type-names" | "schema-names" | "function-names" | "declaration-names"
  terms: ["ScopeContext", "ScopeFilter"],
  allow: false,           // these terms are BANNED outside exceptions
  path: "**",
  exceptions: [{ in: "shared/libs/scoped-ac/**", reason: "Canonical source." }],
}
```

### eslint

Global config:
```ts
eslint: {
  enabled: true,    // false = skip ESLint processor entirely
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "varsIgnorePattern": "^_" }],
  },
}
```

Per-package override (in a module/lib lint-controls.ts):
```ts
eslint: {
  overrides: {
    "no-console": "error",   // applied only to this package's files
  },
}
```

### cast-boundary

File-allowlist gated `as X` enforcement.

```ts
"cast-boundary": {
  allowLists: {
    BetterAuth: [
      { path: "apps/main/slices/seed/user-organization-mgmt/api/services/mount-user-org-auth.ts", rationale: "BetterAuth server setup" },
      { path: "apps/main/slices/*/*/api/services/**", rationale: "Services bridge BetterAuth API" },
    ],
    Hono: [
      { path: "apps/main/slices/*/*/api/routes/**", rationale: "c.req.valid type erasure" },
    ],
    Drizzle: [
      { path: "apps/main/slices/*/*/api/repositories/**", rationale: "ORM row-read inference" },
    ],
    TanStack: [
      { path: "apps/main/shared/web/src/routes/**", rationale: "Router strict:false gaps" },
    ],
    Test: [
      { path: "**/__test__/**", rationale: "Test mocks" },
    ],
  },
}
```

Semantics: file on list + correct `// boundary: X` comment → PASS. File on list + missing/wrong comment → WARN. File not on any list → ERROR. `as const` / `as never` / import aliases always exempt.

---

### dsl-coherence

Scans access-control DSL rule files (`.ac.ts`) for incoherent role declarations. Currently detects: entity blocks that declare `create` or `delete` actions **and** have a traversal (`→`) target in the same block. `resolveForCreateDelete` cannot follow traversal hops at create/delete time — the engine resolves properties in memory without a DB query.

```ts
"dsl-coherence": [
  {
    id: "no-create-delete-with-traversal",
    severity: "error",
    description: "create/delete with traversal target (→) in same block",
    in: "configs/access-control/rules/**/*.ac.ts",
  },
]
```

Each control scans the files matched by `in`. Violations reference the line of the offending action declaration.

---

### pattern-tags

Enforces a **closed, authorized set** of `[PATTERN:X]` tags across all service and repository files in the entire codebase. Three enforcement layers:

1. **Unauthorized tag** — `[PATTERN:X]` where X is not in the `authorized` list → ERROR
2. **Tag requirements** — tagged method body must contain required calls/patterns → ERROR
3. **Naked guarded call** — a guarded engine call appearing in a non-private, untagged method → ERROR

Unlike all other processor types, `pattern-tags` is a **single config object** (not an array) — there is one authorized list and one set of definitions per control set.

```ts
"pattern-tags": {
  authorized: ["R", "R·S", "W1", "W1·S", "W2", "W3", "W3·S", "W·BA", "W·BA·X", "W·Self"],

  definitions: [
    {
      name: "R",
      description: "Read — list, get, paginated",
      in: "**/*.repository.ts",
      requires: [
        { match: "\\.resolveRead\\(", description: "resolveRead helper call" },
      ],
    },
    {
      name: "W1",
      description: "Create free-standing — service gates via resolveForCreateDelete",
      in: "**/*.service.ts",
      requires: [
        { match: "\\.resolveForCreateDelete\\(", description: "engine gate" },
        { match: "\\bthis\\.audit", description: "audit log" },
        { match: "\\.forbidden\\(", description: "forbidden() throw" },
      ],
      // Optional: coherence rules for value equality or conditional presence
      coherence: [
        {
          extract1: "entity:\\s*[\"']([^\"']+)[\"']",   // capture entity from audit
          extract2: "resolveForCreateDelete\\([^,]+,\\s*[\"']([^\"']+)[\"']", // entity arg
          description: "audit entity must match resolveForCreateDelete entity",
        },
      ],
    },
    {
      name: "W·BA",
      description: "Write via external provider — service gates via checkWriteScope",
      in: "**/*.service.ts",
      requires: [
        {
          // OR: at least one must match
          match: ["\\.checkWriteScope\\(", "\\.resolveForCreateDelete\\("],
          description: "engine gate (checkWriteScope or resolveForCreateDelete)",
        },
        { match: "\\bthis\\.audit", description: "audit log" },
        { match: "\\.forbidden\\(", description: "forbidden() throw" },
      ],
      coherence: [
        {
          // If audit action is "create", engine must also call resolveForCreateDelete
          extract1: "action:\\s*[\"'](create)[\"']",
          checkIn: "\\.resolveForCreateDelete\\(",
          description: "W·BA create operations must gate via engine.resolveForCreateDelete — using a foreign repo's checkWriteScope gates the wrong entity",
        },
      ],
    },
  ],

  // Engine calls that must always appear inside a tagged (or private) method.
  guardedCalls: [
    {
      match: "\\.engine\\.resolveForCreateDelete\\(",
      description: "engine.resolveForCreateDelete",
      in: "**/*.service.ts",
    },
    {
      match: "(?:await )?this\\.\\w*[Rr]epo\\w*\\.checkWriteScope\\(",
      description: "repo.checkWriteScope",
      in: "**/*.service.ts",
    },
    {
      match: "\\bthis\\.resolveRead\\(",
      description: "resolveRead (repo read-scope helper)",
      in: "**/*.repository.ts",
    },
    {
      match: "\\bthis\\.resolveWrite\\(",
      description: "resolveWrite (repo write-scope helper)",
      in: "**/*.repository.ts",
    },
  ],

  exceptions: [
    { in: "**/repositories/base.repository.ts", reason: "Helper definitions, not guarded calls." },
  ],
}
```

**`PatternCoherenceRule` — two modes (mutually exclusive):**

| Field | Mode | What it does |
|-------|------|--------------|
| `extract1` + `extract2` | Value equality | Both regexes must capture the same string (e.g. entity names must match across two calls) |
| `extract1` + `checkIn` | Conditional presence | If `extract1` matches the body, `checkIn` regex must also match the body |

**Tag placement:** `[PATTERN:X]` must appear as a `//` comment on the line immediately before the method signature (blank lines and other `//` comments between the tag and the signature are allowed).

**Private methods are exempt** from naked-call checks — repos conventionally wrap engine calls in `private resolveRead()` / `private resolveWrite()` helpers. The guarded boundary is the public methods that call those helpers.

**Authorized patterns** (as of this writing):

| Tag | Layer | Operation |
|-----|-------|-----------|
| `R` | Repository | Read — list, get, paginated |
| `R·S` | Repository | Read — scoped to session subject |
| `W1` | Service | Create free-standing (no container) |
| `W1·S` | Service | Create free-standing, scoped to session subject |
| `W2` | Service | Create in container |
| `W3` | Service | Mutate existing entity (update/delete) |
| `W3·S` | Service | Mutate, scoped to session subject |
| `W·BA` | Service | Write via external provider (BetterAuth, etc.) |
| `W·BA·X` | Service | Write via provider + cross-entity business logic check |
| `W·Self` | Service | Actor = target, schema-enforced, no role gate |

Full pattern semantics: [`docs/01_reference/access-control.md`](../../docs/01_reference/access-control.md).

---

## PathPattern

All `from`, `to`, `in`, `path` fields accept `string | string[]`.

Glob rules: `*` = one segment, `**` = any depth. No magic beyond that.

```ts
"apps/main/slices/*/*/**"          // any module, any depth
"@prowd/scoped-ac"             // exact package name
["apps/main/slices/**", "apps/**"]  // either
```

---

## Exceptions

Every control type has `exceptions`. Structure varies slightly but the pattern is always:

```ts
exceptions: [
  { in: "path/or/glob/**", reason: "Why this path is exempt." },
  // import-export also supports from/to/symbols in exceptions
]
```

Always include a `reason`. It's required by type and serves as the audit trail.

---

## Adding a rule

1. Find the right processor (see table above)
2. Add a control object to the relevant array in `lint-controls.ts`
3. Give it a unique `id`, a `severity`, a `description`
4. Run `pnpm lint:arch` to verify it fires on expected files and not on others
5. Add `exceptions` for any legitimate false positives

---

## Running

```bash
pnpm lint:arch                    # full run, writes .lint-report.json
pnpm tsx scripts/lint/runner.ts   # same, directly

# Check count for a specific rule:
pnpm lint:arch 2>&1 | grep "rule-id"

# Tests (cast-boundary processor):
pnpm tsx scripts/lint/__test__/cast-boundary.test.ts
```

---

## Files

```
scripts/lint/
├── runner.ts                           Orchestrator
├── lint-controls.ts                    Global control set
├── types.ts                            All TypeScript types
├── README.md                           This file
├── .lint-report.json                   Latest run output (gitignored)
├── runs/                               Historical runs (gitignored)
├── processors/
│   ├── import-export.processor.ts
│   ├── content-patterns.processor.ts
│   ├── metrics.processor.ts
│   ├── structure.processor.ts
│   ├── domain-ownership.processor.ts
│   ├── eslint.processor.ts
│   ├── markup-validation.processor.ts
│   ├── jsx-external-allowlist.processor.ts
│   ├── jsx-ast.processor.ts
│   ├── cast-boundary.processor.ts
│   ├── dsl-coherence.processor.ts      DSL rule file coherence (create/delete + traversal)
│   └── pattern-tags.processor.ts       [PATTERN:X] tag enforcement
├── utils/
│   ├── files.ts                        pathMatchesPattern, getSourceFiles, readFile, extractImports
│   └── ast.ts                          AST utilities
└── __test__/
    └── cast-boundary.test.ts           Processor unit tests
```
