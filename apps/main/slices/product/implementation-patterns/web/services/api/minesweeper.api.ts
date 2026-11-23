import type { BoardWithCells, ClickInput, ClickResult, CreateBoardInput } from "../../../shared/minesweeper.types";
import { clientUrl, http } from "./http";

const id = (boardId: string) => encodeURIComponent(boardId);

export const minesweeperApi = {
  create: (input: CreateBoardInput): Promise<BoardWithCells> =>
    http().request(clientUrl("/implementation-patterns/minesweeper/boards"), { method: "POST", body: JSON.stringify(input) }),
  get: (boardId: string): Promise<BoardWithCells> => http().request(clientUrl(`/implementation-patterns/minesweeper/boards/${id(boardId)}`)),
  click: (boardId: string, input: ClickInput): Promise<ClickResult> =>
    http().request(clientUrl(`/implementation-patterns/minesweeper/boards/${id(boardId)}/clicks`), { method: "POST", body: JSON.stringify(input) }),
};
