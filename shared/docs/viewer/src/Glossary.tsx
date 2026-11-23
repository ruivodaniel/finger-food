// The glossary page, as the old viewer had it (renderGlossaryAll): one glossary, every term alphabetical with an anchor g-<slug>; chips filter by owner (what subject was).
import { useEffect } from "react";
import { Badge, Chip } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { Entry, Full } from "./data";
import { Md } from "./md";

export const slugOf = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-");

// One continuous page, read by scrolling: every term with its definition inline. A term's name, or a [[reference]], only scrolls to its anchor; the search filters this same page in place.
export function Glossary({ entries, full, owner, onOwner, anchor, q }: { entries: Entry[]; /** the terms' payloads, by id */ full: Map<string, Full>; owner: string | null; onOwner: (o: string | null) => void; /** a slug to scroll to, when reached from a reference */ anchor?: string | null; /** the search, filtering the terms in place */ q?: string }) {
  const all = entries.filter((e) => e.kind === "term").sort((p, q) => p.title.localeCompare(q.title));
  const needle = (q ?? "").trim().toLowerCase();
  const hit = (e: Entry) => { if (!needle) return true; const t = full.get(e.id)?.term; return `${e.title} ${t?.aliases?.join(" ") ?? ""} ${t?.def ?? ""}`.toLowerCase().includes(needle); };
  const terms = (owner ? all.filter((e) => (e.owners ?? [e.owner]).includes(owner)) : all).filter(hit);
  const used = [...new Set(all.flatMap((e) => e.owners ?? [e.owner]))].sort();
  useEffect(() => { if (!anchor) return; const el = document.getElementById(`g-${anchor}`); if (el) el.scrollIntoView({ block: "start" }); }, [anchor, terms.length]);
  return (
    <Stack dir="col" scale="md" element="surface--content">
      <span element="type--body-extra-small" className="uppercase tracking-wider">one glossary</span>
      <h1 element="type--heading1">Glossary{owner ? ` · ${owner}` : ""}</h1>
      <p>{terms.length} terms. A term can belong to several subjects.</p>
      <Stack dir="row" scale="xs" wrap>
        <Chip scale="sm" closable={false} emphasis={owner ? "quiet" : "primary"} onClick={() => onOwner(null)}>all</Chip>
        {used.map((o) => <Chip key={o} scale="sm" closable={false} emphasis={owner === o ? "primary" : "quiet"} onClick={() => onOwner(o)}>{o}</Chip>)}
      </Stack>
      <Stack dir="col">
        {terms.map((e) => {
          const t = full.get(e.id)?.term;
          return (
            <Stack key={e.id} dir="col" scale="3xs" id={`g-${slugOf(e.title)}`} className="py-3">
              <span>
                <a element="type--link" href={`#g-${slugOf(e.title)}`} onClick={(ev) => { ev.preventDefault(); document.getElementById(`g-${slugOf(e.title)}`)?.scrollIntoView({ block: "start" }); }}><Md>{e.title}</Md></a>
                {t?.aliases?.length ? <span element="type--body"> also: <Md>{t.aliases.join(", ")}</Md></span> : null}
                {t?.proposed ? <> <Badge scale="xs" emphasis="quiet" status="warning">proposed</Badge></> : null}
              </span>
              <Stack dir="row" scale="xs" align="center" wrap>
                {(e.owners ?? [e.owner]).map((o) => <Chip key={o} scale="xs" closable={false} emphasis={owner === o ? "primary" : "quiet"} onClick={() => onOwner(o)}>{o}</Chip>)}
                {e.paths.map((p) => <code key={p} element="type--code">{p}</code>)}
              </Stack>
              <p>{t ? <Md>{t.def}</Md> : "…"}</p>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}
