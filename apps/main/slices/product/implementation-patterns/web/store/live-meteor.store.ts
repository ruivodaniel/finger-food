/**
 * The meteors being edited live in this tab, by id: what the edit form shows. THE EXCEPTION, used here because the
 * collaboration slice pushes changes many times a second and the form needs them at once.
 *
 * Read through the selector hook, by components. Written only through the named mutations, and only by the live-meteor
 * service, which copies from collaboration what a meteor's form needs and nothing else.
 */
import { create } from "zustand";
import type { CollaborationState, LiveDocumentView } from "@modules/collaboration/web";
import type { MeteorFields } from "../shared/helpers/meteor-fields";

/** Who holds a field, when it isn't you. */
export interface FieldHolder {
  name: string;
  image: string | null;
}

export interface LiveMeteorView {
  /** Null until joined. */
  fields: MeteorFields | null;
  /** Everyone on the meteor, for the presence bar. */
  members: LiveDocumentView["members"];
  /** Fields another client holds, by field. */
  heldBy: Partial<Record<keyof MeteorFields, FieldHolder>>;
  /** Who locked it: read-only while set. */
  lockedBy: string | null;
  state: CollaborationState;
  message: string | null;
  /** "Ana is editing this", for a few seconds after a refusal. */
  heldToast: string | null;
}

export const emptyLiveMeteor: LiveMeteorView = { fields: null, members: [], heldBy: {}, lockedBy: null, state: "loading", message: null, heldToast: null };

export const useLiveMeteorStore = create<{ byId: Record<string, LiveMeteorView> }>(() => ({ byId: {} }));

/** The store's mutations: for the live-meteor service only. */
export const liveMeteors = {
  set: (id: string, view: LiveMeteorView) => useLiveMeteorStore.setState((store) => ({ byId: { ...store.byId, [id]: view } })),
  drop: (id: string) =>
    useLiveMeteorStore.setState((store) => {
      const { [id]: _dropped, ...rest } = store.byId;
      return { byId: rest };
    }),
};
