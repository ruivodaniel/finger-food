import { useEffect, useState } from "react";
import { Button, Footer, Header, Sheet, SheetContent, SheetDescription, SheetTitle, SheetClose } from "@libs/web-components";
import { KanbanBoard, KanbanCardEditor, moveCard, type Kanban, type KanbanCard, type KanbanEvent, type KanbanColors, type KanbanLook } from "@libs/knowledge/hosts/kanban";
import fixtures from "../../../../../knowledge/hosts/kanban/v2/fixtures.json";
import { Stack } from "@libs/web-layouts";
import { Instance, instances } from "../../../lib/instance";

/** Pattern: knowledge — the kanban host (v1). Data in, events out: the board never saves. Here the store holds the board, the collapsed columns and the look; each event writes to it (open the store tab:
 *  drag a card and the order changes there). A consumer that wants the look and the collapsed columns kept does exactly this. What opening a card does is the consumer's: here a sheet with the card's editor (the host's KanbanCardEditor,
 *  pure: a draft in and out); save writes the card into the store, delete asks first. The id of the open card is in the store as `opened`. */
/** a consumer that wants a minimal colour schema: three theme colours, for the tags and for the columns. The other boards give no palette and use the board's own (the theme's content colours). */
const MINIMAL: KanbanColors = { default: [{ id: "minimal", label: "colours", colors: [{ value: "var(--color-brand-1)", name: "brand" }, { value: "var(--color-content-green-standard)", name: "green" }, { value: "var(--color-content-orange-standard)", name: "orange" }] }] };
const BOARDS = fixtures as { id: string; name: string; data: Kanban }[];
const board = (id: string) => BOARDS.find((b) => b.id === id)!.data;

/** the measure of the previewer's container around each fixture */
export const measure = "xl";

/** the window over the board: the card as a draft; save writes it, delete asks first, closing writes nothing */
function CardSheet({ card, columns, tags, onSave, onDelete, onClose }: { card: KanbanCard | null; columns: Kanban["columns"]; tags: string[]; onSave: (c: KanbanCard) => void; onDelete: () => void; onClose: () => void }) {
  const [draft, setDraft] = useState<KanbanCard | null>(card);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => { setDraft(card); setConfirming(false); }, [card?.id]);   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Sheet open={!!card} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" scale="md">
        <Header><Stack dir="row" align="center" justify="between"><Stack dir="col" scale="2xs"><SheetTitle><span element="type--heading3">Edit card</span></SheetTitle>
          <SheetDescription asChild><div /></SheetDescription></Stack><SheetClose asChild><Button buttonType="icon" startIcon="close" emphasis="secondary" scale="sm" aria-label="Close" data-testid="kanban-sheet-close-btn" /></SheetClose></Stack></Header>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 24 }}>
          {draft ? <KanbanCardEditor draft={draft} onChange={setDraft} lookups={{ columns, tags }} /> : null}
        </div>
        <Footer>
          {confirming ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", width: "100%" }}>
              <span element="type--body-small">Delete “{draft?.title || "this card"}”? This cannot be undone.</span>
              <span style={{ display: "inline-flex", gap: 8 }}><Button emphasis="tertiary" onClick={() => setConfirming(false)}>Cancel</Button><Button status="error" onClick={onDelete}>Delete</Button></span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", width: "100%" }}>
              <Button emphasis="tertiary" status="error" onClick={() => setConfirming(true)}>Delete</Button>
              <span style={{ display: "inline-flex", gap: 8 }}><Button emphasis="tertiary" onClick={onClose}>Cancel</Button><Button onClick={() => draft && onSave(draft)}>Save</Button></span>
            </div>
          )}
        </Footer>
      </SheetContent>
    </Sheet>
  );
}

function Board({ id, label, colors }: { id: string; label: string; colors?: KanbanColors }) {
  const key = `kanban-${id}`;
  return (
    <Instance id={key} initial={{ data: { board: board(id), collapsed: [], look: {}, tagColors: {}, opened: null } }}>
      {(x) => {
        const d = x.data.board as Kanban;
        const patch = (p: Record<string, unknown>) => instances.patch(key, "data", p);
        const onEvent = (e: KanbanEvent) => {
          if (e.type === "card-moved") patch({ board: { ...d, cards: moveCard(d.cards, e.id, e.column, e.index) } });
          else if (e.type === "card-added") {
            const id = `c${Date.now().toString(36)}`;
            const added = [...d.cards, { id, column: e.column, title: "New card", createdAt: new Date().toISOString() } satisfies KanbanCard];
            // from the plus: last in the column; from a double click on the free space: where it was, the cards after it pushed down
            patch({ board: { ...d, cards: e.index === undefined ? added : moveCard(added, id, e.column, e.index) }, opened: id });
          }
          else if (e.type === "card-opened") patch({ opened: e.id });
          else if (e.type === "column-toggled") { const now = new Set(x.data.collapsed as string[]); if (e.collapsed) now.add(e.column); else now.delete(e.column); patch({ collapsed: [...now] }); }
          else if (e.type === "look-changed") patch({ look: e.look });
          else if (e.type === "tag-colors-changed") patch({ tagColors: e.colors });
        };
        return (
          <Stack dir="col" scale="xs">
            <span element="type--body-small" emphasis="quiet">{label}</span>
            <div style={{ height: 520 }}>
              <KanbanBoard data={d} collapsed={x.data.collapsed as string[]} look={x.data.look as Partial<KanbanLook>} tagColors={x.data.tagColors as Record<string, string>} colors={colors} onEvent={onEvent} />
            </div>
            <CardSheet card={d.cards.find((c) => c.id === x.data.opened) ?? null} columns={d.columns} tags={[...new Set(d.cards.flatMap((c) => c.tags ?? []))].sort()}
              onSave={(c) => patch({ board: { ...d, cards: d.cards.map((k) => (k.id === c.id ? c : k)) }, opened: null })}
              onDelete={() => patch({ board: { ...d, cards: d.cards.filter((k) => k.id !== x.data.opened) }, opened: null })}
              onClose={() => patch({ opened: null })} />
          </Stack>
        );
      }}
    </Instance>
  );
}

export default function KanbanFixture() {
  return (
    <Stack dir="col" scale="2xl">
      <Board id="components" label="five columns, fifty cards: drag a card in or across columns, collapse a column, search and filter in the header, change the view and the column width" />
      <Board id="pipeline" label="a minimal colour schema: this consumer gives its own palette of three theme colours (colors={{ default }}); every other board gives none and uses the board's own, the theme's content colours" colors={MINIMAL} />
      <Board id="small" label="a small board, three columns" />
      <Board id="empty" label="an empty board: drop line at the end of an empty column" />
    </Stack>
  );
}
