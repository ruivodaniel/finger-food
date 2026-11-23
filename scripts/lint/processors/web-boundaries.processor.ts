// ── Web Boundaries Processor ──────────────────────────────────────
// Enforces the web import boundaries (docs: Scaffolding & Import Boundaries,
// topic "Web: import boundaries"). The rules are relational ("another slice",
// "another page", "a symbol the index re-exports from shared/components"), so
// every import is resolved to a file and both ends are classified against the
// layout in web-layout.ts before a rule is applied.
//
//   zone   core   the app's web (apps/main/core/web/src)
//          slice  <slice>/web, folder = shared/components · services/api · pages/<p>/hooks …
//
// Bare package imports (node_modules, workspace packages that are not a slice
// or the core) are never classified: they cross no web boundary.

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import type {
  LintViolation,
  LoadedControlSet,
  WebBoundariesConfig,
  WebBoundaryRule,
  WebBoundaryRuleId,
  WebLayout,
  WebShape,
} from "../types.ts";
import { pathMatchesPattern } from "../utils/files.ts";

interface ProcessorContext {
  rootDir: string;
  ignorePatterns: string[];
}

export interface WebElement {
  zone: "core" | "slice";
  /** The zone's directory: the core dir or the slice's web dir. */
  base: string;
  /** Path under base, without the file: "shared/components", "services/api", "pages/members/hooks", "" for a top file. */
  folder: string;
  /** Set when the file is inside pages/<page>/. */
  page?: string;
  /** The file is the zone's index.ts (slice public surface). */
  isIndex: boolean;
}

export interface ResolvedImport {
  spec: string;
  line: number;
  isTypeOnly: boolean;
  /** Imported names; "*" for a namespace import. */
  symbols: string[];
  /** Repo-relative target, null when the import is a package outside the layout. */
  target: string | null;
}

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

// ── Entry ────────────────────────────────────────────────────────

