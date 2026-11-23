import { describe, expect, it } from "vitest";
import { InMemoryBoardRepository } from "../repositories/board.repository";
import { MinesweeperService } from "./minesweeper.service";

const make = (seed = 7) => {
  let n = 0;
  return new MinesweeperService({
    boards: new InMemoryBoardRepository(),
    createId: () => `board-${(n += 1)}`,
    createSeed: () => seed,
    errors: { notFound: (m) => new Error(m), badRequest: (m) => new Error(m) },
  });
};

describe("MinesweeperService", () => {
  it("the first click is never a mine and reveals at least its cell", () => {
    const service = make();
    const { board } = service.create(50);
    const result = service.click(board.id, { i: 1275, action: "reveal" });
    expect(result.changed.some((c) => c.i === 1275 && c.s === "revealed")).toBe(true);
    expect(result.changed.every((c) => c.s === "revealed")).toBe(true);
    expect(result.board.revealed).toBe(result.changed.length);
  });

  it("a click on a revealed cell changes nothing", () => {
    const service = make();
    const { board } = service.create(50);
    service.click(board.id, { i: 0, action: "reveal" });
    expect(service.click(board.id, { i: 0, action: "reveal" }).changed).toEqual([]);
  });

  it("a flag goes on and off, and a flagged cell is not revealed by a click", () => {
    const service = make();
    const { board } = service.create(50);
    expect(service.click(board.id, { i: 9, action: "flag" }).changed).toEqual([{ i: 9, s: "flagged" }]);
    expect(service.click(board.id, { i: 9, action: "reveal" }).changed).toEqual([]);
    expect(service.click(board.id, { i: 9, action: "flag" }).changed).toEqual([{ i: 9, s: "hidden" }]);
  });

  it("a mine explodes and its blast reveals cells around it", () => {
    const service = make();
    const { board } = service.create(50);
    service.click(board.id, { i: 0, action: "reveal" });
    // every cell is clicked until one explodes: the web could not have known which
    let exploded: number | undefined;
    for (let i = 0; i < 2500 && exploded === undefined; i += 1) {
      const { changed } = service.click(board.id, { i, action: "reveal" });
      if (changed.some((c) => c.s === "exploded")) exploded = i;
    }
    expect(exploded).toBeDefined();
    const state = service.get(board.id);
    expect(state.board.exploded).toBeGreaterThan(0);
    expect(state.cells.length).toBe(state.board.revealed + state.board.exploded);
  });

  it("what the board says it holds is what a reload reads", () => {
    const service = make();
    const { board } = service.create(200);
    const { changed } = service.click(board.id, { i: 20100, action: "reveal" });
    expect(service.get(board.id).cells.length).toBe(changed.length);
  });

  it("an unknown board is not found", () => {
    expect(() => make().get("nope")).toThrow();
  });
});
