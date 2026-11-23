// ── WHERE THE UI'S THINGS ARE, in files ──────────────────────────
// The finders the file source uses for what a thing of the UI names: an import (as TypeScript resolves it), a UI document by its name,
// a component written as code by its name. Node only: this is storage knowledge, and it belongs to the source.
import { dirname } from "node:path";
import * as ts from "typescript";
import type { FileSource, Finder } from "../../check/file-source.ts";

const WEB = "shared/libs/ui/web";
const DATA = /\/ui_data\.json$/;

/** the library's things, by name: its UI documents (name → version → id) and its components written as code (name → version → the ids of that version's files) */
type Library = { documents: Record<string, Record<number, string>>; components: Record<string, Record<number, string[]>> };
const libraries = new WeakMap<FileSource, Library>();
function libraryOf(source: FileSource): Library {
  if (libraries.has(source)) return libraries.get(source)!;
  const lib: Library = { documents: {}, components: {} };
  for (const id of source.under(WEB)) if (DATA.test(id)) { const r = JSON.parse(source.read(id)) as { name: string; kind: string; document: { version: number } }; if (r.kind === "component") (lib.documents[r.name] ??= {})[r.document.version] = id; }
  for (const group of ["components", "layouts"]) {
    for (const thing of source.children(`${WEB}/primitives/${group}`)) { if (!source.holds(thing)) continue;
      for (const v of source.children(thing)) { const m = /\/v(\d+)$/.exec(v); if (!m || !source.holds(v)) continue;
        const files = source.under(v).filter((f) => /\.tsx?$/.test(f));
        for (const f of files) for (const x of source.read(f).matchAll(/export\s+(?:function|const)\s+([A-Z]\w*)|export\s*\{([^}]*)\}/g))
          for (const name of x[1] ? [x[1]] : x[2].split(",").map((n) => n.trim().split(/\s+as\s+/).pop()!).filter((n) => /^[A-Z]\w*$/.test(n)))
            (lib.components[name] ??= {})[Number(m[1])] = files.filter((y) => y.endsWith(".tsx"));
      } }
  }
  libraries.set(source, lib);
  return lib;
}
const pick = <T,>(versions: Record<number, T> | undefined, asked: number | undefined): T | undefined => (versions ? versions[asked ?? Math.max(...Object.keys(versions).map(Number))] : undefined);

/** is this file where the library's component of that name is written, at any version? */
export const writes = (source: FileSource, id: string, name: string): boolean => Object.values(libraryOf(source).components[name] ?? {}).some((files) => files.includes(id));
/** every file of the library's components written as code, by id */
export const componentFiles = (source: FileSource): string[] => [...new Set(Object.values(libraryOf(source).components).flatMap((v) => Object.values(v).flat()))];
/** every UI document of the library, by id: for the resolver */
export const libraryDocuments = (source: FileSource): string[] => Object.values(libraryOf(source).documents).flatMap((v) => Object.values(v));

const options = new Map<string, ts.CompilerOptions>();
const optionsFor = (file: string): ts.CompilerOptions => {
  const config = ts.findConfigFile(dirname(file), ts.sys.fileExists) ?? "";
  if (!options.has(config)) options.set(config, config ? ts.parseJsonConfigFileContent(ts.readConfigFile(config, ts.sys.readFile).config, ts.sys, dirname(config)).options : {});
  return options.get(config)!;
};

export const uiFinders: Record<string, Finder> = {
  /** the file an import is, as TypeScript resolves it: a workspace package to its own source; an installed package is not in this storage */
  import(named, from, source) {
    const file = source.path(from);
    const to = ts.resolveModuleName(named.name, file, { ...optionsFor(file), resolveJsonModule: true }, ts.sys).resolvedModule?.resolvedFileName;
    return to && /\.(tsx?|json)$/.test(to) && !to.endsWith(".d.ts") && !to.includes("/node_modules/") ? [source.id(to)] : [];
  },
  document: (named, _from, source) => { const id = pick(libraryOf(source).documents[named.name], named.version); return id ? [id] : []; },
  component: (named, _from, source) => pick(libraryOf(source).components[named.name], named.version) ?? [],
};

const pascal = (name: string) => name.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("");
/** what a file of the repository is, by its place: the one place where a place is given a name. A rule says the name, never the place */
export function uiWhat(id: string): Record<string, string> {
  let m = /^shared\/libs\/ui\/web\/primitives\/(?:components|layouts)\/([^/]+)\//.exec(id); if (m) return { primitive: pascal(m[1]) };
  m = /^shared\/libs\/ui\/web\/patterns\/[^/]+\/([^/]+)\//.exec(id); if (m) return { pattern: m[1] };
  m = /^shared\/libs\/knowledge\/(?:[^/]+\/)?([^/]+)\//.exec(id); if (m) return { knowledge: m[1] };
  m = /^apps\/[^/]+\/slices\/[^/]+\/([^/]+)\//.exec(id); if (m) return { slice: m[1] };
  m = /^apps\/([^/]+)\//.exec(id); if (m) return { app: m[1] };
  return {};
}
