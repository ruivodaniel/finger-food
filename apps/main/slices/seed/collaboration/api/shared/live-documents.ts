// The live documents, in memory, one API process: per document its state, head, revision, who is on it, and the opIds applied.
// The stream of changes is never stored: what is stored is written by the collaboration service alone.
import type { Actor, CollaborativeKind } from "../mount-types";
import type { DocumentLockView } from "../../shared/types";

export interface LiveLease {
  path: string[];
  clientId: string;
  actorId: string;
  expiry: ReturnType<typeof setTimeout>;
}

export interface LiveDocumentState {
  kind: CollaborativeKind;
  id: string;
  document: unknown;
  head: string;
  /** one more for each batch of changes accepted */
  revision: number;
  /** by client id: the actor */
  members: Map<string, string>;
  /** by actor id: who they are, as the app said it when they joined */
  actors: Map<string, Actor>;
  appliedOpIds: Set<string>;
  /** One editor per path, by its first two segments: "nodes/n42". */
  leases: Map<string, LiveLease>;
  /** Changes not saved yet. */
  unsaved: boolean;
  /** The session going quiet, and the cap on continuous editing. */
  quietTimer?: ReturnType<typeof setTimeout>;
  capTimer?: ReturnType<typeof setTimeout>;
  /** Who made the last change: who a checkpoint saves on behalf of. */
  lastActorId?: string;
  /** Frozen until unlocked: no lease and no change is taken. */
  lock: DocumentLockView | null;
  /** Everything on a document runs in the order it arrived, one at a time. */
  queue: Promise<unknown>;
}

const keyOf = (kindName: string, id: string) => `${kindName}/${id}`;

export class LiveDocuments {
  private readonly documents = new Map<string, LiveDocumentState>();

  get(kindName: string, id: string): LiveDocumentState | undefined {
    return this.documents.get(keyOf(kindName, id));
  }

  open(kind: CollaborativeKind, id: string, document: unknown, head: string, lock: DocumentLockView | null): LiveDocumentState {
    const live: LiveDocumentState = { kind, id, document, head, revision: 0, members: new Map(), actors: new Map(), appliedOpIds: new Set(), leases: new Map(), unsaved: false, lock, queue: Promise.resolve() };
    this.documents.set(keyOf(kind.kind, id), live);
    return live;
  }

  close(live: LiveDocumentState): void {
    clearTimeout(live.quietTimer);
    clearTimeout(live.capTimer);
    for (const lease of live.leases.values()) clearTimeout(lease.expiry);
    this.documents.delete(keyOf(live.kind.kind, live.id));
  }

  /** The documents an actor is on, in any of their tabs. */
  ofActor(actorId: string): LiveDocumentState[] {
    return [...this.documents.values()].filter((live) => [...live.members.values()].includes(actorId));
  }
}
