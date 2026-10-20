// ── Example Control Sets — Type Verification ──────────────────────
// These exist ONLY to verify the type interfaces compile.
// Run: tsc --noEmit scripts/lint/__examples__/example-controls.ts

import type { ControlSet } from "../types.ts";

// ── Global Control Set ───────────────────────────────────────────

const globalControls: ControlSet = {
  sourceGlobs: [
    "configs/**/*.{ts,tsx}",
    "shared/contracts/**/*.{ts,tsx}",
    "apps/main/shared/api/src/**/*.{ts,tsx}",
    "apps/main/shared/web/src/**/*.{ts,tsx}",
  ],

  "import-export": [
    // ── Zone isolation ──────────────────────────────────────
    {
      id: "module-isolation",
      severity: "error",
      direction: "import",
      allow: false,
      from: "apps/main/slices/*/*/**",
      to: "apps/main/slices/*/*/**",
      selfImport: "skip",
      description: "Modules cannot import from other modules.",
    },
    {
      id: "lib-no-module",
      severity: "error",
      direction: "import",
      allow: false,
      from: "shared/libs/*/**",
      to: "apps/main/slices/*/*/**",
      description: "Libs cannot import from modules.",
    },
    {
      id: "lib-no-config",
      severity: "error",
      direction: "import",
      allow: false,
      from: "shared/libs/*/**",
      to: "configs/**",
      description: "Libs cannot import from configs.",
    },
    {
      id: "lib-no-app",
      severity: "error",
      direction: "import",
      allow: false,
      from: "shared/libs/*/**",
      to: "apps/**",
      description: "Libs cannot import from apps.",
    },
    {
      id: "shared-no-app",
      severity: "error",
      direction: "import",
      allow: false,
      from: "shared/**",
      to: "apps/**",
      description: "Shared code cannot import from apps. Dependency flows apps → shared.",
    },
    {
      id: "config-type-only-from-module",
      severity: "error",
      direction: "import",
      allow: false,
      from: "configs/**",
      to: "apps/main/slices/*/*/**",
      typeOnlyAllowed: true,
      description: "Configs can only type-import from modules.",
      message: "Use 'import type' or move types to contracts.",
    },
    {
      id: "contract-zero-runtime",
      severity: "error",
      direction: "import",
      allow: false,
      from: "shared/contracts/**",
      to: "apps/main/slices/*/*/**",
      typeOnlyAllowed: true,
      description: "Contracts are types-only. No runtime imports.",
    },
    {
      id: "frontend-no-scoped-ac",
      severity: "warn",
      direction: "import",
      allow: false,
      from: "apps/main/shared/web/**",
      to: "@prowd/scoped-ac",
      description: "Frontend must not import scoped-ac. Use availability-check.",
      message: "Use @libs/availability-check for frontend access checks.",
    },

    // ── API layering ────────────────────────────────────────
    {
      id: "repo-access",
      severity: "error",
      direction: "import",
      allow: false,
      to: "**/repositories/**",
      description: "Repositories cannot be imported by anyone.",
      exceptions: [
        { from: "**/services/**", reason: "Services orchestrate repositories." },
      ],
    },
    {
      id: "model-access",
      severity: "error",
      direction: "import",
      allow: false,
      to: "**/models/**",
      description: "Models cannot be imported by anyone.",
      exceptions: [
        { from: "**/repositories/**", reason: "Repositories own data access." },
      ],
    },
    {
      id: "drizzle-access",
      severity: "error",
      direction: "import",
      allow: false,
      to: "drizzle-orm",
      description: "Drizzle ORM cannot be imported by anyone.",
      exceptions: [
        { from: "**/repositories/**", reason: "Repositories query the database." },
        { from: "**/models/**", reason: "Models define the schema." },
        { from: "**/lib/db*", reason: "DB client infrastructure." },
        { from: "**/lib/scoped-ac*", reason: "Scope filter builder infrastructure." },
      ],
    },
    {
      id: "hono-access",
      severity: "error",
      direction: "import",
      allow: false,
      to: "hono",
      description: "Hono cannot be imported by anyone.",
      exceptions: [
        { from: "**/routes/**", reason: "Routes are HTTP handlers." },
        { from: "**/middlewares/**", reason: "Middlewares process requests." },
        { from: "**/lib/server*", reason: "Server infrastructure." },
        { from: "**/lib/auth*", reason: "Auth infrastructure." },
      ],
    },
  ],

  "content-patterns": [
    {
      id: "no-manual-role-check",
      severity: "warn",
      type: "line",
      description: "No manual role string comparison.",
      match: ["roles\\.includes\\(['\"]", "role\\s*===\\s*['\"]"],
      message: "Use access control middleware, not manual role checks.",
      exceptions: [
        { in: "**/middlewares/**", reason: "Middleware implements role resolution." },
        { in: "configs/**", reason: "Config declares role structures." },
      ],
    },
    {
      id: "no-commented-code",
      severity: "warn",
      type: "block",
      description: "No blocks of commented-out code.",
      match: [
        "^\\s*\\/\\/\\s*(import |export |const |let |var |function |class |interface |type |return )",
        "^\\s*\\/\\/\\s*.*[{};=]\\s*$",
      ],
      minLines: 3,
    },
  ],

  metrics: [
    { id: "max-file-lines", type: "file-lines", warn: 300, error: 500 },
    { id: "max-folder-files", type: "folder-files", warn: 15, error: 25 },
    { id: "max-function-lines", type: "function-lines", warn: 50, error: 80 },
    { id: "max-function-params", type: "function-params", warn: 4, error: 6 },
  ],

  structure: [
    {
      id: "module-has-controls",
      severity: "warn",
      type: "required",
      description: "Every module should have a lint-controls.ts.",
      path: "apps/main/slices/*/*/lint-controls.ts",
    },
    {
      id: "lib-has-controls",
      severity: "warn",
      type: "required",
      description: "Every lib should have a lint-controls.ts.",
      path: "shared/libs/*/lint-controls.ts",
    },
    {
      id: "no-stray-module-root-files",
      severity: "error",
      type: "forbidden",
      description: "No .ts files directly in module root.",
      path: "apps/main/slices/*/*/*.ts",
      allowedFiles: ["lint-controls.ts", "index.ts"],
    },
    {
      id: "api-route-naming",
      severity: "warn",
      type: "naming",
      description: "Route files should match *.router.ts",
      path: "**/api/routes/",
      pattern: "*.router.ts",
    },
    {
      id: "api-service-naming",
      severity: "warn",
      type: "naming",
      description: "Service files should match *.service.ts",
      path: "**/api/services/",
      pattern: "*.service.ts",
    },
    {
      id: "api-repo-naming",
      severity: "warn",
      type: "naming",
      description: "Repository files should match *.repository.ts",
      path: "**/api/repositories/",
      pattern: "*.repository.ts",
    },
  ],

  "domain-ownership": [],

  eslint: {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": ["error", {
        "ts-ignore": true,
        "ts-expect-error": true,
        "ts-nocheck": true,
      }],
    },
  },
};