export async function processWebBoundariesControls(
  controlSets: LoadedControlSet[],
  ctx: ProcessorContext,
): Promise<LintViolation[]> {
  const globalCs = controlSets.find((cs) => cs.owner === "global");
  const config = globalCs?.controls["web-boundaries"] as WebBoundariesConfig | undefined;
  if (!config || config.enabled === false) return [];

  const { layout } = config;
  const rule = (id: WebBoundaryRuleId): WebBoundaryRule | null => {
    const r = config.rules[id];
    return r && r.enabled !== false ? r : null;
  };

  const files = await sourceFiles(layout, ctx);
  const violations: LintViolation[] = [];
  const push = (id: WebBoundaryRuleId, file: string, line: number | undefined, message: string, target?: string) => {
    const r = rule(id)!;
    if (r.exceptions?.some((e) => (!e.from || pathMatchesPattern(file, e.from)) && (!e.to || (target && pathMatchesPattern(target, e.to))))) return;
    violations.push({ id, owner: "global", processor: "web-boundaries", severity: r.severity, file, lines: line ? [line] : [], message });
  };

  const indexExports = new Map<string, Map<string, string> | null>();

  for (const file of files) {
    const from = classify(file, layout);
    if (!from) continue;
    const content = fs.readFileSync(path.join(ctx.rootDir, file), "utf-8");

    for (const imp of extractImports(content).map((i) => ({ ...i, target: resolveImport(i.spec, file, layout, ctx.rootDir) }))) {
      if (!imp.target) continue;
      const to = classify(imp.target, layout);

      if (!to) continue;

      // 2 · the core imports a slice only through its web/index.ts
      if (rule("web-core-via-index") && from.zone === "core" && to.zone === "slice" && !to.isIndex) {
        push("web-core-via-index", file, imp.line, `The core imports "${imp.spec}", an internal file of ${to.base}. Import the slice through its web/index.ts.`, imp.target);
      }

      // 3 · a slice never imports the core
      if (rule("web-slice-no-core") && from.zone === "slice" && to.zone === "core") {
        push("web-slice-no-core", file, imp.line, `A slice imports "${imp.spec}" from the core. A slice never imports the core.`, imp.target);
      }

      // 4 · another slice: only its shared/components and services/application (and a page it places in its own section),
      //     through its web/index.ts. Never its hooks, store or helpers: hooks are a slice's private React glue.
      if (rule("web-slice-components-only") && from.zone === "slice" && to.zone === "slice" && from.base !== to.base) {
        if (!to.isIndex) {
          push("web-slice-components-only", file, imp.line, `"${imp.spec}" is an internal file of ${to.base}. Another slice is reached only through its web/index.ts, and only for its shared/components and application services.`, imp.target);
        } else {
          if (!indexExports.has(to.base)) indexExports.set(to.base, readIndexExports(to.base, ctx.rootDir));
          const exportsMap = indexExports.get(to.base);
          for (const sym of imp.symbols) {
            const source = sym === "*" ? null : exportsMap?.get(sym);
            if (source && (pathMatchesPattern(source, `${to.base}/shared/components/**`)
              || pathMatchesPattern(source, `${to.base}/services/application/**`)
              || pathMatchesPattern(source, `${to.base}/pages/*/*.tsx`))) continue;   // a page another slice places in its own section
            const what = sym === "*" ? "a namespace import" : `"${sym}"${source ? ` (${path.relative(to.base, source)})` : ""}`;
            push("web-slice-components-only", file, imp.line, `${what} from ${to.base}/index.ts is not one of its shared/components, application services or pages. Another slice may import only those: never its hooks, store or helpers.`, source ?? imp.target);
          }
        }
      }

      // 6 · pages/<page>/ is private to that page. The slice's routes may import the page file
      //     itself (pages/<page>/<Page>.tsx), never its components, hooks or helpers.
      if (rule("web-page-private") && to.page && !(from.base === to.base && from.page === to.page)) {
        const routesToEntry = from.base === to.base && from.folder.startsWith("routes")
          && to.folder === `pages/${to.page}` && /Page\.tsx$/.test(imp.target);
        if (!routesToEntry) {
          push("web-page-private", file, imp.line, `"${imp.spec}" is inside pages/${to.page}/, which is private to that page. Move what is shared to the slice's shared/.`, imp.target);
        }
      }

      // 7 · only services/application imports services/api
      if (rule("web-api-only-from-application") && to.zone === "slice" && to.folder.startsWith("services/api")
          && !(from.base === to.base && /^services\/(application|api)(\/|$)/.test(from.folder))) {
        push("web-api-only-from-application", file, imp.line, `"${imp.spec}" is in services/api. Only services/application imports services/api: go through the application service.`, imp.target);
      }

      // 11 · helpers import only helpers (packages are not classified, so they always pass)
      if (rule("web-helpers-pure") && isHelpers(from) && !isHelpers(to)) {
        push("web-helpers-pure", file, imp.line, `A helper imports "${imp.spec}" (${to.folder || "a top file"}). Helpers import only helpers and node_modules packages.`, imp.target);
      }

      // 12 · the core's services/api never reaches a slice
      if (rule("web-core-no-application") && from.zone === "core" && from.folder.startsWith("services/api") && to.zone === "slice") {
        push("web-core-no-application", file, imp.line, `The core's services/api imports "${imp.spec}". It is only the generic client (401 · 403) and knows no slice.`, imp.target);
      }
    }

    // 8 · pages, components and hooks reach logic through services/application, never fetch themselves
    if (rule("web-logic-via-application") && from.zone === "slice" && /(^|\/)(pages|components|hooks)(\/|$)/.test(from.folder)) {
      content.split("\n").forEach((l, i) => {
        if (/\bfetch\s*\(/.test(l)) push("web-logic-via-application", file, i + 1, "A page, component or hook calls fetch. Logic goes through services/application.");
      });
    }

    // 9–10 · only the store module touches raw state
    if (rule("web-store-no-raw-access") && !/^store(\/|$)/.test(from.folder)) {
      content.split("\n").forEach((l, i) => {
        if (/\.(getState|setState)\(/.test(l)) push("web-store-no-raw-access", file, i + 1, "Change state through the owner's named mutations (setActiveOrg), not raw getState()/setState(). Components read through the store's selector hook.");
      });
    }
  }

  await checkShape(config, rule, push, ctx);

  // 12 · the core has no services/application
  if (rule("web-core-no-application") && fs.existsSync(path.join(ctx.rootDir, layout.core, "services/application"))) {
    push("web-core-no-application", `${layout.core}/services/application`, undefined, "The core has a services/application folder. The core holds no application logic.");
  }

  return violations;
}

// ── Folder shape ─────────────────────────────────────────────────
// Every folder of the shape exists, even when empty. Files are named, never created.

async function checkShape(
  config: WebBoundariesConfig,
  rule: (id: WebBoundaryRuleId) => WebBoundaryRule | null,
  push: (id: WebBoundaryRuleId, file: string, line: number | undefined, message: string) => void,
  ctx: ProcessorContext,
): Promise<void> {
  const { layout, shape } = config;
  const dirsOf = async (patterns: string[]) => {
    const found: string[] = [];
    for (const p of patterns) {
      for (const m of await glob(p, { cwd: ctx.rootDir, ignore: ctx.ignorePatterns })) {
        if (fs.statSync(path.join(ctx.rootDir, m)).isDirectory()) found.push(m.replace(/\\/g, "/"));
      }
    }
    return [...new Set(found)].sort();
  };
  const missing = (base: string, s: WebShape) => {
    const present = fs.readdirSync(path.join(ctx.rootDir, base));
    return [
      ...s.dirs.filter((d) => !fs.existsSync(path.join(ctx.rootDir, base, d))).map((d) => `${d}/`),
      ...s.files.filter((f) => !present.some((p) => new RegExp("^" + f.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$").test(p))),
    ];
  };
  const check = async (id: WebBoundaryRuleId, patterns: string[], s: WebShape) => {
    if (!rule(id)) return;
    for (const base of await dirsOf(patterns)) {
      const gone = missing(base, s);
      if (gone.length) push(id, base, undefined, `"${base}" is missing ${gone.join(", ")}. ${rule(id)!.description}`);
    }
  };

  await check("web-shape-core", [layout.core], shape.core);
  await check("web-shape-slice", layout.slices, shape.slice);
  await check("web-shape-page", layout.slices.map((s) => `${s}/pages/*`), shape.page);

  if (rule("web-shape-pages-are-folders")) {
    for (const s of layout.slices) {
      for (const f of await glob(`${s}/pages/*.{ts,tsx}`, { cwd: ctx.rootDir, ignore: ctx.ignorePatterns })) {
        push("web-shape-pages-are-folders", f, undefined, "Move the page into its own folder: pages/<page>/<Page>.tsx, with components/, hooks/ and helpers/ beside it.");
      }
    }
  }
}

// ── Files ────────────────────────────────────────────────────────

async function sourceFiles(layout: WebLayout, ctx: ProcessorContext): Promise<string[]> {
  const globs = [layout.core, ...layout.slices].map((g) => `${g.replace(/\/\*\*$/, "")}/**/*.{ts,tsx}`);
  const files = new Set<string>();
  for (const g of globs) for (const f of await glob(g, { cwd: ctx.rootDir, ignore: ctx.ignorePatterns })) files.add(f.replace(/\\/g, "/"));
  return [...files].sort();
}

// ── Classification ───────────────────────────────────────────────

export function classify(file: string, layout: WebLayout): WebElement | null {
  // Slices first: a layout may place slices inside the core's folder.
  for (const pattern of layout.slices) {
    const depth = pattern.split("/").length;
    const base = file.split("/").slice(0, depth).join("/");
    if (/\.[jt]sx?$/.test(base)) continue; // a file beside the slices, not inside one
    if (file.split("/").length >= depth && pathMatchesPattern(base, pattern)) return element("slice", base, file.slice(base.length + 1));
  }

  const core = layout.core.replace(/\/$/, "");
  if (file === core || file.startsWith(core + "/")) return element("core", core, file.slice(core.length + 1));
  return null;
}

function element(zone: "core" | "slice", base: string, rest: string): WebElement {
  const parts = rest.split("/").filter(Boolean);
  // A directory target (no extension) is its index.
  const isDir = parts.length === 0 || !/\.[jt]sx?$/.test(parts[parts.length - 1]);
  const dirParts = isDir ? parts : parts.slice(0, -1);
  const fileName = isDir ? "index" : parts[parts.length - 1].replace(/\.[jt]sx?$/, "");
  const folder = dirParts.join("/");
  const page = dirParts[0] === "pages" && dirParts[1] ? dirParts[1] : undefined;
  return { zone, base, folder, page, isIndex: folder === "" && fileName === "index" };
}

function isHelpers(e: WebElement): boolean {
  return /(^|\/)helpers(\/|$)/.test(e.folder);
}

// ── Import extraction and resolution ─────────────────────────────

export function extractImports(content: string): Omit<ResolvedImport, "target">[] {
  const out: Omit<ResolvedImport, "target">[] = [];
  const lineOf = (index: number) => content.slice(0, index).split("\n").length;
  const fromRe = /^\s*(import|export)\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/gm;
  for (const m of content.matchAll(fromRe)) {
    const clause = m[3].trim();
    out.push({ spec: m[4], line: lineOf(m.index!), isTypeOnly: !!m[2], symbols: clauseSymbols(clause) });
  }
  for (const m of content.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm)) out.push({ spec: m[1], line: lineOf(m.index!), isTypeOnly: false, symbols: [] });
  for (const m of content.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)) out.push({ spec: m[1], line: lineOf(m.index!), isTypeOnly: false, symbols: ["*"] });
  return out;
}

function clauseSymbols(clause: string): string[] {
  const symbols: string[] = [];
  if (/(^|,)\s*\*/.test(clause)) symbols.push("*");
  const braces = clause.match(/\{([\s\S]*)\}/);
  if (braces) {
    for (const part of braces[1].split(",")) {
      const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim();
      if (name) symbols.push(name);
    }
  }
  const head = clause.replace(/\{[\s\S]*\}/, "").replace(/\*\s+as\s+\w+/, "").split(",")[0].trim();
  if (head && head !== "*") symbols.push("default");
  return symbols;
}

/** Repo-relative path for a relative or aliased import; null for any other package. */
export function resolveImport(spec: string, fromFile: string, layout: WebLayout, rootDir: string): string | null {
  let candidates: string[] = [];
  if (spec.startsWith(".")) {
    candidates = [path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), spec))];
  } else {
    for (const alias of layout.aliases) {
      const m = spec.match(new RegExp(alias.pattern));
      if (m) { candidates = alias.to.map((t) => t.replace(/\$(\d)/g, (_, n) => m[Number(n)] ?? "")); break; }
    }
  }
  if (candidates.length === 0) return null;
  for (const c of candidates) {
    const file = toFile(c, rootDir);
    if (file) return file;
  }
  // Unresolvable, but the path still says where it points.
  return candidates[0];
}

