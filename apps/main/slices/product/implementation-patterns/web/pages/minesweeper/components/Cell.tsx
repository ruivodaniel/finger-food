/**
 * One cell of the board. Given its index, nothing about its state and nothing about where it sits. It is bound to its own cell in the
 * store through the selector hook, so it is drawn again only when that cell changes. It never changes the state: a click
 * tells the service, and the cell changes when the store does, like every other cell.
 */

import * as React from "react";
import { Tile } from "@libs/web-components";
import { minesweeperService } from "../../../services/application/minesweeper.service";
import { useCell } from "../../../store/minesweeper.store";
import { countDraw } from "../helpers/meter";
import { CellContent } from "./CellContent";

const CONCEPT = { hidden: "implementation-patterns-mine-cell", revealed: "implementation-patterns-mine-cell implementation-patterns-mine-cell-revealed", exploded: "implementation-patterns-mine-cell implementation-patterns-mine-cell-exploded", flagged: "implementation-patterns-mine-cell implementation-patterns-mine-cell-flagged" } as const;

export const Cell = React.memo(function Cell({ i }: { i: number }): React.ReactElement {
  const cell = useCell(i);
  countDraw();
  return (
    <Tile
      concept={CONCEPT[cell?.s ?? "hidden"]}
      data-testid="cell"
      data-state={cell?.s ?? "hidden"}
      className="items-center justify-center"
      onClick={() => void minesweeperService.reveal(i)}
      onContextMenu={(event) => { event.preventDefault(); void minesweeperService.flag(i); }}
    >
      <CellContent cell={cell} />
    </Tile>
  );
});
