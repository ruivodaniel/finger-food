// The browser guard for the client worker versions, alongside the browser
// typecheck (tsconfig.client.json):
//   - client-workers.ts lists exactly the versions whose contract declares "client";
//   - nothing a client version reaches, file by file, imports node or a server package.
import { builtinModules } from "node:module";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { clientWorkers } from "../client-workers";

const PKG = path.resolve(__dirname, "..");

/** Packages a browser cannot run, or that carry the runner's secrets; node built-ins are refused on top. */
const SERVER_PACKAGES = ["execa", "hono", "pino", "pg", "drizzle-orm", "@aws-sdk", "@trigger.dev", "@libs/storage"];

/** A version's entry, as a runner loads it. */
async function load(version: string): Promise<{ contract: { meta: { runtimes: readonly string[] } } }> {
  return import(/* @vite-ignore */ path.join(PKG, version, "index.ts"));
}

/** Every `<id>/<version>` folder of the package. */
function versions(): string[] {
  const out: string[] = [];
  for (const id of readdirSync(PKG)) {
    if (["lib", "node_modules", "__test__"].includes(id) || !statSync(path.join(PKG, id)).isDirectory()) continue;
    for (const v of readdirSync(path.join(PKG, id))) if (/^v\d+$/.test(v)) out.push(`${id}/${v}`);
  }
  return out.sort();
}

/** The specifiers a file imports: static, re-exported, dynamic, and side-effect imports (types included: they name the module too). */
function specifiers(source: string): string[] {
  const found = new Set<string>();
  const patterns = [/\bfrom\s*["']([^"']+)["']/g, /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g, /^\s*import\s*["']([^"']+)["']/gm];
  for (const re of patterns) for (const m of source.matchAll(re)) found.add(m[1]!);
  return [...found];
}

function resolveRelative(from: string, spec: string): string {
  const base = path.resolve(path.dirname(from), spec);
  for (const candidate of [base, `${base}.ts`, path.join(base, "index.ts")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  throw new Error(`${path.relative(PKG, from)}: cannot resolve ${spec}`);
}

/** Walks the package's own files from an entry; returns each file reached and the bare specifiers it imports. */
function importGraph(entry: string): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  const queue = [entry];
  while (queue.length) {
    const file = queue.pop()!;
    if (graph.has(file)) continue;
    const bare: string[] = [];
    for (const spec of specifiers(readFileSync(file, "utf8"))) {
      if (spec.startsWith(".")) queue.push(resolveRelative(file, spec));
      else bare.push(spec);
    }
    graph.set(file, bare);
  }
  return graph;
}

function refusal(spec: string): string | undefined {
  if (spec.startsWith("node:") || builtinModules.includes(spec.split("/")[0]!)) return "a node built-in";
  const server = SERVER_PACKAGES.find((p) => spec === p || spec.startsWith(`${p}/`));
  return server ? `a server package (${server})` : undefined;
}

describe("client worker versions", () => {
  it("client-workers.ts lists exactly the versions whose contract declares the client runtime", async () => {
    const declared: string[] = [];
    for (const v of versions()) {
      const { contract } = await load(v);
      if (contract.meta.runtimes.includes("client")) declared.push(v);
    }
    expect(Object.keys(clientWorkers).sort()).toEqual(declared);
  });

  it("every version declares at least one runtime, and only known ones", async () => {
    for (const v of versions()) {
      const { contract } = await load(v);
      expect(contract.meta.runtimes.length, v).toBeGreaterThan(0);
      for (const r of contract.meta.runtimes) expect(["server", "client"], v).toContain(r);
    }
  });

  it.each(Object.keys(clientWorkers))("%s reaches no node built-in and no server package", (version) => {
    const graph = importGraph(path.join(PKG, version, "index.ts"));
    const problems: string[] = [];
    for (const [file, bare] of graph) {
      if (!file.startsWith(PKG + path.sep)) problems.push(`${file}: outside the package`);
      for (const spec of bare) {
        const why = refusal(spec);
        if (why) problems.push(`${path.relative(PKG, file)} imports ${spec}: ${why}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("the walk sees what it should: a server version is refused", () => {
    // The guard itself, checked on a version known to need node.
    const graph = importGraph(path.join(PKG, "document-format-conversion-libreoffice/v1/index.ts"));
    const refused = [...graph.values()].flat().filter((s) => refusal(s));
    expect(refused).toEqual(expect.arrayContaining(["node:fs", "execa"]));
  });
});
