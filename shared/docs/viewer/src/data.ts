// The database as the viewer reads it: the flat entry list (db/entries.json, written by engine/remap-owner.ts), the skills (db/skills.json), one entry's payload on demand.
export type Kind = "doc" | "term" | "adr" | "standards";
export type Status = "todo" | "converted" | "approved" | "deprecated";
export type Audience = "seed-contributor" | "seed-consumer" | "product-contributor";
export const AUDIENCES: Audience[] = ["seed-contributor", "seed-consumer", "product-contributor"];
export const audienceLabel = (a: Audience) => a.replace("-", " ");
export type Entry = { id: string; kind: Kind; title: string; status: Status; owner: string; /** the reading position inside its owner folder (from the doc's JSON); absent sorts after the ordered ones, by title */ order?: number; /** the audiences the entry is for; a term carries none and passes every audience filter */ audience?: Audience[]; /** a term: every owner it belongs to */ owners?: string[]; subject?: string; subjects?: string[]; tags: string[]; paths: string[]; summary?: string; docId?: string };
export type Activity = { id: string; title: string; docs: string[] };
export type SkillSubgroup = { id: string; title: string; activities: Activity[] };
export type SkillGroup = { id: string; title: string; note?: string; groups: SkillSubgroup[] };
export type Skills = { groups: SkillGroup[] };

export type RichText = string;
export type Claim = { id?: string; ids?: string[]; text: RichText; source?: RichText };
import type { Diagram as SwimlaneDiagram, Direction as SwimlaneDirection } from "@libs/knowledge/previewer-editors/diagram-swimlane/v3/types";
/** what a document shows beside its text. The knowledge library's components draw the last three: a Mermaid diagram and a PlantUML diagram from their text
 *  (sequence, flowchart, class, state, activity…), a swimlane from its lanes, shapes and connectors. */
export type ImageOrDiagram =
  | { title?: RichText; type: "ascii"; value: string }
  | { title?: RichText; type: "image"; src: string; alt?: string }
  | { title?: RichText; type: "html"; src?: string; value?: string }
  | { title?: RichText; type: "mermaid"; value: string }
  | { title?: RichText; type: "plantuml"; value: string }
  | { title?: RichText; type: "swimlane"; diagram: SwimlaneDiagram; direction?: SwimlaneDirection };
export type Example = { title?: RichText; text?: RichText; snippets?: { caption?: RichText; code: string }[] };
export type Topic = { topic: RichText; statement?: RichText; claims: Claim[]; imagesAndDiagrams?: ImageOrDiagram[]; diagrams?: ImageOrDiagram[]; examples?: Example[] };
export type Review = { state: "closed" | "unreviewed"; note?: RichText };
export type DocPayload = { axioms: { text: RichText; sub?: RichText[] }[]; purpose: { intro?: RichText; points?: RichText[]; note?: RichText }; reference: Topic[]; review?: { axioms?: Review; purpose?: Review; reference?: Review }; converted?: true };
export type AdrPayload = { date: string; context: RichText; decision: RichText; consequences: RichText[]; affects?: string[]; supersededBy?: string; adrStatus: "accepted" | "proposed" | "superseded" };
export type TermPayload = { def: RichText; aliases?: string[]; proposed?: true };
export type StandardsPayload = { note?: RichText; files: { prefix: string; file: string; governs: RichText; rules: { id: string; section?: string; text: RichText; consumedBy?: string[]; note?: RichText; warning?: RichText }[] }[] };
export type Full = Entry & { paths: string[]; doc?: DocPayload | null; adr?: AdrPayload; term?: TermPayload; standards?: StandardsPayload };

const json = async <T,>(path: string): Promise<T> => { const r = await fetch(path, { cache: "no-store" }); if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`); return r.json() as Promise<T>; };
export const loadEntries = () => json<{ entries: Entry[] }>("/db/entries.json").then((d) => d.entries);
export const loadSkills = () => json<Skills>("/db/skills.json");
export const loadEntry = (id: string) => json<Full>(`/db/${id}.json`);
/** an asset of a doc: its `src` is written relative to db/doc/, as `../assets/<docId>/<file>` */
export const assetUrl = (src: string) => new URL(src, `${location.origin}/db/doc/`).pathname;

export const toApprove = (e: { status: Status }) => e.status !== "approved" && e.status !== "deprecated";
export const deprecated = (e: { status: Status }) => e.status === "deprecated";
