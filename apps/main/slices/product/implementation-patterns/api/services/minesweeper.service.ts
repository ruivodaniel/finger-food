/**
 * The minesweeper's rules. A click on a clear cell reveals it, and the clear area around it when no mine touches it. A
 * click on a mine explodes it: the blast reveals every cell near it, and a mine inside the blast explodes too. The web
 * sends the click and is told what changed; it cannot work the answer out, because it never holds the mines.
 */

import type { BoardView, BoardWithCells, CellChange, ClickInput, ClickResult } from "../../shared/minesweeper.types";
import type { Board, BoardRepository } from "../repositories/board.repository";
import type { ModuleErrors } from "../shared/module-errors";

const ONE_MINE_IN = 7;
const BLAST_RADIUS = 2;
/** a click never answers with more cells than this: the rest stay hidden until clicked */
const MAX_CHANGED = 20_000;

export interface MinesweeperServiceDeps {
  boards: BoardRepository;
  createId: () => string;
  errors: Pick<ModuleErrors, "notFound" | "badRequest">;
  /** the seed of a new board; a test passes a fixed one */
  createSeed?: () => number;
}

export class MinesweeperService {
  constructor(private readonly deps: MinesweeperServiceDeps) {}

  create(size: number): BoardWithCells {
    const board: Board = {
      id: this.deps.createId(),
      size,
      seed: (this.deps.createSeed ?? (() => Math.floor(Math.random() * 2 ** 31)))(),
      oneIn: ONE_MINE_IN,
      safe: new Set(),
      revealed: new Set(),
      exploded: new Set(),
      flagged: new Set(),
    };
    this.deps.boards.save(board);
    return { board: this.view(board), cells: [] };
  }

  get(boardId: string): BoardWithCells {
    const board = this.find(boardId);
    const cells: CellChange[] = [];
    for (const i of board.revealed) cells.push({ i, s: "revealed", n: this.around(board, i) });
    for (const i of board.exploded) cells.push({ i, s: "exploded" });
    for (const i of board.flagged) cells.push({ i, s: "flagged" });
    return { board: this.view(board), cells };
  }

  click(boardId: string, { i, action }: ClickInput): ClickResult {
    const board = this.find(boardId);
    if (!Number.isInteger(i) || i < 0 || i >= board.size * board.size) throw this.deps.errors.badRequest("no such cell");
    const changed = action === "flag" ? this.flag(board, i) : this.reveal(board, i);
    return { board: this.view(board), changed };
  }

  private flag(board: Board, i: number): CellChange[] {
    if (board.revealed.has(i) || board.exploded.has(i)) return [];
    if (board.flagged.delete(i)) return [{ i, s: "hidden" }];
    board.flagged.add(i);
    return [{ i, s: "flagged" }];
  }

  private reveal(board: Board, i: number): CellChange[] {
    if (board.revealed.has(i) || board.exploded.has(i) || board.flagged.has(i)) return [];
    if (board.revealed.size === 0 && board.exploded.size === 0) {
      board.safe.add(i);
      for (const n of this.neighbours(board, i, 1)) board.safe.add(n);
    }
    return this.isMine(board, i) ? this.explode(board, i) : this.clear(board, i);
  }

  /** the clear cell and, while no mine touches a cell, the cells around it */
  private clear(board: Board, start: number): CellChange[] {
    const changed: CellChange[] = [];
    const queue = [start];
    const seen = new Set(queue);
    while (queue.length && changed.length < MAX_CHANGED) {
      const i = queue.pop() as number;
      if (board.revealed.has(i) || board.exploded.has(i) || board.flagged.has(i)) continue;
      const n = this.around(board, i);
      board.revealed.add(i);
      changed.push({ i, s: "revealed", n });
      if (n > 0) continue;
      for (const next of this.neighbours(board, i, 1)) {
        if (!seen.has(next)) { seen.add(next); queue.push(next); }
      }
    }
    return changed;
  }

  /** the mine explodes; its blast reveals the cells near it, and a mine among them explodes in turn */
  private explode(board: Board, start: number): CellChange[] {
    const changed: CellChange[] = [];
    const queue = [start];
    const seen = new Set(queue);
    while (queue.length && changed.length < MAX_CHANGED) {
      const mine = queue.pop() as number;
      if (board.exploded.has(mine)) continue;
      board.flagged.delete(mine);
      board.exploded.add(mine);
      changed.push({ i: mine, s: "exploded" });
      for (const i of this.neighbours(board, mine, BLAST_RADIUS)) {
        if (board.revealed.has(i) || board.exploded.has(i)) continue;
        if (this.isMine(board, i)) {
          if (!seen.has(i)) { seen.add(i); queue.push(i); }
          continue;
        }
        board.flagged.delete(i);
        board.revealed.add(i);
        changed.push({ i, s: "revealed", n: this.around(board, i) });
      }
    }
    return changed;
  }

  private find(boardId: string): Board {
    const board = this.deps.boards.findById(boardId);
    if (!board) throw this.deps.errors.notFound("no such board: it may have been dropped from memory");
    return board;
  }

  private view(board: Board): BoardView {
    return {
      id: board.id,
      size: board.size,
      mines: Math.round((board.size * board.size) / board.oneIn),
      revealed: board.revealed.size,
      exploded: board.exploded.size,
    };
  }

  /** the same answer for the same board and cell, with no table of mines: a hash of the seed and the index */
  private isMine(board: Board, i: number): boolean {
    if (board.safe.has(i)) return false;
    let h = (board.seed ^ Math.imul(i + 1, 0x9e3779b1)) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) % board.oneIn === 0;
  }

  private around(board: Board, i: number): number {
    let n = 0;
    for (const next of this.neighbours(board, i, 1)) if (this.isMine(board, next)) n += 1;
    return n;
  }

  private neighbours(board: Board, i: number, radius: number): number[] {
    const { size } = board;
    const x = i % size;
    const y = (i - x) / size;
    const out: number[] = [];
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
        out.push(ny * size + nx);
      }
    }
    return out;
  }
}
