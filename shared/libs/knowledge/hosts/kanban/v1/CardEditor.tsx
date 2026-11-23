// The editor of a plain card: pure, a draft in and out (the editing contract); the window around it and what saving does are the consumer's. The fields the application's kanban tab gave a card:
// its stage (the board's columns, by `lookups`), the title, the description, tags (the board's tags, by `lookups`; a new one is created from what is typed), the source, links and images.
import { useState } from "react";
import { Button } from "../../../../ui/web/primitives/components/button/v1";
import { Input } from "../../../../ui/web/primitives/components/input/v1";
import { InputSelect } from "../../../../ui/web/primitives/components/input-select/v1";
import { Textarea } from "../../../../ui/web/primitives/components/textarea/v1";
import { Stack } from "../../../../ui/web/primitives/components/stack/v1";
import { Field } from "../../../previewer-editors/editing/fields";
import type { EditorProps } from "../../../previewer-editors/editing/types";
import type { KanbanCard, KanbanColumn } from "./types";

export function KanbanCardEditor({ draft, onChange, lookups }: EditorProps<KanbanCard, { columns: KanbanColumn[]; tags?: string[] }>) {
  const patch = (p: Partial<KanbanCard>) => onChange({ ...draft, ...p });
  const [image, setImage] = useState("");
  const links = draft.links ?? [], images = draft.images ?? [], tags = draft.tags ?? [];
  const setLink = (i: number, p: Partial<{ label: string; url: string }>) => patch({ links: links.map((l, j) => (j === i ? { ...l, ...p } : l)) });
  const tagOptions = [...new Set([...(lookups?.tags ?? []), ...tags])].sort().map((t) => ({ value: t, label: t }));
  return (
    <Stack dir="col" gap={14}>
      {lookups?.columns ? <Field label="stage"><InputSelect options={lookups.columns.map((c) => ({ value: c.id, label: c.name }))} value={draft.column} clearable={false} onChange={((v: string | null) => { if (v) patch({ column: v }); }) as never} /></Field> : null}
      <Field label="title"><Input autoFocus value={draft.title} onChange={(title: string) => patch({ title })} /></Field>
      <Field label="description"><Textarea rows={5} value={draft.text ?? ""} onChange={(text: string) => patch({ text })} /></Field>
      <Field label="tags"><InputSelect multiple search="as-input" creatable options={tagOptions} value={tags} onChange={(v: string[]) => patch({ tags: v })} placeholder="pick or create a tag" /></Field>
      <Field label="source"><Input value={draft.from ?? ""} onChange={(from: string) => patch({ from })} placeholder="where it comes from" /></Field>
      <Field label="links">
        <Stack dir="col" gap={6}>
          {links.map((l, i) => (
            <Stack key={i} dir="row" gap={6} align="center">
              <div style={{ width: 160 }}><Input value={l.label} onChange={(label: string) => setLink(i, { label })} placeholder="label" /></div>
              <div style={{ flex: 1 }}><Input value={l.url} onChange={(url: string) => setLink(i, { url })} placeholder="https://…" /></div>
              <Button emphasis="tertiary" scale="xs" onClick={() => window.open(l.url, "_blank", "noreferrer")} disabled={!l.url}>open</Button>
              <Button emphasis="tertiary" scale="xs" onClick={() => patch({ links: links.filter((_, j) => j !== i) })}>remove</Button>
            </Stack>
          ))}
          <div><Button emphasis="tertiary" scale="sm" startIcon="add" onClick={() => patch({ links: [...links, { label: "", url: "" }] })}>link</Button></div>
        </Stack>
      </Field>
      <Field label="images">
        <Stack dir="col" gap={6}>
          <Stack dir="row" gap={8} style={{ flexWrap: "wrap" }}>
            {images.map((src, i) => (
              <div key={src + i} style={{ position: "relative" }}>
                <img src={src} alt="" style={{ display: "block", height: 100, maxWidth: 200, objectFit: "cover" }} />
                <div style={{ position: "absolute", top: 2, right: 2 }}><Button emphasis="secondary" scale="xs" onClick={() => patch({ images: images.filter((_, j) => j !== i) })} title="remove">×</Button></div>
              </div>
            ))}
          </Stack>
          <Stack dir="row" gap={6} align="center">
            <div style={{ flex: 1 }} onKeyDown={(e) => { if (e.key === "Enter" && image.trim()) { e.preventDefault(); patch({ images: [...images, image.trim()] }); setImage(""); } }}><Input value={image} onChange={setImage} placeholder="an image address, Enter" /></div>
          </Stack>
        </Stack>
      </Field>
    </Stack>
  );
}
