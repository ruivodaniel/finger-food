// The canvas edge label's editor: what a connector says. Pure: a draft in, a draft out. The line itself (its ends, its kind) is the diagram's.
import { Input } from "../../../../../../ui/web/primitives/components/input/v1";
import { Textarea } from "../../../../../../ui/web/primitives/components/textarea/v1";
import { Stack } from "../../../../../../ui/web/primitives/components/stack/v1";
import type { EditorProps } from "../../../../previewer-editors/editing/types";
import { Field } from "../../../../previewer-editors/editing/fields";
import type { Label as CanvasEdge } from "../../document";

export function EdgeLabelEditor({ draft, onChange }: EditorProps<CanvasEdge>) {
  const set = <K extends keyof CanvasEdge>(k: K, v: CanvasEdge[K]) => onChange({ ...draft, [k]: v || undefined });
  return (
    <Stack dir="col" gap={12}>
      <Field label="title"><Input className="w-full" value={draft.title ?? ""} onChange={(v) => set("title", v)} placeholder="what the connector says" /></Field>
      <Field label="description"><Textarea minRows={2} value={draft.description ?? ""} onChange={(v) => set("description", v)} /></Field>
      <Field label="note"><Textarea minRows={3} value={draft.note ?? ""} onChange={(v) => set("note", v)} /></Field>
    </Stack>
  );
}
