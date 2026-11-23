// Who is editing a document now, one entry per person, while it is on screen. Watches it (the service hears its room) and
// reads who is on it from the store: the same entry the editor's presence bar reads. Inside the slice: other slices use
// the EditingNow component.
import { useEffect, useMemo } from "react";
import type { DocumentMember } from "../../../shared/types";
import { closeForWatching, keyOf, openForWatching } from "../../services/application/rooms";
import { useLiveDocuments } from "../../store/live-documents.store";

const nobody: DocumentMember[] = [];

export function useDocumentEditors(kind: string, id: string): DocumentMember[] {
  useEffect(() => {
    openForWatching(kind, id);
    return () => closeForWatching(kind, id);
  }, [kind, id]);

  const members = useLiveDocuments((store) => store.byKey[keyOf(kind, id)]?.members ?? nobody);
  return useMemo(() => [...new Map(members.map((member) => [member.actorId, member])).values()], [members]);
}
