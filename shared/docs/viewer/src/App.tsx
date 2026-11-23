// The docs viewer: one tree in the nav (SKILLS: activities → docs; DOCUMENTS: every entry under its owner), the chosen entry in the page. Built with the library only; the theme owns the look.
import { useEffect, useMemo, useState } from "react";
import { Badge, Icon, Input, InputSelect, ListTree, TooltipProvider, type IconName, type ListTreeNodeContext } from "@libs/web-components";
import { Container, Main, MainBody, Page, PageBody, PageHeader, ScrollArea, ShellNav, ShellSideNav, Stack } from "@libs/web-layouts";
import { loadEntries, loadEntry, loadSkills, toApprove, deprecated, AUDIENCES, audienceLabel, type Audience, type Entry, type Full, type Skills } from "./data";
import { DocView } from "./DocView";
import { Glossary, slugOf } from "./Glossary";
import { LinksContext } from "./md";

type Counts = { todo: number; ok: number };
/** counts: only on the DOCUMENTS's group rows (an owner, the root); a document row shows its own status; SKILLS rows and the glossary carry none. Terms never enter a count. */
type Node = { id: string; label: string; kind: "root" | "group" | "owner" | "glossary" | "doc" | "term" | "adr" | "standards"; children?: Node[]; counts?: Counts; entry?: Entry; docs?: string[]; note?: string; /** a group kept even while it holds nothing (tooling: lint, tests) */ keepEmpty?: boolean };
type StatusFilter = "active" | "approved" | "todo" | "deprecated" | "all";
const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [{ value: "active", label: "all active" }, { value: "approved", label: "approved" }, { value: "todo", label: "to approve" }, { value: "deprecated", label: "deprecated" }, { value: "all", label: "all" }];

const KIND_ICON: Record<Node["kind"], IconName> = { root: "folder", group: "compass", owner: "folder", glossary: "bookOpen", doc: "fileText", term: "bookOpen", adr: "gitBranch", standards: "list" };
const OWNER_ORDER = ["main", "orchestrator", "libs", "infra", "documentation"];
const SECOND_ORDER: Record<string, string[]> = { main: ["core", "slices"], libs: ["ui", "knowledge"] };
const sum = (nodes: Node[]): Counts => nodes.reduce((a, n) => ({ todo: a.todo + (n.counts?.todo ?? 0), ok: a.ok + (n.counts?.ok ?? 0) }), { todo: 0, ok: 0 });
const countOf = (e: Entry): Counts => (deprecated(e) ? { todo: 0, ok: 0 } : toApprove(e) ? { todo: 1, ok: 0 } : { todo: 0, ok: 1 });
const by = (order: string[]) => (a: string, b: string) => { const i = order.indexOf(a), j = order.indexOf(b); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) || a.localeCompare(b); };

