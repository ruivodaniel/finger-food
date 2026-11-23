/**
 * Mount types — what the app hands the slice, what it gets back, and what a slice plugs in for its kind of document.
 */
import type { Ac, GatedDb, SchemaTables } from "@libs/gated-scoped-ac";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { Hono } from "hono";
import type { CollaborationService } from "./services/collaboration.service";
import type { DocumentLockService } from "./services/document-lock.service";
import type { ModuleErrors } from "./shared/module-errors";
import type { DocumentRules } from "../shared/rules";
import type { DocumentChange } from "../shared/types";
import type { CollaborationEnv } from "./types";

/** What a slice plugs in so that its documents can be edited live. This slice knows no kind of document, and how a document
 * is stored and what it allows are its owner's: these are the steps the engine can't do itself. */
export interface CollaborativeKind<TDocument = unknown> {
  /** the name in the routes and the rooms: tab_document */
  kind: string;
  /** Whether the asker may read the document (join it, see it live) or write it (lease, change, save). The owner's rules
   * answer: `scopedAc` is the request's access context, handed over unread. Not readable: 404; not writable: 403. */
  access(scopedAc: unknown, documentId: string, action: "read" | "write"): Promise<boolean>;
  /** Documents' titles, by id, for the locks list. A document with none is left out. */
  titlesOf?(ids: string[]): Promise<Map<string, string>>;
  /** The stored document and its head. Throws what it throws for one that isn't there. */
  load(id: string): Promise<{ document: TDocument; head: string }>;
  applyChanges(document: TDocument, changes: DocumentChange[]): TDocument;
  /** The changes from one document to another: a whole document written from outside the session. */
  diff(current: TDocument, next: TDocument, newOpId: () => string): DocumentChange[];
  /** Whether a change still applies to what it was made from: what is at its path is what it says was there before. */
  stillHolds(document: TDocument, change: DocumentChange): boolean;
  /** Is the result allowed? Why not, in words, or nothing. */
  findRefusal(id: string, current: TDocument, next: TDocument): Promise<string | null>;
  /** Rules beyond one editor per item, if this kind has any: the answers about its structure. */
  rules?: DocumentRules<TDocument>;
  /** Stores the document, on behalf of an actor. Answers the head it is at now. Details are what a client sent with an asked-for
   * save: this slice passes them through and never reads them. A checkpoint has none. */
  save(id: string, document: TDocument, actorId: string, details?: unknown): Promise<string>;
}

/** What this slice asks of the app's realtime: rooms are names it owns, and their members are actors. An actor joins once per
 * tab on the document and leaves once per tab: the room counts them, and keeps the actor until their last tab leaves. */
export interface DocumentRooms {
  join(room: string, actorId: string): void;
  leave(room: string, actorId: string): void;
  pushToRoom(room: string, options: { event: string; data: unknown }): Promise<void>;
}

export interface MountCollaborationApiOptions {
  rooms: DocumentRooms;
  /** Who an actor is, for the presence bar, the toast and the locks list: read when they join, or lock. */
  actorOf: (actorId: string) => Promise<Actor>;
  /** The app's scoped-AC engine: who may see, lock and unlock is its rules on document_lock. */
  engine: Pick<Ac, "allowCreate" | "resolveRead" | "resolveDelete">;
  /** The app's gated-db factory: bag -> a bag-bound handle, which the locks are read and written through. Its `ungated()`
   * is where a live document reads its own lock: a lock freezes the document for everyone, whoever asks. */
  gatedDb: GatedDbWithUngated;
  /** Ids for locks, made the way the app makes every id. */
  createId: () => string;
  errors: ModuleErrors;
  /** How long a lease lasts without a renew. Default 15 s. */
  leaseMs?: number;
  /** No lease held and no change for this long is a checkpoint. Default 10 s. */
  quietMs?: number;
  /** Continuous editing is saved after this long. Default 10 minutes. */
  capMs?: number;
}

/** Who an actor is, as the app knows them: their name, and their picture when they have one. */
export interface Actor {
  name: string;
  image: string | null;
}

/** A gated-db factory, and the one ungated path of the app's db. */
export type GatedDbWithUngated = ((bag: unknown) => GatedDb<SchemaTables>) & { ungated(): Pick<PgDatabase<PgQueryResultHKT>, "select"> };

export interface MountCollaborationApiResult {
  /** Mount under /collaboration. */
  router: Hono<CollaborationEnv>;
  services: { collaboration: CollaborationService; locks: DocumentLockService };
}
