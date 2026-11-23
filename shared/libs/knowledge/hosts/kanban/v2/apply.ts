// The board after an event: for a consumer that only keeps the board and gives it back as `data`. An event that is not about the cards (a card opened, a column
// folded, the look, the colours of the tags) gives the same board back.
import type { Kanban, KanbanCard, KanbanEvent } from "./types";
import { moveCard } from "./move";

export function apply(d: Kanban, e: KanbanEvent): Kanban {
  switch (e.type) {
    case "card-moved": return { ...d, cards: moveCard(d.cards, e.id, e.column, e.index) };
    case "card-added": {
      // from the plus: last in the column; from a double click on the free space: where it was, the cards after it pushed down
      const added: KanbanCard[] = [...d.cards, { id: e.id, column: e.column, title: "New card", createdAt: new Date().toISOString() }];
      return { ...d, cards: e.index === undefined ? added : moveCard(added, e.id, e.column, e.index) };
    }
    default: return d;
  }
}
