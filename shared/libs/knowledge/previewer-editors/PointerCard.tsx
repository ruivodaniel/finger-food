// Brought from slice-design/shared/ui/components/entity-previewers/PointerCard.tsx (4 Nov). The tool keeps its own until it moves to the canvas v3.
// The pointer card: a card that opens where the pointer rests on a thing (still for 250 ms) and stays where it opened, beside the pointer: 14 px to its right, or to its
// left when the pointer is less than 500 px from the right edge of the browser window (the top window, also when the component is in a frame); its top starts 14 px under
// the pointer and, once its height is measured, is kept at least 8 px inside the screen. It stays while the pointer is on the thing or on the card, closes 350 ms after it
// leaves both, and at once on a press (no card again until the pointer has left the thing). A double click on the thing pins the card: it stays, whatever the pointer does,
// until Escape or a press outside it. The floating box is a plain positioned element (the library's hover card can only sit beside an element, not at a pointer); what it
// holds is the consumer's. The ERD node and the compact code snippet carry their own, untouched.
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** how much room there is between the pointer and the right edge of the browser window, in the window's own coordinates: in a frame (the cockpit), the pointer is moved by where the frame sits in the window */
function roomRight(clientX: number): number {
  try {
    const top = window.top ?? window;
    const frame = top === window ? null : window.frameElement;
    const offset = frame ? frame.getBoundingClientRect().left : 0;
    return top.innerWidth - (offset + clientX);
  } catch { return window.innerWidth - clientX; }   // a frame of another origin: its own window
}
const OPEN_AFTER = 250, GRACE = 350, OFFSET = 14, EDGE = 8, NEEDS_RIGHT = 500;

export function PointerCard({ body, card, width, concept, testid, disabled = false, pinnable = false, onPinned }: { body: ReactNode; card: ReactNode; /** the card's width */ width: number; /** the theme concept the wrapper and the card wear */ concept?: string; testid?: string; /** no card for now */ disabled?: boolean; /** a double click on the thing pins the card */ pinnable?: boolean; /** the card was pinned or let go */ onPinned?: (pinned: boolean) => void }) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const [pinned, setPinned] = useState(false);
  const [top, setTop] = useState(0);
  const opening = useRef<number | null>(null), closing = useRef<number | null>(null), box = useRef<HTMLDivElement>(null);
  const shut = useRef(false);   // pressed: no card until the pointer has left the thing
  const clear = (t: typeof opening) => { if (t.current) window.clearTimeout(t.current); t.current = null; };
  useEffect(() => () => { clear(opening); clear(closing); }, []);
  useEffect(() => { if (disabled) { clear(opening); clear(closing); setAt(null); } }, [disabled]);
  const move = (e: ReactMouseEvent) => {
    clear(closing);
    if (at || e.buttons || shut.current || disabled) return;
    clear(opening);
    const x = e.clientX, y = e.clientY;
    opening.current = window.setTimeout(() => setAt({ x, y }), OPEN_AFTER);
  };
  const leave = () => { clear(opening); shut.current = false; if (pinned) return; if (!closing.current) closing.current = window.setTimeout(() => { closing.current = null; setAt(null); }, GRACE); };
  const press = () => { if (pinned) return; clear(opening); clear(closing); shut.current = true; setAt(null); };
  const pin = (e: ReactMouseEvent) => { if (!pinnable || disabled) return; e.stopPropagation(); clear(opening); clear(closing); shut.current = false; setAt({ x: e.clientX, y: e.clientY }); setPinned(true); onPinned?.(true); };
  const unpin = () => { setPinned(false); setAt(null); onPinned?.(false); };
  // pinned: Escape or a press outside the card lets it go
  useEffect(() => {
    if (!pinned) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); unpin(); } };
    const down = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) unpin(); };
    window.addEventListener("keydown", key, true); window.addEventListener("mousedown", down, true);
    return () => { window.removeEventListener("keydown", key, true); window.removeEventListener("mousedown", down, true); };
  }, [pinned]);   // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!at || !box.current) return;
    setTop(Math.max(EDGE, Math.min(at.y + OFFSET, window.innerHeight - box.current.offsetHeight - EDGE)));
  }, [at]);
  const left = at ? (roomRight(at.x) < NEEDS_RIGHT ? at.x - width - OFFSET : at.x + OFFSET) : 0;
  return (
    <>
      <div concept={concept} onMouseMove={move} onMouseLeave={leave} onMouseDownCapture={press} onDoubleClick={pin}>{body}</div>
      {at ? createPortal(
        <div ref={box} concept={concept} data-testid={testid} onMouseEnter={() => clear(closing)} onMouseLeave={leave} onMouseDown={(e) => e.stopPropagation()} className="nodrag nopan nowheel" style={{ position: "fixed", left, top, width, zIndex: 100000, userSelect: "text" }}>{card}</div>,
        document.body,
      ) : null}
    </>
  );
}
