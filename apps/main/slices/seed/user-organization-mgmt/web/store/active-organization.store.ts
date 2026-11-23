/**
 * The active organization — the org the caller acts IN (the context). The
 * app's http client sends it as ACTIVE_ORG_HEADER on every request; the org a
 * request acts ON travels in its URL. The server honors the header only when
 * it names one of the caller's memberships, so a stale stored value is
 * harmless (resolves to null, and the switcher self-heals it).
 *
 * Persisted to localStorage under the same key and the same raw value as
 * before (the id itself, not a JSON envelope), and rehydrated by the app when
 * it mounts.
 */

import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";

const STORAGE_KEY = "uom.active-organization";

interface ActiveOrganizationState {
  activeOrgId: string | null;
  setActiveOrg: (id: string) => void;
  clearActiveOrg: () => void;
}

type Persisted = Pick<ActiveOrganizationState, "activeOrgId">;

/** The stored value is the bare id, as it always was. */
const rawIdStorage: PersistStorage<Persisted> = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    const id = window.localStorage.getItem(name);
    return id ? { state: { activeOrgId: id }, version: 0 } : null;
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    if (value.state.activeOrgId) window.localStorage.setItem(name, value.state.activeOrgId);
    else window.localStorage.removeItem(name);
  },
  removeItem: (name) => {
    if (typeof window !== "undefined") window.localStorage.removeItem(name);
  },
};

export const useActiveOrganizationStore = create<ActiveOrganizationState>()(
  persist(
    (set) => ({
      activeOrgId: null,
      setActiveOrg: (id) => set({ activeOrgId: id }),
      clearActiveOrg: () => set({ activeOrgId: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: rawIdStorage,
      partialize: (state) => ({ activeOrgId: state.activeOrgId }),
      skipHydration: true,
    },
  ),
);

/** The current value, outside React — what the http client stamps on requests. */
export const getActiveOrgId = (): string | null => useActiveOrganizationStore.getState().activeOrgId;

/** The named mutations, outside React — what services call. */
export const setActiveOrg = (id: string): void => useActiveOrganizationStore.getState().setActiveOrg(id);
export const clearActiveOrg = (): void => useActiveOrganizationStore.getState().clearActiveOrg();

/** Load the stored value. The app calls it once, before the first render. */
export const rehydrateActiveOrganization = (): void => {
  void useActiveOrganizationStore.persist.rehydrate();
};
