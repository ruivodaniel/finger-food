/**
 * The minesweeper's state: the board and every cell the API has said something about. THE EXCEPTION, used here because
 * thousands of components need the state at once and one service manages it.
 *
 * A cell is read by its index. The cells are kept in chunks, so a change copies only the chunks it touches and a cell
 * whose state did not change keeps the same object: its component is not drawn again. A cell that was never mentioned is
 * not in the store at all; it is hidden.
 *
 * Read through the selector hooks. Written only through the named mutations, and only by the application service.
 */

import { create } from "zustand";
import type { BoardView, CellChange } from "../../shared/minesweeper.types";

/** what a cell's component reads; undefined: hidden */
export type CellView = { s: "revealed"; n: number } | { s: "exploded" } | { s: "flagged" };

const CHUNK_BITS = 10;
const chunkOf = (i: number) => i >> CHUNK_BITS;

type Chunks = Record<number, Record<number, CellView>>;

interface MinesweeperState {
  board: BoardView | null;
  chunks: Chunks;
  /** a request is on its way: the board waits for the API's answer */
  waiting: boolean;
  setBoard: (board: BoardView, cells: CellChange[]) => void;
  applyChanges: (board: BoardView, changed: CellChange[]) => void;
  setWaiting: (waiting: boolean) => void;
  clearBoard: () => void;
}

const viewOf = (c: CellChange): CellView | undefined =>
  c.s === "revealed" ? { s: "revealed", n: c.n ?? 0 } : c.s === "exploded" ? { s: "exploded" } : c.s === "flagged" ? { s: "flagged" } : undefined;

/** the chunks with the changes in: only a touched chunk is a new object */
function withChanges(chunks: Chunks, changed: CellChange[]): Chunks {
  const next: Chunks = { ...chunks };
  const copied = new Set<number>();
  for (const change of changed) {
    const key = chunkOf(change.i);
    if (!copied.has(key)) { next[key] = { ...next[key] }; copied.add(key); }
    const view = viewOf(change);
    const chunk = next[key] as Record<number, CellView>;
    if (view) chunk[change.i] = view;
    else delete chunk[change.i];
  }
  return next;
}

export const useMinesweeperStore = create<MinesweeperState>()((set) => ({
  board: null,
  chunks: {},
  waiting: false,
  setBoard: (board, cells) => set({ board, chunks: withChanges({}, cells), waiting: false }),
  applyChanges: (board, changed) => set((state) => ({ board, chunks: changed.length ? withChanges(state.chunks, changed) : state.chunks, waiting: false })),
  setWaiting: (waiting) => set({ waiting }),
  clearBoard: () => set({ board: null, chunks: {}, waiting: false }),
}));

/** The selector hooks — what a component binds to. */
export const useCell = (i: number): CellView | undefined => useMinesweeperStore((state) => state.chunks[chunkOf(i)]?.[i]);
export const useBoard = (): BoardView | null => useMinesweeperStore((state) => state.board);
export const useWaiting = (): boolean => useMinesweeperStore((state) => state.waiting);

/** The current value, outside React — what the service reads. */
export const getBoard = (): BoardView | null => useMinesweeperStore.getState().board;
export const isWaiting = (): boolean => useMinesweeperStore.getState().waiting;

/** The named mutations, outside React — what the service calls. */
export const setBoard = (board: BoardView, cells: CellChange[]): void => useMinesweeperStore.getState().setBoard(board, cells);
export const applyChanges = (board: BoardView, changed: CellChange[]): void => useMinesweeperStore.getState().applyChanges(board, changed);
export const setWaiting = (waiting: boolean): void => useMinesweeperStore.getState().setWaiting(waiting);
export const clearBoard = (): void => useMinesweeperStore.getState().clearBoard();
