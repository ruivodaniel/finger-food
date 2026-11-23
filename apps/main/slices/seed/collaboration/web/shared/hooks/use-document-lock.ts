// A document's lock: who froze it and when, whether the caller may lock or unlock it (the server's answer), and the two
// actions. While it is on screen the document is watched: the service hears a lock or an unlock by anyone and refreshes
// it at once, and with it every lock this page shows.
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { locksService } from "../../services/application/locks.service";
import { closeForWatching, openForWatching } from "../../services/application/rooms";

export function useDocumentLock(kind: string, documentId: string) {
  const state = useQuery(locksService.getLockState(kind, documentId));
  const lock = useMutation({ mutationFn: () => locksService.lock(kind, documentId) });
  const unlock = useMutation({ mutationFn: () => locksService.unlock(kind, documentId) });

  useEffect(() => {
    openForWatching(kind, documentId);
    return () => closeForWatching(kind, documentId);
  }, [kind, documentId]);

  return {
    lock: state.data?.lock ?? null,
    canLock: state.data?.canLock ?? false,
    canUnlock: state.data?.canUnlock ?? false,
    isLoading: state.isPending,
    doLock: lock,
    doUnlock: unlock,
    error: lock.error ?? unlock.error ?? null,
  };
}
