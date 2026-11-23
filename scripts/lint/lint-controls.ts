// ── Global Control Set ────────────────────────────────────────────
// Owner: global (inferred from location in scripts/lint/)
// These controls apply to the entire codebase.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ControlSet } from "./types.ts";
import { webControls } from "./web-controls.ts";
import webLayout from "./web-layout.ts";
import { ALLOWED_JSX_PACKAGES } from "../../shared/libs/ui/rules/code.ts";

// Web controls switched off, by id. The cockpit's toggles edit this list.
const WEB_DISABLED: string[] = [];

const web = webControls(webLayout, { disabled: WEB_DISABLED });

// ── Worker versions the frontend may not import ──
// Every `<id>/<version>` of @libs/orchestrator-workers whose contract does not
// declare "client" in meta.runtimes, read from the contract's source so the
// rule follows the declaration. A contract without an inline runtimes literal
// fails here, loudly, rather than slipping through.
const WORKERS_DIR = path.resolve(import.meta.dirname, "../../shared/libs/orchestrator/workers");
const WORKERS_PKG = "@libs/orchestrator-workers";
function serverOnlyWorkers(): string[] {
  const out: string[] = [];
  for (const id of readdirSync(WORKERS_DIR, { withFileTypes: true })) {
    if (!id.isDirectory() || id.name === "lib" || id.name.startsWith("_") || id.name === "node_modules") continue;
    for (const version of readdirSync(path.join(WORKERS_DIR, id.name), { withFileTypes: true })) {
      if (!version.isDirectory() || !/^v\d+$/.test(version.name)) continue;
      const contract = readFileSync(path.join(WORKERS_DIR, id.name, version.name, "contract.ts"), "utf8");
      const runtimes = /runtimes:\s*\[([^\]]*)\]/.exec(contract);
      if (!runtimes) throw new Error(`${id.name}/${version.name}: meta.runtimes must be written inline in contract.ts`);
      if (!/["']client["']/.test(runtimes[1] ?? "")) out.push(`${WORKERS_PKG}/${id.name}/${version.name}`);
    }
  }
  return out.sort();
}

// ── Layout component anchors (used by no-layout-dimension-override) ──
// Matches a JSX opening tag for any @libs/web-layouts primitive followed by
// className="..." so patterns only fire on these specific components.
const _LAYOUT_ALL = "Page|PageHeader|SecondPageHeader|PageBody|PageFooter|Main|MainHeader|SecondMainHeader|MainContent|MainBody|MainFooter|PageLeftSidebar|PageRightSidebar|MainRightSidebar|MainContainer|ScrollArea|Shell|ShellNone|AuthPage";
const _LAYOUT_SIDE = "PageLeftSidebar|PageRightSidebar|MainRightSidebar";
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
    "shared/configs/**/*.{ts,tsx}",
    "shared/contracts/**/*.{ts,tsx}",
    "apps/main/core/api/src/**/*.{ts,tsx}",
    "apps/main/core/web/src/**/*.{ts,tsx}",
    "apps/main/slices/*/*/**/*.{ts,tsx}",
    "apps/orchestrator/shared/**/*.{ts,tsx}",
    "apps/orchestrator/slices/**/*.{ts,tsx}",
    "shared/libs/ui/themes/**/theme.ts",   // the themes: the rule theme-no-main-colours reads them
    "shared/libs/orchestrator/**/*.ts",    // the orchestrator's libs: the schema stays runtime-agnostic
  ],

  "import-export": [
    // ── Zone isolation ──────────────────────────────────────
    // The boundary table (target-scaffolding.md § Import boundaries):
    //
    //   main shells    configs · libs · seed slices · product slices
    //   product slice  configs · libs · other product slices
    //   seed slice     configs · libs · another seed slice's api/ and web/ surface
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
      description: "A seed slice reaches another seed slice only through its public surface (api/index.ts, web/index.ts), and never a product slice.",
      message: "Seed slices may import configs, libs and another seed slice's api/index.ts or web/index.ts. Its service instances come from the shell that mounts them.",
      exceptions: [
        { from: "apps/main/slices/*/*/web/**", to: ["@modules/*/web", "@seed/*/web", "@product/*/web"], reason: "Web rule 4: a slice may render another slice's shared/components, or place one of its pages in its own section, through its web/index.ts. web-slice-components-only checks what is imported." },
        { from: "apps/main/slices/seed/*/api/**", to: ["@modules/*/api", "@seed/*/api"], reason: "A seed slice may use another seed slice's services through its api/index.ts (credits and payment name owners through user-organization-mgmt's); the instances are handed over at the mount." },
      ],
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
      exceptions: [
        { from: "apps/main/slices/*/*/web/**", to: ["@modules/*/web", "@seed/*/web"], reason: "Web rule 4: a slice may render another slice's shared/components, or place one of its pages in its own section, through its web/index.ts. web-slice-components-only checks what is imported." },
      ],
    },
    {
      id: "slice-no-shell",
      severity: "error",
      direction: "import",
      allow: false,
      from: "apps/main/slices/*/*/**",
      // The web shell is web-slice-no-core's (web-controls.ts), which also resolves the @/ alias.
      to: ["apps/main/core/api/**", "apps/main/core/mobile/**", "@apps/**"],
      description: "Slices cannot import their host shell. The shell mounts the slice and injects config/db — the arrow is one-way.",
      message: "A slice must not reach into apps/main/{api,mobile}. Take what you need as a mount parameter.",
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
      to: "shared/configs/**",
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
      // The contract language is read by the orchestrator and by the browser
      // alike, so it may depend on neither side's runtime. Its tsconfig has no
      // node types and no DOM; this rule names the same line for the IDE and
      // for packages that would still type-check (execa, hono, drizzle…).
      id: "orchestrator-lib-schema-runtime-agnostic",
      severity: "error",
      direction: "import",
      allow: false,
      from: "shared/libs/orchestrator/lib-schema/**",
      to: [
        "node:**",
        "fs", "path", "os", "child_process", "crypto", "stream", "buffer", "url", "util", "events", "worker_threads", "process",
        "execa", "hono", "drizzle-orm", "pg", "openai", "pino", "@trigger.dev", "@aws-sdk", "@libs/storage",
        "react", "react-dom",
      ],
      description: "@libs/orchestrator-lib-schema is runtime-agnostic: zod and nothing else. No node built-ins, no server packages, no UI.",
      message: "The schema is shared by the orchestrator and the browser. Put runtime code with whoever runs it (the orchestrator, or a worker that declares its runtime), not in the schema.",
    },
    {
      // A worker version runs in the browser only when its contract says so.
      // The frontend imports @libs/orchestrator-workers/<id>/<version>; the
      // versions without "client" in meta.runtimes are listed here, and so is
      // the package's lib/ (server helpers: the open API's token, meteredExec).
      id: "frontend-client-workers-only",
      severity: "error",
      direction: "import",
      allow: false,
      from: ["apps/main/core/web/**", "apps/main/core/mobile/**", "apps/main/slices/*/*/web/**"],
      to: [...serverOnlyWorkers(), `${WORKERS_PKG}/lib`],
      description: "The frontend imports only worker versions whose contract declares the \"client\" runtime.",
      message: "This worker version does not declare runtimes \"client\". Call it through the orchestrator, or publish a new version that can run in the browser and declares it.",
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
      id: "config-type-only-from-slice",
      severity: "error",
      direction: "import",
      allow: false,
      from: "shared/configs/**",
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
      from: "shared/configs/**",
      to: [
        "apps/main/core/api/**",
        "apps/main/core/web/**",
        "apps/main/core/mobile/**",
        "apps/orchestrator/**",
        "@apps/**",
      ],
      description: "Configuration is pure — config files cannot import from application code. Axiom: configuration never imports runtime.",
      message: "Config files are pure declarations. They cannot import from an app shell. If you need a shared type, move it to the slice that owns it and type-import that.",
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
      from: ["apps/main/core/api/**", "apps/main/core/web/**", "apps/main/core/mobile/**", "apps/orchestrator/**"],
      to: "**/models/**",
      description: "A shell can import a slice's model surface (@modules/<slice>/models) but not deep into model internals.",
      message: "Import from @modules/<slice>/models (the public barrel), not from internal model files.",
      exceptions: [
        { from: "apps/main/core/api/src/models/**", reason: "App-owned models are internal to the app." },
        { from: "apps/main/core/api/src/features/**/models/**", reason: "App feature models are app-internal; cross-feature model imports are allowed by constitution." },
        { from: "apps/main/core/api/src/lib/**", reason: "App infrastructure may reference schema." },
        { from: "apps/main/core/api/src/wiring/**", reason: "App wiring may reference schema." },
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
      from: "apps/main/core/web/**",
      to: "**/repositories/**",
      description: "Frontend must not import repositories. Frontend accesses backend through HTTP endpoints only.",
    },
    {
      id: "frontend-no-drizzle",
      severity: "error",
      direction: "import",
      allow: false,
      from: "apps/main/core/web/**",
      to: "drizzle-orm",
      description: "Frontend must not import Drizzle ORM. Frontend accesses backend through HTTP endpoints only.",
    },
    {
      id: "frontend-no-backend-module-api",
      severity: "error",
      direction: "import",
      allow: false,
      from: "apps/main/core/web/**",
      to: ["@modules/*/api", "@seed/*/api", "@product/*/api"],
      description: "Frontend must not import a slice's backend surface. Frontend accesses backend through HTTP endpoints only.",
      message: "Use @modules/<slice>/web for frontend, not @modules/<slice>/api.",
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
      from: "apps/main/core/web/src/routes/**",
      to: "@radix-ui/*",
      description: "App pages must import UI components from @libs/web-components, not from Radix directly.",
      message: "Import from @libs/web-components instead of @radix-ui/*. The component library wraps Radix with theme integration.",
      exceptions: [
        { from: "shared/libs/ui/**", reason: "Component library wraps Radix internally." },
      ],
    },
  ],

  "content-patterns": [
    {
      id: "theme-no-main-colours",
      severity: "warn",
      type: "line",
      description: "A theme surface never names main-white or main-black: they do not swap with the mode. Fill is `background`, text is `foreground`, text on a coloured fill is `smart-fb`.",
      // a line that names a main colour, except a mode anchor (a standalone background/foreground line) and a shadow
      match: ["^(?! {6,8}(?:background|foreground):)(?!.*(?:drop-shadow|inner-shadow)).*\"main-(?:white|black)\""],
      in: "shared/libs/ui/themes/**/theme.ts",
      message: "main-white / main-black does not follow the mode. Use `background`, `foreground` or `smart-fb`; keep main-* only if this colour must be white (or black) in every mode, as a brand colour does, and say why.",
      exceptions: [
        { in: "**/*-mobile/**", reason: "The mobile themes reuse the web colours; they are migrated with the mobile emitter." },
      ],
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
        { in: "shared/configs/**", reason: "Config declares role structures." },
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
      in: ["apps/main/slices/**", "apps/main/core/web/src/**"],
      message: "Use @libs/web-components instead of raw HTML elements. Component map: Button, ButtonGroup, Input, InputGroup, Checkbox, RadioGroup/RadioGroupItem, Toggle/ToggleGroup, Select, Combobox, MultiSelect, DatePicker, FileUpload, Textarea, Label, Dialog, AlertDialog, Alert, EmptyState, Popover, HoverCard, Progress, Breadcrumb, TreeView, Table/*, Separator, List/*, Icon (for SVG). Only <input type=\"file\"> is allowed raw.",
      exceptions: [
        { in: "shared/libs/ui/**", reason: "Component library defines these wrappers." },
        { in: "apps/main/core/web/src/routes/sandbox/**", reason: "Sandbox is a dev playground, not production UI." },
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
      in: ["apps/main/slices/**", "apps/main/core/web/src/**"],
      message: "Raw <h1>-<h4> and <p> elements must carry element=\"type--*\" to participate in the theme engine. Example: <h1 element=\"type--heading1\">.",
      exceptions: [
        { in: "shared/libs/ui/**", reason: "Component library internals." },
        { in: "apps/main/core/web/src/routes/sandbox/**", reason: "Sandbox is a dev playground, not production UI." },
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
      in: ["apps/main/slices/**", "apps/main/core/web/src/**"],
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
      in: ["apps/main/slices/**", "apps/main/core/web/src/**"],
      message: "Shell-level structure (h-screen, overflow-auto, <main>) and layout= on bare divs must use @libs/web-layouts primitives (Shell, Page, Main, ScrollArea, etc.).",
      exceptions: [
        { in: "shared/libs/ui/**", reason: "Layout library internals." },
        { in: "apps/main/core/web/src/routes/sandbox/theme-editor/**", reason: "Theme editor is a meta-tool — must be independent from the theme engine." },
        { in: "apps/main/core/web/src/routes/sandbox/_shared/**", reason: "Sandbox shared components are dev tooling, not production UI." },
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
      in: ["apps/main/slices/**", "apps/main/core/web/src/**"],
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
      in: ["apps/main/slices/**", "apps/main/core/web/src/**"],
      message: "Tailwind aesthetic classes are owned by the theme engine. Use element= and axis attributes instead. Only structural Tailwind (flex, grid, w, h, items, justify, overflow, relative, absolute, mx-auto) is allowed.",
      exceptions: [
        { in: "shared/libs/ui/**", reason: "Component library is the theme boundary." },
        { in: "apps/main/core/web/src/routes/sandbox/**", reason: "Sandbox is a dev playground, not production UI." },
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
      in: ["apps/main/slices/**", "apps/main/core/web/src/**"],
      message: "Inline styles for visual properties bypass the theme engine. Use element= and axis attributes instead.",
      exceptions: [
        { in: "shared/libs/ui/**", reason: "Component library internals." },
        { in: "apps/main/core/web/src/routes/sandbox/**", reason: "Sandbox is a dev playground, not production UI." },
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
      in: ["apps/main/slices/**", "apps/main/core/web/src/**"],
      message: "Do not override theme composition variables (--bg, --fg, --tint, --border-color, --bg-alpha) via inline styles. Customise through the theme object or concept overrides.",
      exceptions: [
        { in: "shared/libs/ui/**", reason: "Theme engine internals." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
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
      in: ["shared/configs/**/*.config.ts"],
      message: "Export a plain data value instead of a function. Runtime logic belongs in the module, not in a config file.",
    },
  ],


  structure: [
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
        { path: "shared/configs/**", reason: "configs/ is the canonical config zone — all module configs live here." },
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
        { path: "shared/configs/**", reason: "Configs may use Zod for value declarations." },
        { path: "**/__test__/**", reason: "Test files." },
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
      in: ["apps/main/slices/**", "apps/main/core/web/src/**"],
      // the list lives in the UI library: shared/libs/ui/rules/code.ts
      allowedPackages: [...ALLOWED_JSX_PACKAGES],
      exceptions: [
        { in: "shared/libs/ui/**", reason: "Component library wraps external primitives." },
        { in: "**/__test__/**", reason: "Test files." },
        { in: "**/*.test.*", reason: "Test files." },
      ],
    },
  ],

  // ── Slot Rules ─────────────────────────────────────────────────
  // The 17 rules of UI structure (concept-table v98, slot rules tab):
  // container × slot × child. Checks UI as code (tsx fixtures and slice code)
  // and UI as data (pattern json). Rules live in slot-rules-data.ts.
  "slot-rules": {
    in: ["shared/libs/ui/web/patterns/**"],
    exceptions: [
      { in: "shared/libs/ui/web/primitives/**", reason: "The primitives themselves." },
      { in: "**/__test__/**", reason: "Test files." },
      { in: "**/*.test.*", reason: "Test files." },
    ],
    severity: "warn",
  },

  // ── JSX AST Rules ──────────────────────────────────────────────
  // These rules require parsing the JSX tree (parent-child awareness).
  "jsx-ast": {
    in: ["apps/main/slices/**", "apps/main/core/web/src/**"],
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

  // ── Web structure and import boundaries (web-controls.ts) ──────
  "web-boundaries": web,

  // ── Layer Discipline ─────────────────────────────────────────────
  // Universal invariant: a file at layer N cannot import from layer N+.
  // The web's layering is web-boundaries' (web-controls.ts).
  // Axiom: docs/01_reference/import-boundaries.md — layer ordering.
  "layer-discipline": {
    stacks: [
      // ── API stack ──────────────────────────────────────────────
      // model → repository → service → router → middleware
      {
        id: "api-layers",
        description: "API layer ordering: model < repository < service < router < middleware",
        in: ["apps/main/core/api/**", "apps/main/slices/*/*/api/**"],
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
    ],
  },
};

export default controls;
