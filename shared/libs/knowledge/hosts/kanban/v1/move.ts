// The pure part of the board's reorder: no React, no DOM. The order of the cards array is the order inside every column.
import type { KanbanCard } from "./types";

/** `id` goes to `column`, at `index` among that column's cards (the moved card not counted). An index past the end lands last. */
export function moveCard<C extends KanbanCard>(cards: C[], id: string, column: string, index: number): C[] {
  const card = cards.find((c) => c.id === id);
  if (!card) return cards;
  const rest = cards.filter((c) => c.id !== id);
  const moved = { ...card, column };
  const inColumn = rest.filter((c) => c.column === column);
  const anchor = inColumn[index];
  if (anchor) { const at = rest.indexOf(anchor); return [...rest.slice(0, at), moved, ...rest.slice(at)]; }
  const last = inColumn[inColumn.length - 1];
  if (last) { const at = rest.indexOf(last) + 1; return [...rest.slice(0, at), moved, ...rest.slice(at)]; }
  return [...rest, moved];
}
