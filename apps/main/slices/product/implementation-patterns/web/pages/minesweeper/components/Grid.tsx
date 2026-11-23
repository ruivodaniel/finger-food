/**
 * The board. The library's VirtualScrollArea mounts only the cells on screen; the grid says how many cells exist and
 * what a cell is. It knows nothing of their state and passes none: a cell scrolled into view mounts and reads its state
 * from the store, so a change made while it was off screen is already there.
 */

import * as React from "react";
import { VirtualScrollArea, type VirtualPosition } from "@libs/web-layouts";
import { Cell } from "./Cell";

/** the side of a cell, in pixels */
const CELL = 24;

export function Grid({ size }: { size: number }): React.ReactElement {
  const renderCell = React.useCallback(({ row, column }: VirtualPosition) => <Cell i={row * size + column} />, [size]);
  return <VirtualScrollArea axis="both" label="Minesweeper board" data-testid="minesweeper-grid" count={{ rows: size, columns: size }} itemSize={{ row: CELL, column: CELL }} renderItem={renderCell} />;
}