/** the DOCUMENTS: owners as a tree, docs/decisions/standards as leaves; terms are not documents and are not here (the glossary is one leaf of its own) */
function mapperTree(entries: Entry[]): Node {
  const owners = new Map<string, Entry[]>();
  for (const e of entries) { if (e.kind === "term" || e.owner.startsWith("skills/")) continue; if (!owners.has(e.owner)) owners.set(e.owner, []); owners.get(e.owner)!.push(e); }
  // every owner path and its ancestors; "(all slices)" always present under main/slices
  const paths = new Set<string>(["main/slices/(all slices)", "libs/knowledge"]);
  for (const o of owners.keys()) { const seg = o.split("/"); for (let i = 1; i <= seg.length; i++) paths.add(seg.slice(0, i).join("/")); }
  const build = (path: string): Node => {
    const seg = path.split("/"), depth = seg.length;
    const kids = [...paths].filter((p) => p.startsWith(path + "/") && p.split("/").length === depth + 1).sort(depth === 1 ? by(SECOND_ORDER[seg[0]] ?? []) : (a, b) => (a.endsWith("(all slices)") ? -1 : b.endsWith("(all slices)") ? 1 : a.localeCompare(b))).map(build);
    const own = owners.get(path) ?? [];
    const leaves: Node[] = own.sort((a, b) => (a.kind === b.kind ? (a.order ?? 1e9) - (b.order ?? 1e9) || a.title.localeCompare(b.title) : a.kind === "doc" ? -1 : b.kind === "doc" ? 1 : a.kind.localeCompare(b.kind))).map((e) => ({ id: e.id, label: e.title, kind: e.kind, counts: countOf(e), entry: e }));
    const children = [...kids, ...leaves];
    return { id: `owner:${path}`, label: seg[seg.length - 1], kind: "owner", children, counts: sum(children) };
  };
  const tops = OWNER_ORDER.filter((o) => paths.has(o)).map(build);
  return { id: "mapper", label: "DOCUMENTS", kind: "root", children: tops, counts: sum(tops) };
}
/** the SKILLS: groups of activity documents (db/doc/skill-<activity>.json, owner skills/<group>); a group counts like any other */
function skillsTree(k: Skills, byId: Map<string, Entry>): Node {
  const groups = k.groups.map((g): Node => {
    const subs = g.groups.map((sg): Node => {
      const acts = sg.activities.flatMap((a): Node[] => { const e = byId.get(`doc/skill-${a.id}`); return e ? [{ id: e.id, label: e.title, kind: "doc", counts: countOf(e), entry: e }] : []; });
      return { id: `group:${g.id}/${sg.id}`, label: sg.title, kind: "group", children: acts, counts: sum(acts) };
    });
    return { id: `group:${g.id}`, label: g.title, kind: "group", children: subs, counts: sum(subs), note: g.note };
  });
  return { id: "skills", label: "SKILLS", kind: "root", children: groups, counts: sum(groups) };
}
/** the GLOSSARY: one leaf for the whole database, every term alphabetical */
/** TOOLING: a sibling of the skills; its groups are empty for now and stay on the tree */
const toolingTree = (): Node => ({ id: "tooling", label: "TOOLING", kind: "root", keepEmpty: true, children: [{ id: "group:tooling/lint", label: "lint", kind: "group", keepEmpty: true, children: [] }, { id: "group:tooling/tests", label: "tests", kind: "group", keepEmpty: true, children: [] }] });
const glossaryLeaf = (entries: Entry[]): Node => ({ id: "glossary", label: "GLOSSARY", kind: "glossary", docs: entries.filter((e) => e.kind === "term").map((e) => e.id) });
/** the tree with only the rows the search and the status keep; a group stays when a child stays */
function prune(n: Node, keep: (e: Entry) => boolean, byId: Map<string, Entry>): Node | null {
  if (n.entry) return keep(n.entry) ? n : null;
  if (n.kind === "glossary") { const docs = (n.docs ?? []).filter((id) => { const e = byId.get(id); return !!e && keep(e); }); return docs.length ? { ...n, docs } : null; }
  const children = (n.children ?? []).map((c) => prune(c, keep, byId)).filter((c): c is Node => !!c);
  // the counts follow the filter: a group counts only the rows it still shows
  return children.length || n.keepEmpty ? { ...n, children, ...(n.counts ? { counts: sum(children) } : {}) } : null;
}
/** the group ids from a root down to the node with this id (the node itself excluded); [] when it is not in these trees */
const pathTo = (trees: Node[], id: string): string[] => { const walk = (n: Node, trail: string[]): string[] | null => { if (n.id === id) return trail; for (const c of n.children ?? []) { const r = walk(c, n.children?.length ? [...trail, n.id] : trail); if (r) return r; } return null; }; for (const t of trees) { const r = walk(t, []); if (r) return r; } return []; };
const allGroupIds = (n: Node, out: string[] = []): string[] => { if (n.children?.length) { out.push(n.id); n.children.forEach((c) => allGroupIds(c, out)); } return out; };

function RowView({ n, ctx }: { n: Node; ctx: ListTreeNodeContext }) {
  const heading = n.kind === "root" || n.kind === "glossary";
  const group = n.counts && n.children?.length;
  return (
    <Stack dir="row" scale="xs" align="center" className="min-w-0" title={n.note ?? n.entry?.summary}>
      {!heading ? <Icon name={KIND_ICON[n.kind]} scale="xs" className="shrink-0" /> : null}
      <span element={heading ? "type--body-small" : ctx.depth <= 1 ? "type--body" : "type--body-small"} className={`truncate ${heading ? "uppercase tracking-wider" : ""}`}>{n.label}</span>
      {group ? (
        <span className="ml-auto shrink-0 inline-flex gap-1">
          <Badge scale="xs" emphasis={n.counts!.todo ? "primary" : "quiet"} status={n.counts!.todo ? "error" : "neutral"}>{n.counts!.todo}</Badge>
          <Badge scale="xs" emphasis="primary" status="success">{n.counts!.ok}</Badge>
        </span>
      ) : n.entry ? (
        <span className="ml-auto shrink-0">{deprecated(n.entry) ? <Badge scale="xs" emphasis="quiet" status="neutral">deprecated</Badge> : <Badge scale="xs" emphasis={toApprove(n.entry) ? "quiet" : "primary"} status={toApprove(n.entry) ? "error" : "success"}>{toApprove(n.entry) ? "to approve" : "approved"}</Badge>}</span>
      ) : null}
    </Stack>
  );
}

