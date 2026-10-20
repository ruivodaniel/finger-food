// ── Global Control Set ────────────────────────────────────────────
// Owner: global (inferred from location in scripts/lint/)
// These controls apply to the entire codebase.

import type { ControlSet } from "./types.ts";

// ── Layout component anchors (used by no-layout-dimension-override) ──
// Matches a JSX opening tag for any @libs/web-layouts primitive followed by
// className="..." so patterns only fire on these specific components.
const _LAYOUT_ALL = "Page|PageHeader|PageBody|Main|MainHeader|MainBody|LeftSidebar|RightSidebar|ContextPanel|Container|ScrollArea|Shell|ShellNone|AuthPage";
const _LAYOUT_SIDE = "LeftSidebar|RightSidebar|ContextPanel";
// className="..." anchor — prefix for class-based patterns
const _A = `<(?:${_LAYOUT_ALL})(?=[\\s/>])[^>]*className="[^"]*`;
const _AS = `<(?:${_LAYOUT_SIDE})(?=[\\s/>])[^>]*className="[^"]*`;
// style={...} anchor — prefix for inline-style pattern
const _ST = `<(?:${_LAYOUT_ALL})(?=[\\s/>])[^>]*style=\\{[^}]*`;

const controls: ControlSet = {
  // Scaffolding per _meta/___REFACTOR/target-scaffolding.md:
  //   apps/main/{api,web,mobile}      — main's shells
  //   apps/main/slices/seed/<s>       — reusable slices    (@modules/* today, @seed/* in target)
  //   apps/main/slices/product/<p>    — this product's slices (@product/* in target)
  //   apps/orchestrator               — the seed orchestrator (Trigger.dev + one API)
  //   shared/libs/<l>                 — generic engines
  //   configs/<c>                     — pure data
  sourceGlobs: [
    "configs/**/*.{ts,tsx}",
    "shared/contracts/**/*.{ts,tsx}",
    "apps/main/shared/api/src/**/*.{ts,tsx}",
    "apps/main/shared/web/src/**/*.{ts,tsx}",
    "apps/main/slices/*/*/**/*.{ts,tsx}",
    "apps/orchestrator/shared/**/*.{ts,tsx}",
    "apps/orchestrator/slices/**/*.{ts,tsx}",
  ],

  "import-export": [
    // ── Zone isolation ──────────────────────────────────────
    // The boundary table (target-scaffolding.md § Import boundaries):
    //
    //   main shells    configs · libs · seed slices · product slices
    //   product slice  configs · libs · other product slices
    //   seed slice     configs · libs                    (reaches nothing)
    //   any other app  configs · libs                    + main's generated contract
    //   libs           node modules only
    //   NOBODY         another app's code · another app's db
    //
    // Slice `to` patterns list both the file glob (catches relative imports)
    // and the package specifier (catches the normal `@modules/x/api` form).
    {
      id: "seed-slice-isolation",
      severity: "error",
      direction: "import",
      allow: false,
      from: "apps/main/slices/seed/*/**",
      to: ["apps/main/slices/*/*/**", "@modules/**", "@seed/**", "@product/**"],
      selfImport: "skip",
      description: "Seed slices reach nothing. A seed slice cannot import another slice — seed or product.",
      message: "Seed slices may import configs and libs only. Composition happens in the shell that mounts them, not between slices.",
    },
    {
      id: "product-slice-no-seed",
      severity: "error",
      direction: "import",
      allow: false,
      from: "apps/main/slices/product/*/**",
      to: ["apps/main/slices/seed/*/**", "@modules/**", "@seed/**"],
      description: "Product slices cannot import seed slices. A product slice may reach configs, libs, and other product slices.",
      message: "Seed slices are mounted by the shell, not consumed by product slices. If you need seed behaviour here, inject it at the mount.",
    },
    {
      id: "slice-no-shell",
      severity: "error",
      direction: "import",
      allow: false,
      from: "apps/main/slices/*/*/**",
      to: ["apps/main/shared/api/**", "apps/main/shared/web/**", "apps/main/shared/mobile/**", "@apps/**"],
      description: "Slices cannot import their host shell. The shell mounts the slice and injects config/db — the arrow is one-way.",
      message: "A slice must not reach into apps/main/{api,web,mobile}. Take what you need as a mount parameter.",
    },
    {
      id: "cross-app-isolation",
      severity: "error",
      direction: "import",
      allow: false,
      from: ["apps/orchestrator/**"],
      to: ["@apps/**", "apps/main/**"],
      description: "No app may import another app's code — only configs, libs, and main's generated contract.",
      message: "Apps talk over the wire (openapi / signed events), never by import. See target-scaffolding.md § Binary assets between apps.",
    },
    {
      id: "lib-no-slice",
      severity: "error",
      direction: "import",
      allow: false,
      from: "shared/libs/*/**",
      to: ["apps/main/slices/*/*/**", "@modules/**", "@seed/**", "@product/**"],
      description: "Libs cannot import from slices. Libs are generic engines — they see node modules only.",
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
      description: "Shared code cannot import from apps.",
    },
    {
      id: "config-no-cross-import",
      severity: "error",
      direction: "import",
      allow: false,
      from: "configs/*/**",
      to: "configs/*/**",
      selfImport: "skip",
      description: "Configs cannot import from other configs. Each config package is scoped to one module.",
      message: "Cross-config imports create cross-module coupling. Use contracts for shared types.",
    },
    {
      id: "config-type-only-from-slice",
      severity: "error",
      direction: "import",
      allow: false,
      from: "configs/**",
      to: ["apps/main/slices/*/*/**", "@modules/**", "@seed/**", "@product/**"],
      typeOnlyAllowed: true,
      description: "Configs can only type-import from slices.",
      message: "Use 'import type' or move types to contracts.",
    },
    {
      // Narrowed to shells + other apps: slices also live under apps/ now, and
      // a type-only import from a config into a slice stays legal above.
      id: "config-no-app-import",
      severity: "error",
      direction: "import",
      allow: false,
      from: "configs/**",
      to: [
        "apps/main/shared/api/**",
        "apps/main/shared/web/**",
        "apps/main/shared/mobile/**",
        "apps/orchestrator/**",
        "@apps/**",
      ],
      description: "Configuration is pure — config files cannot import from application code. Axiom: configuration never imports runtime.",
      message: "Config files are pure declarations. They cannot import from an app shell. If you need a shared type, move it to the slice that owns it and type-import that.",
    },
    {
      id: "domain-config-no-system-config-import",
      severity: "error",
      direction: "import",
      allow: false,
      from: "configs/*/**",
      to: "configs/access-control/**",
      selfImport: "skip",
      description: "Domain configs must not import from system-wide configs. One-way dependency: access-control may import domain vocabulary, never the reverse.",
      message: "Domain configs are leaves — they must not import from configs/access-control/. If you need shared vocabulary, expose it from the domain config and let access-control import it.",
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
    // ── Frontend scoped-ac: governed surface ─────────────────────────
    // Axiom: frontend can check, must not decide (access-control.md — Frontend
    // Authorization, Tier 1). Tier 1 optimistic checks require role types and
    // expandRoles; they do not require the engine factory or server query types.
    // Shape: barrel guard (Category 1) — direction is allowed, surface is governed.
    {
      id: "frontend-scoped-ac",
      severity: "error",
      direction: "import",
      allow: false,
      from: "apps/main/shared/web/**",
      to: "@prowd/scoped-ac",
      description: "Frontend may import scoped-ac only for Tier 1 availability-check surface: role types, hierarchy types, scope context types, and expandRoles. Engine factory and server query types are backend-only. See docs/01_reference/access-control.md — Frontend Authorization.",
      message: "Import only the Tier 1 availability-check surface from scoped-ac. Allowed: ScopedRoleDefinition, ScopedRoleDefinitions, RoleHierarchyConfig, RoleTree, ScopeContext, SubjectsBag, AccessRule, Action, expandRoles. Engine factory (createScopedAc), query types (ResolvedScope, ScopeFilter, DrizzleEntity*), and server setup helpers are backend-only.",
      exceptions: [
        {
          reason: "Tier 1 availability-check surface — role types, hierarchy, scope context, expandRoles",
          symbols: [
            { name: "ScopedRoleDefinition", kind: "type" },
            { name: "ScopedRoleDefinitions", kind: "type" },
            { name: "RoleHierarchyConfig", kind: "type" },
            { name: "RoleTree", kind: "type" },
            { name: "ScopeContext", kind: "type" },
            { name: "SubjectsBag", kind: "type" },
            { name: "AccessRule", kind: "type" },
            { name: "Action", kind: "type" },
            { name: "expandRoles", kind: "function" },
          ],
        },
      ],
    },

    // ── Module public surface: models/index.ts ────────────
    // Constitution defines models/ as a separate public barrel for schema contracts.
    // Apps may import @prowd/<module>/models but not deep into models/ internals.
    {
      // Scoped to the SHELLS on purpose: a slice reaching its own ../models is
      // internal traffic, governed by `model-access` (layering), not by this rule.
      // Before the move every app dir was a shell, so "apps/**" said this by itself.
      id: "shell-no-deep-model-import",
      severity: "error",
      direction: "import",
      allow: false,
      from: ["apps/main/shared/api/**", "apps/main/shared/web/**", "apps/main/shared/mobile/**", "apps/orchestrator/**"],
      to: "**/models/**",
      description: "A shell can import a slice's model surface (@modules/<slice>/models) but not deep into model internals.",
      message: "Import from @modules/<slice>/models (the public barrel), not from internal model files.",
      exceptions: [
        { from: "apps/main/shared/api/src/models/**", reason: "App-owned models are internal to the app." },
        { from: "apps/main/shared/api/src/features/**/models/**", reason: "App feature models are app-internal; cross-feature model imports are allowed by constitution." },
        { from: "apps/main/shared/api/src/lib/**", reason: "App infrastructure may reference schema." },
        { from: "apps/main/shared/api/src/wiring/**", reason: "App wiring may reference schema." },
        { to: "**/models/index.ts", reason: "Public model barrel is allowed." },
      ],
    },

    // ── Frontend-backend boundary ───────────────────────────
    // Frontend must NEVER import backend-only code: repositories, services, drizzle, or backend module paths.
    {
      id: "frontend-no-backend",
      severity: "error",
      direction: "import",
      allow: false,
      from: "apps/main/shared/web/**",
      to: "**/repositories/**",
      description: "Frontend must not import repositories. Frontend accesses backend through HTTP endpoints only.",
    },
    {
      id: "frontend-no-services",
      severity: "error",
      direction: "import",
      allow: false,
      from: "apps/main/shared/web/**",
      to: "**/services/**",
      description: "Frontend must not import services. Frontend accesses backend through HTTP endpoints only.",
    },
    {
      id: "frontend-no-drizzle",
      severity: "error",
      direction: "import",
      allow: false,
      from: "apps/main/shared/web/**",
      to: "drizzle-orm",
      description: "Frontend must not import Drizzle ORM. Frontend accesses backend through HTTP endpoints only.",
    },
    {
      id: "frontend-no-backend-module-api",
      severity: "error",
      direction: "import",
      allow: false,
      from: "apps/main/shared/web/**",
      to: "@prowd/*/api",
      description: "Frontend must not import module backend surfaces. Frontend accesses backend through HTTP endpoints only.",
      message: "Use @prowd/<module>/web for frontend, not @prowd/<module>/api.",
    },

    // ── API layering ────────────────────────────────────────
    {
      id: "repo-access",
      severity: "error",
      direction: "import",
      allow: false,
      to: "**/repositories/**",
      description: "Repositories can only be imported by services and module-internal wiring.",
      message: "Only service files may import from repositories. Routes and other layers must go through the service layer.",
      exceptions: [
        { from: "**/services/**", reason: "Services orchestrate repositories." },
        { from: "**/*.service.ts", reason: "Feature service files use flat naming convention." },
        { from: "**/routes/**/index.ts", reason: "Route index wires repos to service factories." },
        { from: "**/config/**", reason: "App config wires infrastructure." },
        { from: "apps/main/slices/*/*/api/mount*", reason: "Module mount entrypoint wires internal repos to services." },
        { from: "apps/orchestrator/shared/runtime/run-pipeline.ts", reason: "The orchestrator's task entry wires the run store into a Trigger.dev task." },
        { from: "apps/orchestrator/shared/api/index.ts", reason: "The orchestrator's entrypoint and composition root wires the run store into the app." },
      ],
    },
    {
      id: "model-access",
      severity: "error",
      direction: "import",
      allow: false,
      to: "**/models/**",
      description: "Models can only be imported by repositories and infrastructure.",
      message: "Only repository files may import from models. Services and routes must go through the repository layer.",
      exceptions: [
        { from: "**/repositories/**", reason: "Repositories own data access." },
        { from: "**/*.repository.ts", reason: "Feature repository files use flat naming convention." },
        { from: "**/models/**", reason: "Models can reference other models." },
        { from: "**/lib/auth*", reason: "Auth setup references schema." },
        { from: "**/lib/db*", reason: "DB setup references schema." },
        { from: "**/config/**", reason: "App config wires schema." },
        { from: "apps/orchestrator/shared/db.ts", reason: "DB client infrastructure — the orchestrator's app root (SCF10)." },
      ],
    },
    {
      id: "drizzle-access",
      severity: "error",
      direction: "import",
      allow: false,
      to: "drizzle-orm",
      description: "Drizzle ORM can only be used in repositories, models, and lib/ infrastructure. Services, routes, and middleware must not import Drizzle.",
      message: "Only repositories, models, and lib/ infrastructure may import drizzle-orm. Services access data through repositories. Routes access data through services.",
      exceptions: [
        { from: "**/repositories/**", reason: "Repositories query the database." },
        { from: "**/*.repository.ts", reason: "Feature repository files use flat naming convention." },
        { from: "**/models/**", reason: "Models define the schema." },
        { from: "**/lib/db*", reason: "DB client infrastructure." },
        { from: "apps/*/src/db.ts", reason: "DB client infrastructure — shell-level, not under lib/." },
        { from: "apps/main/*/src/db.ts", reason: "DB client infrastructure — shell-level, not under lib/." },
        { from: "apps/orchestrator/shared/db.ts", reason: "DB client infrastructure — the orchestrator's app root (SCF10)." },
        { from: "**/adapters/drizzle/**", reason: "Drizzle adapter builds scope conditions." },
        { from: "apps/main/slices/*/*/api/middlewares/**", reason: "Module-internal middleware may use drizzle for scope resolution." },
        { from: "apps/main/slices/*/*/api/lib/**", reason: "Module-internal infrastructure." },
        { from: "apps/main/slices/*/*/api/mount*", reason: "Module mount entrypoint wires internal infrastructure." },
      ],
    },
    {
      id: "hono-access",
      severity: "warn",
      direction: "import",
      allow: false,
      to: "hono",
      description: "Hono can only be used in routes, middlewares, and infrastructure.",
      message: "Only routes, middlewares, and lib/ infrastructure may import hono. Services and repositories must be transport-agnostic.",
      exceptions: [
        { from: "**/routes/**", reason: "Routes are HTTP handlers." },
        { from: "**/*.router.ts", reason: "Feature router files use flat naming convention." },
        { from: "**/middlewares/**", reason: "Middlewares process requests." },
        { from: "**/lib/**", reason: "Infrastructure (server, auth, error, hc, etc.)." },
        { from: "**/adapters/hono/**", reason: "Hono adapter in scoped-ac." },
        { from: "apps/main/slices/*/*/api/mount*", reason: "Module mount entrypoint creates Hono router." },
        { from: "apps/orchestrator/shared/api/app.ts", reason: "The orchestrator's app factory: middlewares and routers assembled here." },
        { from: "apps/orchestrator/shared/api/index.ts", reason: "The orchestrator's entrypoint and composition root." },
      ],
    },

    // ── UI: Components must come from @libs/web-components ──────
    // Module web code and app pages must not import UI primitives from
    // Radix, Headless UI, or other low-level sources. Use @libs/web-components.
    {
      id: "ui-must-use-component-library",
      severity: "warn",
      direction: "import",
      allow: false,
      from: "apps/main/slices/**/web/**",
      to: "@radix-ui/*",
      description: "Module web code must import UI components from @libs/web-components, not from Radix directly.",
      message: "Import from @libs/web-components instead of @radix-ui/*. The component library wraps Radix with theme integration.",
      exceptions: [
        { from: "shared/libs/ui/**", reason: "Component library wraps Radix internally." },
      ],
    },
    {
      id: "app-ui-must-use-component-library",
      severity: "warn",
      direction: "import",
      allow: false,
      from: "apps/main/shared/web/src/routes/**",
      to: "@radix-ui/*",
      description: "App pages must import UI components from @libs/web-components, not from Radix directly.",
      message: "Import from @libs/web-components instead of @radix-ui/*. The component library wraps Radix with theme integration.",
      exceptions: [
        { from: "shared/libs/ui/**", reason: "Component library wraps Radix internally." },
      ],
    },
  ],

  "content-patterns": [
    // ── Module web barrel must not export pages ────────────────
    {
      id: "no-page-export-from-web-barrel",
      severity: "warn",
      type: "line",
      description: "Module web/index.ts must not export individual pages or layouts. Pages travel inside route contribution objects.",
      match: ["export.*Page\\b", "export.*Layout\\b"],
      in: "apps/main/slices/*/*/web/index.ts",
      message: "Pages and layouts are internal. Export route contribution functions instead. Pages travel inside route objects.",
    },
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
      id: "no-manual-disabled-from-permissions",
      severity: "warn",
      type: "line",
      description: "Do not manually compute disabled state from permission/role variables. Use availability-check (check(...).buttonProps or getButtonProps).",
      match: ["disabled=\\{.*(?:role|permission|canEdit|canDelete|canUpdate|canRemove|canInvite|hasAccess|isAuthorized|hasPermission)"],
      in: "**/pages/**",
      message: "Use availability-check instead of manually computing disabled state from permissions. Spread check(...).buttonProps or getButtonProps(availability) onto the button.",
      exceptions: [
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
    {
      id: "fe-must-use-module-api",
      severity: "error",
      type: "line",
      description: "Entity operations must go through apiClient (/api/client/*), not authClient (/api/auth/*). authClient.organization is only for session context.",
      match: [
        "authClient\\??\\.(organization)\\??\\.(create|delete|update|inviteMember|removeMember|updateMemberRole|acceptInvitation|rejectInvitation|cancelInvitation|getFullOrganization)",
      ],
      message: "Entity operations (create, delete, update, invite, remove member, getFullOrganization) must go through apiClient (/api/client/*), not authClient (/api/auth/*). authClient.organization is only for session context: setActive, useActiveOrganization, useListOrganizations.",
      exceptions: [
        { in: "**/api/**", reason: "Backend code may call auth.api.* legitimately through services." },
      ],
    },
    {
      id: "no-app-hook-invocation",
      severity: "error",
      type: "line",
      description: "invokeHook() can only be called from inside modules. Apps catch hooks in hooks.config.ts, they don't fire them.",
      match: ["invokeHook\\("],
      message: "Hooks must be fired by the module internally. The app catches hooks in hooks.config.ts — it does not invoke them directly.",
      exceptions: [
        { in: "apps/main/slices/*/*/**", reason: "Modules fire their own hooks." },
        { in: "**/config/hooks*", reason: "Hook config wiring." },
      ],
    },
    {
      id: "repo-no-business-patterns",
      severity: "warn",
      type: "line",
      description: "Repositories should only do data access. These patterns indicate business logic that belongs in the service layer.",
      match: [
        "\\bthrow\\b",
        "new Error\\(",
        "new \\w+Error\\(",
        "\\bfetch\\(",
        "process\\.env",
        "\\bemit\\(",
        "\\bpublish\\(",
        "\\bdispatch\\(",
        "\\bsetTimeout\\b",
        "\\bsetInterval\\b",
      ],
      in: ["**/repositories/**", "**/*.repository.ts"],
      message: "Business logic in repository. Repos return data — they don't throw, fetch, emit events, or access env. Move to the service layer.",
      exceptions: [
        { in: "apps/orchestrator/**", reason: "The orchestrator's run store has no business logic; a missing row after an insert is an invariant, thrown as such." },
      ],
    },
    // ── resolveRead / resolveUpdate: repository only ────────────────
    // Axiom 5 (access-control.md): engine.resolveRead narrows query results;
    // engine.resolveUpdate lives inside findByIdForAllow in repos.
    // Neither belongs in services, routes, or middleware.
    // See docs/01_reference/access-control.md and shared/libs/scoped-ac/docs/consumer/AC-PATTERNS.md.
    {
      id: "resolve-read-update-only-in-repos",
      severity: "error",
      type: "line",
      description: "engine.resolveRead and engine.resolveUpdate may only be called from repository files.",
      match: ["\\bengine\\.resolveRead\\(", "\\bengine\\.resolveUpdate\\("],
      message: "engine.resolveRead/resolveUpdate belongs in repositories only. resolveRead narrows the query; resolveUpdate lives inside findByIdForAllow. See docs/01_reference/access-control.md and shared/libs/scoped-ac/docs/consumer/AC-PATTERNS.md.",
      exceptions: [
        { in: "**/repositories/**", reason: "Repositories own read/update scope resolution." },
        { in: "**/*.repository.ts", reason: "Feature repository files use flat naming convention." },
        { in: "shared/libs/scoped-ac/**", reason: "scoped-ac defines these methods." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
    // ── expandRoles exclusive to middleware (Moment 1) ─────────────
    // AC axiom: two moments — Moment 1 is expandRoles() in middleware,
    // Moment 2 is resolveFor*() in repositories. expandRoles must not
    // appear in services, repositories, or routes.
    {
      id: "expand-roles-only-in-middleware",
      severity: "error",
      type: "line",
      description: "expandRoles() is Moment 1 — it belongs in middleware only. Services and repositories receive pre-expanded roles via AccessContext.",
      match: ["expandRoles\\("],
      message: "expandRoles() must be called in middleware only (Moment 1). Services and repositories receive effective roles from the AccessContext — they do not expand roles themselves.",
      exceptions: [
        { in: "**/middlewares/**", reason: "Middleware owns Moment 1 role expansion." },
        { in: "**/*.middleware.ts", reason: "Flat-named middleware files." },
        { in: "shared/libs/scoped-ac/**", reason: "scoped-ac defines expandRoles." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
    // ── Service CUD must gate via engine ────────────────────────────
    // Every service method that calls a BA adapter or repo write must
    // first gate via engine.resolveCreate, engine.resolveDelete, or
    // repo.findByIdForAllow. No write executes without a prior engine call.
    // See docs/01_reference/access-control.md and AC-PATTERNS.md.
    {
      id: "service-cud-must-gate",
      severity: "error",
      type: "co-occurrence",
      description: "Service methods that write must gate via engine.resolveCreate, engine.resolveDelete, or repo.findByIdForAllow before executing.",
      in: ["**/services/**", "**/*.service.ts"],
      match: [
        "this\\.baAdapter\\.",
        "this\\.repo\\.(create|update|delete)\\(",
      ],
      mustCoexist: ["\\.resolveCreate\\(", "\\.resolveDelete\\(", "\\.findByIdForAllow\\("],
      message: "This service method does a write but does not call resolveCreate, resolveDelete, or findByIdForAllow. Every CUD must gate via the engine before executing. See docs/01_reference/access-control.md and shared/libs/scoped-ac/docs/consumer/AC-PATTERNS.md.",
      exceptions: [
        { in: "**/services/create-auth-config*", reason: "BA hooks handle lifecycle, not CUD gating." },
      ],
    },
    // ── auth.api.* exclusive to adapter ───────────────────────────
    // BAAdapter ADR (2026-04-25): services must call this.baAdapter.*,
    // never auth.api.* directly. BAAdapter is the single gate for BA-owned writes.
    {
      id: "auth-api-only-in-adapter",
      severity: "error",
      type: "line",
      description: "auth.api.* is BetterAuth's internal API. Only the BAAdapter may call it. Services must call this.baAdapter.* instead.",
      match: ["auth\\.api\\."],
      message: "Direct auth.api.* call bypasses BAAdapter. Route all BA writes through BAAdapter (this.baAdapter.*). See 2026-04-25-baadapter-as-write-gate.md.",
      exceptions: [
        { in: "**/*-adapter.ts", reason: "BAAdapter is the only sanctioned direct caller of auth.api.*" },
        { in: "**/lib/auth*", reason: "Auth server setup references auth.api for type extraction only — not a write call." },
        { in: "**/mount*", reason: "Module mount entrypoint wires auth." },
        { in: "apps/**/config/**", reason: "App wiring config (module-mount.config.ts) extracts Parameters<typeof auth.api.X>[0] types at mount boundary — type reference, not a write call." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
    // ── resolveCreate: service only ─────────────────────────────────
    // engine.resolveCreate gates free-standing creates. Only services
    // make verdict calls. Repositories execute; they never gate.
    // See docs/01_reference/access-control.md and AC-PATTERNS.md.
    {
      id: "resolve-create-only-in-services",
      severity: "error",
      type: "line",
      description: "engine.resolveCreate may only be called from service files.",
      match: ["\\bengine\\.resolveCreate\\("],
      message: "engine.resolveCreate() belongs in services only. Repositories execute writes — they never make the create verdict. See docs/01_reference/access-control.md and shared/libs/scoped-ac/docs/consumer/AC-PATTERNS.md.",
      exceptions: [
        { in: "**/services/**", reason: "Services own create gating." },
        { in: "**/*.service.ts", reason: "Feature service files use flat naming convention." },
        { in: "shared/libs/scoped-ac/**", reason: "scoped-ac defines resolveCreate." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
    // ── findByIdForAllow: called from services only ──────────────────
    // findByIdForAllow is the gate-2 boolean method defined in repositories.
    // Only services call it. Routes and middleware must not call it directly.
    // NOTE: regex has leading dot — matches calls (.findByIdForAllow() but
    // NOT the definition (async findByIdForAllow()).
    // See docs/01_reference/access-control.md#patterns and AC-PATTERNS.md.
    {
      id: "findByIdForAllow-only-in-services",
      severity: "error",
      type: "line",
      description: "findByIdForAllow may only be CALLED from service files. Repositories define it; services call it.",
      match: ["\\.findByIdForAllow\\("],
      message: "findByIdForAllow() can only be called from services. It is the gate-2 boolean method for update/delete-by-id. See docs/01_reference/access-control.md#patterns and shared/libs/scoped-ac/docs/consumer/AC-PATTERNS.md.",
      exceptions: [
        { in: "**/services/**", reason: "Services call findByIdForAllow to gate update/delete." },
        { in: "**/*.service.ts", reason: "Feature service files use flat naming convention." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
    // ── Rule C: Repositories must import AccessContext ──
    {
      id: "repo-must-import-access-context",
      severity: "warn",
      type: "co-occurrence",
      description: "Repositories that import from models must also import AccessContext — the canonical access-control artifact.",
      in: ["**/repositories/**", "**/*.repository.ts"],
      match: ["from.*models"],
      mustCoexist: ["AccessContext"],
      message: "This repository imports from models but does not import AccessContext. Protected repository methods require AccessContext as their first parameter.",
      exceptions: [
        { in: "**/lib/**", reason: "Infrastructure repos may not need scope." },
        { in: "**/repositories/gate*", reason: "Gate repository reads public auth state — not scoped entity data." },
        { in: "**/repositories/legal*", reason: "Legal document reads are public." },
        { in: "apps/orchestrator/**", reason: "The orchestrator has no scoped access control; its repositories are the run store, reached only by the run's own id." },
      ],
    },
    // ── Repo reads on protected entities must call the engine ─────────
    // Any SELECT from a protected entity must include an engine.resolveRead
    // call (narrows rows/fields) or engine.resolveUpdate/resolveDelete
    // (inside findByIdForAllow gate-2). Raw unscoped selects are forbidden.
    // See docs/01_reference/access-control.md and AC-PATTERNS.md.
    {
      id: "repo-protected-query-must-use-engine",
      severity: "error",
      type: "co-occurrence",
      description: "Protected repository queries must route through engine.resolveRead (reads) or engine.resolveUpdate/resolveDelete (findByIdForAllow gate-2).",
      in: ["**/repositories/**", "**/*.repository.ts"],
      match: [
        "\\.from\\s*\\(\\s*schema\\.(organization|member|invitation|userPreferences|legalDocument|consentRecord)\\b",
      ],
      mustCoexist: [
        "engine\\.resolveRead\\(",
        "engine\\.resolveUpdate\\(",
        "engine\\.resolveDelete\\(",
        "this\\.engine",
      ],
      message: "This repository method queries a protected entity without calling the engine. All reads must be narrowed by engine.resolveRead; findByIdForAllow uses engine.resolveUpdate/resolveDelete. See docs/01_reference/access-control.md and shared/libs/scoped-ac/docs/consumer/AC-PATTERNS.md.",
      exceptions: [
        { in: "**/repositories/gate*", reason: "Gate repository reads public auth state — not scoped entity data." },
        { in: "**/lib/**", reason: "Infrastructure files in lib/ are not repositories." },
      ],
    },
    // ── Drizzle re-export in api barrel ────────────────────────
    {
      id: "no-drizzle-export-in-api-barrel",
      severity: "error",
      type: "line",
      description: "Do not export Drizzle tables through api/index.ts. Table/schema references belong in models/index.ts.",
      match: ["pgTable", "export.*from.*models"],
      in: "**/api/index.ts",
      message: "Drizzle table exports belong in models/index.ts, not api/index.ts. Backend behavior belongs in api/index.ts.",
      exceptions: [
        { in: "apps/**", reason: "App-level api barrel may reference its own models." },
      ],
    },
    // ── Module direct dependency imports ─────────────────────
    {
      id: "module-adapter-mediated-deps-web",
      severity: "warn",
      type: "line",
      description: "Module web code must not import adapter-mediable framework libraries directly. Toast and i18n libraries are swappable per product and must go through the module's provider adapters.",
      match: [
        "from ['\"]sonner",
        "from ['\"]react-hot-toast",
        "from ['\"]react-toastify",
        "from ['\"]i18next",
        "from ['\"]react-i18next",
      ],
      in: "apps/main/slices/**/web/**",
      message: "This library is adapter-mediated. Modules must consume it via the injected adapter (toast for notifications, translate / TranslationFunction for i18n) instead of importing the library directly. Peer-dependencies like react-query, react-router, and better-auth are NOT covered by this rule — they're architecturally legal direct imports.",
      exceptions: [
        { in: "**/providers/**", reason: "Module provider is the adapter boundary — it may import the framework to wrap it." },
      ],
    },
    {
      id: "module-adapter-mediated-deps-mobile",
      severity: "warn",
      type: "line",
      description: "Module mobile code must not import adapter-mediable framework libraries directly. Toast and i18n libraries are swappable per product and must go through the module's provider adapters.",
      match: [
        "from ['\"]sonner",
        "from ['\"]react-hot-toast",
        "from ['\"]react-toastify",
        "from ['\"]i18next",
        "from ['\"]react-i18next",
      ],
      in: "apps/main/slices/**/mobile/**",
      message: "This library is adapter-mediated. Modules must consume it via the injected adapter (toast for notifications, translate / TranslationFunction for i18n) instead of importing the library directly.",
      exceptions: [
        { in: "**/providers/**", reason: "Module provider is the adapter boundary — it may import the framework to wrap it." },
      ],
    },
    // ── WithScope naming anti-pattern ─────────────────────────
    {
      id: "no-with-scope-suffix",
      severity: "warn",
      type: "line",
      description: "Do not suffix repository method names with WithScope — it's redundant. All protected queries use scope by default.",
      match: ["WithScope\\(", "WithScope\\s*="],
      in: ["**/repositories/**", "**/*.repository.ts"],
      message: "WithScope suffix is redundant. Rename to the base name (e.g., findAllWithScope → findAll). Every protected query goes through engine.resolveForReadUpdate — the suffix implies there's an unscoped version.",
    },
    // ── Rule E: pgTable/pgView declarations must live in models/ ──
    {
      id: "pg-table-only-in-models",
      severity: "error",
      type: "line",
      description: "pgTable and pgView declarations must live in models/ directories. Drizzle schema definitions are centralized.",
      match: ["pgTable\\(", "pgView\\("],
      message: "Drizzle schema definitions (pgTable/pgView) must be in **/models/**. No agent may create table or view definitions anywhere else.",
      exceptions: [
        { in: "**/models/**", reason: "Models define the schema." },
        { in: "**/migrations/**", reason: "Migrations may reference tables." },
        { in: "shared/libs/scoped-ac/**", reason: "scoped-ac reference schemas." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
    // ── scoped-ac v1 API globally forbidden ────────────────────────
    // ADR 2026-04-25 (agnostic-engine): resolveScope, resolveScopeForJoin, canCreate
    // are replaced by the v2 two-call API (expandRoles + resolveForReadUpdate /
    // resolveForCreateDelete). Old names must not appear anywhere in consumer code.
    {
      id: "scoped-ac-v1-api-forbidden",
      severity: "error",
      type: "line",
      description: "scoped-ac v1 API names are deprecated. Use v2: expandRoles + resolveForReadUpdate / resolveForCreateDelete.",
      match: ["\\.resolveScope\\(", "resolveScopeForJoin\\(", "\\.canCreate\\("],
      message: "scoped-ac v1 API. Migrate: resolveScope → resolveForReadUpdate, resolveScopeForJoin → (removed; use access conditions), canCreate → resolveForCreateDelete. See ADR 2026-04-25-agnostic-engine.md.",
      exceptions: [
        { in: "shared/libs/scoped-ac/**", reason: "scoped-ac may retain v1 names internally during the migration window." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
    // ── Retired scoped-ac API and AC patterns ─────────────────────────
    // The 2026-04-29 engine ADR renamed the API surface and retired the
    // two-step compile pattern and the old wrapper conventions.
    // All of the below are errors — not warnings. The refactor enforces
    // the canonical architecture without migration grace period.
    // See docs/01_reference/access-control.md and AC-PATTERNS.md.
    {
      id: "retired-ac-api",
      severity: "error",
      type: "line",
      description: "Retired scoped-ac API. Migrate to the four-method engine surface (resolveRead / resolveUpdate / resolveCreate / resolveDelete).",
      match: [
        "\\.resolveForReadUpdate\\(",
        "\\.resolveForCreateDelete\\(",
        "scopeFilterBuilder\\.compile\\(",
        "\\bthis\\.resolveRead\\(",
        "\\bthis\\.resolveWrite\\(",
        "\\bcheckWriteScope\\b",
        "//\\s*\\[PATTERN:",
      ],
      message: "Retired AC pattern. Migrate to the current engine API and [AC:X] tag grammar. See docs/01_reference/access-control.md and shared/libs/scoped-ac/docs/consumer/AC-PATTERNS.md.",
      exceptions: [
        { in: "shared/libs/scoped-ac/**", reason: "scoped-ac retains deprecated methods on the public surface during the migration window." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
    // ── UI: No raw native elements ─────────────────────────
    // Every interactive control, data display, overlay, and separator has a
    // @libs/web-components equivalent. Raw HTML bypasses the theme engine.
    // Allowed raw: <a>/<Link>, <form>, <img> (non-avatar), <svg> (lib only),
    // <span>, <div>, <input type="file">, semantic HTML (<main>, <section>, <article>, <nav>).
    {
      id: "no-raw-native-elements",
      severity: "warn",
      type: "line",
      description: "Use @libs/web-components instead of raw native HTML elements.",
      match: [
        // Interactive controls (<input type="file"> is the only allowed raw input)
        "<button[\\s>]",
        "<input(?!.*type=[\"']file)[\\s/>]",
        "<select[\\s>]",
        "<textarea[\\s>]",
        "<label[\\s>]",
        "<dialog[\\s>]",
        // Table family → Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption
        "<table[\\s>]",
        "<thead[\\s>]",
        "<tbody[\\s>]",
        "<tfoot[\\s>]",
        "<tr[\\s>]",
        "<th[\\s>]",
        "<td[\\s>]",
        "<caption[\\s>]",
        // Separator
        "<hr[\\s/>]",
        // Lists → List, ListItem, ListItemContent, ListItemTitle, ListItemDescription, ListItemAction
        "<ul[\\s>]",
        "<li[\\s>]",
        // SVG — only the component library may render raw SVG
        "<svg[\\s>]",
      ],
      in: ["apps/main/slices/**", "apps/main/shared/web/src/**"],
      message: "Use @libs/web-components instead of raw HTML elements. Component map: Button, ButtonGroup, Input, InputGroup, Checkbox, RadioGroup/RadioGroupItem, Toggle/ToggleGroup, Select, Combobox, MultiSelect, DatePicker, FileUpload, Textarea, Label, Dialog, AlertDialog, Alert, EmptyState, Popover, HoverCard, Progress, Breadcrumb, TreeView, Table/*, Separator, List/*, Icon (for SVG). Only <input type=\"file\"> is allowed raw.",
      exceptions: [
        { in: "shared/libs/ui/**", reason: "Component library defines these wrappers." },
        { in: "apps/main/shared/web/src/routes/sandbox/**", reason: "Sandbox is a dev playground, not production UI." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
    // ── UI: No raw typography elements without element= ──────
    // <h1>...<h4> and <p> must carry element="type--*" to participate in the
    // theme engine. Bare heading/paragraph tags bypass typography tokens.
    {
      id: "no-raw-typography-elements",
      severity: "warn",
      type: "line",
      description: "Typography elements (<h1>-<h4>, <p>) must have element=\"type--*\" attribute.",
      match: [
        "<h[1-4](?!.*element=)[\\s>]",
        "<p(?!.*element=)[\\s>]",
      ],
      in: ["apps/main/slices/**", "apps/main/shared/web/src/**"],
      message: "Raw <h1>-<h4> and <p> elements must carry element=\"type--*\" to participate in the theme engine. Example: <h1 element=\"type--heading1\">.",
      exceptions: [
        { in: "shared/libs/ui/**", reason: "Component library internals." },
        { in: "apps/main/shared/web/src/routes/sandbox/**", reason: "Sandbox is a dev playground, not production UI." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
    // ── UI: No camelCase type-- axis values ──────────────────
    // CSS attribute selectors are case-sensitive. The engine emits [type--body-small].
    // type--bodySmall in markup silently matches nothing.
    {
      id: "no-camelcase-type-axis",
      severity: "error",
      type: "line",
      description: "type-- axis values must be kebab-case. type--bodySmall never matches a CSS selector.",
      match: ["type--[a-z]+[A-Z]"],
      in: ["apps/main/slices/**", "apps/main/shared/web/src/**"],
      message: "type-- axis values must be kebab-case (e.g. type--body-small, not type--bodySmall). CamelCase values silently match no CSS selector.",
      exceptions: [
        { in: "shared/libs/ui/**", reason: "Component library internals." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
    // ── UI: No element= and layout= on same node ────────────
    // A single DOM node cannot have both attributes. One or the other.
    {
      id: "no-element-layout-both",
      severity: "error",
      type: "line",
      description: "A DOM node cannot have both element= and layout= attributes.",
      match: [
        "(?=.*\\belement=)(?=.*\\blayout=)",
      ],
      in: ["apps/main/slices/**", "apps/main/shared/web/src/**"],
      message: "A single node cannot have both element= and layout=. Use one or the other. Split into a layout wrapper and a styled child if both are needed.",
      exceptions: [
        { in: "shared/libs/ui/**", reason: "Component library internals." },
      ],
    },
    // ── UI: No layout= on bare divs ─────────────────────────
    // Only @libs/web-layouts primitives should emit layout= attributes.
    // A bare <div layout="..."> means someone is bypassing the layout system.
    // Also: <div className="overflow-y-auto"> should be ScrollArea.
    {
      id: "no-layout-bare-div",
      severity: "warn",
      type: "line",
      description: "Bare divs must not carry layout= attributes or act as scroll containers. Use @libs/web-layouts primitives.",
      match: [
        // Bare div emitting layout= (only layout components should)
        "<div[^>]*\\blayout=",
        // Scroll containers must use ScrollArea
        "<div[^>]*overflow-y-auto",
        "<div[^>]*overflow-x-auto",
        // Shell-level structural patterns — must use @libs/web-layouts
        "<div[^>]*(?<![a-z0-9-])h-screen",
        "<div[^>]*(?<![a-z0-9-])max-h-screen",
        "<div[^>]*(?<![a-z0-9-])min-h-screen",
        "<div[^>]*(?<![a-z0-9-])w-screen",
        // Raw <main> — use Main from @libs/web-layouts
        "<main[\\s>]",
      ],
      in: ["apps/main/slices/**", "apps/main/shared/web/src/**"],
      message: "Shell-level structure (h-screen, overflow-auto, <main>) and layout= on bare divs must use @libs/web-layouts primitives (Shell, Page, Main, ScrollArea, etc.).",
      exceptions: [
        { in: "shared/libs/ui/**", reason: "Layout library internals." },
        { in: "apps/main/shared/web/src/routes/sandbox/theme-editor/**", reason: "Theme editor is a meta-tool — must be independent from the theme engine." },
        { in: "apps/main/shared/web/src/routes/sandbox/_shared/**", reason: "Sandbox shared components are dev tooling, not production UI." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
    // ── UI: No layout dimension override ─────────────────────
    // Consumers must not fight the layout engine's ownership of dimensions,
    // overflow, and positioning on @libs/web-layouts primitives. The engine sets
    // these via CSS selectors on layout= + scale= attributes.
    {
      id: "no-layout-dimension-override",
      severity: "warn",
      type: "line",
      description: "Layout component dimensions, overflow, and positioning are owned by the layout engine. Do not set them via className.",
      match: [
        // Hardcoded height — scale system owns height of layout components
        `${_A}\\bh-(?!auto|full\\b)\\w+`,
        `${_A}\\bmin-h-\\w+`,
        `${_A}\\bmax-h-\\w+`,
        // Hardcoded width — only on dimension-owning sidebar/panel components
        `${_AS}\\bw-(?!auto|full\\b)\\w+`,
        `${_AS}\\bmin-w-\\w+`,
        `${_AS}\\bmax-w-\\w+`,
        // Overflow — layout components own their scroll contract
        `${_A}\\boverflow-\\w+`,
        // External flex sizing — parent layout controls how these fill space
        `${_A}\\bflex-1\\b`,
        `${_A}\\bgrow\\b`,
        `${_A}\\bflex-grow\\b`,
        `${_A}\\bshrink-0\\b`,
        `${_A}\\bflex-shrink\\b`,
        `${_A}\\bbasis-\\w+`,
        // Hardcoded positioning — use sticky prop; layout owns stacking context
        `${_A}\\bsticky\\b`,
        `${_A}\\bfixed\\b`,
        `${_A}\\babsolute\\b`,
        `${_A}\\btop-\\w+`,
        `${_A}\\bbottom-\\w+`,
        `${_A}\\bleft-\\w+`,
        `${_A}\\bright-\\w+`,
        `${_A}\\bz-\\w+`,
        // Inline style dimensions — same ownership rule
        `${_ST}(?:height|width|overflow|position)`,
      ],
      in: ["apps/main/slices/**", "apps/main/shared/web/src/**"],
      message: "Remove this class from the layout component. Height, width, overflow, flex-fill, and positioning are set by the theme engine via scale= and layout= attributes. Use the `scale` or `sticky` props instead.",
      exceptions: [
        { in: "shared/libs/ui/**", reason: "Layout library internals." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
    // ── UI: No Tailwind aesthetic classes ─────────────────────
    // Markup dictionary: components MUST NOT use bg-*, rounded-*, shadow-*,
    // border-*, ring-*, opacity-*, or text-{color}-* classes. Theme owns these.
    {
      id: "no-tailwind-aesthetic",
      severity: "warn",
      type: "line",
      description: "No Tailwind aesthetic classes in module/app web code. Theme owns visual properties via element= attributes.",
      match: [
        // Surface / shape
        "className=.*\\b(?:bg-(?!transparent|inherit|current)\\w+)",
        "className=.*\\b(?:rounded-\\w+)",
        "className=.*\\b(?:shadow-\\w+)",
        "className=.*\\b(?:drop-shadow-\\w+)",
        "className=.*\\b(?:blur-\\w+)",
        "className=.*\\b(?:border-(?!none|collapse|separate|spacing)\\w+)",
        "className=.*\\b(?:ring-\\w+)",
        "className=.*\\b(?:opacity-\\w+)",
        // SVG paint — theme owns icon color
        "className=.*\\b(?:fill-\\w+)",
        "className=.*\\b(?:stroke-\\w+)",
        // Color — raw palette colors
        "className=.*\\b(?:text-(?:red|green|blue|amber|yellow|orange|emerald|zinc|slate|gray|white|black|rose|violet|purple|indigo|cyan|teal|lime|fuchsia|pink|sky|stone|neutral)[-/])",
        // Color — semantic tokens used as Tailwind classes (bypass element= attributes)
        "className=.*\\b(?:text-(?:muted-foreground|destructive|primary|secondary|accent|foreground|popover-foreground|card-foreground))",
        // Typography — font weight
        "className=.*\\b(?:font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black))",
        // Typography — text size
        "className=.*\\b(?:text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl))",
        // Typography — line height
        "className=.*\\b(?:leading-\\w+)",
        // Typography — letter spacing
        "className=.*\\b(?:tracking-\\w+)",
        // Typography — text decoration and rendering
        "className=.*\\b(?:italic|underline|line-through|no-underline|antialiased)",
        // Spacing — all spacing is theme-owned (interior.padding, interior.gap)
        // mx-auto / my-auto / m-auto are exempt: centering mechanics, not spacing values
        "className=.*\\b(?:p|px|py|pt|pb|pl|pr)-\\w+",
        "className=.*\\b(?:gap|gap-x|gap-y)-\\w+",
        "className=.*\\b(?:m|mt|mb|ml|mr)-\\w+",
        "className=.*\\bmx-(?!auto\\b)\\w+",
        "className=.*\\bmy-(?!auto\\b)\\w+",
        "className=.*\\b(?:space-[xy]-\\w+)",
        // Gradient stops
        "className=.*\\b(?:from-\\w+)",
        "className=.*\\b(?:to-\\w+)",
        "className=.*\\b(?:via-\\w+)",
        // Animation / transition
        "className=.*\\b(?:transition-\\w+)",
        "className=.*\\b(?:duration-\\w+)",
        "className=.*\\b(?:ease-\\w+)",
        "className=.*\\b(?:animate-\\w+)",
        // Misc aesthetic
        "className=.*\\b(?:prose)",
        "className=.*\\b(?:cursor-(?:pointer|not-allowed|default|grab|grabbing))",
        "className=.*\\b(?:select-none)",
        "className=.*\\b(?:outline-\\w+)",
      ],
      in: ["apps/main/slices/**", "apps/main/shared/web/src/**"],
      message: "Tailwind aesthetic classes are owned by the theme engine. Use element= and axis attributes instead. Only structural Tailwind (flex, grid, w, h, items, justify, overflow, relative, absolute, mx-auto) is allowed.",
      exceptions: [
        { in: "shared/libs/ui/**", reason: "Component library is the theme boundary." },
        { in: "apps/main/shared/web/src/routes/sandbox/**", reason: "Sandbox is a dev playground, not production UI." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
    // ── UI: No inline styles for visual properties ───────────
    {
      id: "no-inline-visual-styles",
      severity: "warn",
      type: "line",
      description: "No inline styles for visual properties. Theme owns appearance via element= attributes.",
      match: [
        "style=\\{.*(?:color|backgroundColor|background|border|shadow|opacity|fontFamily|fontSize|fontWeight|borderRadius)",
      ],
      in: ["apps/main/slices/**", "apps/main/shared/web/src/**"],
      message: "Inline styles for visual properties bypass the theme engine. Use element= and axis attributes instead.",
      exceptions: [
        { in: "shared/libs/ui/**", reason: "Component library internals." },
        { in: "apps/main/shared/web/src/routes/sandbox/**", reason: "Sandbox is a dev playground, not production UI." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
    // ── UI: No inline CSS custom properties ──────────────────
    {
      id: "no-inline-css-vars",
      severity: "warn",
      type: "line",
      description: "No inline --bg, --fg, --tint, --border-color, --bg-alpha overrides. Theme owns these composition variables.",
      match: [
        "style=\\{.*--(?:bg|fg|tint|border-color|bg-alpha)",
      ],
      in: ["apps/main/slices/**", "apps/main/shared/web/src/**"],
      message: "Do not override theme composition variables (--bg, --fg, --tint, --border-color, --bg-alpha) via inline styles. Customise through the theme object or concept overrides.",
      exceptions: [
        { in: "shared/libs/ui/**", reason: "Theme engine internals." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },

    // ── TypeScript discipline: `as` casts ─────────────────────
    // The constitution forbids `as` casts except at sanctioned system
    // boundaries (Hono validator erasure, BetterAuth response normalization,
    // Drizzle row reads where TS cannot infer, TanStack Router typing gaps,
    // test mocks, `as const`).
    //
    // Rule 1: `as unknown as X` double-casts are ALWAYS banned — no
    //   boundary can legitimise them. They bypass the type system entirely.
    //
    // Rule 2: Single `as X` casts must be accompanied by a
    //   `// boundary:` comment on the same line or the line immediately
    //   above, naming the sanctioned context. `as const` is exempt
    //   (language idiom, not a cast), as are `as never` (Hono validator
    //   erasure — always at a boundary), import aliases, and TSX generic
    //   identifiers.
    //
    // See _meta/reports/2026-04-19-as-cast-inventory.md for context.
    {
      id: "no-as-unknown-as",
      severity: "error",
      type: "line",
      description: "`as unknown as X` double-casts are always forbidden — they bypass the type system.",
      match: ["\\bas\\s+unknown\\s+as\\b"],
      message: "`as unknown as X` is unconditionally banned. Use a single `as X` at a sanctioned boundary (with a `// boundary:` comment), or rewrite the types / add runtime validation.",
      exceptions: [
        { in: "**/__test__/**", reason: "Test files may mock with double-casts." },
        { in: "**/*.test.*", reason: "Test files." },
        { in: "**/__proof__/**", reason: "Type-proof files are PoC scaffolding." },
        { in: "apps/main/shared/web/src/routes/sandbox/**", reason: "Sandbox playground." },
        { in: "apps/main/slices/seed/notifications/**", reason: "Stub module — separate decision." },
        { in: "apps/main/shared/mobile/**", reason: "POC app — deferred." },
      ],
    },
    {
      id: "require-boundary-comment-on-cast",
      // Superseded by the `cast-boundary` processor (allowlist-gated enforcement).
      // Comment convention preserved as documentation; enforcement moved to file allowlists.
      severity: "warn",
      type: "line",
      description: "`as` casts must carry a `// boundary:` comment naming the sanctioned boundary.",
      // Match ` as <TypeName>` where TypeName starts with a capital letter or `{`
      // (type literal) or `(` (parenthesized type). Exclude:
      //   - `as const` (language idiom)
      //   - `as never` (Hono validator erasure — always at a boundary; covered by closed list #1)
      //   - import/export aliases (`import { X as Y } from ...` / `export ... as Y`)
      //   - generic type params like `Array<T as ...>` (non-standard, unlikely)
      match: [
        " as (?!const\\b|never\\b|unknown\\b)[A-Z_$][A-Za-z0-9_$]*",
        " as \\{",
        " as \\(",
      ],
      // Skip when:
      //   - same / preceding line carries `// boundary:` annotation
      //   - line begins with `import` / `export` (single-line statement)
      //   - line is a destructure entry inside a multi-line import (e.g.
      //     `  X as Y,` between `import {` and `} from "..."`); the
      //     processor only walks back one non-blank line, so this pattern
      //     lets the chain continue through alias-only lines.
      skipIfNearby: "//\\s*boundary:|^\\s*(?:import|export)\\s|^\\s*[A-Za-z_$][A-Za-z0-9_$]*\\s+as\\s+[A-Za-z_$][A-Za-z0-9_$]*\\s*,?\\s*$",
      in: [
        "shared/libs/**",
        "apps/main/slices/seed/user-organization-mgmt/**",
        "configs/**",
        "apps/main/shared/api/src/**",
        "apps/main/shared/web/src/**",
        "apps/orchestrator/shared/**",
        "apps/orchestrator/slices/**",
      ],
      message: "`as` cast without `// boundary:` annotation. Either add a comment naming the sanctioned boundary (Hono, BetterAuth, Drizzle, Test, TanStack), rewrite using proper typing / runtime validation, or use `as const` if that's what you meant.",
      exceptions: [
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
        { in: "**/__proof__/**", reason: "Type-proof files." },
        { in: "apps/main/shared/web/src/routes/sandbox/**", reason: "Sandbox playground." },
        { in: "apps/main/slices/seed/notifications/**", reason: "Stub module — separate decision." },
        { in: "apps/main/shared/mobile/**", reason: "POC app — deferred." },
      ],
    },

    // ── i18n enforcement ─────────────────────────────────────
    {
      id: "i18n-config-strings-web",
      severity: "warn",
      type: "co-occurrence",
      description: "Web app TS files with user-facing string properties should use i18n.",
      in: "apps/main/shared/web/src/**/*.ts",
      match: ["title:\\s*['\"]", "label:\\s*['\"]", "description:\\s*['\"]", "message:\\s*['\"]"],
      mustCoexist: ["i18next", "useTranslation", "\\bt\\("],
      message: "This file contains user-facing string properties (title, label, etc.) but doesn't use i18n. Wrap with t() or accept a TranslationFunction.",
      exceptions: [
        { in: "**/variables.config.ts", reason: "Display format preferences, not user-facing labels." },
        { in: "**/route-tree.ts", reason: "Route definitions — titles come from module route contributions." },
        { in: "**/lib/**", reason: "Adapter/infrastructure code — errors are mapped to i18n keys downstream." },
        { in: "apps/main/shared/web/src/routes/sandbox/theme-editor/**", reason: "Theme editor is a developer tool — strings are editor labels, not product UI." },
        { in: "apps/main/shared/web/src/routes/sandbox/_shared/**", reason: "Sandbox shared dev tooling." },
      ],
    },
    {
      id: "i18n-config-strings-mobile",
      severity: "warn",
      type: "co-occurrence",
      description: "Mobile app TS files with user-facing string properties should use i18n.",
      in: "apps/main/shared/mobile/src/**/*.ts",
      match: ["title:\\s*['\"]", "label:\\s*['\"]", "description:\\s*['\"]", "message:\\s*['\"]"],
      mustCoexist: ["i18next", "useTranslation", "\\bt\\("],
      message: "This file contains user-facing string properties (title, label, etc.) but doesn't use i18n. Wrap with t() or accept a TranslationFunction.",
      exceptions: [
        { in: "**/lib/**", reason: "Adapter/infrastructure code — errors are mapped to i18n keys downstream." },
      ],
    },
    // ── BA HTTP CRUD endpoints must stay disabled ─────────────────────
    // Successor to the retired `data-access:ba-disabled-paths-missing` rule.
    // The org-plugin's nine HTTP endpoints (/api/auth/organization/*) bypass
    // the module middleware chain and the engine; they must be turned off
    // via BetterAuth's `disabledPaths` so every entity write goes through
    // /api/client/* and the BAAdapter. Single regex with nine path lookaheads —
    // the rule fires unless all are present in the file.
    {
      id: "ba-disabled-paths-complete",
      severity: "error",
      type: "co-occurrence",
      description: "BetterAuth instance must disable all nine /organization/* HTTP CRUD endpoints. Each one bypasses the module's authorization chain and the scoped-ac engine.",
      in: "apps/main/slices/seed/user-organization-mgmt/api/services/mount-user-org-auth.ts",
      match: ["\\bbetterAuth\\("],
      mustCoexist: [
        "(?=[\\s\\S]*[\"']/organization/create[\"'])(?=[\\s\\S]*[\"']/organization/update[\"'])(?=[\\s\\S]*[\"']/organization/delete[\"'])(?=[\\s\\S]*[\"']/organization/invite-member[\"'])(?=[\\s\\S]*[\"']/organization/accept-invitation[\"'])(?=[\\s\\S]*[\"']/organization/reject-invitation[\"'])(?=[\\s\\S]*[\"']/organization/cancel-invitation[\"'])(?=[\\s\\S]*[\"']/organization/remove-member[\"'])(?=[\\s\\S]*[\"']/organization/update-member-role[\"'])",
      ],
      message: "BetterAuth is configured but `disabledPaths` is missing one or more of the nine /organization/* CRUD entries. All nine must be disabled — those endpoints bypass /api/client/* and the BAAdapter, leaking writes around the access control system.",
    },

    // ── Config data purity ────────────────────────────────────────
    {
      id: "configs-no-functions-in-config",
      severity: "warn",
      type: "line",
      description: "*.config.ts files must not export functions. Config files declare data; behavior belongs in the owning module.",
      match: [
        "^export\\s+(async\\s+)?function\\s",
        "^export\\s+const\\s+\\w+\\s*=\\s*(async\\s+)?\\(",
        "^export\\s+const\\s+\\w+\\s*=\\s*(async\\s+)?function",
      ],
      in: ["configs/**/*.config.ts"],
      message: "Export a plain data value instead of a function. Runtime logic belongs in the module, not in a config file.",
    },
  ],

  metrics: [
    { id: "max-file-lines", enabled: false, type: "file-lines", warn: 300, error: 500 },
    { id: "max-folder-files", enabled: false, type: "folder-files", warn: 15, error: 25 },
    { id: "max-function-lines", enabled: false, type: "function-lines", warn: 50, error: 80 },
    { id: "max-function-params", enabled: false, type: "function-params", warn: 4, error: 6 },
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
      allowedFiles: ["lint-controls.ts", "lint-config.ts", "index.ts"],
    },
    {
      id: "module-has-shared-types",
      severity: "error",
      type: "required",
      description: "Every module must have shared/types/ for public type contracts.",
      path: "apps/main/slices/*/*/shared/types/",
      mustNotBeEmpty: true,
    },
    // ── Config zone positive assertion ────────────────────────────
    // Axiom (config-architecture.md): everything configurable lives under configs/.
    // Positive control: any *.config.ts outside the configs/ zone is a violation —
    // regardless of where it lives today or tomorrow.
    {
      id: "config-files-must-be-in-configs-zone",
      severity: "error",
      type: "forbidden",
      description: "Module config files (*.config.ts) must live under configs/. Placing them in shared/ or scattered across apps/ violates the single-config-zone axiom.",
      path: "**/*.config.ts",
      exceptions: [
        { path: "configs/**", reason: "configs/ is the canonical config zone — all module configs live here." },
        { path: "apps/**/config/**", reason: "App-level wiring (module-mount, server config) is app-internal infrastructure, not module config." },
        { path: "shared/libs/**", reason: "Library-internal config helpers are not module configs." },
        // Tooling configs — these configure build, test, and migration tools, not module business logic.
        // They must live at the package root by their tool's convention.
        { path: "**/vite.config.*", reason: "Vite build config is tooling, not module config. Must live at app root by Vite convention." },
        { path: "**/vitest.*.config.*", reason: "Vitest test config is tooling. Must live at app root by Vitest convention." },
        { path: "**/drizzle.config.*", reason: "Drizzle migration config is tooling. Must live at app root by Drizzle convention." },
        { path: "**/trigger.config.*", reason: "Trigger.dev project config is tooling. Must live at app root by the CLI's convention." },
        { path: "**/app.config.*", reason: "Expo app config is mobile tooling. Must live at app root by Expo convention." },
        { path: "**/__test__/**", reason: "Test config files." },
      ],
    },
    // ── Rule D: Validation schema files must live in models/ ──
    {
      id: "schemas-in-models",
      severity: "warn",
      type: "forbidden",
      description: "Validation schema files (*.schemas.ts) must live in models/ directories, co-located with their Drizzle model.",
      path: "**/*.schemas.ts",
      allowedFiles: [],
      exceptions: [
        { path: "**/models/**", reason: "Models directory is the canonical location." },
        { path: "configs/**", reason: "Configs may use Zod for value declarations." },
        { path: "**/__test__/**", reason: "Test files." },
      ],
    },

    // ── Config zone rules ─────────────────────────────────────────
    // Enforce the canonical config-architecture.md layout:
    // only .config.ts, .ac.ts, index.ts, or types.ts are allowed.
    {
      id: "configs-suffix-discipline",
      severity: "warn",
      type: "forbidden",
      description: "Files under configs/ must use .config.ts, .ac.ts, index.ts, or types.ts suffixes. Other names signal runtime code or misplaced types.",
      message: "Rename to *.config.ts (data), *.ac.ts (rules), index.ts, or types.ts — or move the file to the owning module.",
      path: "configs/**/*.ts",
      exceptions: [
        { path: "configs/**/*.config.ts", reason: "Allowed: config data declaration files." },
        { path: "configs/**/*.ac.ts", reason: "Allowed: access-control rule files." },
        { path: "configs/**/index.ts", reason: "Allowed: package entry points." },
        { path: "configs/**/types.ts", reason: "Allowed: type declaration files." },
      ],
    },
    {
      id: "ac-rules-only-in-rules-folder",
      severity: "error",
      type: "forbidden",
      description: "*.ac.ts files must live under configs/access-control/rules/<module>/. An ac file elsewhere mixes rule authorship with config declarations.",
      message: "Move this .ac.ts file to configs/access-control/rules/<module>/.",
      path: "configs/**/*.ac.ts",
      exceptions: [
        { path: "configs/access-control/rules/*.ac.ts", reason: "Canonical location for AC rule files (direct in rules/)." },
        { path: "configs/access-control/rules/**/*.ac.ts", reason: "Canonical location for AC rule files (in module subfolders)." },
      ],
    },
  ],

  // ── JSX External Allowlist ─────────────────────────────────────
  // If a JSX element resolves to an identifier imported from an external
  // package, that package must be in this allowlist. Internal imports are
  // ignored — they are linted in their own files under the same policy.
  "jsx-external-allowlist": [
    {
      id: "jsx-external-allowlist",
      severity: "warn",
      description: "JSX components from external packages must come from the approved design system.",
      message: "This component is imported from an external package not in the UI allowlist. Use @libs/web-components or @libs/web-layouts instead.",
      in: ["apps/main/slices/**", "apps/main/shared/web/src/**"],
      allowedPackages: [
        // Design system
        "@libs/web-components",
        "@libs/web-layouts",
        "@libs/list-query",
        "@libs/availability-check",
        // React core (Fragment, Suspense, StrictMode, etc.)
        "react",
        "react-dom",
        // Router (Link, Outlet, etc.)
        "@tanstack/react-router",
        "@tanstack/react-router-devtools",
        "@tanstack/react-query",
        // i18n (Trans component)
        "react-i18next",
        // Forms (Controller, FormProvider, etc.)
        "react-hook-form",
      ],
      exceptions: [
        { in: "shared/libs/ui/**", reason: "Component library wraps external primitives." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
  ],

  // ── JSX AST Rules ──────────────────────────────────────────────
  // These rules require parsing the JSX tree (parent-child awareness).
  "jsx-ast": {
    in: ["apps/main/slices/**", "apps/main/shared/web/src/**"],
    exceptions: [
      { in: "shared/libs/ui/**", reason: "Component library internals." },
      { in: "**/__test__/**", reason: "Test files." },
      { in: "**/*.test.*", reason: "Test files." },
    ],
    rules: [
      {
        id: "no-anchor-button-nesting",
        severity: "error",
        description: "<a>/<Link> cannot contain <button> or button-rendering components. Use asChild.",
        message: "Interactive element nested inside anchor creates invalid HTML. Use the asChild Slot pattern.",
      },
      {
        id: "no-shell-bare-div",
        severity: "warn",
        description: "Bare <div> wrapping shell components (SidebarProvider, SidebarInset, <main>) must use @libs/web-layouts.",
        message: "Shell structure must use Shell/Page from @libs/web-layouts, not bare divs.",
      },
    ],
  },

  eslint: {
    enabled: true,
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_",
      }],
      "@typescript-eslint/ban-ts-comment": ["error", {
        "ts-ignore": true,
        "ts-expect-error": true,
        "ts-nocheck": true,
      }],
    },
  },

  // ── Cast Boundary Allowlists ───────────────────────────────────────
  // Files listed here are permitted to contain `as X` casts at the named boundary.
  // Enforcement semantics (see cast-boundary.processor.ts):
  //   File in list + correct comment       → PASS
  //   File in list + missing comment       → WARN  (documentation debt)
  //   File in list + wrong-boundary comment → WARN  (doc mismatch)
  //   File NOT in any list                 → ERROR
  //   `as const` / `as never` / import aliases → always exempt
  //
  // Closed boundary list: BetterAuth | Hono | Drizzle | TanStack | Test
  // DO NOT add boundaries outside this list.
  "cast-boundary": {
    allowLists: {
      BetterAuth: [
        // ── Module-internal BetterAuth construction ────────────
        { path: "apps/main/slices/seed/user-organization-mgmt/api/services/mount-user-org-auth.ts",
          rationale: "BetterAuth server setup + plugin wiring (encapsulated inside the module)" },
        { path: "apps/main/slices/seed/user-organization-mgmt/api/mount.ts",
          rationale: "BA system caller adapter + per-method auth.api widening at the mount seam" },
        // ── App infrastructure ──────────────────────────────────
        { path: "apps/main/shared/api/src/lib/error.ts",
          rationale: "BetterAuth error-shape translation" },
        // ── Web auth client infrastructure ──────────────────────
        { path: "apps/main/shared/web/src/lib/auth-client-adapter.ts",
          rationale: "Adapter to BetterAuth untyped client surface" },
        { path: "apps/main/shared/web/src/components/**",
          rationale: "App-level components may consume BetterAuth session data" },
        { path: "apps/main/shared/web/src/hooks/**",
          rationale: "App-level hooks consume BetterAuth session shapes" },
        // ── Module API services + lib ───────────────────────────
        { path: "apps/main/slices/seed/user-organization-mgmt/api/services/**",
          rationale: "Services bridge BetterAuth API calls and cross-org operations" },
        { path: "apps/main/slices/seed/user-organization-mgmt/api/lib/**",
          rationale: "Module API infrastructure bridges BetterAuth and Hono context" },
        // ── Module shared utilities ──────────────────────────────
        { path: "apps/main/slices/seed/user-organization-mgmt/shared/**",
          rationale: "Shared utilities process BetterAuth-derived and module config shapes" },
        // ── Module web layer ────────────────────────────────────
        { path: "apps/main/slices/seed/user-organization-mgmt/web/**",
          rationale: "All web code in this module is at the BetterAuth session boundary" },
      ],
      Hono: [
        // ── Module routes (c.req.valid type erasure) ────────────
        { path: "apps/main/slices/*/*/api/routes/**",
          rationale: "c.req.valid() return type is erased to unknown at the Hono route boundary" },
        // ── Module middlewares (Hono context vars) ───────────────
        { path: "apps/main/slices/*/*/api/middlewares/**",
          rationale: "Hono context variable type erasure (c.get/c.set)" },
        // ── App API routes ───────────────────────────────────────
        { path: "apps/main/shared/api/src/routes/**",
          rationale: "c.req.valid type erasure at Hono router boundary" },
        // ── App feature routers (flat naming convention) ─────────
        { path: "apps/main/shared/api/src/features/**/*.router.ts",
          rationale: "c.req.valid type erasure at Hono route boundary — same as routes/, flat convention" },
        // ── Feature session-context helpers ──────────────────────
        { path: "apps/main/shared/api/src/features/**/lib/session-context.ts",
          rationale: "c.get() context variable type erasure at the Hono context boundary" },
        // ── scoped-ac Hono adapter ───────────────────────────────
        { path: "shared/libs/scoped-ac/src/adapters/hono/**",
          rationale: "Hono middleware adapter casts Hono context variable shapes" },
      ],
      Drizzle: [
        // ── Module repositories (ORM row-read inference) ─────────
        { path: "apps/main/slices/*/*/api/repositories/**",
          rationale: "Drizzle ORM row-read inference gaps require casts at the repository boundary" },
        // ── App feature repositories (flat naming convention) ────
        { path: "apps/main/shared/api/src/features/**/*.repository.ts",
          rationale: "Drizzle ORM row-read inference gaps — same as repositories/, flat convention" },
        // ── Module mount entrypoint (db narrowing) ───────────────
        { path: "apps/main/slices/*/*/api/mount*",
          rationale: "Mount entrypoint narrows app superset db type to the module's schema subset" },
        // ── scoped-ac Drizzle adapter ────────────────────────────
        { path: "shared/libs/scoped-ac/src/adapters/drizzle/**",
          rationale: "Drizzle column/SQL fragment casts at the adapter boundary" },
      ],
      TanStack: [
        // ── Route tree assembly ──────────────────────────────────
        { path: "apps/main/shared/web/src/lib/build-route-tree.ts",
          rationale: "TanStack Router generic erasure in route-tree assembly" },
        { path: "apps/main/shared/web/src/route-tree.ts",
          rationale: "TanStack Router generated route tree — strict generic inference gaps" },
        // ── App route files ──────────────────────────────────────
        { path: "apps/main/shared/web/src/routes/**",
          rationale: "TanStack Router strict:false hook types + Link dynamic props" },
        // ── Feature page files ───────────────────────────────────
        // Page files own TanStack interactions (useParams, useNavigate, as never
        // path/params casts) when pages move out of routes/ into features/*/pages/.
        // Scoped to pages/ only — other feature files (api, hooks, components)
        // have no legitimate TanStack cast surface.
        { path: "apps/main/shared/web/src/features/**/pages/**",
          rationale: "TanStack Router hook types + params casts in feature page files" },
        // ── Module route definitions ─────────────────────────────
        { path: "apps/main/slices/*/*/web/routes/**",
          rationale: "Module-level TanStack Router route definition objects" },
        // ── App entrypoint ───────────────────────────────────────
        { path: "apps/main/shared/web/src/main.tsx",
          rationale: "TanStack Router routeTree cast at app entrypoint" },
      ],
      Test: [
        { path: "**/__test__/**", rationale: "Test mocks may require double-cast or loose typing" },
        { path: "**/*.test.ts",   rationale: "Test files" },
        { path: "**/*.test.tsx",  rationale: "Test files" },
        { path: "**/*.spec.ts",   rationale: "Test files" },
        { path: "**/*.spec.tsx",  rationale: "Test files" },
      ],
    },
  },
  // ── DSL Coherence ────────────────────────────────────────────────
  // Validates that access-control DSL rule files do not declare incoherent
  // role combinations. Currently enforces Axiom 3 of scoped-ac:
  //
  //   "Reads and updates resolve to a query-clause filter.
  //    Creates and deletes resolve to an allow/deny verdict."
  //
  // resolveForCreateDelete evaluates target rules by walking field paths
  // directly into the properties dict — it cannot follow traversal hops.
  // A traversal target on a create/delete role silently denies all callers.
  //
  // Correct pattern (from platform-admin.ac.ts):
  //   manage_ops_center_members:   { member: { actions: ["read","update"],  target: ["member.orgId → org.type:'ops_center'"] } }
  //   manage_ops_center_members_write: { member: { actions: ["create","delete"], target: [] } }
  "dsl-coherence": [
    {
      id: "traversal-in-create-delete",
      severity: "error",
      description: "DSL role has create/delete action with a traversal (→) target.",
      message: "resolveForCreateDelete cannot follow traversal (→) hops — split into two roles: one with [\"read\",\"update\"] + traversal target, another with [\"create\",\"delete\"] + direct or empty target.",
      in: "configs/access-control/rules/**/*.ac.ts",
    },
  ],

  // ── Pattern Tags ─────────────────────────────────────────────────
  // Enforces the closed authorized set of [AC:X] access-control tags
  // across all service and repository files in the entire codebase.
  //
  // Tag grammar and full pattern reference:
  //   docs/01_reference/access-control.md#patterns
  //   shared/libs/scoped-ac/docs/consumer/AC-PATTERNS.md
  //
  // Authorized tags:
  //
  //   Repository-side (engine call location):
  //     AC:R      — Read, engine.resolveRead filters the query
  //     AC:R·J    — Enrichment join read, engine.resolveRead where applied in LEFT JOIN ON
  //     AC:G2     — Gate-2 boolean (findByIdForAllow), resolveUpdate/resolveDelete inside
  //
  //   Service-side (gate location):
  //     AC:C·I    — Create → repo executor
  //     AC:C·P    — Create → external provider (generic)
  //     AC:C·P:BA — Create → BetterAuth executor
  //     AC:U·I    — Update → repo executor (gate via findByIdForAllow)
  //     AC:U·P    — Update → external provider
  //     AC:U·P:BA — Update → BetterAuth executor
  //     AC:D·I    — Delete by id → repo executor (gate via findByIdForAllow)
  //     AC:D·P    — Delete by id → external provider
  //     AC:D·P:BA — Delete by id → BetterAuth executor
  //     AC:D·R·I  — Delete with row in hand → repo executor
  //     AC:D·R·P  — Delete with row in hand → external provider (generic)
  //     AC:D·R·P:BA — Delete with row in hand → BetterAuth executor
  "pattern-tags": {
    authorized: [
      // Repository-side
      "AC:R",
      "AC:R·J",
      "AC:G2",
      // Service-side — internal (repo) executor
      "AC:C·I",
      "AC:U·I",
      "AC:D·I",
      "AC:D·R·I",
      // Service-side — external provider (generic)
      "AC:C·P",
      "AC:U·P",
      "AC:D·P",
      "AC:D·R·P",
      // Service-side — BetterAuth executor
      "AC:C·P:BA",
      "AC:U·P:BA",
      "AC:D·P:BA",
      "AC:D·R·P:BA",
    ],

    definitions: [
      // ── Repository: Read ─────────────────────────────────────────
      {
        name: "AC:R",
        description: "Repo read — engine.resolveRead applies where/joins/select to the query",
        in: "**/*.repository.ts",
        requires: [
          { match: "engine\\.resolveRead\\(", description: "engine.resolveRead call" },
        ],
      },
      {
        name: "AC:R·J",
        description: "Repo enrichment join read — engine.resolveRead where applied in LEFT JOIN ON, never WHERE",
        in: "**/*.repository.ts",
        requires: [
          { match: "engine\\.resolveRead\\(", description: "engine.resolveRead call" },
        ],
      },

      // ── Repository: Gate-2 ────────────────────────────────────────
      {
        name: "AC:G2",
        description: "Gate-2 findByIdForAllow — returns boolean only, resolveUpdate or resolveDelete inside, never the row",
        in: "**/*.repository.ts",
        requires: [
          {
            match: ["engine\\.resolveUpdate\\(", "engine\\.resolveDelete\\("],
            description: "engine.resolveUpdate or engine.resolveDelete call",
          },
        ],
      },

      // ── Service: Create — internal executor ──────────────────────
      {
        name: "AC:C·I",
        description: "Service create, repo executor — resolveCreate verdict + audit + forbidden + repo write",
        in: "**/*.service.ts",
        requires: [
          { match: "engine\\.resolveCreate\\(", description: "engine.resolveCreate call" },
          { match: "\\bthis\\.audit", description: "audit call" },
          { match: "\\.errors\\.forbidden\\(|throw.*[Ff]orbidden", description: "forbidden() throw on denied" },
        ],
        coherence: [
          {
            extract1: "resolveCreate\\([^,]+,\\s*[\"'](\\w+)[\"']",
            extract2: "entity:\\s*[\"'](\\w+)[\"']",
            description: "entity in resolveCreate must match entity in audit log",
          },
        ],
      },

      // ── Service: Create — external provider ──────────────────────
      {
        name: "AC:C·P",
        description: "Service create, external provider executor — resolveCreate verdict + audit + forbidden",
        in: "**/*.service.ts",
        requires: [
          { match: "engine\\.resolveCreate\\(", description: "engine.resolveCreate call" },
          { match: "\\bthis\\.audit", description: "audit call" },
          { match: "\\.errors\\.forbidden\\(|throw.*[Ff]orbidden", description: "forbidden() throw on denied" },
        ],
        coherence: [
          {
            extract1: "resolveCreate\\([^,]+,\\s*[\"'](\\w+)[\"']",
            extract2: "entity:\\s*[\"'](\\w+)[\"']",
            description: "entity in resolveCreate must match entity in audit log",
          },
        ],
      },
      {
        name: "AC:C·P:BA",
        description: "Service create, BetterAuth executor — resolveCreate verdict + audit + forbidden + baAdapter call",
        in: "**/*.service.ts",
        requires: [
          { match: "engine\\.resolveCreate\\(", description: "engine.resolveCreate call" },
          { match: "\\bthis\\.audit", description: "audit call" },
          { match: "\\.errors\\.forbidden\\(|throw.*[Ff]orbidden", description: "forbidden() throw on denied" },
          { match: "this\\.baAdapter\\.", description: "BAAdapter call" },
        ],
        coherence: [
          {
            extract1: "resolveCreate\\([^,]+,\\s*[\"'](\\w+)[\"']",
            extract2: "entity:\\s*[\"'](\\w+)[\"']",
            description: "entity in resolveCreate must match entity in audit log",
          },
        ],
      },

      // ── Service: Update — internal executor ──────────────────────
      {
        name: "AC:U·I",
        description: "Service update, repo executor — findByIdForAllow gate + audit + forbidden + repo write",
        in: "**/*.service.ts",
        requires: [
          { match: "\\.findByIdForAllow\\(", description: "findByIdForAllow gate call" },
          { match: "\\bthis\\.audit", description: "audit call" },
          { match: "\\.errors\\.forbidden\\(|throw.*[Ff]orbidden", description: "forbidden() throw on denied" },
        ],
      },

      // ── Service: Update — external provider ──────────────────────
      {
        name: "AC:U·P",
        description: "Service update, external provider — findByIdForAllow gate + audit + forbidden",
        in: "**/*.service.ts",
        requires: [
          { match: "\\.findByIdForAllow\\(", description: "findByIdForAllow gate call" },
          { match: "\\bthis\\.audit", description: "audit call" },
          { match: "\\.errors\\.forbidden\\(|throw.*[Ff]orbidden", description: "forbidden() throw on denied" },
        ],
      },
      {
        name: "AC:U·P:BA",
        description: "Service update, BetterAuth executor — findByIdForAllow gate + audit + forbidden + baAdapter call",
        in: "**/*.service.ts",
        requires: [
          { match: "\\.findByIdForAllow\\(", description: "findByIdForAllow gate call" },
          { match: "\\bthis\\.audit", description: "audit call" },
          { match: "\\.errors\\.forbidden\\(|throw.*[Ff]orbidden", description: "forbidden() throw on denied" },
          { match: "this\\.baAdapter\\.", description: "BAAdapter call" },
        ],
      },

      // ── Service: Delete by id — internal executor ─────────────────
      {
        name: "AC:D·I",
        description: "Service delete by id, repo executor — findByIdForAllow gate + audit + forbidden + repo delete",
        in: "**/*.service.ts",
        requires: [
          { match: "\\.findByIdForAllow\\(", description: "findByIdForAllow gate call" },
          { match: "\\bthis\\.audit", description: "audit call" },
          { match: "\\.errors\\.forbidden\\(|throw.*[Ff]orbidden", description: "forbidden() throw on denied" },
        ],
      },

      // ── Service: Delete by id — external provider ─────────────────
      {
        name: "AC:D·P",
        description: "Service delete by id, external provider — findByIdForAllow gate + audit + forbidden",
        in: "**/*.service.ts",
        requires: [
          { match: "\\.findByIdForAllow\\(", description: "findByIdForAllow gate call" },
          { match: "\\bthis\\.audit", description: "audit call" },
          { match: "\\.errors\\.forbidden\\(|throw.*[Ff]orbidden", description: "forbidden() throw on denied" },
        ],
      },
      {
        name: "AC:D·P:BA",
        description: "Service delete by id, BetterAuth executor — findByIdForAllow gate + audit + forbidden + baAdapter call",
        in: "**/*.service.ts",
        requires: [
          { match: "\\.findByIdForAllow\\(", description: "findByIdForAllow gate call" },
          { match: "\\bthis\\.audit", description: "audit call" },
          { match: "\\.errors\\.forbidden\\(|throw.*[Ff]orbidden", description: "forbidden() throw on denied" },
          { match: "this\\.baAdapter\\.", description: "BAAdapter call" },
        ],
      },

      // ── Service: Delete with row in hand — internal executor ──────
      {
        name: "AC:D·R·I",
        description: "Service delete with row in hand, repo executor — resolveDelete verdict + audit + forbidden",
        in: "**/*.service.ts",
        requires: [
          { match: "engine\\.resolveDelete\\(", description: "engine.resolveDelete call" },
          { match: "\\bthis\\.audit", description: "audit call" },
          { match: "\\.errors\\.forbidden\\(|throw.*[Ff]orbidden", description: "forbidden() throw on denied" },
        ],
        coherence: [
          {
            extract1: "resolveDelete\\([^,]+,\\s*[\"'](\\w+)[\"']",
            extract2: "entity:\\s*[\"'](\\w+)[\"']",
            description: "entity in resolveDelete must match entity in audit log",
          },
        ],
      },

      // ── Service: Delete with row in hand — external provider ──────
      {
        name: "AC:D·R·P",
        description: "Service delete with row in hand, external provider — resolveDelete verdict + audit + forbidden",
        in: "**/*.service.ts",
        requires: [
          { match: "engine\\.resolveDelete\\(", description: "engine.resolveDelete call" },
          { match: "\\bthis\\.audit", description: "audit call" },
          { match: "\\.errors\\.forbidden\\(|throw.*[Ff]orbidden", description: "forbidden() throw on denied" },
        ],
        coherence: [
          {
            extract1: "resolveDelete\\([^,]+,\\s*[\"'](\\w+)[\"']",
            extract2: "entity:\\s*[\"'](\\w+)[\"']",
            description: "entity in resolveDelete must match entity in audit log",
          },
        ],
      },
      {
        name: "AC:D·R·P:BA",
        description: "Service delete with row in hand, BetterAuth executor — resolveDelete verdict + audit + forbidden + baAdapter call",
        in: "**/*.service.ts",
        requires: [
          { match: "engine\\.resolveDelete\\(", description: "engine.resolveDelete call" },
          { match: "\\bthis\\.audit", description: "audit call" },
          { match: "\\.errors\\.forbidden\\(|throw.*[Ff]orbidden", description: "forbidden() throw on denied" },
          { match: "this\\.baAdapter\\.", description: "BAAdapter call" },
        ],
        coherence: [
          {
            extract1: "resolveDelete\\([^,]+,\\s*[\"'](\\w+)[\"']",
            extract2: "entity:\\s*[\"'](\\w+)[\"']",
            description: "entity in resolveDelete must match entity in audit log",
          },
        ],
      },
    ],

    // Guarded engine calls — any public method containing these must carry an [AC:X] tag.
    // Private methods are automatically exempt (they are internal helpers).
    guardedCalls: [
      // ── Repository layer ─────────────────────────────────────────
      // Public repo methods calling the engine directly must be tagged.
      {
        match: "engine\\.resolveRead\\(",
        description: "engine.resolveRead",
        in: "**/*.repository.ts",
      },
      {
        match: "engine\\.resolveUpdate\\(",
        description: "engine.resolveUpdate",
        in: "**/*.repository.ts",
      },
      {
        match: "engine\\.resolveDelete\\(",
        description: "engine.resolveDelete",
        in: "**/*.repository.ts",
      },
      // ── Service layer ─────────────────────────────────────────────
      // Public service methods calling the engine or gate-2 must be tagged.
      {
        match: "engine\\.resolveCreate\\(",
        description: "engine.resolveCreate",
        in: "**/*.service.ts",
      },
      {
        match: "engine\\.resolveDelete\\(",
        description: "engine.resolveDelete (row in hand)",
        in: "**/*.service.ts",
      },
      {
        match: "\\.findByIdForAllow\\(",
        description: "repo.findByIdForAllow (gate-2)",
        in: "**/*.service.ts",
      },
    ],
  },

  // ── Layer Discipline ─────────────────────────────────────────────
  // Universal invariant: a file at layer N cannot import from layer N+.
  // Two stacks — same abstract principle, different vocabularies.
  // Axiom: docs/01_reference/import-boundaries.md — layer ordering.
  "layer-discipline": {
    stacks: [
      // ── API stack ──────────────────────────────────────────────
      // model → repository → service → router → middleware
      {
        id: "api-layers",
        description: "API layer ordering: model < repository < service < router < middleware",
        in: ["apps/main/shared/api/**", "apps/main/slices/*/*/api/**"],
        layers: [
          { name: "model",      match: ["**/*.model.ts", "**/models/**"] },
          { name: "repository", match: ["**/*.repository.ts", "**/repositories/**"] },
          { name: "service",    match: ["**/*.service.ts", "**/services/**"] },
          { name: "router",     match: ["**/*.router.ts", "**/routes/**"] },
          { name: "middleware", match: "**/middlewares/**" },
        ],
        exceptions: [
          {
            // UOM scope-hydration middleware reads AccessContext directly from
            // the member + organization repos — read-only, no service gate needed.
            // ADR: apps/main/slices/seed/user-organization-mgmt/docs/contributor/DATA-ACCESS-PATTERNS.md
            from: "apps/main/slices/seed/user-organization-mgmt/api/middlewares/**",
            to:   "apps/main/slices/seed/user-organization-mgmt/api/repositories/**",
            reason: "Scope hydration middleware reads AccessContext directly from repo — read-only hydration, no service indirection needed by design.",
          },
        ],
      },

      // ── Web stack ──────────────────────────────────────────────
      // api → hooks → components → pages
      {
        id: "web-layers",
        description: "Web layer ordering: api < hooks < components < pages",
        in: ["apps/main/shared/web/**", "apps/main/slices/*/*/web/**"],
        layers: [
          { name: "api",        match: ["**/api/**", "**/api.ts"] },
          { name: "hooks",      match: "**/hooks/**" },
          { name: "components", match: "**/components/**" },
          { name: "pages",      match: "**/pages/**" },
        ],
        exceptions: [],
      },
    ],
  },
};

export default controls;
