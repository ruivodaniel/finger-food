// THE SCROLL SCOPE OF A LAYOUT. A header and the body that scrolls under it belong to the same layout (a shell, a page, a main), so the layout holds
// which way its body was last scrolled. The body reports its own scroll and nothing else; a header reads its layout's state and listens to nothing.
// A scope passes what it hears to the scope around it: a scroll in the main's body is known to the page and to the shell.
import * as React from "react";

export type ScrollDirection = "up" | "down";
type Scope = { direction: ScrollDirection; report: (direction: ScrollDirection) => void; threshold: number };
const ScrollScopeContext = React.createContext<Scope | null>(null);

/** which way a scroll position moved: down once past the threshold and moving down, up otherwise; null while it barely moved */
function turn(y: number, before: number, threshold: number): ScrollDirection | null {
  if (Math.abs(y - before) < 8) return null;
  return y > before && y > threshold ? "down" : "up";
}

/** A layout's scroll scope. `threshold`: how far down, in px, before the layout counts as scrolled down. `window`: the scope with no scope around it
 *  also hears the window's own scroll (a page that scrolls as a document): the shell passes it. */
export function ScrollScope({ threshold = 56, window: hearsWindow = false, children }: { threshold?: number; window?: boolean; children?: React.ReactNode }) {
  const parent = React.useContext(ScrollScopeContext);
  const [direction, setDirection] = React.useState<ScrollDirection>("up");
  const report = React.useCallback((d: ScrollDirection) => { setDirection(d); parent?.report(d); }, [parent]);
  React.useEffect(() => {
    if (!hearsWindow || parent) return;
    let before = window.scrollY;
    const onScroll = () => { const d = turn(window.scrollY, before, threshold); if (d) { before = window.scrollY; report(d); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hearsWindow, parent, threshold, report]);
  const scope = React.useMemo(() => ({ direction, report, threshold }), [direction, report, threshold]);
  return <ScrollScopeContext.Provider value={scope}>{children}</ScrollScopeContext.Provider>;
}

/** for a header: which way the body of its layout was last scrolled (up when it stands in no layout) */
export function useScrollDirection(): ScrollDirection {
  return React.useContext(ScrollScopeContext)?.direction ?? "up";
}

/** for a body: a ref for its own element; its scroll, and only its own, is reported to its layout */
export function useReportScroll<T extends HTMLElement>(): React.RefObject<T | null> {
  const ref = React.useRef<T | null>(null);
  const scope = React.useContext(ScrollScopeContext);
  const report = scope?.report, threshold = scope?.threshold ?? 56;
  React.useEffect(() => {
    const el = ref.current; if (!el || !report) return;
    let before = el.scrollTop;
    const onScroll = (e: Event) => { if (e.target !== el) return; const d = turn(el.scrollTop, before, threshold); if (d) { before = el.scrollTop; report(d); } };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [report, threshold]);
  return ref;
}
