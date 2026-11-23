// The board's header: on the left the search, title only and the filter (tags and creation dates); on the right what the reader may change of how the board shows:
// the view (expanded or compact), the tags on or off, the column width. Each group is there only when the board's switch says so.
// The controls are the library's (Input, Checkbox, Button, InputSelect, DatePicker), so the theme draws them; the filter panel keeps its own open and close.
import { useState } from "react";
import { Badge } from "../../../../ui/web/primitives/components/badge/v1";
import { Button } from "../../../../ui/web/primitives/components/button/v1";
import { Checkbox } from "../../../../ui/web/primitives/components/checkbox/v1";
import { Content, Footer, Header } from "../../../../ui/web/primitives/components/parts/v1";
import { DatePicker } from "../../../../ui/web/primitives/components/date-picker/v1";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "../../../../ui/web/primitives/components/dialog/v1";
import { Input } from "../../../../ui/web/primitives/components/input/v1";
import { InputSelect } from "../../../../ui/web/primitives/components/input-select/v1";
import { PickerMenu, type PaletteColor as PickerColor, type Section as PickerSection } from "../../../../ui/web/primitives/components/color-picker/v2";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../ui/web/primitives/components/popover/v1";
import { Switch } from "../../../../ui/web/primitives/components/switch/v1";
import { Stack } from "../../../../ui/web/primitives/components/stack/v1";
import { isActive, NO_FILTER, type KanbanFilter } from "./filter";
import { tagStyle, tagStyleOn } from "./palette";

export type Look = { view: "expanded" | "compact"; showTags: boolean; columnWidth: "narrow" | "regular" | "wide" };
export type HeaderParts = { search: boolean; filter: boolean; view: boolean; tags: boolean; width: boolean };

const toDate = (v: string): Date | null => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v); return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null; };
const toIso = (d: Date | null) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "");

/** the tags window: show the tags on the cards or not, and the colour of each tag, picked with the library's colour picker; the reader may add colours of their own to it */
function TagsWindow({ open, onOpenChange, tags, tagColors, setTagColors, sections, look, setLook }: { open: boolean; onOpenChange: (o: boolean) => void; tags: string[]; tagColors: Record<string, string>; setTagColors: (c: Record<string, string>) => void; sections: PickerSection[]; look: Look; setLook: (l: Look) => void }) {
  const [mine, setMine] = useState<PickerColor[]>([]);
  const all: PickerSection[] = [...sections, { id: "mine", label: "my colours", colors: mine, addable: true, onAdd: (hex: string) => setMine((m) => (m.some((c) => c.value.toLowerCase() === hex.toLowerCase()) ? m : [...m, { value: hex }])), onRemove: (hex: string) => setMine((m) => m.filter((c) => c.value.toLowerCase() !== hex.toLowerCase())) }];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent scale="md">
        <Header>
          <DialogTitle>Tags</DialogTitle>
          <DialogDescription>Each tag has its own colour; pick another one for any of them, or make your own.</DialogDescription>
        </Header>
        <Stack dir="col" gap={12} pad={24} style={{ maxHeight: "55vh", overflowY: "auto" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Switch checked={look.showTags} onCheckedChange={(c: boolean) => setLook({ ...look, showTags: c })} /><span element="type--body-small">show the tags on the cards</span></label>
          {tags.length === 0 ? <span element="type--body-small" emphasis="quiet">no tags yet</span> : null}
          {tags.map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span element="type--body-small">{t}</span>
              <PickerMenu trigger={{ icon: "circle", solid: true }} label={`colour of ${t}`} sections={all} value={tagColors[t] ?? null} onChange={(v) => { if (typeof v === "string") setTagColors({ ...tagColors, [t]: v }); }} />
            </div>
          ))}
        </Stack>
        <Footer>
          <DialogClose asChild><Button emphasis="secondary">Close</Button></DialogClose>
        </Footer>
      </DialogContent>
    </Dialog>
  );
}

