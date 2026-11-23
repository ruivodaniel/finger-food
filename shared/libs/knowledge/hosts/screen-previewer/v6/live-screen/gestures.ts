// A PERSON'S GESTURES ON THE PAGE, sent as the events a mouse and a keyboard send, in their order, to an element found by its test id.
// The live screen offers them to the player; they run inside the page's own document. Each is one thing (move, button down, button up, a key):
// the player composes them into acts (player/acts.ts). Nothing here knows a play, a step or a time.
/** an element by its test id, or the option of an open select by its value or its text */
export type Target = string | { option: string };
export type Point = { x: number; y: number };

const said = (t: Target) => (typeof t === "string" ? `the test id ${t}` : `the option ${t.option}`);
const KEYS: Record<string, string> = { Enter: "Enter", Escape: "Escape", Tab: "Tab", Backspace: "Backspace", Delete: "Delete", ArrowUp: "ArrowUp", ArrowDown: "ArrowDown", ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight", Space: " " };

export function createGestures(doc: Document) {
  const view = doc.defaultView!;
  let over: HTMLElement | null = null, at: Point = { x: 0, y: 0 };

  const lookFor = (t: Target): HTMLElement | null => {
    if (typeof t === "string") return doc.querySelector<HTMLElement>(`[data-testid="${CSS.escape(t)}"]`);
    const options = [...doc.querySelectorAll<HTMLElement>('[role="option"], option')];
    return options.find((o) => o.getAttribute("data-value") === t.option || o.getAttribute("value") === t.option) ?? options.find((o) => o.textContent?.trim() === t.option) ?? null;
  };
  const find = (t: Target): HTMLElement => { const el = lookFor(t); if (!el) throw new Error(`nothing on the screen has ${said(t)}`); return el; };
  const centre = (el: HTMLElement): Point => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const send = (el: HTMLElement, kinds: string[], p: Point, buttons = 0) => {
    for (const type of kinds) {
      const init = { bubbles: !/enter|leave/.test(type), cancelable: true, composed: true, view, clientX: p.x, clientY: p.y, button: 0, buttons, pointerType: "mouse", pointerId: 1, isPrimary: true };
      el.dispatchEvent(type.startsWith("pointer") ? new view.PointerEvent(type, init) : new view.MouseEvent(type, init));
    }
  };
  const key = (el: HTMLElement, type: string, k: string) => el.dispatchEvent(new view.KeyboardEvent(type, { key: k, bubbles: true, cancelable: true, composed: true }));
  /** writes a field's value the way the browser does when a person types: through the element's own setter, then the input event */
  const write = (el: HTMLElement, value: string) => {
    const proto = el instanceof view.HTMLTextAreaElement ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, value);
    el.dispatchEvent(new view.Event("input", { bubbles: true }));
  };
  /** the regions of this page that scroll up and down and hold the element, the nearest first, the page itself last */
  const regionsOf = (el: HTMLElement): Element[] => {
    const out: Element[] = [];
    for (let p = el.parentElement; p && p !== doc.documentElement && p !== doc.body; p = p.parentElement)
      if (p.scrollHeight > p.clientHeight + 1 && /auto|scroll/.test(view.getComputedStyle(p).overflowY)) out.push(p);
    const page = doc.scrollingElement;
    if (page && page.scrollHeight > page.clientHeight + 1) out.push(page);
    return out;
  };
  /** the part of the element that is seen: its box cut by the window and by every region that clips it; nothing when no part is */
  const seenPart = (el: HTMLElement): { left: number; top: number; right: number; bottom: number } | null => {
    const r = el.getBoundingClientRect(), seen = { left: Math.max(0, r.left), top: Math.max(0, r.top), right: Math.min(view.innerWidth, r.right), bottom: Math.min(view.innerHeight, r.bottom) };
    for (let p = el.parentElement; p && p !== doc.documentElement && p !== doc.body; p = p.parentElement) {
      const style = view.getComputedStyle(p);
      if (style.overflowY === "visible" && style.overflowX === "visible") continue;
      const c = p.getBoundingClientRect();
      if (style.overflowY !== "visible") { seen.top = Math.max(seen.top, c.top); seen.bottom = Math.min(seen.bottom, c.bottom); }
      if (style.overflowX !== "visible") { seen.left = Math.max(seen.left, c.left); seen.right = Math.min(seen.right, c.right); }
    }
    return seen.right - seen.left > 1 && seen.bottom - seen.top > 1 ? seen : null;
  };
  const focused = () => (doc.activeElement instanceof view.HTMLElement ? doc.activeElement : doc.body);

  return {
    /** waits for the element (up to `patience` ms) and gives the centre of the part of it that is seen, in the page's window. It scrolls nothing:
     *  an element with no part in view is an error that says so */
    async reach(t: Target, patience = 8000): Promise<Point> {
      for (let waited = 0; !lookFor(t) && waited < patience; waited += 40) await new Promise((r) => setTimeout(r, 40));
      const el = find(t), seen = seenPart(el);
      if (!seen) throw new Error(`${said(t)} is not in view: scroll to it first`);
      return { x: (seen.left + seen.right) / 2, y: (seen.top + seen.bottom) / 2 };
    },
    /** scrolls, in `ms`, the regions of this page that hold the element until it is in their middle, as a person scrolls. Only this page's own regions,
     *  each by its own scrollTop: nothing outside the page can move. An element already there moves nothing */
    async scrollTo(t: Target, ms: number, patience = 8000): Promise<void> {
      for (let waited = 0; !lookFor(t) && waited < patience; waited += 40) await new Promise((r) => setTimeout(r, 40));
      const el = find(t);
      for (const region of regionsOf(el)) {
        const r = el.getBoundingClientRect(), page = region === doc.scrollingElement;
        const top = page ? 0 : region.getBoundingClientRect().top, height = page ? view.innerHeight : region.clientHeight;
        // how far this region has to go for the element to be in its middle, and how far it can go
        const from = region.scrollTop, to = Math.max(0, Math.min(region.scrollHeight - region.clientHeight, from + (r.top + r.height / 2) - (top + height / 2)));
        if (Math.abs(to - from) < 1) continue;
        const start = Date.now();
        for (let k = ms > 0 ? 0 : 1; ; ) {
          region.scrollTop = from + (to - from) * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
          if (k >= 1) break;
          await new Promise((ok) => setTimeout(ok, 16));
          k = Math.min(1, (Date.now() - start) / ms);
        }
      }
    },
    /** the pointer is over the element: the one it was over hears it leave */
    pointerMove(t: Target) {
      const el = find(t); at = centre(el);
      if (over && over !== el && over.isConnected) send(over, ["pointerout", "pointerleave", "mouseout", "mouseleave"], at);
      if (over !== el) send(el, ["pointerover", "pointerenter", "mouseover", "mouseenter"], at);
      send(el, ["pointermove", "mousemove"], at);
      over = el;
    },
    /** the button goes down on the element: it takes the focus */
    pointerDown(t: Target) { const el = find(t); at = centre(el); send(el, ["pointerdown", "mousedown"], at, 1); el.focus(); },
    /** the button comes up on the element: a click */
    pointerUp(t: Target) { const el = find(t); at = centre(el); send(el, ["pointerup", "mouseup", "click"], at); },
    /** the pointer goes off the screen */
    pointerLeave() { if (over?.isConnected) send(over, ["pointerout", "pointerleave", "mouseout", "mouseleave"], at); over = null; },
    /** what the field holds is selected and deleted */
    clear(t: Target) { const el = find(t); if ((el as HTMLInputElement).value !== "") write(el, ""); },
    /** one key, on the element that has the focus: a character is typed into a field; a named key (Enter, Escape, Tab, Backspace…) is pressed */
    key(k: string) {
      const el = focused(), named = KEYS[k] ?? (k.length === 1 ? null : k), value = (el as HTMLInputElement).value;
      const typed = named ?? k;
      const went = key(el, "keydown", typed);
      if (went && !named && typeof value === "string") write(el, value + k);
      else if (went && named === "Backspace" && typeof value === "string" && value) write(el, value.slice(0, -1));
      else if (went && named === "Enter") (el as HTMLInputElement).form?.requestSubmit();
      key(el, "keyup", typed);
    },
    /** a checkbox or a switch: whether it is on */
    isOn(t: Target): boolean { const el = find(t); return el.getAttribute("aria-checked") === "true" || el.getAttribute("data-state") === "checked" || (el as HTMLInputElement).checked === true; },
    /** a native select takes the option's value */
    isNativeSelect(t: Target): boolean { return find(t) instanceof view.HTMLSelectElement; },
    choose(t: Target, value: string) { const el = find(t) as HTMLSelectElement; el.value = value; el.dispatchEvent(new view.Event("input", { bubbles: true })); el.dispatchEvent(new view.Event("change", { bubbles: true })); },
    /** a file field takes a file, read from a URL */
    async giveFile(t: Target, url: string) {
      const el = find(t) as HTMLInputElement, blob = await (await view.fetch(url)).blob(), box = new view.DataTransfer();
      box.items.add(new view.File([blob], url.split("/").pop() || "file", { type: blob.type }));
      el.files = box.files;
      el.dispatchEvent(new view.Event("input", { bubbles: true })); el.dispatchEvent(new view.Event("change", { bubbles: true }));
    },
  };
}
export type Gestures = ReturnType<typeof createGestures>;
