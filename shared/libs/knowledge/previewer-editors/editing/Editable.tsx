// The edit shell: wraps a previewer's body; on hover the same chrome as the ui snapshot previewer, inside at the top right, with one button: edit. It shows only when the
// previewer's `editable` hover switch is on and the consumer gave an `edit`. Click opens the sheet with the entity's editor. A fixture says nothing; a live entity
// gets a warning band right above the footer (Daniel, 24 Oct).
import { useContext, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Badge, Button, Icon, Sheet, SheetContent, SheetDescription, Footer, Header, SheetTitle, SheetClose } from "@libs/web-components";
import { ScrollArea, Stack } from "@libs/web-layouts";
import type { Edit, EditorProps } from "./types";
import { EditHost } from "./EditHost";

export function Editable<D, L = unknown, A = unknown>({ edit, enabled = true, block = false, openOnDoubleClick = true, data, Editor, children }: { edit?: Edit<D, L, A>; /** a double click opens the sheet too (off where the double click means something else, as typing a connector's label) */ openOnDoubleClick?: boolean; /** the previewer's `editable` hover switch */ enabled?: boolean; /** the previewer fills its line (a list item, a card at fill width): the shell does too */ block?: boolean; data: D; Editor: ComponentType<EditorProps<D, L, A>>; children: ReactNode }) {
  const host = useContext(EditHost);
  const [own, setOwn] = useState(false);
  const open = host ? host.open : own;
  const setOpen = host ? host.setOpen : setOwn;
  const has = !!edit && (host ? true : enabled);
  useEffect(() => { host?.register(has); }, [has]);   // eslint-disable-line react-hooks/exhaustive-deps
  const [draft, setDraft] = useState<D>(data);
  useEffect(() => { if (open) setDraft(data); }, [open]);   // eslint-disable-line react-hooks/exhaustive-deps
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(false);
  if (!edit || (!host && !enabled)) return <>{children}</>;
  const live = edit.source === "live";
  const start = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); setDraft(data); setOpen(true); };
  const submit = async () => { setBusy(true); try { await edit.onSubmit(draft); setOpen(false); } finally { setBusy(false); } };
  return (
    <div style={{ position: "relative", display: block ? "flex" : "inline-flex", width: block ? "100%" : undefined }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onDoubleClick={openOnDoubleClick && !host ? start : undefined}>
      {children}
      {!host && (hover || open) ? (
        <Stack element="overlay--popover" dir="row" className="nodrag nopan" concept="knowledge-edit-button" onMouseDown={(e) => e.stopPropagation()}>
          <Button buttonType="icon" startIcon="edit" emphasis="tertiary" scale="xs" aria-label={`edit ${edit.kind ?? ""}`.trim()} data-testid="edit-button" onClick={start} />
        </Stack>
      ) : null}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" scale="md" style={edit.size === "lg" ? { maxWidth: 560 } : undefined} status={live ? "warning" : undefined} onClick={(e) => e.stopPropagation()}>
          <Header><Stack dir="row" align="center" justify="between"><Stack dir="col" scale="2xs"><SheetTitle><span element="type--heading3">Edit {edit.kind ?? "entity"}</span></SheetTitle>
            <SheetDescription asChild><div /></SheetDescription></Stack><SheetClose asChild><Button buttonType="icon" startIcon="close" emphasis="secondary" scale="sm" aria-label="Close" data-testid="edit-sheet-close-btn" /></SheetClose></Stack></Header>
          {/* the sheet is a column: header, a body that takes the rest and scrolls, the band and the footer pinned at the bottom */}
          <ScrollArea><Stack dir="col" scale="md">
            <Editor draft={draft} onChange={setDraft} lookups={edit.lookups} actions={edit.actions} />
          </Stack></ScrollArea>
          {live ? (
            <Stack dir="row" scale="sm" align="center" concept="knowledge-edit-warning">
              <Badge status="warning" scale="sm"><Stack dir="row" scale="2xs" align="center"><Icon name="warning" scale="xs" />live entity</Stack></Badge>
              <span element="type--body-small">You are editing the real entity. Every place that shows it will change when you save.</span>
            </Stack>
          ) : null}
          <Footer>
            <Stack dir="row" scale="sm" justify="end">
              <Button emphasis="tertiary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button status={live ? "warning" : undefined} onClick={submit} disabled={busy}>{live ? "Save to the entity" : "Apply"}</Button>
            </Stack>
          </Footer>
        </SheetContent>
      </Sheet>
    </div>
  );
}