// ── Library Control Set: scoped-ac ───────────────────────────────

const scopedAcControls: ControlSet = {
  sourceGlobs: ["src/**/*.{ts,tsx}"],

  "import-export": [
    // What this library exports (promoted surface — root)
    {
      id: "root-exports",
      severity: "error",
      direction: "export",
      allow: false,
      from: "shared/libs/scoped-ac/src/index.ts",
      description: "Root index only exports promoted symbols.",
      exceptions: [
        {
          reason: "Promoted API surface",
          symbols: [
            { name: "ScopedRoleDefinitions", kind: "type" },
            { name: "RoleHierarchyConfig", kind: "type" },
            { name: "RoleGroups", kind: "type" },
            { name: "ScopeContext", kind: "type" },
            { name: "ScopeFilter", kind: "type" },
            { name: "assertValidConfiguration", kind: "function" },
          ],
        },
      ],
    },
    // What this library exports (promoted surface — drizzle adapter)
    {
      id: "drizzle-adapter-exports",
      severity: "error",
      direction: "export",
      allow: false,
      from: "shared/libs/scoped-ac/src/adapters/drizzle/index.ts",
      description: "Drizzle adapter only exports promoted symbols.",
      exceptions: [
        {
          reason: "Promoted adapter surface",
          symbols: [
            { name: "createScopeFilterBuilder", kind: "function" },
          ],
        },
      ],
    },
    // Apps can only import promoted symbols from root
    {
      id: "app-root-import",
      severity: "warn",
      direction: "import",
      allow: false,
      from: "apps/**",
      to: "@prowd/scoped-ac",
      description: "Apps cannot import non-promoted scoped-ac symbols.",
      message: "Access through user-organization-mgmt API or use promoted symbols only.",
      exceptions: [
        {
          reason: "Promoted for app usage",
          symbols: [
            { name: "ScopedRoleDefinitions", kind: "type" },
            { name: "RoleHierarchyConfig", kind: "type" },
            { name: "RoleGroups", kind: "type" },
            { name: "ScopeContext", kind: "type" },
            { name: "ScopeFilter", kind: "type" },
            { name: "assertValidConfiguration", kind: "function" },
          ],
        },
      ],
    },
    // Apps can only import from allowed subpaths
    {
      id: "app-no-hono-adapter",
      severity: "warn",
      direction: "import",
      allow: false,
      from: "apps/**",
      to: "@prowd/scoped-ac/adapters/hono",
      description: "Apps cannot import from scoped-ac/adapters/hono. Use user-org-mgmt middleware.",
    },
    // Apps can import promoted symbol from drizzle adapter
    {
      id: "app-drizzle-adapter-import",
      severity: "warn",
      direction: "import",
      allow: false,
      from: "apps/**",
      to: "@prowd/scoped-ac/adapters/drizzle",
      description: "Apps can only import createScopeFilterBuilder from drizzle adapter.",
      exceptions: [
        {
          reason: "Promoted adapter surface",
          symbols: [
            { name: "createScopeFilterBuilder", kind: "function" },
          ],
        },
      ],
    },
  ],

  "domain-ownership": [
    {
      id: "scope-type-authority",
      severity: "error",
      type: "type-names",
      description: "These types are authoritative to scoped-ac. No redefinitions elsewhere.",
      terms: ["ScopeContext", "ScopeFilter", "ScopedRoleDefinition",
              "RoleHierarchyConfig"],
      allow: false,
      path: "**",
      message: "This type is owned by @prowd/scoped-ac. Import it instead of redefining.",
      exceptions: [
        { in: "shared/libs/scoped-ac/**", reason: "Canonical source." },
      ],
    },
  ],

  metrics: [
    {
      id: "scoped-ac-file-lines",
      type: "file-lines",
      warn: 300,
      error: 500,
      in: "shared/libs/scoped-ac/**",
      exceptions: [
        { in: "shared/libs/scoped-ac/src/resolver/**", reason: "Cohesive algorithm", override: { error: 700 } },
      ],
    },
  ],
};

