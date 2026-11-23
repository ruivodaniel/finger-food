// One entry rendered from its JSON: a doc (axioms → purpose → reference), a decision, a term, the standards tracker. Ported from docs/engine/viewer.html renderDoc, as React.
import { useEffect, useState } from "react";
import { Badge, Chip } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { assetUrl, type Full, type ImageOrDiagram, type Review, type Topic } from "./data";
import { Md } from "./md";
import { Previewer as CodeBlock } from "@libs/knowledge/previewer-editors/code-block/Previewer";
import { Previewer as Mermaid } from "@libs/knowledge/previewer-editors/diagram-mermaid/v2/Previewer";
import { Previewer as Plantuml } from "@libs/knowledge/previewer-editors/diagram-plantuml/v2/Previewer";
import { Swimlane } from "@libs/knowledge/previewer-editors/diagram-swimlane/v3/Surface";

/** a code snippet or an ascii drawing: the code block previewer (the knowledge library's), read-only, the language from the caption when it names one */
const LANGS = new Set(["typescript", "javascript", "json", "python", "html", "css", "markdown", "sql", "bash", "shell", "yaml", "go", "rust", "java", "c", "cpp", "csharp", "ruby", "toml", "tsx", "ts", "js"]);
const langOf = (caption?: string) => { const c = (caption ?? "").trim().toLowerCase(); return c === "ts" || c === "tsx" ? "typescript" : c === "js" ? "javascript" : c === "bash" ? "shell" : LANGS.has(c) ? c : "plain"; };
const Pre = ({ children, lang = "plain" }: { children: string; lang?: string }) => <CodeBlock layout="block" v={{ language: lang, fontSize: "13", showLineNumbers: false }} data={{ id: "", code: children }} />;

