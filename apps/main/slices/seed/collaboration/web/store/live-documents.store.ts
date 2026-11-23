/**
 * The documents open in this tab, by `kind:id`: who is on each, what they hold, its lock, and, for one being edited, the
 * document as this tab shows it and how the edit is going. Held here and not in a hook because more than one component
 * needs it (the form, the presence bar, a list of the documents), and because the service manages it as events arrive.
 *
 * Only the application service sets it, through the mutations below. A component reads it, bound through a selector.
 */

import { create } from "zustand";
import type { DocumentLease, DocumentLockView, DocumentMember } from "../../shared/types";

export type CollaborationState = "loading" | "live" | "sending" | "reconnecting" | "refused" | "failed";

export interface LiveDocumentView {
  /** The document as this tab shows it: what the server has, with this tab's changes on top. Null until joined, or watched only. */
  document: unknown;
  members: DocumentMember[];
  leases: DocumentLease[];
  /** Frozen: nobody's changes are taken until it is unlocked. */
  lock: DocumentLockView | null;
  state: CollaborationState;
  message: string | null;
  /** "Ana is editing this", for a few seconds after a refusal. */
  heldToast: string | null;
}

export const emptyLiveDocument: LiveDocumentView = { document: null, members: [], leases: [], lock: null, state: "loading", message: null, heldToast: null };

export const useLiveDocuments = create<{ byKey: Record<string, LiveDocumentView> }>(() => ({ byKey: {} }));

const patch = (key: string, part: Partial<LiveDocumentView>) =>
  useLiveDocuments.setState((store) => ({ byKey: { ...store.byKey, [key]: { ...(store.byKey[key] ?? emptyLiveDocument), ...part } } }));

/** The store's mutations: for the application service only. */
export const liveDocuments = {
  read: (key: string): LiveDocumentView => useLiveDocuments.getState().byKey[key] ?? emptyLiveDocument,
  setMembers: (key: string, members: DocumentMember[]) => patch(key, { members }),
  setLeases: (key: string, leases: DocumentLease[]) => patch(key, { leases }),
  setLock: (key: string, lock: DocumentLockView | null) => patch(key, { lock }),
  showDocument: (key: string, document: unknown) => patch(key, { document }),
  setStatus: (key: string, state: CollaborationState, message: string | null = null) => patch(key, { state, message }),
  showHeld: (key: string, heldToast: string | null) => patch(key, { heldToast }),
  drop: (key: string) =>
    useLiveDocuments.setState((store) => {
      const { [key]: _dropped, ...rest } = store.byKey;
      return { byKey: rest };
    }),
};
