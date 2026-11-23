// The minesweeper's contract between the API and the web. The API decides everything: where the mines are, what a click
// reveals, what explodes. The web never sees a mine it was not told about.

/** a cell the board has something to say about; a cell never mentioned is hidden */
export type CellState = "revealed" | "exploded" | "flagged" | "hidden";

/** `i` is the cell's index, row by row: y * size + x. `n` is the number of mines around a revealed cell. */
export interface CellChange { i: number; s: CellState; n?: number }

export interface BoardView { id: string; size: number; mines: number; revealed: number; exploded: number }

export interface BoardWithCells { board: BoardView; cells: CellChange[] }

export interface CreateBoardInput { size: number }

export type ClickAction = "reveal" | "flag";
export interface ClickInput { i: number; action: ClickAction }

/** what one click changed: every cell whose state is now different, and the board's counts */
export interface ClickResult { board: BoardView; changed: CellChange[] }

export const BOARD_SIZES = [50, 200, 500] as const;
