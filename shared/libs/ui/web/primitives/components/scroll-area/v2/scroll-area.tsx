"use client";

// TO SUNSET (5 Nov 2026): the Content part scrolls (overflow per axis); this component stays until the consumers move, then goes.
// The scroll-area layout (@libs/web-layouts) is not this: it stays for the layout regions.

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import * as React from "react";

import { cn } from "../../../../lib/utils";

// =============================================================================
// Components
// =============================================================================

/** @deprecated to sunset: use Content with overflow (5 Nov 2026) */
function ScrollArea({ className, children, ...props }: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root layout="scroll-area" className={cn("relative h-full", className)} {...props}>
      <ScrollAreaPrimitive.Viewport className="h-full w-full">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      orientation={orientation}
      className={cn(
        "flex touch-none select-none",
        orientation === "vertical" && "flex-col",
        className,
      )}
      {...props}>
      <ScrollAreaPrimitive.ScrollAreaThumb
        className="relative flex-1"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };
