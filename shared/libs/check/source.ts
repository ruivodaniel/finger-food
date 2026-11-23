// ── SOURCE ───────────────────────────────────────────────────────
// The only part that knows the storage. Every other part asks it: the run for an entry point, the expander for what is under an item and for
// where a thing an item names is, the resolver for a thing by its name. An id is where a thing is, as the source says it (a path from the root; a row id).

/** a thing an item names, as the item writes it: the kind of naming (an import, a document, a component…), the name, and the version when it pins one */
export type Named = { as: string; name: string; version?: number; /** the part of the storage or of the library it is named in, when there are several (a surface) */ in?: string; /** where the item takes it from, when it says (the package or alias it is imported from) */ from?: string; /** the item that names it */ by?: string };

export type Source = {
  /** an entry point, as the caller wrote it → the id of the thing, or undefined when there is no such thing */
  locate(entryPoint: string): string | undefined;
  /** is it a holder of other things (a folder; a row that owns rows)? */
  holds(id: string): boolean;
  /** the things directly in a holder, holders included */
  children(id: string): string[];
  /** contain: the things under a holder, at any depth, holders left out */
  under(id: string): string[];
  /** the thing itself, as stored */
  read(id: string): string;
  /** the thing as a value, when reading it as text is not enough (a module that exports its value) */
  load(id: string): Promise<unknown>;
  /** where the thing an item names is: the ids it stands for (none when the storage does not hold it). `from`: the item that names it */
  find(named: Named, from: string): string[];
  /** what the thing is, by the names it goes by (a primitive, a pattern, a slice…): what a rule says instead of a place */
  what(id: string): Record<string, string>;
  /** the versions a versioned thing has, when `id` stands inside one: the thing, this version, and the latest. A thing with no versions: undefined */
  version(id: string): { thing: string; version: number; latest: number } | undefined;
};
