/** What is inside a cell: nothing, the number of mines around it, a mine that exploded, or a flag. A component of its own. */

import * as React from "react";
import { Text } from "@libs/web-components";
import type { CellView } from "../../../store/minesweeper.store";

export const CellContent = React.memo(function CellContent({ cell }: { cell: CellView | undefined }): React.ReactElement | null {
  if (!cell) return null;
  if (cell.s === "exploded") return <Text type="body-small" data-testid="mine">✹</Text>;
  if (cell.s === "flagged") return <Text type="body-small" data-testid="flag">⚑</Text>;
  return cell.n > 0 ? <Text type="body-small">{cell.n}</Text> : null;
});