function toFile(candidate: string, rootDir: string): string | null {
  const abs = path.join(rootDir, candidate);
  if (/\.[jt]sx?$/.test(candidate) && fs.existsSync(abs)) return candidate;
  for (const ext of EXTENSIONS) if (fs.existsSync(abs + ext)) return candidate + ext;
  for (const ext of EXTENSIONS) if (fs.existsSync(path.join(abs, "index" + ext))) return `${candidate}/index${ext}`;
  return null;
}

// ── A slice's public surface ─────────────────────────────────────

/** Exported name → the repo file it comes from, for a slice's web/index.ts. */
export function readIndexExports(base: string, rootDir: string): Map<string, string> | null {
  const index = toFile(`${base}/index`, rootDir);
  if (!index) return null;
  const map = new Map<string, string>();
  const content = fs.readFileSync(path.join(rootDir, index), "utf-8");
  const resolve = (spec: string) => (spec.startsWith(".") ? toFile(path.posix.normalize(path.posix.join(base, spec)), rootDir) : null);

  for (const m of content.matchAll(/export\s+(?:type\s+)?\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"]/g)) {
    const source = resolve(m[2]) ?? m[2];
    for (const part of m[1].split(",")) {
      const [orig, alias] = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/).map((s) => s.trim());
      if (orig) map.set(alias ?? orig, source);
    }
  }
  for (const m of content.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g)) {
    const source = resolve(m[1]);
    if (!source) continue;
    for (const name of declaredExports(fs.readFileSync(path.join(rootDir, source), "utf-8"))) if (!map.has(name)) map.set(name, source);
  }
  for (const name of declaredExports(content.replace(/export\s+(?:type\s+)?\{[\s\S]*?\}\s+from\s+['"][^'"]+['"]/g, ""))) {
    if (!map.has(name)) map.set(name, index);
  }
  return map;
}

function declaredExports(content: string): string[] {
  const names: string[] = [];
  for (const m of content.matchAll(/export\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?(?:const|let|function\*?|class|type|interface|enum)\s+(\w+)/g)) names.push(m[1]);
  for (const m of content.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}\s*;?(?!\s*from)/g)) {
    for (const part of m[1].split(",")) {
      const [orig, alias] = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/).map((s) => s.trim());
      if (orig) names.push(alias ?? orig);
    }
  }
  return names;
}
