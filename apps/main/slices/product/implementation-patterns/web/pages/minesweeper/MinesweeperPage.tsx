/**
 * MinesweeperPage — /implementation-patterns/minesweeper. The implementation pattern of the slice store, the exception: thousands of
 * components need the same state at once, and one service manages it.
 *
 * The person clicks a cell. The cell tells the application service. The service asks the API, and the API decides what
 * is revealed and what explodes. The service sets the answer in the store. Every mounted cell that changed is drawn
 * again; no other cell is. Left click reveals, right click flags.
 */

import * as React from "react";
import { Button, Card, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { BOARD_SIZES } from "../../../shared/minesweeper.types";
import { minesweeperService } from "../../services/application/minesweeper.service";
import { useBoard, useWaiting } from "../../store/minesweeper.store";
import { Grid } from "./components/Grid";
import { Meter } from "./components/Meter";
import { measureAnswer } from "./helpers/meter";

export function MinesweeperPage(): React.ReactElement {
  const board = useBoard();
  const waiting = useWaiting();

  React.useEffect(() => {
    minesweeperService.listenToAnswers(measureAnswer);
    void minesweeperService.newBoard(BOARD_SIZES[0]);
    return () => { minesweeperService.listenToAnswers(null); minesweeperService.leave(); };
  }, []);

  return (
    <Stack dir="col" scale="lg" data-testid="minesweeper-page" className="w-full">
      <Text type="body-small" emphasis="quiet">
        The slice store, at a size no page reaches. The API decides what a click reveals; the cells only show the store.
        Change the size: the readings of a click should stay the same.
      </Text>
      <Stack dir="row" align="center" scale="md" wrap>
        {BOARD_SIZES.map((size) => (
          <Button key={size} scale="sm" emphasis={board?.size === size ? "primary" : "secondary"} disabled={waiting} data-testid={`size-${size}`} onClick={() => void minesweeperService.newBoard(size)}>
            {size} × {size}
          </Button>
        ))}
        {board ? <Text type="body-small" emphasis="quiet">{(board.size * board.size).toLocaleString("en-GB")} cells · {board.mines.toLocaleString("en-GB")} mines · {board.revealed.toLocaleString("en-GB")} revealed · {board.exploded.toLocaleString("en-GB")} exploded</Text> : null}
      </Stack>
      <Meter />
      {/* the card has the height; the board fills it and scrolls inside */}
      <Card className="h-[70vh]">{board ? <Grid key={board.id} size={board.size} /> : null}</Card>
    </Stack>
  );
}
