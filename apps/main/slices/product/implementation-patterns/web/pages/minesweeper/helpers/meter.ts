// The page's meter: how many cells were drawn again by the last answer, and how long from the answer to the paint.
// Not state of the product: a measuring instrument of this page, kept out of the store on purpose.

export interface Reading { changed: number; drawn: number; requestMs: number; paintMs: number }

let drawn = 0;
let reading: Reading | null = null;
const listeners = new Set<() => void>();

/** a cell calls it every time it is drawn */
export const countDraw = (): void => { drawn += 1; };

/** an answer was just set in the store: count the draws it causes, and time them to the next paint */
export function measureAnswer(answer: { changed: number; requestMs: number }): void {
  drawn = 0;
  const set = performance.now();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    reading = { changed: answer.changed, drawn, requestMs: Math.round(answer.requestMs), paintMs: Math.round(performance.now() - set) };
    listeners.forEach((tell) => tell());
  }));
}

export const subscribeToReading = (tell: () => void): (() => void) => { listeners.add(tell); return () => { listeners.delete(tell); }; };
export const getReading = (): Reading | null => reading;
