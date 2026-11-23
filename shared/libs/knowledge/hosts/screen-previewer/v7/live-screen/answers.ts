// THE ANSWERS on screen: every read the page made, kept by its source and params, so a redraw does not ask again. `again` marks every one to be asked the next
// time it is read; the last answer shows until the new one comes. A read that fails keeps the answer it had and gains the error; the next answer clears the error.
import type { ReadStatus } from "../../../../../ui/ui-data/v3/types";

type Answer = { data?: unknown; error: ReadStatus["error"]; again: boolean; asking?: Promise<void> };
const errorOf = (e: unknown): NonNullable<ReadStatus["error"]> => ({ ...(typeof (e as { status?: unknown })?.status === "number" ? { status: (e as { status: number }).status } : {}), message: e instanceof Error ? e.message : String(e) });

export function createAnswers(ask: (source: string, params: Record<string, unknown>) => Promise<unknown>, changed: () => void) {
  let kept = new Map<string, Answer>();
  const keyOf = (source: string, params: Record<string, unknown>) => source + " " + JSON.stringify(params);
  const send = (key: string, source: string, params: Record<string, unknown>) => {
    const mine = kept, a: Answer = kept.get(key) ?? { error: null, again: false };
    a.again = false;
    const p: Promise<void> = ask(source, params).then((data) => { a.data = data; a.error = null; }, (e: unknown) => { a.error = errorOf(e); }).finally(() => { if (a.asking === p) a.asking = undefined; if (mine === kept) changed(); });
    a.asking = p; kept.set(key, a);
  };
  return {
    read(source: string, params: Record<string, unknown>): unknown {
      const key = keyOf(source, params), a = kept.get(key);
      if (!a || (a.again && !a.asking)) send(key, source, params);
      return kept.get(key)!.data;
    },
    /** where a read stands, by TanStack Query's names. A read never asked is about to be: it is loading */
    status(source: string, params: Record<string, unknown>): ReadStatus {
      const a = kept.get(keyOf(source, params));
      if (!a) return { isLoading: true, isFetching: true, isRefetching: false, isError: false, error: null };
      const fetching = !!a.asking, has = a.data !== undefined;
      return { isLoading: fetching && !has, isFetching: fetching, isRefetching: fetching && has, isError: !!a.error, error: a.error };
    },
    again() { kept.forEach((a) => { a.again = true; }); changed(); },
    forget() { kept = new Map(); },
    /** resolves when nothing is being asked */
    async settled(): Promise<void> { for (;;) { const ps = [...kept.values()].map((a) => a.asking).filter(Boolean); if (!ps.length) return; await Promise.all(ps); } },
  };
}