export function App() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [skills, setSkills] = useState<Skills | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("active");
  // the audience filter: a document names its audiences; "all" keeps every entry, an audience keeps the entries that name it (a term names none and always stays)
  const [audience, setAudience] = useState<Audience | "all">("all");
  // the open document is the url's (?doc=<entry id>, or "glossary"): a refresh keeps it, a link carries it
  const [selected, setSelected] = useState<string | null>(() => new URLSearchParams(window.location.search).get("doc"));
  useEffect(() => { const u = new URL(window.location.href); if (selected) u.searchParams.set("doc", selected); else u.searchParams.delete("doc"); if (u.href !== window.location.href) window.history.replaceState(null, "", u); }, [selected]);
  useEffect(() => { const back = () => setSelected(new URLSearchParams(window.location.search).get("doc")); window.addEventListener("popstate", back); return () => window.removeEventListener("popstate", back); }, []);
  const [full, setFull] = useState<Full | null>(null);
  const [collapsed, setCollapsed] = useState<string[] | null>(null);
  useEffect(() => { Promise.all([loadEntries(), loadSkills()]).then(([e, k]) => { setEntries(e); setSkills(k); }).catch((e) => setError(String(e.message ?? e))); }, []);
  const byId = useMemo(() => new Map((entries ?? []).map((e) => [e.id, e])), [entries]);
  // the terms' payloads (the glossary page) and their definitions by name (the [[term]] links): loaded once, then every text re-renders with them
  const [termFull, setTermFull] = useState<Map<string, Full>>(() => new Map());
  const termDefs = useMemo(() => { const m = new Map<string, string>(); for (const f of termFull.values()) if (f.term) { m.set(f.title.toLowerCase(), f.term.def); f.term.aliases?.forEach((a) => m.set(a.toLowerCase(), f.term!.def)); } return m; }, [termFull]);
  // the glossary page: its owner filter and the anchor a reference asked for
  const [glossaryOwner, setGlossaryOwner] = useState<string | null>(null);
  const [glossaryAnchor, setGlossaryAnchor] = useState<string | null>(null);
  // the glossary page's own search, in the page header: filters the page in place (the sidebar search filters the tree)
  const [glossaryQ, setGlossaryQ] = useState("");
  const trees = useMemo(() => (entries && skills ? [glossaryLeaf(entries), mapperTree(entries), skillsTree(skills, byId), toolingTree()] : []), [entries, skills, byId]);
  const keepStatus = (e: Entry) => status === "all" || (status === "active" ? !deprecated(e) : status === "deprecated" ? deprecated(e) : !deprecated(e) && (status === "approved") === !toApprove(e));
  const keep = (e: Entry) => (audience === "all" || !e.audience || e.audience.includes(audience)) && keepStatus(e) && (!q || `${e.title} ${e.summary ?? ""} ${e.tags.join(" ")} ${e.id}`.toLowerCase().includes(q.toLowerCase()));
  const shown = useMemo(() => trees.map((t) => prune(t, keep, byId)).filter((t): t is Node => !!t), [trees, q, status, audience, byId]);   // eslint-disable-line react-hooks/exhaustive-deps
  // every group starts closed; the person opens what they want
  useEffect(() => { if (collapsed === null && trees.length) { const onTheWay = new Set(selected ? pathTo(trees, selected) : []); setCollapsed(trees.flatMap((t) => allGroupIds(t)).filter((id) => !onTheWay.has(id))); } }, [trees, collapsed, selected]);
  // a document opened from elsewhere (a link, a [[ref]]): the groups on its way open, the rest stay as they are
  useEffect(() => { if (!selected || collapsed === null) return; const onTheWay = pathTo(trees, selected); if (onTheWay.some((id) => collapsed.includes(id))) setCollapsed(collapsed.filter((id) => !onTheWay.includes(id))); }, [selected, trees]);   // eslint-disable-line react-hooks/exhaustive-deps
  const selectedEntry = selected ? byId.get(selected) : undefined;
  const selectedNode = useMemo(() => { const find = (n: Node): Node | null => (n.id === selected ? n : (n.children ?? []).map(find).find(Boolean) ?? null); return trees.map(find).find(Boolean) ?? null; }, [trees, selected]);
  useEffect(() => { setFull(null); if (!selectedEntry) return; let dead = false; loadEntry(selectedEntry.id).then((f) => { if (!dead) setFull(f); }).catch((e) => setError(String(e.message ?? e))); return () => { dead = true; }; }, [selectedEntry]);
  // terms by name, for the [[term]] tooltips: fetched once a term list is wanted
  useEffect(() => { if (!entries) return; let dead = false; const next = new Map<string, Full>(); Promise.all(entries.filter((e) => e.kind === "term").map((t) => loadEntry(t.id).then((f) => { next.set(t.id, f); }).catch(() => undefined))).then(() => { if (!dead) setTermFull(next); }); return () => { dead = true; }; }, [entries]);

  // picking anything never moves the tree: it stays as the person left it
  const open = (id: string) => setSelected(id);
  const onSelect = (n: Node) => { if (n.kind === "glossary" || n.entry) setSelected(n.id); else { const c = collapsed ?? []; setCollapsed(c.includes(n.id) ? c.filter((x) => x !== n.id) : [...c, n.id]); } };
  // a [[term]] reference opens the glossary at the term's anchor (an alias goes to its term)
  const openTerm = (name: string) => { const n = name.toLowerCase(); const t = [...termFull.values()].find((f) => f.title.toLowerCase() === n || f.term?.aliases?.some((a) => a.toLowerCase() === n)); setGlossaryAnchor(slugOf(t?.title ?? name)); setSelected("glossary"); };
  const links = { termDef: (name: string) => termDefs.get(name), hasDoc: (id: string) => byId.has(id), openDoc: open, openTerm };

  return (
    <LinksContext.Provider value={links}>
      <TooltipProvider delayDuration={150}>
      <ShellSideNav className="h-full">
        <ShellNav>
          <Stack dir="col" scale="sm" className="h-full w-[380px]">
            <Input type="search" scale="sm" placeholder="search" value={q} onChange={setQ} showClear />
            <InputSelect scale="sm" options={STATUS_OPTIONS} value={status} onChange={(v) => setStatus((v as StatusFilter | null) ?? "active")} />
            <InputSelect scale="sm" options={[{ value: "all", label: "all audiences" }, ...AUDIENCES.map((a) => ({ value: a, label: audienceLabel(a) }))]} value={audience} onChange={(v) => setAudience((v as Audience | "all" | null) ?? "all")} />
            <ScrollArea>
              {error ? <p element="type--body-small" status="error">{error}</p> : null}
              {!entries ? <p element="type--body-small">loading…</p> : (
                <ListTree items={shown} renderNode={(n, ctx) => <RowView n={n} ctx={ctx} />} collapsed={q.trim() ? [] : collapsed ?? []} onCollapsedChange={(c) => { if (!q.trim()) setCollapsed(c); }} indent={14} lines="children" selectedId={selected} onSelect={onSelect} />
              )}
            </ScrollArea>
          </Stack>
        </ShellNav>
        <Page>
          <PageHeader>
            <Container scale="lg">
              {selectedNode?.kind === "glossary" ? (
                <Stack dir="row" scale="md" align="center">
                  <span element="type--body-small" className="uppercase tracking-wider">glossary</span>
                  <div className="w-[360px]"><Input type="search" scale="sm" placeholder="search the glossary" value={glossaryQ} onChange={setGlossaryQ} showClear /></div>
                </Stack>
              ) : (
                <>
                  <h1 element="type--heading2">{selectedEntry?.title ?? selectedNode?.label ?? "docs"}</h1>
                  {selectedEntry ? <span element="type--body-small">{selectedEntry.id}</span> : selectedNode?.note ? <span element="type--body-small">{selectedNode.note}</span> : null}
                </>
              )}
            </Container>
          </PageHeader>
          <PageBody>
            <Main>
              <MainBody>
                <ScrollArea>
                  <Container scale="md" align="left" concept="document">
                    {selectedNode?.kind === "glossary" ? (
                      <Glossary entries={entries ?? []} full={termFull} owner={glossaryOwner} onOwner={setGlossaryOwner} anchor={glossaryAnchor} q={glossaryQ} />
                    ) : full ? <DocView e={full} openDoc={open} onGlossary={(t) => openTerm(t)} /> : selectedEntry ? <p element="type--body-small">loading…</p> : <p element="type--body">Pick a document in the SKILLS or the DOCUMENTS, or open the GLOSSARY.</p>}
                  </Container>
                </ScrollArea>
              </MainBody>
            </Main>
          </PageBody>
        </Page>
      </ShellSideNav>
      </TooltipProvider>
    </LinksContext.Provider>
  );
}
