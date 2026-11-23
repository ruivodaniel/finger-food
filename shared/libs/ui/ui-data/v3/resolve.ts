// THE RESOLVER: how a name becomes a component written as code. A UI document names a component by its name alone (the latest version comes) or by its name
// and a number (that version comes). The resolver looks only in the code registries it was handed: it has no list of its own and reaches for nothing.
// A component written as data is found the same way through `use` and the documents the consumer gives (the registry of documents and the lock): that half is in the runtime.
import type { Prim } from "./types";
import { primOf } from "./schema";

/** one version of a component: the code, and its props schema when it declares one */
export type CodeVersion = { component: unknown; schema?: { component: string; props: Record<string, { kind: string; values?: readonly string[] }> } };
/** what a library gives: for each component name, its versions by number. Written when the library is built */
export type CodeRegistry = Record<string, Record<number, CodeVersion>>;
export type Resolved = { component: unknown; prim?: Prim; version: number };
export interface Resolver {
  /** the component of that name: at the version asked; with none asked, at the version the lock keeps, else the latest. Null when the name, or that version, is not there */
  resolve(name: string, version?: number): Resolved | null;
  /** the versions there are of a name, lowest first; none when the name is unknown */
  versions(name: string): number[];
}

/** a resolver over the registries the consumer handed, in order: a name in two of them is the later one's. `lock`: the version to give a name when none is asked */
export function createResolver(registries: CodeRegistry[], lock: Record<string, number> = {}): Resolver {
  const all: CodeRegistry = Object.assign({}, ...registries);
  const versions = (name: string) => Object.keys(all[name] ?? {}).map(Number).sort((a, b) => a - b);
  return {
    versions,
    resolve(name, version) {
      const have = versions(name);
      if (!have.length) return null;
      const v = version ?? lock[name] ?? have[have.length - 1], found = all[name][v];
      return found ? { component: found.component, ...(found.schema ? { prim: primOf(found.schema) } : {}), version: v } : null;
    },
  };
}
