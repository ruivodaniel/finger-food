/// <reference path="../../react-overrides.d.ts" />
import * as React from "react";
import { clsx } from "clsx";
import { positionClasses } from "../../position";
import { useReportScroll } from "../../../../lib/scroll-scope";

/**
 * ScrollArea — canonical internal scroll container.
 *
 * Use anywhere a region needs to scroll — inside a card, a sidebar, a dialog,
 * a panel, the main body. Not tied to the page layout tree.
 *
 * Encapsulates the flex + min-height: 0 + overflow pattern that is a constant
 * source of broken layouts when reinvented ad-hoc. Theme controls scrollbar
 * appearance via [layout="scroll-area"].
 *
 * @param axis - "y" (default) | "x" | "both"
 *
 * ```tsx
 * <Card>
 *   <Header>…</Header>
 *   <ScrollArea>
 *     <LongList />
 *   </ScrollArea>
 * </Card>
 * ```
 */

type ScrollAreaProps = React.ComponentProps<"div"> & {
  axis?: "y" | "x" | "both";
};

const axisClasses: Record<NonNullable<ScrollAreaProps["axis"]>, string> = {
  y:    "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
  x:    "min-w-0 overflow-x-auto overflow-y-hidden",
  both: "flex-1 min-h-0 overflow-auto",
};

export function ScrollArea({ axis = "y", className, position, ...props }: ScrollAreaProps) {
  // v2: its own scroll is reported to the layout it stands in (lib/scroll-scope), so a header of that layout can leave on scroll
  const ref = useReportScroll<HTMLDivElement>();
  return (
    <div
      ref={ref}
      layout="scroll-area"
      position={position}
      className={clsx(axisClasses[axis], className, positionClasses(position))}
      {...props}
    />
  );
}
