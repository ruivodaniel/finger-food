/**
 * The boards, in the API's memory: a test keeps nothing in the database. A board is its size, its seed and what happened
 * to it; the mines are computed from the seed, never stored. The oldest board leaves when there are too many.
 */

export interface Board {
  id: string;
  size: number;
  seed: number;
  /** one mine in this many cells */
  oneIn: number;
  /** the first cell clicked and the cells around it never hold a mine */
  safe: Set<number>;
  revealed: Set<number>;
  exploded: Set<number>;
  flagged: Set<number>;
}

export interface BoardRepository {
  save(board: Board): void;
  findById(id: string): Board | undefined;
}

const MAX_BOARDS = 20;

export class InMemoryBoardRepository implements BoardRepository {
  private readonly boards = new Map<string, Board>();

  save(board: Board): void {
    this.boards.delete(board.id);
    this.boards.set(board.id, board);
    while (this.boards.size > MAX_BOARDS) {
      const oldest = this.boards.keys().next().value;
      if (oldest === undefined) break;
      this.boards.delete(oldest);
    }
  }

  findById(id: string): Board | undefined {
    return this.boards.get(id);
  }
}
