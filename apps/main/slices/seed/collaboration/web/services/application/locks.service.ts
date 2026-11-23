/**
 * Document locks: a document's lock and what the caller may do about it, the locks the caller may see, and locking and
 * unlocking. Reads are query options under one key, so that a lock or an unlock refreshes every one of them: this tab's,
 * once answered, and anyone's, as its room hears it.
 */
import { queryOptions } from "@tanstack/react-query";
import { locksApi } from "../api/locks.api";
import { mountedApp } from "./mount";

const keys = {
  all: ["collaboration", "locks"] as const,
  state: (kind: string, documentId: string) => ["collaboration", "locks", "state", kind, documentId] as const,
  page: (query: { page: number; pageSize: number }) => ["collaboration", "locks", "page", query.page, query.pageSize] as const,
  of: (kind: string, documentIds: string[]) => ["collaboration", "locks", "of", kind, ...documentIds] as const,
};

export const locksService = {
  keys,
  getLockState: (kind: string, documentId: string) => queryOptions({ queryKey: keys.state(kind, documentId), queryFn: () => locksApi.getState(kind, documentId) }),
  /** The locks among these documents of a kind: one request for a whole list, read again every 30 s and when the window
   * comes back, since a list doesn't watch its documents. Nothing to ask without ids. */
  getLocksOf: (kind: string, documentIds: string[]) =>
    queryOptions({ queryKey: keys.of(kind, documentIds), queryFn: () => locksApi.getLocksOf(kind, documentIds), enabled: documentIds.length > 0, staleTime: 0, refetchInterval: 30_000 }),
  getLocks: (query: { page: number; pageSize: number }) => queryOptions({ queryKey: keys.page(query), queryFn: () => locksApi.getAll(query) }),
  lock: (kind: string, documentId: string) => locksApi.lock(kind, documentId).finally(refresh),
  unlock: (kind: string, documentId: string) => locksApi.unlock(kind, documentId).finally(refresh),
  /** Every lock this page shows, read again. */
  refresh,
  /** One document's lock, read again. */
  refreshState: (kind: string, documentId: string) => mountedApp().queryClient.invalidateQueries({ queryKey: keys.state(kind, documentId) }),
};

function refresh() {
  return mountedApp().queryClient.invalidateQueries({ queryKey: keys.all });
}
