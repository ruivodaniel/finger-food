// The exploration's editor: pure, a draft in, a draft out. What the sidecar holds and a person sets: the title, whether it is a spike, the skin it runs in, its tags.
// The name (the folder), the version and the dates are the tool's: shown, not changed here.
import { Input, InputSelect } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { EditorProps } from "../editing/types";
import { Field, Grid } from "../editing/fields";
import type { Exploration } from "./types";
import type { ExplorationLookups } from "./options";

export function ExplorationEditor({ draft, onChange, lookups }: EditorProps<Exploration, ExplorationLookups>) {
  const set = <K extends keyof Exploration>(k: K, v: Exploration[K]) => onChange({ ...draft, [k]: v });
  const tags = [...new Set([...(lookups?.tags ?? []), ...(draft.tags ?? [])])].sort();
  return (
    <Stack dir="col" scale="md">
      <Field label="title"><Input className="w-full" value={draft.title} onChange={(v) => set("title", v)} /></Field>
      <Grid cols={3}>
        <Field label="name"><Input className="w-full" value={draft.name} disabled onChange={() => undefined} /></Field>
        <Field label="kind"><InputSelect options={[{ value: "exploration", label: "exploration" }, { value: "spike", label: "spike" }]} value={draft.spike ? "spike" : "exploration"} clearable={false} onChange={(v: string | null) => set("spike", v === "spike")} /></Field>
        <Field label="skin"><InputSelect options={[{ value: "tool", label: "tool" }, { value: "own", label: "own" }]} value={draft.skin} clearable={false} onChange={(v: string | null) => set("skin", (v as Exploration["skin"]) ?? "tool")} /></Field>
      </Grid>
      <Field label="tags"><InputSelect multiple search="as-input" options={tags.map((t) => ({ value: t, label: t }))} value={draft.tags ?? []} onChange={(v: string[]) => set("tags", v)} placeholder="none" /></Field>
      <span element="type--body-small" emphasis="quiet">latest version {draft.version}{draft.slice ? ` · slice ${draft.slice}` : ""}</span>
    </Stack>
  );
}
