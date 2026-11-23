// THE MOCK STORE: in place of the product's store.
import type { DataReader } from "../reader";
import { parse } from "../url";

export interface MockStore {
  /** takes the id from the URL, reads the initial store state of that UI snapshot or UI prototype, starts with it */
  start(url: string): Promise<void>;
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  /** every value, for the headers of a request */
  all(): Record<string, unknown>;
}

export function createMockStore(reader: DataReader): MockStore {
  let state: Record<string, unknown> = {};
  return {
    async start(url) {
      const p = parse(url);
      if (!p) throw new Error(`not a live screen URL: ${url}`);
      const row = p.kind === "ui-prototype" ? await reader.uiPrototype(p.id) : await reader.uiSnapshot(p.id);
      state = { ...(row.initialStoreState ?? {}) };
    },
    get: (key) => state[key],
    set: (key, value) => { state = { ...state, [key]: value }; },
    all: () => ({ ...state }),
  };
}
