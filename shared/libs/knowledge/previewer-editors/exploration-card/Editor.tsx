// The canvas card's editor: the fields of a card, nothing else. Pure: a draft in, a draft out.
import { IconPicker, Input, InputSelect, PickerMenu, Textarea } from "@libs/web-components";

/** the ten colours a card may take, as the picker offers them: the theme's token behind each name */
const CARD_PALETTE = [{ id: "canvas", label: "canvas", colors: CANVAS_COLORS.map((c) => ({ value: `var(--color-${c})`, name: c })) }];
const tokenOf = (v: string | null): CanvasColor | undefined => CANVAS_COLORS.find((c) => v === `var(--color-${c})` || v === c);
import { Stack } from "@libs/web-layouts";
import type { EditorProps } from "../editing/types";
import { CANVAS_COLORS, type CanvasCard, type CanvasColor } from "./types";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <Stack dir="col" scale="2xs"><span element="type--body-small" emphasis="quiet">{label}</span>{children}</Stack>;

export function CardEditor({ draft, onChange }: EditorProps<CanvasCard>) {
  const set = <K extends keyof CanvasCard>(k: K, v: CanvasCard[K]) => onChange({ ...draft, [k]: v });
  return (
    <>
      <Field label="title"><Input value={draft.title} onChange={(v) => set("title", v)} /></Field>
      <Field label="description"><Textarea minRows={2} value={draft.description ?? ""} onChange={(v) => set("description", v || undefined)} /></Field>
      <Field label="note"><Textarea minRows={4} value={draft.note ?? ""} onChange={(v) => set("note", v || undefined)} /></Field>
      <Field label="colour"><PickerMenu sections={CARD_PALETTE} value={draft.color ? `var(--color-${draft.color})` : null} onChange={(v) => set("color", tokenOf(typeof v === "string" ? v : null))} placeholder="none" /></Field>
      {/* the picture: an icon of the registry, or an image by url; one or the other, as the card draws it */}
      <Field label="picture"><InputSelect options={[{ value: "icon", label: "icon" }, { value: "image", label: "image" }, { value: "none", label: "none" }]} value={draft.image ? "image" : draft.icon ? "icon" : "none"} onChange={(v: string | null) => { const k = v ?? "none"; onChange({ ...draft, icon: k === "icon" ? (draft.icon ?? "component") : undefined, image: k === "image" ? (draft.image ?? "") : undefined }); }} /></Field>
      {draft.image !== undefined ? <Field label="image url"><Input value={draft.image} onChange={(v) => set("image", v)} placeholder="/slice-design-files/…" /></Field> : null}
      {draft.icon !== undefined && draft.image === undefined ? <Field label="icon"><IconPicker value={draft.icon ? { library: "library", name: draft.icon } : null} onChange={(v) => set("icon", (v?.name || "component") as CanvasCard["icon"])} /></Field> : null}
    </>
  );
}
