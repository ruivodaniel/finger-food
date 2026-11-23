/**
 * A document live: joining and leaving it, the leases of an edit, this tab's changes, and a save asked for. The calls only:
 * rooms.ts decides when to join or watch and hears the room, live-session.ts keeps an edit in step, and the store shows it.
 */

import type { DocumentChange, LeaseAction } from "../../../shared/types";
import { collaborationApi } from "../api/collaboration.api";

export const collaborationService = {
  join: <TDocument>(kind: string, id: string) => collaborationApi.join<TDocument>(kind, id),
  leave: (kind: string, id: string) => collaborationApi.leave(kind, id),
  /** Hears a document's room without editing it: its locks, as they happen. */
  watch: (kind: string, id: string) => collaborationApi.watch(kind, id),
  unwatch: (kind: string, id: string) => collaborationApi.unwatch(kind, id),
  sendLease: (kind: string, id: string, paths: string[][], action: LeaseAction, operation?: string) => collaborationApi.sendLease(kind, id, paths, action, operation),
  /** Saved now, if anything changed. The details are the kind's to read. */
  save: (kind: string, id: string, details: object) => collaborationApi.save(kind, id, details),
  sendChanges: (kind: string, id: string, changes: DocumentChange[]) => collaborationApi.sendChanges(kind, id, changes),
  /** Each change applies only if what it was made from is still there: an undo or a redo. */
  sendChangesIfUnchanged: (kind: string, id: string, changes: DocumentChange[]) => collaborationApi.sendChangesIfUnchanged(kind, id, changes),
};
