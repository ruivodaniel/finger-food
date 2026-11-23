// THE NAMED MUTATIONS OF THE MOCK STORE: in place of an application service. A document never writes the store: it dispatches one of these
// by name, and the mutation sets the store. Each takes what the store holds and the action's arguments, and gives the keys it sets.
import type { MockStore } from "./mock-store";
import type { STORE_ACTIONS } from "../../../../../ui/ui-data/v3/dictionary";

type Mutation = (store: MockStore, args: Record<string, unknown>) => void;
const merge = (store: MockStore, key: string, patch: Record<string, unknown>) => store.set(key, { ...((store.get(key) as Record<string, unknown> | undefined) ?? {}), ...patch });

export const STORE_MUTATIONS: Record<(typeof STORE_ACTIONS)[number], Mutation> & Record<string, Mutation | undefined> = {
  /** the page takes the whole screen: the regions bound to `store.layout.expanded` go away */
  "layout.setExpanded": (store, args) => merge(store, "layout", { expanded: !!args.expanded }),
};
