/**
 * The minesweeper, on the web side. The only writer of the minesweeper store. A component tells it what the person did;
 * it sends that to the API, and sets in the store whatever the API answers. It never works out what a click reveals.
 * Nothing is cached: every answer is state that many components share, so it all goes to the store.
 */

import type { ClickAction, ClickResult } from "../../../shared/minesweeper.types";
import { minesweeperApi } from "../api/minesweeper.api";
import { applyChanges, clearBoard, getBoard, isWaiting, setBoard, setWaiting } from "../../store/minesweeper.store";
import { mounted } from "./mount";

/** told after each answer is set in the store: the page's meter reads it; the service keeps no measure itself */
type AnswerListener = (answer: { changed: number; requestMs: number }) => void;
let onAnswer: AnswerListener | null = null;

const fail = (error: unknown) => {
  setWaiting(false);
  mounted().toast?.error(error instanceof Error ? error.message : "The board did not answer.");
};

async function click(i: number, action: ClickAction): Promise<void> {
  const board = getBoard();
  // one click at a time: the board's next state is the API's to say
  if (!board || isWaiting()) return;
  setWaiting(true);
  const sent = performance.now();
  let result: ClickResult;
  try {
    result = await minesweeperApi.click(board.id, { i, action });
  } catch (error) {
    fail(error);
    return;
  }
  const requestMs = performance.now() - sent;
  applyChanges(result.board, result.changed);
  onAnswer?.({ changed: result.changed.length, requestMs });
}

export const minesweeperService = {
  /** a new board of this size replaces the one in the store */
  newBoard: async (size: number): Promise<void> => {
    setWaiting(true);
    try {
      const { board, cells } = await minesweeperApi.create({ size });
      setBoard(board, cells);
    } catch (error) {
      fail(error);
    }
  },
  reveal: (i: number): Promise<void> => click(i, "reveal"),
  flag: (i: number): Promise<void> => click(i, "flag"),
  leave: (): void => clearBoard(),
  listenToAnswers: (listener: AnswerListener | null): void => { onAnswer = listener; },
};