function ReviewBadge({ r }: { r?: Review }) {
  if (!r) return null;
  return <Badge scale="xs" emphasis="quiet" status={r.state === "closed" ? "success" : "warning"}>{r.state}</Badge>;
}
function HtmlFromFile({ src }: { src: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { let dead = false; fetch(assetUrl(src)).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`)))).then((t) => { if (!dead) setHtml(t); }).catch((e) => { if (!dead) setErr(String(e.message ?? e)); }); return () => { dead = true; }; }, [src]);
  if (err) return <p element="type--body" status="error">could not load {src}: {err}</p>;
  if (html === null) return <p element="type--body">loading {src}…</p>;
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
function Diagrams({ items }: { items: ImageOrDiagram[] }) {
  return (
    <Stack dir="col" scale="sm">
      {items.map((d, i) => (
        <div key={i}>
          {d.title ? <p element="type--body"><Md>{d.title}</Md></p> : null}
          {d.type === "image" ? <img src={assetUrl(d.src)} alt={d.alt ?? d.title ?? ""} className="max-w-full" />
            : d.type === "html" && d.src ? <HtmlFromFile src={d.src} />
            : d.type === "html" ? <div dangerouslySetInnerHTML={{ __html: d.value ?? "" }} />
            // the knowledge library's diagrams, read-only: the document holds the diagram's own data, the component draws it
            : d.type === "mermaid" ? <Mermaid data={{ id: `mermaid-${i}`, text: d.value }} />
            : d.type === "plantuml" ? <Plantuml data={{ id: `plantuml-${i}`, text: d.value }} />
            : d.type === "swimlane" ? <Swimlane data={d.diagram} direction={d.direction} editable={false} />
            : <Pre>{(d as { value?: string }).value ?? ""}</Pre>}
        </div>
      ))}
    </Stack>
  );
}
function TopicView({ t, n }: { t: Topic; n: number }) {
  const diagrams = t.imagesAndDiagrams ?? t.diagrams ?? [];
  return (
    <Stack dir="col" scale="sm">
      <h3 element="type--heading2" id={`t${n}`}><span element="type--body">{n}</span> <Md>{t.topic}</Md></h3>
      {t.statement ? <p><Md>{t.statement}</Md></p> : <p element="type--body">(no statement yet)</p>}
      {t.claims?.length ? (
        <ul className="list-disc pl-5">
          {t.claims.map((c, i) => <li key={i}><Md>{c.text}</Md>{(c.ids ?? (c.id ? [c.id] : [])).map((id) => <Badge key={id} scale="xs" emphasis="quiet" className="ml-1">{id}</Badge>)}{c.source ? <span element="type--body"> · <Md>{c.source}</Md></span> : null}</li>)}
        </ul>
      ) : null}
      {diagrams.length ? <Diagrams items={diagrams} /> : null}
      {(t.examples ?? []).map((e, i) => (
        <Stack key={i} dir="col" scale="2xs">
          {e.title ? <p><strong><Md>{e.title}</Md></strong></p> : null}
          {e.text ? <p><Md>{e.text}</Md></p> : null}
          {(e.snippets ?? []).map((s, j) => <div key={j}>{s.caption ? <p element="type--body"><Md>{s.caption}</Md></p> : null}<Pre lang={langOf(s.caption)}>{s.code}</Pre></div>)}
        </Stack>
      ))}
    </Stack>
  );
}

export function DocView({ e, openDoc, onGlossary }: { e: Full; openDoc: (id: string) => void; /** a term entry: "in the glossary" */ onGlossary?: (title: string) => void }) {
  return (
    <Stack dir="col" scale="lg" element="surface--content">
      <Stack dir="row" scale="sm" align="center" className="flex-wrap">
        <Badge scale="xs" status={e.status === "approved" ? "success" : "error"} emphasis={e.status === "approved" ? "primary" : "quiet"}>{e.status === "approved" ? "approved" : "to approve"}</Badge>
        <Badge scale="xs" emphasis="quiet">{e.kind}</Badge>
        <span element="type--body">{e.owner}</span>
        {e.tags.map((t) => <Chip key={t} scale="xs" emphasis="quiet" closable={false}>{t}</Chip>)}
      </Stack>
      {e.summary ? <p><Md>{e.summary}</Md></p> : null}

      {e.kind === "term" && e.term ? (
        <Stack dir="col" scale="2xs">
          <span element="type--body-extra-small" className="uppercase tracking-wider">term</span>
          <p><Md>{e.term.def}</Md></p>
          {e.term.aliases?.length ? <p element="type--body">also: {e.term.aliases.join(", ")}</p> : null}
          {e.term.proposed ? <Badge scale="xs" emphasis="quiet" status="warning">proposed</Badge> : null}
          <p><a element="type--link" href="#glossary" onClick={(ev) => { ev.preventDefault(); onGlossary?.(e.title); }}>in the glossary</a></p>
        </Stack>
      ) : null}

      {e.kind === "adr" && e.adr ? (
        <Stack dir="col" scale="sm">
          <Stack dir="row" scale="sm" align="center"><Badge scale="xs" emphasis="quiet" status={e.adr.adrStatus === "accepted" ? "success" : e.adr.adrStatus === "superseded" ? "warning" : "info"}>{e.adr.adrStatus}{e.adr.supersededBy ? ` → ${e.adr.supersededBy}` : ""}</Badge><span element="type--body">{e.adr.date}</span></Stack>
          {e.adr.affects?.length ? <p element="type--body">governs {e.adr.affects.map((a, i) => <span key={a}>{i ? " · " : ""}<a element="type--link" href={`#doc/${a}`} onClick={(ev) => { ev.preventDefault(); openDoc(`doc/${a}`); }}>{a}</a></span>)}</p> : null}
          <h3 element="type--heading4">Context</h3><p><Md>{e.adr.context}</Md></p>
          <h3 element="type--heading4">Decision</h3><p><Md>{e.adr.decision}</Md></p>
          <h3 element="type--heading4">Consequences</h3>
          <ul className="list-disc pl-5">{e.adr.consequences.map((c, i) => <li key={i}><Md>{c}</Md></li>)}</ul>
        </Stack>
      ) : null}

      {e.kind === "standards" && e.standards ? (
        <Stack dir="col" scale="md">
          {e.standards.note ? <p><Md>{e.standards.note}</Md></p> : null}
          {e.standards.files.map((f, i) => {
            const consumed = f.rules.filter((r) => r.consumedBy?.length).length;
            return (
              <Stack key={i} dir="col" scale="xs">
                <h3 element="type--heading4"><Badge scale="xs" emphasis="quiet">{f.prefix}</Badge> {f.file}</h3>
                <p element="type--body"><Md>{f.governs}</Md> · {consumed} / {f.rules.length} consumed</p>
                <ul className="list-disc pl-5">{f.rules.map((r) => <li key={r.id}><Badge scale="xs" emphasis="quiet">{r.id}</Badge> <Md>{r.text}</Md>{r.consumedBy?.length ? <span element="type--body"> · consumed → {r.consumedBy.join(", ")}</span> : null}</li>)}</ul>
              </Stack>
            );
          })}
        </Stack>
      ) : null}

      {e.kind === "doc" && e.doc ? (
        <Stack dir="col" scale="lg">
          <Stack dir="col" scale="sm">
            <h2 element="type--heading2" id="axioms">Axioms <ReviewBadge r={e.doc.review?.axioms} /></h2>
            {e.doc.axioms.length ? <ol className="list-decimal pl-5">{e.doc.axioms.map((a, i) => <li key={i}><Md>{a.text}</Md>{a.sub ? <ul className="list-disc pl-5">{a.sub.map((s, j) => <li key={j}><Md>{s}</Md></li>)}</ul> : null}</li>)}</ol> : <p element="type--body">(no axioms yet)</p>}
          </Stack>
          <Stack dir="col" scale="sm">
            <h2 element="type--heading2" id="purpose">Purpose <ReviewBadge r={e.doc.review?.purpose} /></h2>
            {e.doc.purpose.intro ? <p><Md>{e.doc.purpose.intro}</Md></p> : null}
            {e.doc.purpose.points ? <ul className="list-disc pl-5">{e.doc.purpose.points.map((p, i) => <li key={i}><Md>{p}</Md></li>)}</ul> : null}
            {e.doc.purpose.note ? <blockquote element="surface--panel"><Md>{e.doc.purpose.note}</Md></blockquote> : null}
          </Stack>
          <Stack dir="col" scale="lg">
            <h2 element="type--heading2" id="reference">Reference <ReviewBadge r={e.doc.review?.reference} /></h2>
            {e.doc.reference.map((t, i) => <TopicView key={i} t={t} n={i + 1} />)}
          </Stack>
        </Stack>
      ) : e.kind === "doc" ? <p element="type--body">not migrated yet (todo)</p> : null}
    </Stack>
  );
}
