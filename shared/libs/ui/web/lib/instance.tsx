// The instance store: one small array of { id, config, data }, one entry per instantiated component in a fixture. A fixture declares its instance next to its component
// (<Instance id initial>); the design cockpit reads and edits the same array (the store tab of the code sheet). Outside the cockpit it just works as local state.
import { useSyncExternalStore, type ReactNode } from "react";

export type InstanceState = { id: string; config: Record<string, unknown>; data: Record<string, unknown> };
export type InstanceInitial = { config?: Record<string, unknown>; data?: Record<string, unknown> };

let list: InstanceState[] = [];
const listeners = new Set<() => void>();
const emit = () => { list = [...list]; listeners.forEach((l) => l()); };

export const instances = {
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  all: () => list,
  get: (id: string) => list.find((i) => i.id === id),
  /** seeds an entry once; later renders keep what the person changed */
  seed: (id: string, initial: InstanceInitial) => { if (!list.some((i) => i.id === id)) list = [...list, { id, config: { ...initial.config }, data: { ...initial.data } }]; },
  /** replaces an entry (the store tab's save) */
  replace: (next: InstanceState) => { list = list.map((i) => (i.id === next.id ? next : i)); emit(); },
  patch: (id: string, part: "config" | "data", values: Record<string, unknown>) => { list = list.map((i) => (i.id === id ? { ...i, [part]: { ...i[part], ...values } } : i)); emit(); },
  /** the cockpit clears it when the item changes (silently: it runs while rendering) */
  clear: () => { list = []; },
};

export type InstanceApi = {
  config: Record<string, any>;
  data: Record<string, any>;
  /** the props that bind `data[key]` to a component: its value prop and its change callback (defaults: value / onChange) */
  bind: (key: string, valueProp?: string, changeProp?: string) => Record<string, unknown>;
};

export function useInstance(id: string, initial: InstanceInitial): InstanceApi {
  instances.seed(id, initial);
  useSyncExternalStore(instances.subscribe, instances.all);
  const me = instances.get(id)!;
  return {
    config: me.config,
    data: me.data,
    bind: (key, valueProp = "value", changeProp = "onChange") => ({ [valueProp]: me.data[key], [changeProp]: (v: unknown) => instances.patch(id, "data", { [key]: v }) }),
  };
}

/** one instance in a fixture, as a render prop (a fixture has several, and hooks cannot loop) */
export function Instance({ id, initial, children }: { id: string; initial: InstanceInitial; children: (x: InstanceApi) => ReactNode }) {
  return <>{children(useInstance(id, initial))}</>;
}
