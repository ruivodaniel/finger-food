// ── Import boundaries (pnpm lint:boundaries) ─────────────────────────
// The import rules of shared/docs/db/doc/scaffolding-and-import-boundaries.json
// and main-web-scaffolding-and-import-boundaries.json, between packages:
// slices, libraries, the core and the repo's shared/. What may import what
// inside one slice's web is `pnpm lint:arch`'s.
//
// Workspace imports are checked by package name too: pnpm's links resolve
// the declared ones, scripts/lint/depcruise/workspace.cjs the rest.

const { packages } = require("./scripts/lint/depcruise/workspace.cjs");

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SEED = "apps/main/slices/seed/[^/]+";
const PRODUCT = "apps/main/slices/product/[^/]+";
const SLICE = "apps/main/slices/(?:seed/[^/]+|product/[^/]+|shared)";

// A slice's public surface is what its package.json `exports` points at:
// api/index.ts, web/index.ts, shared/index.ts, api/models/index.ts.
const PUBLIC_SURFACE = `^(?:${packages
  .filter((pkg) => new RegExp(`^${SLICE}$`).test(pkg.dir))
  .flatMap((pkg) => pkg.exported)
  .map(escape)
  .join("|")})$`;

module.exports = {
  forbidden: [
    {
      name: "seed-imports-no-product",
      comment:
        "A seed slice never imports a product slice: a new project deletes the product slices and keeps the seed.",
      severity: "error",
      from: { path: `^${SEED}/` },
      to: { path: `^${PRODUCT}/` },
    },
    {
      name: "slice-reaches-slice-through-public-surface",
      comment:
        "A slice reaches another slice only through its public surface (the files its package.json exports), never past it.",
      severity: "error",
      from: { path: `^(${SLICE})/` },
      to: { path: `^${SLICE}/`, pathNot: ["^$1/", PUBLIC_SURFACE] },
    },
    {
      name: "outside-reaches-slice-through-public-surface",
      comment:
        "The core, the other apps and the repo's shared/ reach a slice only through its public surface (the files its package.json exports), never past it.",
      severity: "error",
      from: { pathNot: `^${SLICE}/` },
      to: { path: `^${SLICE}/`, pathNot: PUBLIC_SURFACE },
    },
    {
      name: "slice-imports-no-core",
      comment: "A slice never imports the core: the core mounts slices, a slice knows nothing of the app.",
      severity: "error",
      from: { path: "^apps/main/slices/" },
      to: { path: "^apps/main/core/" },
    },
    {
      name: "shared-imports-no-app",
      comment: "The repo's shared/ imports nothing from apps/.",
      severity: "error",
      from: { path: "^shared/", pathNot: "^shared/configs/" },
      to: { path: "^apps/" },
    },
    {
      name: "config-imports-only-slice-dsl",
      comment:
        "A config imports nothing from apps/ but a slice's shared/index.ts: the DSL the config is written in (defineCreditsCatalog, defineMessageTypes).",
      severity: "error",
      from: { path: "^shared/configs/" },
      to: { path: "^apps/", pathNot: `^${SLICE}/shared/index\\.ts$` },
    },
    {
      name: "workspace-import-resolves",
      comment:
        "A workspace import by package name the checker cannot resolve cannot be checked: a path its package.json does not export, or a file that does not exist.",
      severity: "error",
      from: {},
      to: { couldNotResolve: true, path: "^@(?:modules|product|libs|configs|apps)/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    // Archived trees awaiting deletion are not runtime code.
    exclude: { path: "(^|/)(node_modules|dist|build|coverage|[.][^/]*-to-sunset)/" },
    tsPreCompilationDeps: true,
    webpackConfig: { fileName: "scripts/lint/depcruise/workspace.cjs" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["types", "import", "require", "node", "default"],
      mainFields: ["types", "module", "main"],
      extensions: [".ts", ".tsx", ".d.ts", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts", ".json"],
    },
  },
};
