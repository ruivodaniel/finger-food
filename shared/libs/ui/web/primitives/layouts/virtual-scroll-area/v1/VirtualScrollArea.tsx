/// <reference path="../../react-overrides.d.ts" />
import * as React from "react";
import { clsx } from "clsx";
import { useVirtualizer } from "@tanstack/react-virtual";
import { positionClasses } from "../../position";

/**
 * VirtualScrollArea — the sibling of ScrollArea for content too large to mount: a scroll window that mounts only the
 * items inside it. ScrollArea is given children; this is given how many items exist, their size, and what to draw for
 * one. The engine is TanStack Virtual; the markup is ours.
 *
 * It fills its container, like ScrollArea, and the container has the size: a window that is not bounded on an axis it
 * virtualises would mount everything, so that is reported as an error in development.
 *
 * The host passes no state through `renderItem`: an item is given where it is, and gets its own state by itself. Keep
 * `renderItem` the same function between renders (useCallback), so items already mounted are not drawn again.
 *
 * First version: items of a fixed size. Not here yet: measured sizes, scroll to an index, stick to the end.
 * Not this component: a table (the rich table virtualises itself), a canvas, heavy items in a normal page.
 *
 * @param axis - "y" (default) | "x" | "both", the same words as ScrollArea
 *
 * ```tsx
 * <Card className="h-[70vh]">
 *   <VirtualScrollArea axis="both" label="Board" count={{ rows: 500, columns: 500 }} itemSize={{ row: 24, column: 24 }} renderItem={renderCell} />
 * </Card>
 * ```
 */

export type VirtualPosition = { row: number; column: number };
export type VirtualRange = { rows: { start: number; end: number }; columns: { start: number; end: number } };

type Own = {
  axis?: "y" | "x" | "both";
  /** how many items exist, not how many are mounted: a number for one axis, rows and columns for both */
  count: number | { rows: number; columns: number };
  /** the size of an item along the axis, in pixels: a number for one axis, row and column for both */
  itemSize: number | { row: number; column: number };
  /** what to draw for the item at this place; on one axis the other index is 0 */
  renderItem: (position: VirtualPosition) => React.ReactNode;
  /** extra items mounted around the window, per side */
  overscan?: number;
  /** told when the items in the window change: a host that fetches by range reads it */
  onRangeChange?: (range: VirtualRange) => void;
  /** names the area for a screen reader */
  label: string;
};
export type VirtualScrollAreaProps = Own & Omit<React.ComponentProps<"div">, keyof Own | "children">;

const axisClasses: Record<NonNullable<Own["axis"]>, string> = {
  y: "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
  x: "min-w-0 overflow-x-auto overflow-y-hidden",
  both: "flex-1 min-h-0 min-w-0 overflow-auto",
};

type SlotProps = { row: number; column: number; x: number; y: number; width: number | undefined; height: number | undefined; role: string; index?: number; render: Own["renderItem"] };
/** one mounted item: placed by transform, drawn again only when its place or the render function changes */
const Slot = React.memo(function Slot({ row, column, x, y, width, height, role, index, render }: SlotProps) {
  return (
    <div
      layout="virtual-scroll-area-item"
      role={role}
      aria-colindex={role === "gridcell" ? column + 1 : undefined}
      aria-posinset={role === "listitem" ? (index ?? 0) + 1 : undefined}
      style={{ position: "absolute", top: 0, left: 0, display: "grid", width: width ?? "100%", height: height ?? "100%", transform: `translate(${x}px, ${y}px)` }}
    >
      {render({ row, column })}
    </div>
  );
});

export function VirtualScrollArea({ axis = "y", count, itemSize, renderItem, overscan = 2, onRangeChange, label, className, position, ...props }: VirtualScrollAreaProps) {
  const window_ = React.useRef<HTMLDivElement>(null);
  const rows = typeof count === "number" ? (axis === "x" ? 1 : count) : count.rows;
  const columns = typeof count === "number" ? (axis === "x" ? count : 1) : count.columns;
  const rowSize = typeof itemSize === "number" ? itemSize : itemSize.row;
  const columnSize = typeof itemSize === "number" ? itemSize : itemSize.column;
  const virtualRows = axis !== "x";
  const virtualColumns = axis !== "y";

  const rowVirtualizer = useVirtualizer({ count: virtualRows ? rows : 0, getScrollElement: () => window_.current, estimateSize: () => rowSize, overscan });
  const columnVirtualizer = useVirtualizer({ count: virtualColumns ? columns : 0, getScrollElement: () => window_.current, estimateSize: () => columnSize, overscan, horizontal: true });

  const rowItems = virtualRows ? rowVirtualizer.getVirtualItems().map((v) => ({ index: v.index, start: v.start })) : [{ index: 0, start: 0 }];
  const columnItems = virtualColumns ? columnVirtualizer.getVirtualItems().map((v) => ({ index: v.index, start: v.start })) : [{ index: 0, start: 0 }];

  const firstRow = rowItems[0]?.index ?? 0, lastRow = rowItems[rowItems.length - 1]?.index ?? -1;
  const firstColumn = columnItems[0]?.index ?? 0, lastColumn = columnItems[columnItems.length - 1]?.index ?? -1;
  const told = React.useRef(onRangeChange);
  told.current = onRangeChange;
  React.useEffect(() => {
    told.current?.({ rows: { start: firstRow, end: lastRow }, columns: { start: firstColumn, end: lastColumn } });
  }, [firstRow, lastRow, firstColumn, lastColumn]);

  // a window as large as everything it holds is not a window: its container gave it no size on that axis
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const el = window_.current;
    if (!el) return;
    const tall = virtualRows && rows * rowSize > window.innerHeight && el.clientHeight >= rows * rowSize;
    const wide = virtualColumns && columns * columnSize > window.innerWidth && el.clientWidth >= columns * columnSize;
    if (tall || wide) console.error(`VirtualScrollArea "${label}": the window is not bounded in ${tall ? "height" : "width"}, so every item is mounted. Give its container a size on that axis.`);
  }, [virtualRows, virtualColumns, rows, columns, rowSize, columnSize, label]);

  const grid = axis === "both";
  const slots = (row: { index: number; start: number }) => columnItems.map((column) => (
    <Slot
      key={grid ? `${row.index}:${column.index}` : virtualRows ? row.index : column.index}
      row={row.index} column={column.index} x={column.start} y={row.start}
      width={virtualColumns ? columnSize : undefined} height={virtualRows ? rowSize : undefined}
      role={grid ? "gridcell" : "listitem"} index={virtualRows ? row.index : column.index} render={renderItem}
    />
  ));

  return (
    <div
      ref={window_}
      layout="virtual-scroll-area"
      position={position}
      role={grid ? "grid" : "list"}
      aria-label={label}
      aria-rowcount={grid ? rows : undefined}
      aria-colcount={grid ? columns : undefined}
      data-mounted={rowItems.length * columnItems.length}
      className={clsx(axisClasses[axis], className, positionClasses(position))}
      {...props}
    >
      <div
        layout="virtual-scroll-area-size"
        style={{ position: "relative", width: virtualColumns ? columnVirtualizer.getTotalSize() : "100%", height: virtualRows ? rowVirtualizer.getTotalSize() : "100%" }}
      >
        {grid
          ? rowItems.map((row) => <div key={row.index} role="row" aria-rowindex={row.index + 1} style={{ display: "contents" }}>{slots(row)}</div>)
          : rowItems.map((row) => slots(row))}
      </div>
    </div>
  );
}
