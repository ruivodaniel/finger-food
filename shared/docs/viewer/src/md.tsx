// The inline markup of every text field: `code` · **bold** · *em* · [[term]] · [[term|shown]] · [[doc-id]]. React nodes out, nothing escaped by hand.
// A [[term]] is a link to the glossary at the term's anchor, its definition as the tooltip (the old viewer's .gterm); an unknown term is plain text; a doc id is a doc link.
import { createContext, useContext, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@libs/web-components";

export type Links = { termDef: (name: string) => string | undefined; hasDoc: (id: string) => boolean; openDoc: (id: string) => void; openTerm: (name: string) => void };
export const LinksContext = createContext<Links>({ termDef: () => undefined, hasDoc: () => false, openDoc: () => {}, openTerm: () => {} });

const TOKEN = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[\[[^\]|]+(?:\|[^\]]+)?\]\])/g;
/** the markup stripped, for a title attribute */
export const plain = (s: string) => s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, d) => d ?? t).replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/`([^`]+)`/g, "$1");
const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export function Md({ children: text }: { children: string | undefined }) {
  const links = useContext(LinksContext);
  if (!text) return null;
  const parts = String(text).split(TOKEN);
  const out: ReactNode[] = parts.map((p, i) => {
    if (i % 2 === 0) return p;
    if (p.startsWith("`")) return <code key={i} element="type--code">{p.slice(1, -1)}</code>;
    if (p.startsWith("**")) return <strong key={i}><Md>{p.slice(2, -2)}</Md></strong>;
    if (p.startsWith("*")) return <em key={i}><Md>{p.slice(1, -1)}</Md></em>;
    const m = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/.exec(p)!;
    const term = m[1].trim(), shown = m[2] ?? m[1];
    const def = links.termDef(term.toLowerCase());
    if (def) return (
      <Tooltip key={i}>
        <TooltipTrigger asChild>
          <a element="type--link" href={`#g-${slug(term)}`} onClick={(e) => { e.preventDefault(); links.openTerm(term); }}>{shown}</a>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-md"><span element="type--body"><strong>{term}</strong> · <Md>{def}</Md></span></TooltipContent>
      </Tooltip>
    );
    if (links.hasDoc(`doc/${term}`)) return <a key={i} element="type--link" href={`#doc/${term}`} onClick={(e) => { e.preventDefault(); links.openDoc(`doc/${term}`); }}>{shown}</a>;
    return shown;
  });
  return <>{out}</>;
}
