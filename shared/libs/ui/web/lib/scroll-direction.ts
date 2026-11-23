// THE SCROLL OF A BODY, TOLD AS AN EVENT. A body (or a shell, for the window) tells which way it was last scrolled and nothing else: who hears it decides
// what to do. No region reads a scroll: a region goes away when it is told to (`away`).
import * as React from "react";

export type ScrollDirection = "up" | "down";
export type OnScrollDirection = (direction: ScrollDirection) => void;

/** which way a scroll position moved: down once past the threshold and moving down, up otherwise; null while it barely moved */
function turn(y: number, before: number, threshold: number): ScrollDirection | null {
  if (Math.abs(y - before) < 8) return null;
  return y > before && y > threshold ? "down" : "up";
}

/** for a body: a ref for its own element; each change of direction of its own scroll is told to `tell` */
export function useTellScroll<T extends HTMLElement>(tell: OnScrollDirection | undefined, threshold = 56): React.RefObject<T | null> {
  const ref = React.useRef<T | null>(null), to = React.useRef(tell);
  to.current = tell;
  const on = !!tell;
  React.useEffect(() => {
    const el = ref.current; if (!el || !on) return;
    let before = el.scrollTop, last: ScrollDirection = "up";
    const onScroll = (e: Event) => { if (e.target !== el) return; const d = turn(el.scrollTop, before, threshold); if (!d) return; before = el.scrollTop; if (d !== last) { last = d; to.current?.(d); } };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [on, threshold]);
  return ref;
}

/** for a shell: each change of direction of the window's own scroll (a page that scrolls as a document) is told to `tell` */
export function useTellWindowScroll(tell: OnScrollDirection | undefined, threshold = 56): void {
  const to = React.useRef(tell);
  to.current = tell;
  const on = !!tell;
  React.useEffect(() => {
    if (!on) return;
    let before = window.scrollY, last: ScrollDirection = "up";
    const onScroll = () => { const d = turn(window.scrollY, before, threshold); if (!d) return; before = window.scrollY; if (d !== last) { last = d; to.current?.(d); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [on, threshold]);
}

/** what a region that can go away carries: the flag `away` when told so; it clips its content as soon as it is one that may be told */
export const awayAttrs = (away: boolean | undefined) => ({ flag: away ? "away" : undefined });
export const awayClass = (away: boolean | undefined) => (away === undefined ? undefined : "overflow-hidden");
