import {
  useLayoutEffect,
  useState,
  type RefObject,
  type CSSProperties,
} from "react";

type Placement = "below" | "above";

type Options = {
  /** Desired popover width in px. Will be clamped to viewport. */
  width: number;
  /** Hard cap on popover height in px. Available space may shrink it further. */
  maxHeight: number;
  /** Gap between trigger and popover in px. Default 4. */
  gap?: number;
  /** Anchor edge — 'right' aligns popover right edge to trigger right edge. */
  align?: "left" | "right";
};

type Result = {
  style: CSSProperties;
  placement: Placement;
};

/**
 * The element the popover should anchor to:
 *   - an Element directly (HTMLElement, SVGElement, etc. — useful when the
 *     anchor is a live DOM node, e.g. the inspected leaf in inspect mode), OR
 *   - a RefObject pointing at an HTML element (typical button trigger case).
 *
 * `Element` is used (not `HTMLElement`) so SVG anchors work — inspect mode
 * is a common case where the user hovers a `<svg>` icon.
 */
export type PopoverTarget =
  | Element
  | RefObject<Element | null>
  | RefObject<HTMLElement | null>
  | null;

function resolveTarget(t: PopoverTarget): Element | null {
  if (!t) return null;
  if (t instanceof Element) return t;
  return t.current ?? null;
}

const HIDDEN: Result = {
  style: { position: "fixed", visibility: "hidden" },
  placement: "below",
};

function computePlacement(node: Element, options: Options): Result {
  const rect = node.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = options.gap ?? 4;
  const w = Math.min(options.width, vw - 16);

  const spaceBelow = vh - rect.bottom - gap - 8;
  const spaceAbove = rect.top - gap - 8;
  const placeAbove =
    spaceBelow < options.maxHeight && spaceAbove > spaceBelow;

  const maxH = placeAbove
    ? Math.min(options.maxHeight, Math.max(80, spaceAbove))
    : Math.min(options.maxHeight, Math.max(80, spaceBelow));

  const top = placeAbove ? rect.top - gap - maxH : rect.bottom + gap;

  const align = options.align ?? "right";
  let left = align === "right" ? rect.right - w : rect.left;
  left = Math.max(8, Math.min(left, vw - w - 8));

  return {
    style: {
      position: "fixed",
      top,
      left,
      width: w,
      maxHeight: maxH,
      visibility: "visible",
    },
    placement: placeAbove ? "above" : "below",
  };
}

/**
 * Computes fixed-position style for a popover portaled to <body>, anchored
 * to a target element. Auto-flips above when there's not enough room below.
 *
 * Position is computed INLINE on every render — no state dance, no
 * "first-render hidden" flash. Re-renders triggered by:
 *   - parent re-render (when target / props change)
 *   - resize / ancestor scroll (via the version-bump effect below)
 */
export function usePopoverPlacement(
  target: PopoverTarget,
  open: boolean,
  options: Options,
): Result {
  const node = resolveTarget(target);

  // Bump version on viewport changes so the next render recomputes.
  const [, setVersion] = useState(0);
  useLayoutEffect(() => {
    if (!open || !node) return;
    const tick = () => setVersion((v) => v + 1);
    window.addEventListener("resize", tick);
    // Capture phase so we catch ancestor scrolls too.
    window.addEventListener("scroll", tick, true);
    return () => {
      window.removeEventListener("resize", tick);
      window.removeEventListener("scroll", tick, true);
    };
  }, [open, node]);

  if (!open || !node) return HIDDEN;
  return computePlacement(node, options);
}