// ── Module Control Set: user-organization-mgmt ───────────────────

const userOrgMgmtControls: ControlSet = {
  sourceGlobs: [
    "api/**/*.{ts,tsx}",
    "web/**/*.{ts,tsx}",
    "shared/**/*.{ts,tsx}",
  ],

  "import-export": [
    // API surface locked — only promoted exports
    {
      id: "api-export-surface",
      severity: "error",
      direction: "export",
      allow: false,
      from: "apps/main/slices/seed/user-organization-mgmt/api/index.ts",
      description: "API surface is locked. Only promoted symbols may be exported.",
      exceptions: [
        {
          reason: "Promoted API surface",
          symbols: [
            { name: "mountUserOrgApi", kind: "function" },
            { name: "resolveAccessContext", kind: "function" },
            { name: "UserOrgMgmtHooks", kind: "type" },
            { name: "invokeHook", kind: "function" },
          ],
        },
      ],
    },
    // Web surface locked — only promoted exports
    {
      id: "web-export-surface",
      severity: "error",
      direction: "export",
      allow: false,
      from: "apps/main/slices/seed/user-organization-mgmt/web/index.ts",
      description: "Web surface is locked. Only promoted symbols may be exported.",
      exceptions: [
        {
          reason: "Promoted web surface",
          symbols: [
            { name: "routes" },
            { name: "providers" },
            { name: "navigation" },
          ],
        },
      ],
    },
    // Apps can only import promoted API symbols
    {
      id: "app-api-import",
      severity: "warn",
      direction: "import",
      allow: false,
      from: "apps/**",
      to: "@modules/user-organization-mgmt/api",
      description: "Apps can only import promoted API symbols.",
      message: "Use mountUserOrgApi or resolveAccessContext.",
      exceptions: [
        {
          reason: "Promoted API surface",
          symbols: [
            { name: "mountUserOrgApi", kind: "function" },
            { name: "resolveAccessContext", kind: "function" },
            { name: "UserOrgMgmtHooks", kind: "type" },
            { name: "invokeHook", kind: "function" },
          ],
        },
      ],
    },
    // Apps can only import promoted web symbols
    {
      id: "app-web-import",
      severity: "warn",
      direction: "import",
      allow: false,
      from: "apps/**",
      to: "@modules/user-organization-mgmt/web",
      description: "Apps can only import promoted web symbols.",
      exceptions: [
        {
          reason: "Promoted web surface",
          symbols: [
            { name: "routes" },
            { name: "providers" },
            { name: "navigation" },
          ],
        },
      ],
    },
    // Apps can import all shared types
    {
      id: "app-shared-import",
      severity: "error",
      direction: "import",
      allow: true,
      from: "apps/**",
      to: "@modules/user-organization-mgmt/shared",
      symbols: [{ name: "*" }],
      description: "Apps may import all types from shared.",
    },
  ],

  "content-patterns": [
    {
      id: "no-direct-config-construction",
      severity: "warn",
      type: "line",
      description: "Use createUserOrgMgmtConfig() factory instead of manual construction.",
      match: ":\\s*UserOrgMgmtConfig\\s*=\\s*\\{",
      notIn: "apps/main/slices/seed/user-organization-mgmt/**",
      message: "Construct config with the factory function.",
    },
  ],

  structure: [
    {
      id: "has-shared-types",
      severity: "error",
      type: "required",
      description: "Module must have shared/types/ for public type contracts.",
      path: "apps/main/slices/seed/user-organization-mgmt/shared/types/",
      mustNotBeEmpty: true,
    },
  ],

  "domain-ownership": [
    {
      id: "schema-ownership",
      severity: "warn",
      type: "schema-names",
      description: "These table names belong to user-org-mgmt.",
      terms: [
        "organization", "member", "user", "invitation", "session",
        "account", "verification", "legal", "consent", "membership",
      ],
      allow: false,
      path: "**",
      message: "This schema uses a table name owned by user-organization-mgmt. Move it to the module.",
      exceptions: [
        {
          in: "apps/main/slices/seed/user-organization-mgmt/api/models/**",
          reason: "Module owns these schemas.",
        },
        {
          in: "apps/main/shared/api/src/models/better-auth/**",
          reason: "BetterAuth schemas managed at app level during migration.",
          terms: ["user", "session", "account", "verification"],
        },
      ],
    },
    {
      id: "type-authority",
      severity: "error",
      type: "type-names",
      description: "These types can only be defined inside this module.",
      terms: ["UserOrgMgmtConfig", "UserOrgMgmtHooks", "OrgTypeDefinition"],
      allow: false,
      path: "**",
      exceptions: [
        { in: "apps/main/slices/seed/user-organization-mgmt/**", reason: "Canonical source." },
      ],
    },
  ],

  metrics: [
    {
      id: "pages-folder-files",
      type: "folder-files",
      warn: 20,
      error: 30,
      description: "Module has many pages — relaxed folder limit.",
      in: "apps/main/slices/seed/user-organization-mgmt/web/pages/",
    },
  ],
};

// ── Type verification ────────────────────────────────────────────
const _g: ControlSet = globalControls;
const _s: ControlSet = scopedAcControls;
const _u: ControlSet = userOrgMgmtControls;
void _g; void _s; void _u;
