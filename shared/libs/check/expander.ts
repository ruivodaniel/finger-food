// ── EXPANDER ─────────────────────────────────────────────────────
// From the entry points, the list of items. It judges nothing, and it has no stop of its own: the caller sets the scope with the arguments.
// An entry point is a container (a folder; later a tag of rows) or one thing. One thing may name its version: …/avatar/v3.
//   crawl    what a container gives: the latest version of each thing inside (latest), or every version (all).
//            An entry point that names a version is taken at that version.
//   follow   from each item, everything it uses, whatever its kind, and from that, everything it uses: the version it names, else the latest
// It asks the source for every thing. A kind says how a thing of that kind is recognised, how it is read, and what it names.
import type { Named, Source } from "./source.ts";
import type { Resolve } from "./processor.ts";
import type { Facts } from "./facts.ts";

/** what a container gives: the latest version of each thing inside (the default), or every version */
export type Crawl = "latest" | "all";

export type Kind = {
  name: string;
  /** false: a thing that is followed through and never checked (a module between two items) */
  item?: boolean;
  /** is the thing with this id of this kind? */
  is(id: string): boolean;
  /** what it names, as it writes it: the source says where each is */
  names?(raw: string, id: string): Named[];
  /** PARSER: the thing as stored → its value. The source is asked when reading the text is not enough */
  parse?(raw: string, id: string, source: Source): unknown | Promise<unknown>;
  /** the value → what the processors read, with what it names resolved to its contract */
  facts?(value: unknown, id: string, resolve: Resolve): Facts;
};

export type Listed = { id: string; kind: string; via?: string };

export function expand(entryPoints: readonly string[], call: { crawl: Crawl; follow: boolean; kinds: readonly string[] }, parts: { source: Source; kinds: readonly Kind[] }): { items: Listed[]; missing: string[] } {
  const { source, kinds } = parts;
  const kindOf = (id: string) => kinds.find((k) => k.is(id));
  /** inside a container: every version, or the latest of each thing; a version the entry point itself names is taken as it is */
  const asked = (id: string, entry: string) => { const v = source.version(id); if (call.crawl === "all" || !v || v.version === v.latest) return true; const named = `${v.thing}/v${v.version}`; return entry === named || entry.startsWith(named + "/"); };
  const opened = new Set<string>(), missing: string[] = [];
  for (const entry of entryPoints) {
    const id = source.locate(entry);
    if (id === undefined) { missing.push(entry); continue; }
    if (!source.holds(id)) { opened.add(id); continue; }
    for (const u of source.under(id)) if (asked(u, id)) opened.add(u);
  }
  const via: Record<string, string> = {};
  if (call.follow) {
    const queue = [...opened];
    while (queue.length) {
      const at = queue.shift()!, kind = kindOf(at);
      if (!kind?.names) continue;
      for (const named of kind.names(source.read(at), at)) for (const next of source.find(named, at)) {
        if (opened.has(next)) continue;
        opened.add(next); via[next] = kind.item === false ? via[at] ?? at : at; queue.push(next);
      }
    }
  }
  const items: Listed[] = [];
  for (const id of opened) { const kind = kindOf(id); if (kind && kind.item !== false && call.kinds.includes(kind.name)) items.push(via[id] ? { id, kind: kind.name, via: via[id] } : { id, kind: kind.name }); }
  items.sort((a, b) => a.id.localeCompare(b.id));
  return { items, missing };
}
