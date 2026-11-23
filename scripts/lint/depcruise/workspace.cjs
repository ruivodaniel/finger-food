// ── Workspace packages for dependency-cruiser ────────────────────────
// Two things `.dependency-cruiser.cjs` needs and cannot list by hand:
//
// 1. `packages`: every workspace package with the files its `exports` map
//    points at, which for a slice is its public surface.
// 2. `resolve.fallback`: how to resolve a workspace import by package name
//    when pnpm cannot (the importing package does not declare it, or the name
//    only exists as a tsconfig path). Built from every workspace package's
//    `exports` and every tsconfig `paths` entry, so it never needs editing.
//
// This file doubles as the webpack config dependency-cruiser reads its
// resolve options from (options.webpackConfig), hence the `resolve` export.

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "../../..");
const SCAN = ["apps", "shared"];
const SKIP = new Set(["node_modules", "dist", "build", "coverage", ".turbo", ".git"]);
const WORKSPACE_SCOPE = /^@(modules|product|libs|configs|apps)\//;

function walk(dir, visit) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, visit);
    else visit(full, entry.name);
  }
}

const packageJsons = [];
const tsconfigs = [];
for (const top of SCAN) {
  walk(path.join(ROOT, top), (file, name) => {
    if (name === "package.json") packageJsons.push(file);
    else if (/^tsconfig.*\.json$/.test(name)) tsconfigs.push(file);
  });
}

const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join("/");

const fallback = [];
const named = new Set();

function add(name, target) {
  if (named.has(name)) return;
  named.add(name);
  fallback.push({ name, alias: target, onlyModule: !name.endsWith("*") });
}

function exportTarget(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    for (const condition of ["types", "import", "default", "require"]) {
      const found = exportTarget(value[condition]);
      if (found) return found;
    }
  }
  return null;
}

const packages = [];
for (const file of packageJsons) {
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!pkg.name || !WORKSPACE_SCOPE.test(pkg.name)) continue;
  const dir = path.dirname(file);
  const exported = [];
  packages.push({ name: pkg.name, dir: rel(dir), exported });

  const exportsMap =
    typeof pkg.exports === "string" || (pkg.exports && !Object.keys(pkg.exports)[0]?.startsWith("."))
      ? { ".": pkg.exports }
      : pkg.exports;
  if (exportsMap) {
    for (const [subpath, value] of Object.entries(exportsMap)) {
      const target = exportTarget(value);
      if (!target) continue;
      add(pkg.name + subpath.slice(1), path.join(dir, target));
      exported.push(rel(path.join(dir, target)));
    }
  } else {
    // No exports map: Node resolves the bare name through `main` and any
    // subpath as a file of the package.
    add(pkg.name, path.join(dir, pkg.main ?? pkg.types ?? "index"));
    add(`${pkg.name}/*`, path.join(dir, "*"));
  }
}

// Names that exist only as tsconfig paths (@libs/ui-types, @libs/themes/*).
// Package exports win: they were added first.
for (const file of tsconfigs) {
  const { config } = ts.parseConfigFileTextToJson(file, fs.readFileSync(file, "utf8"));
  const options = config?.compilerOptions;
  if (!options?.paths) continue;
  const base = path.resolve(path.dirname(file), options.baseUrl ?? ".");
  for (const [key, targets] of Object.entries(options.paths)) {
    if (!WORKSPACE_SCOPE.test(key)) continue;
    const target = path.resolve(base, targets[0]);
    const probe = target.endsWith("*") ? path.dirname(target) : target;
    if (fs.existsSync(probe)) add(key, target);
  }
}

module.exports = {
  packages,
  resolve: { fallback },
};
