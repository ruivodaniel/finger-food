/**
 * Live documents, for another slice: what it imports instead of a hook. A slice says what its document is (its shape);
 * this hands back a source it can open while on screen, read and subscribe to (the store's entry for the document), and
 * the actions of an edit. What is kept, and in what store, stays this slice's business.
 *
 * The other slice binds the source to React itself, in a hook of its own: useSyncExternalStore(subscribe, read) and an
 * effect that runs open().
 */
import { findConflict, type DocumentRules } from "../../../shared/rules";
import { useLiveDocuments, liveDocuments, type LiveDocumentView } from "../../store/live-documents.store";
import { collaborationService } from "./collaboration.service";
import type { DocumentShape, LiveSession } from "./live-session";
import { mountedApp } from "./mount";
import { closeForEditing, keyOf, openForEditing, sessionFor } from "./rooms";

export type { CollaborationState, LiveDocumentView } from "../../store/live-documents.store";
export type { DocumentShape } from "./live-session";

/** A field another client holds, and who: their name and picture. */
export interface HeldByOther {
  path: string[];
  holder: string;
  holderImage: string | null;
}

export interface LiveDocumentSource<TDocument> {
  /** Joins it for this tab: call while on screen; the answer leaves. However many open it, the server hears one join. */
  open(): () => void;
  subscribe(onChange: () => void): () => void;
  /** The document as this tab shows it, who is on it, what they hold, its lock and how the edit is going. Same object
   * until something changes. */
  read(): LiveDocumentView;
  change(next: TDocument): void;
  editStart(paths: string[][], operation?: string): void;
  editEnd(paths: string[][]): void;
  showHeld: LiveSession<TDocument>["showHeld"];
  /** Joins it again, after it failed. */
  reload(): void;
  save(details: object): Promise<unknown>;
  undo(): void;
  redo(): void;
}

export const liveDocumentsService = {
  /** One document of a kind, edited live. The shape is set at once; nothing is joined until open(). */
  source<TDocument>(kind: string, id: string, shape: DocumentShape<TDocument>): LiveDocumentSource<TDocument> {
    const key = keyOf(kind, id);
    const session = sessionFor<TDocument>(kind, id);
    session.setShape(shape);
    return {
      open: () => {
        openForEditing(kind, id, session as LiveSession<unknown>);
        return () => closeForEditing(kind, id);
      },
      subscribe: (onChange) => useLiveDocuments.subscribe(onChange),
      read: () => liveDocuments.read(key),
      change: session.change,
      editStart: session.editStart,
      editEnd: session.editEnd,
      showHeld: session.showHeld,
      reload: () => void session.join(),
      save: session.save,
      undo: session.undo,
      redo: session.redo,
    };
  },

  /** What other clients hold in the document, with who holds it. */
  heldByOthers(view: LiveDocumentView): HeldByOther[] {
    const { clientId } = mountedApp();
    return view.leases.filter((lease) => lease.clientId !== clientId).map((lease) => {
      const holder = view.members.find((member) => member.actorId === lease.actorId);
      return { path: lease.path, holder: holder?.actorName ?? lease.actorId, holderImage: holder?.actorImage ?? null };
    });
  },

  /** What the document's rules refuse this tab now: the same check the server runs. */
  conflictOf<TDocument>(view: LiveDocumentView, rules: DocumentRules<TDocument>, itemId: string, operation: string) {
    if (view.document === null) return null;
    const leases = liveDocumentsService.heldByOthers(view).map((lease) => ({ itemId: lease.path[1]!, holder: lease.holder }));
    return findConflict({ document: view.document as TDocument, rules, itemId, operation, leases });
  },

  /** A save asked for from outside the document: now, if it is live and anything changed. */
  save: (kind: string, id: string, details: object) => collaborationService.save(kind, id, details),
};