export function KanbanHeader({ filter, setFilter, tags, tagColors, setTagColors, tagSections, look, setLook, parts }: { filter: KanbanFilter; setFilter: (f: KanbanFilter) => void; tags: string[]; tagColors: Record<string, string>; setTagColors: (c: Record<string, string>) => void; tagSections: PickerSection[]; look: Look; setLook: (l: Look) => void; parts: HeaderParts }) {
  const [open, setOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const n = filter.tags.length + (filter.from || filter.to ? 1 : 0);
  return (
    <div concept="kanban-header" style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0 12px", flexWrap: "wrap" }}>
      {parts.search ? <>
        <div style={{ width: 260 }}><Input type="search" showClear value={filter.q} onChange={(q: string) => setFilter({ ...filter, q })} placeholder="search" /></div>
        {filter.q ? <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", whiteSpace: "nowrap" }}><Checkbox scale="sm" checked={filter.titleOnly} onCheckedChange={(c) => setFilter({ ...filter, titleOnly: c === true })} /><span element="type--body-extra-small">title only</span></label> : null}
      </> : null}
      {parts.filter ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild><Button emphasis={n ? "primary" : "tertiary"} scale="sm" title="filter by tag and creation date">{`filter${n ? ` · ${n}` : ""}`}</Button></PopoverTrigger>
          <PopoverContent align="start" style={{ width: 340 }}>
            <Content>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div element="type--body-extra-small" emphasis="quiet" style={{ letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 6 }}>created</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <DatePicker mode="single" value={toDate(filter.from)} onChange={(d) => setFilter({ ...filter, from: toIso(d) })} placeholder="from" />
                  <DatePicker mode="single" value={toDate(filter.to)} onChange={(d) => setFilter({ ...filter, to: toIso(d) })} placeholder="to" />
                </div>
              </div>
              <div>
                <div element="type--body-extra-small" emphasis="quiet" style={{ letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 6 }}>tags</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 220, overflowY: "auto" }}>
                  {tags.length === 0 && <span element="type--body-small" emphasis="quiet">no tags yet</span>}
                  {tags.map((t) => {
                    const on = filter.tags.includes(t), c = tagColors[t] ?? "var(--primary)";
                    const toggle = () => setFilter({ ...filter, tags: on ? filter.tags.filter((x) => x !== t) : [...filter.tags, t] });
                    return <span key={t} role="button" tabIndex={0} aria-pressed={on} style={{ cursor: "pointer" }} onClick={toggle} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}><Badge scale="sm" style={on ? tagStyleOn(c) : tagStyle(c)}>{t}</Badge></span>;
                  })}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Button emphasis="tertiary" scale="sm" onClick={() => setFilter({ ...filter, tags: [], from: "", to: "" })} disabled={!n}>clear</Button>
                <Button emphasis="secondary" scale="sm" onClick={() => setOpen(false)}>close</Button>
              </div>
            </div>
            </Content>
          </PopoverContent>
        </Popover>
      ) : null}
      {(parts.search || parts.filter) && isActive(filter) ? <Button emphasis="quiet" scale="sm" onClick={() => setFilter({ ...NO_FILTER, titleOnly: filter.titleOnly })}>clear all</Button> : null}
      <span style={{ flex: 1 }} />
      {parts.view ? <span style={{ display: "inline-flex", gap: 4 }}>{(["expanded", "compact"] as const).map((x) => <Button key={x} emphasis={look.view === x ? "secondary" : "tertiary"} scale="sm" onClick={() => setLook({ ...look, view: x })}>{x}</Button>)}</span> : null}
      {parts.tags ? <><Button emphasis={look.showTags ? "secondary" : "tertiary"} scale="sm" onClick={() => setTagsOpen(true)} title="the tags: show them, and pick their colours">tags</Button><TagsWindow open={tagsOpen} onOpenChange={setTagsOpen} tags={tags} tagColors={tagColors} setTagColors={setTagColors} sections={tagSections} look={look} setLook={setLook} /></> : null}
      {parts.width ? <div style={{ width: 120 }}><InputSelect options={(["narrow", "regular", "wide"] as const).map((x) => ({ value: x, label: x }))} value={look.columnWidth} clearable={false} onChange={((v: string | null) => { if (v) setLook({ ...look, columnWidth: v as Look["columnWidth"] }); }) as never} /></div> : null}
    </div>
  );
}
