/**
 * Client-side active-org store — the org the caller acts IN (the context).
 * The api client sends it as ACTIVE_ORG_HEADER on every request; the org a
 * request acts ON travels in its URL. The server honors the header only
 * when it names one of the caller's memberships, so a stale stored value is
 * harmless (resolves to null, and the switcher self-heals it).
 */

const STORAGE_KEY = "uom.active-organization";

let value: string | null | undefined;

export function getActiveOrgId(): string | null {
  if (value === undefined) {
    value =
      typeof window === "undefined"
        ? null
        : window.localStorage.getItem(STORAGE_KEY);
  }
  return value;
}

export function setActiveOrgId(id: string | null): void {
  value = id;
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(STORAGE_KEY, id);
  else window.localStorage.removeItem(STORAGE_KEY);
}
