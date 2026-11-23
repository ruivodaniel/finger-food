// ── SOURCE · files ───────────────────────────────────────────────
// The storage is the repository's files. An id is a path from the root. A versioned thing is a folder with one folder for each version: <thing>/v<N>/.
// Node only: with the finders a caller adds, this is the one place of the system that touches the file system.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import type { Named, Source } from "./source.ts";

const SKIP = new Set(["node_modules", "dist", "generated", ".git"]);
export type FileSource = Source & { root: string; path(id: string): string; id(path: string): string };
/** how a kind of naming is found in files: an import by resolving it, a name by an index of the files that declare it */
export type Finder = (named: Named, from: string, source: FileSource) => string[];

/** `load`: how a module is loaded, given by the runtime (a bundler, or Node). `finders`: by the kind of naming */
/** `what`: what a file is, by its place: the one place where a place is given a name */
export function fileSource(root: string, parts: { load?(path: string): Promise<unknown>; finders?: Record<string, Finder>; what?(id: string): Record<string, string> } = {}): FileSource {
  const path = (id: string) => (isAbsolute(id) ? id : join(root, id)), id = (p: string) => relative(root, p) || ".";
  const under = (p: string): string[] => (statSync(p).isDirectory() ? readdirSync(p).filter((n) => !SKIP.has(n)).flatMap((n) => under(join(p, n))) : [p]);
  const latest = new Map<string, number>();
  const source: FileSource = {
    root, path, id,
    locate: (entry) => (existsSync(path(entry)) ? id(path(entry)) : undefined),
    holds: (i) => existsSync(path(i)) && statSync(path(i)).isDirectory(),
    children: (i) => (existsSync(path(i)) ? readdirSync(path(i)).filter((n) => !SKIP.has(n)).map((n) => id(join(path(i), n))) : []),
    under: (i) => under(path(i)).map(id),
    read: (i) => readFileSync(path(i), "utf-8"),
    load: (i) => (parts.load ? parts.load(path(i)) : import(path(i))),
    find: (named, from) => parts.finders?.[named.as]?.(named, from, source) ?? [],
    what: (i) => parts.what?.(i) ?? {},
    version(i) {
      const m = /^(.*)\/v(\d+)\//.exec(i);
      if (!m) return undefined;
      if (!latest.has(m[1])) latest.set(m[1], Math.max(0, ...readdirSync(path(m[1])).map((n) => /^v(\d+)$/.exec(n)).filter(Boolean).map((x) => Number(x![1]))));
      return { thing: m[1], version: Number(m[2]), latest: latest.get(m[1])! };
    },
  };
  return source;
}
