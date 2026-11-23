/**
 * What the collaboration API answers with. Shared by the slice's server and web sides. It names no kind of document.
 */

/** One edit: paths go by id, never by position, and it says what was there before. */
export interface DocumentChange {
  /** retrying a change sends the same opId, and it is applied once */
  opId: string;
  path: string[];
  before?: unknown;
  after?: unknown;
}

/** Who is on a document now: a browser tab, who is acting in it, and their name, for the presence bar and the toast. */
export interface DocumentMember {
  clientId: string;
  actorId: string;
  actorName: string;
  /** their picture, when they have one */
  actorImage: string | null;
}

/** One editor on one path: held while they edit it, renewed by them, and gone when they stop, 15 s after their last renew, or
 * when their tab closes. */
export interface DocumentLease {
  path: string[];
  clientId: string;
  actorId: string;
}

/** What opening a document live answers. */
export interface LiveDocument<TDocument = unknown> {
  document: TDocument;
  head: string;
  revision: number;
  members: DocumentMember[];
  leases: DocumentLease[];
  /** Frozen: nobody changes it until it is unlocked. Joining still shows it. */
  lock: DocumentLockView | null;
}

/** What saving answers. Nothing changed: nothing saved. */
export interface SavedDocument {
  head: string;
  saved: boolean;
}

export type LeaseAction = "acquire" | "renew" | "release";

/** What asking for leases answers. Not granted: heldBy says who has one of them, and none of them was taken. */
export interface LeaseAnswer {
  granted: boolean;
  heldBy: string | null;
  /** What the holder is doing, when a rule is why it wasn't granted. */
  why?: string;
}

/** What sending changes answers. Refused: nothing of them was applied, and why says what was refused. */
export interface SentChanges {
  revision: number;
  refused: string[];
  why: string | null;
  /** Refused because someone else is editing: who, and why says what they are doing. */
  heldBy: string | null;
}

/** What a document's room hears. */
export type DocumentRoomEvent<TDocument = unknown> =
  | { event: "presence"; data: { members: DocumentMember[] } }
  | { event: "changes"; data: { clientId: string | null; revision: number; changes: DocumentChange[] } }
  | { event: "leases"; data: { leases: DocumentLease[] } }
  | { event: "saved"; data: { head: string } }
  | { event: "reset"; data: { document: TDocument; head: string; revision: number } }
  | { event: "lock"; data: { lock: DocumentLockView | null } };

/** A document's lock: who froze it, and when. */
export interface DocumentLockView {
  id: string;
  kind: string;
  documentId: string;
  /** the document's title, as its kind says it */
  title: string | null;
  lockedBy: string;
  lockedByName: string;
  lockedAt: string;
}

/** A document's lock, and what the caller may do about it: the app's rules decide, the web only reads it. */
export interface DocumentLockState {
  lock: DocumentLockView | null;
  canLock: boolean;
  canUnlock: boolean;
}

/** A lock in the list, and whether the caller may unlock it: the app's rules decide, the web only reads it. */
export interface DocumentLockRow extends DocumentLockView {
  canUnlock: boolean;
}

/** A page of the locks the caller may see. */
export interface DocumentLockPage {
  rows: DocumentLockRow[];
  total: number;
}
