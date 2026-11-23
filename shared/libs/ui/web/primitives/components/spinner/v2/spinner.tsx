import { useDebouncedBoolean } from "../../../../hooks/use-debounced-boolean";
import { cn } from "../../../../lib/utils";
import { axisAttrs } from "../../../../lib/axes";
import { positionClasses } from "../../../../lib/position";
import type { SpinnerProps, SpinnerOverlayProps } from "./types";

// =============================================================================
// Component
// =============================================================================

// the ring per scale: its size and its stroke (the colour is the spinner's foreground, the theme's)
const RING: Record<string, string> = { "3xs": "size-2.5 border", "2xs": "size-3 border", xs: "size-3.5 border", sm: "size-4 border-2", md: "size-5 border-2", lg: "size-7 border-[3px]", xl: "size-9 border-[3px]", "2xl": "size-12 border-4", "3xl": "size-16 border-4" };

export function Spinner({ position, emphasis, status, scale = "md", concept, spinnerClassName, outerClassName }: SpinnerProps) {
  return (
    <div element="surface--spinner" {...axisAttrs({ emphasis, status, scale, concept, position })} className={cn("flex items-center justify-center", outerClassName, positionClasses(position))}>
      <div
        className={cn(
          "animate-spin rounded-full border-current border-t-transparent", RING[scale] ?? RING.md,
          spinnerClassName,
        )}
      />
    </div>
  );
}

export function SpinnerOverlay({
  show = true,
  children,
  className,
  delay = 300,
  debouncedRender = true,
}: SpinnerOverlayProps) {
  const debouncedShow = useDebouncedBoolean(show, delay);
  const isVisible = debouncedRender ? debouncedShow : show;

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center",
        !isVisible && "hidden",
        className,
      )}>
      {children}
    </div>
  );
}
