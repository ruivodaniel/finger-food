/**
 * Collaboration service — a document live: who is on it, their changes in the order accepted, and when it is saved.
 * Clients post changes; the server orders them, applies them and pushes them to the document's room. Clients never save:
 * the server does, at each checkpoint: the session goes quiet, the last client leaves, someone asks, or the cap on continuous
 * editing passes. Between saves the live document is only in memory. It knows no kind of document and doesn't know how one is
 * stored: what depends on that is the plugged-in kind's.
 */
import type { Actor, CollaborativeKind, DocumentRooms } from "../mount-types";
import { findConflict, type Conflict } from "../../shared/rules";
import type { LiveDocumentState, LiveDocuments, LiveLease } from "../shared/live-documents";
import type { ModuleErrors } from "../shared/module-errors";
import type { DocumentChange, DocumentLease, DocumentLockView, DocumentMember, LeaseAction, LeaseAnswer, LiveDocument, SavedDocument, SentChanges } from "../../shared/types";

const DEFAULT_QUIET_MS = 10_000;
const DEFAULT_CAP_MS = 10 * 60_000;
const DEFAULT_LEASE_MS = 15_000;

export interface CollaborationServiceDeps {
  liveDocuments: LiveDocuments;
  rooms: DocumentRooms;
  actorOf: (actorId: string) => Promise<Actor>;
  /** A document's lock as stored, whoever asks: read when it goes live. */
  lockOf: (kindName: string, id: string) => Promise<DocumentLockView | null>;
  errors: ModuleErrors;
  quietMs?: number;
  capMs?: number;
  leaseMs?: number;
}

/** Who is asking, as the app's middleware left it: handed to the kind, which answers what they may do. */
export interface Asker {
  scopedAc: unknown;
}

/** What a locked document answers someone trying to change it: "<who> is keeping this locked". */
const LOCKED_WHY = "keeping this locked";

/** Who sent changes. A whole document from outside the session has no client, and so holds no lease. */
interface ChangeSender {
  clientId: string | null;
  actorId: string;
}

/** What a client asks of the leases. The operation is what the rules are checked against, when it acquires. */
interface LeaseRequest {
  paths: string[][];
  action: LeaseAction;
  operation?: string;
}

/** Who asked for a save, and what they sent with it, for the kind. */
interface AskedSave {
  actorId: string;
  details: unknown;
}

const roomOfDocument = (kindName: string, id: string) => `doc:${kindName}:${id}`;
const roomOf = (live: LiveDocumentState) => roomOfDocument(live.kind.kind, live.id);
const leaseKeyOf = (path: string[]) => `${path[0]}/${path[1]}`;
const leasesOf = (live: LiveDocumentState): DocumentLease[] => [...live.leases.values()].map(({ path, clientId, actorId }) => ({ path, clientId, actorId }));
const membersOf = (live: LiveDocumentState): DocumentMember[] => [...live.members].map(([clientId, actorId]) => ({ clientId, actorId, actorName: live.actors.get(actorId)?.name ?? actorId, actorImage: live.actors.get(actorId)?.image ?? null }));

export class CollaborationService {
  private readonly kinds = new Map<string, CollaborativeKind>();

  private readonly deps: CollaborationServiceDeps;

  constructor(deps: CollaborationServiceDeps) {
    this.deps = deps;
  }

  /** A slice plugs its kind of document in, at mount. */
  registerKind(kind: CollaborativeKind): void {
    this.kinds.set(kind.kind, kind);
  }

  /** A kind a slice plugged in, or nothing. */
  getKind(kindName: string): CollaborativeKind | undefined {
    return this.kinds.get(kindName);
  }

  /** A client opens the document: it joins the room, and the document goes live if it isn't. Joining again reads it as it is now. */
  async join(kindName: string, id: string, client: { clientId: string; actorId: string }, asker: Asker): Promise<LiveDocument> {
    const kind = this.requireKind(kindName);
    await this.requireAccess(kind, id, asker, "read");
    const actor = await this.deps.actorOf(client.actorId);
    let live = this.deps.liveDocuments.get(kindName, id);
    if (!live) {
      const [first, lock] = await Promise.all([kind.load(id), this.deps.lockOf(kindName, id)]);
      live = this.deps.liveDocuments.get(kindName, id) ?? this.deps.liveDocuments.open(kind, id, first.document, first.head, lock);
    }
    const opened = live;
    return this.inOrder(opened, async () => {
      // the last client left while this waited: the document opens again
      if (this.deps.liveDocuments.get(kindName, id) !== opened) return this.join(kindName, id, client, asker);
      const stored = await kind.load(id);
      // the head moved outside the session (a restore): what is stored is the live document now, for everyone on it
      if (opened.head !== stored.head) await this.resetTo(opened, stored);
      const previousActor = opened.members.get(client.clientId);
      opened.members.set(client.clientId, client.actorId);
      opened.actors.set(client.actorId, actor);
      if (previousActor === undefined) this.deps.rooms.join(roomOf(opened), client.actorId);
      if (previousActor !== client.actorId) await this.pushPresence(opened);
      return { document: opened.document, head: opened.head, revision: opened.revision, members: membersOf(opened), leases: leasesOf(opened), lock: opened.lock };
    });
  }

  /** Someone looking at a document without editing it hears its room: a lock or an unlock, and who joins or leaves, as it
   * happens. Not a member: nobody sees them in its presence. Asks the kind for read, like joining. Their last tab
   * disconnecting drops it. Answers who is editing it now: presence is pushed only when that changes. */
  async watch(kindName: string, id: string, actorId: string, asker: Asker): Promise<{ members: DocumentMember[] }> {
    await this.requireAccess(this.requireKind(kindName), id, asker, "read");
    this.deps.rooms.join(roomOfDocument(kindName, id), actorId);
    const live = this.deps.liveDocuments.get(kindName, id);
    return { members: live ? membersOf(live) : [] };
  }

  /** Stops watching a document. */
  unwatch(kindName: string, id: string, actorId: string): void {
    this.deps.rooms.leave(roomOfDocument(kindName, id), actorId);
  }

  /** A client closes the document. When the last one leaves, everything is saved. */
  async leave(kindName: string, id: string, clientId: string): Promise<void> {
    const live = this.deps.liveDocuments.get(kindName, id);
    if (live?.members.has(clientId)) await this.leaveDocument(live, clientId);
  }

  /** One editor per path: a lease is taken when an edit starts, renewed while it lasts and released when it ends. A lease
   * another client holds isn't granted, and none of the paths asked for is taken. */
  async lease(kindName: string, id: string, clientId: string, { paths, action, operation }: LeaseRequest, asker: Asker): Promise<LeaseAnswer> {
    const live = this.requireMember(kindName, id, clientId);
    if (action !== "release") await this.requireAccess(live.kind, id, asker, "write");
    return this.inOrder(live, async () => {
      if (action === "release") {
        for (const path of paths) {
          const lease = live.leases.get(leaseKeyOf(path));
          if (lease?.clientId === clientId) this.dropLease(live, leaseKeyOf(path), lease);
        }
        await this.pushLeases(live);
        return { granted: true, heldBy: null };
      }
      if (live.lock) return { granted: false, heldBy: live.lock.lockedBy, why: LOCKED_WHY };
      const held = paths.map((path) => live.leases.get(leaseKeyOf(path))).find((lease) => lease && lease.clientId !== clientId);
      if (held) return { granted: false, heldBy: held.actorId };
      if (action === "acquire" && operation) {
        const conflict = this.findConflict(live, clientId, paths.map((path) => ({ itemId: path[1]!, operation })));
        if (conflict) return { granted: false, heldBy: conflict.holder, why: conflict.why };
      }
      const isNew = paths.some((path) => !live.leases.has(leaseKeyOf(path)));
      for (const path of paths) {
        const key = leaseKeyOf(path);
        clearTimeout(live.leases.get(key)?.expiry);
        live.leases.set(key, { path, clientId, actorId: live.members.get(clientId)!, expiry: this.expireLater(live, key) });
      }
      if (isNew) await this.pushLeases(live);
      return { granted: true, heldBy: null };
    });
  }

  /** Changes from one client: an opId already applied is skipped, a change on a path another client holds is refused, the
   * owner's rules run on the result, and what is accepted goes to the room. If two changes meet on a path, the last one
   * accepted wins. Refused, nothing of them is applied. A one-off change on a path nobody holds needs no lease. */
  async receiveChanges(kindName: string, id: string, clientId: string, changes: DocumentChange[], asker: Asker): Promise<SentChanges> {
    const live = this.requireMember(kindName, id, clientId);
    await this.requireAccess(live.kind, id, asker, "write");
    return this.inOrder(live, () => this.acceptChanges(live, { clientId, actorId: live.members.get(clientId)! }, changes));
  }

  /** Changes that only apply if nothing moved on since they were made, and that a client has already shown. Each one stands alone:
   * one whose path changed since, or that someone else's lease or a rule stops, is refused, and the others are applied. */
  async receiveChangesIfUnchanged(kindName: string, id: string, clientId: string, changes: DocumentChange[], asker: Asker): Promise<SentChanges> {
    const live = this.requireMember(kindName, id, clientId);
    await this.requireAccess(live.kind, id, asker, "write");
    return this.inOrder(live, async () => {
      const refused: string[] = [];
      const accepted: DocumentChange[] = [];
      let stoppedBy: Conflict | null = null;
      let document = live.document;
      for (const change of changes.filter((candidate) => !live.appliedOpIds.has(candidate.opId))) {
        const conflict = this.findChangeConflict(live, clientId, change);
        if (conflict) stoppedBy ??= conflict;
        if (conflict || !live.kind.stillHolds(document, change)) {
          refused.push(change.opId);
          continue;
        }
        document = live.kind.applyChanges(document, [change]);
        accepted.push(change);
      }
      const answer = await this.acceptChanges(live, { clientId, actorId: live.members.get(clientId)! }, accepted);
      return { revision: answer.revision, refused: [...refused, ...answer.refused], why: stoppedBy?.why ?? answer.why, heldBy: stoppedBy?.holder ?? answer.heldBy };
    });
  }

  /** Someone asks for a save: now, if anything changed, on their behalf, in the document's order. */
  async save(kindName: string, id: string, asked: AskedSave, asker: Asker): Promise<SavedDocument> {
    const kind = this.requireKind(kindName);
    await this.requireAccess(kind, id, asker, "write");
    const live = this.deps.liveDocuments.get(kindName, id);
    if (!live) return { head: (await kind.load(id)).head, saved: false };
    return this.inOrder(live, async () => {
      const saved = await this.writeLive(live, asked);
      return { head: live.head, saved };
    });
  }

  /** A whole document from outside the session. With the document live it goes in as changes from that actor, under the same
   * rules as anyone's: the answer is the document and head then. With nobody on it, nothing: storing it is its owner's. */
  async writeWholeIfLive(kindName: string, id: string, document: unknown, actorId: string): Promise<{ document: unknown; head: string } | null> {
    const live = this.deps.liveDocuments.get(kindName, id);
    if (!live) return null;
    return this.inOrder(live, async () => {
      const changes = live.kind.diff(live.document, document, () => crypto.randomUUID());
      const answer = changes.length ? await this.acceptChanges(live, { clientId: null, actorId }, changes) : null;
      if (answer?.heldBy) throw this.deps.errors.conflict(`${answer.heldBy} is ${answer.why}`);
      if (answer?.why) throw this.deps.errors.unprocessable(answer.why);
      return { document: live.document, head: live.head };
    });
  }

  /** A document was locked or unlocked. Live, the lock wins: what wasn't stored yet is dropped, every lease drops, and the
   * room gets the document as stored (a reset) and the lock: from then on, no lease and no change is taken. What a
   * checkpoint already stored stays. Unlocking tells the room. */
  async applyLock(kindName: string, id: string, lock: DocumentLockView | null): Promise<void> {
    const live = this.deps.liveDocuments.get(kindName, id);
    // nobody editing: those watching it hear it all the same
    if (!live) return this.deps.rooms.pushToRoom(roomOfDocument(kindName, id), { event: "lock", data: { lock } });
    await this.inOrder(live, async () => {
      if (lock) {
        for (const [key, lease] of [...live.leases]) this.dropLease(live, key, lease);
        await this.pushLeases(live);
        await this.resetTo(live, await live.kind.load(live.id));
      }
      live.lock = lock;
      await this.deps.rooms.pushToRoom(roomOf(live), { event: "lock", data: { lock } });
    });
  }

  /** An actor's last connection closed: every tab of theirs leaves every document it was on. */
  dropActor(actorId: string): void {
    for (const live of this.deps.liveDocuments.ofActor(actorId)) {
      for (const [clientId, memberActorId] of live.members) if (memberActorId === actorId) void this.leaveDocument(live, clientId);
    }
  }

  private requireMember(kindName: string, id: string, clientId: string): LiveDocumentState {
    const live = this.deps.liveDocuments.get(kindName, id);
    if (!live?.members.has(clientId)) throw this.deps.errors.notFound(`client ${clientId} isn't live on ${kindName} ${id}: join first`);
    return live;
  }

  private leaveDocument(live: LiveDocumentState, clientId: string): Promise<void> {
    return this.inOrder(live, async () => {
      const actorId = live.members.get(clientId);
      // left already, while this waited
      if (actorId === undefined) return;
      live.members.delete(clientId);
      this.deps.rooms.leave(roomOf(live), actorId);
      const hadLeases = this.dropLeasesOf(live, clientId);
      if (hadLeases && live.members.size > 0) await this.pushLeases(live);
      // those watching hear who is left, nobody included
      await this.pushPresence(live);
      if (live.members.size > 0) return;
      await this.writeLive(live);
      this.deps.liveDocuments.close(live);
    });
  }

  /** The kind's owner says whether the asker may: not readable is not found, so nobody learns it exists; read but not
   * written is forbidden. */
  private async requireAccess(kind: CollaborativeKind, id: string, asker: Asker, action: "read" | "write"): Promise<void> {
    if (!(await kind.access(asker.scopedAc, id, "read"))) throw this.deps.errors.notFound(`no ${kind.kind} ${id}`);
    if (action === "write" && !(await kind.access(asker.scopedAc, id, "write"))) throw this.deps.errors.forbidden(`not allowed to change ${kind.kind} ${id}`);
  }

  private requireKind(kindName: string): CollaborativeKind {
    const kind = this.kinds.get(kindName);
    if (!kind) throw this.deps.errors.notFound(`no collaborative kind ${kindName}`);
    return kind;
  }

  private async acceptChanges(live: LiveDocumentState, sender: ChangeSender, changes: DocumentChange[]): Promise<SentChanges> {
    const fresh = changes.filter((change) => !live.appliedOpIds.has(change.opId));
    if (fresh.length === 0) return { revision: live.revision, refused: [], why: null, heldBy: null };
    if (live.lock) return { revision: live.revision, refused: fresh.map((change) => change.opId), why: LOCKED_WHY, heldBy: live.lock.lockedBy };
    const heldByOther = fresh.map((change) => live.leases.get(leaseKeyOf(change.path))).find((lease) => lease && lease.clientId !== sender.clientId);
    if (heldByOther) return { revision: live.revision, refused: fresh.map((change) => change.opId), why: "editing this", heldBy: heldByOther.actorId };
    const conflict = this.findConflict(live, sender.clientId, fresh.flatMap((change) => live.kind.rules?.operationOf(change) ?? []));
    if (conflict) return { revision: live.revision, refused: fresh.map((change) => change.opId), why: conflict.why, heldBy: conflict.holder };
    const next = live.kind.applyChanges(live.document, fresh);
    const why = await live.kind.findRefusal(live.id, live.document, next);
    if (why) return { revision: live.revision, refused: fresh.map((change) => change.opId), why, heldBy: null };
    live.document = next;
    live.revision += 1;
    for (const change of fresh) live.appliedOpIds.add(change.opId);
    live.lastActorId = sender.actorId;
    live.unsaved = true;
    this.scheduleStoring(live);
    await this.deps.rooms.pushToRoom(roomOf(live), { event: "changes", data: { clientId: sender.clientId, revision: live.revision, changes: fresh } });
    return { revision: live.revision, refused: [], why: null, heldBy: null };
  }

  /** What stops one change: someone else's lease on its path, or a rule. */
  private findChangeConflict(live: LiveDocumentState, clientId: string, change: DocumentChange): Conflict | null {
    if (live.lock) return { holder: live.lock.lockedBy, why: LOCKED_WHY };
    const lease = live.leases.get(leaseKeyOf(change.path));
    if (lease && lease.clientId !== clientId) return { holder: lease.actorId, why: "editing this" };
    const attempt = live.kind.rules?.operationOf(change);
    return attempt ? this.findConflict(live, clientId, [attempt]) : null;
  }

  /** What a kind's rules refuse of these, on account of other clients' leases. A kind with no rules has none. */
  private findConflict(live: LiveDocumentState, clientId: string | null, attempts: { itemId: string; operation: string }[]): Conflict | null {
    const rules = live.kind.rules;
    if (!rules) return null;
    const leases = [...live.leases.values()].filter((lease) => lease.clientId !== clientId).map((lease) => ({ itemId: lease.path[1]!, holder: lease.actorId }));
    for (const { itemId, operation } of attempts) {
      const conflict = findConflict({ document: live.document, rules, itemId, operation, leases });
      if (conflict) return conflict;
    }
    return null;
  }

  private inOrder<TResult>(live: LiveDocumentState, run: () => Promise<TResult>): Promise<TResult> {
    const result = live.queue.then(run);
    live.queue = result.catch(() => undefined);
    return result;
  }

  private expireLater(live: LiveDocumentState, key: string): ReturnType<typeof setTimeout> {
    return setTimeout(() => {
      void this.inOrder(live, async () => {
        const lease = live.leases.get(key);
        if (!lease) return;
        this.dropLease(live, key, lease);
        await this.pushLeases(live);
      });
    }, this.deps.leaseMs ?? DEFAULT_LEASE_MS);
  }

  private dropLease(live: LiveDocumentState, key: string, lease: LiveLease): void {
    clearTimeout(lease.expiry);
    live.leases.delete(key);
  }

  /** Whether it held any. */
  private dropLeasesOf(live: LiveDocumentState, clientId: string): boolean {
    const held = [...live.leases].filter(([, lease]) => lease.clientId === clientId);
    for (const [key, lease] of held) this.dropLease(live, key, lease);
    return held.length > 0;
  }

  private pushLeases(live: LiveDocumentState): Promise<void> {
    return this.deps.rooms.pushToRoom(roomOf(live), { event: "leases", data: { leases: leasesOf(live) } });
  }

  private pushPresence(live: LiveDocumentState): Promise<void> {
    return this.deps.rooms.pushToRoom(roomOf(live), { event: "presence", data: { members: membersOf(live) } });
  }

  /** What was stored outside the session is the live document now, for everyone on it. What wasn't saved is dropped. */
  private async resetTo(live: LiveDocumentState, stored: { document: unknown; head: string }): Promise<void> {
    this.clearStoring(live);
    live.document = stored.document;
    live.head = stored.head;
    live.revision += 1;
    live.unsaved = false;
    await this.deps.rooms.pushToRoom(roomOf(live), { event: "reset", data: { document: stored.document, head: stored.head, revision: live.revision } });
  }

  private clearStoring(live: LiveDocumentState): void {
    clearTimeout(live.quietTimer);
    clearTimeout(live.capTimer);
    live.quietTimer = live.capTimer = undefined;
  }

  /** After an accepted change: the quiet checkpoint counted from this change, and the cap from the first one not saved. */
  private scheduleStoring(live: LiveDocumentState): void {
    live.capTimer ??= setTimeout(() => this.inBackground(live, () => this.writeLive(live)), this.deps.capMs ?? DEFAULT_CAP_MS);
    this.scheduleQuiet(live);
  }

  private scheduleQuiet(live: LiveDocumentState): void {
    clearTimeout(live.quietTimer);
    live.quietTimer = setTimeout(() => {
      this.inBackground(live, async () => {
        // someone is still editing: not quiet yet
        if (live.leases.size > 0) this.scheduleQuiet(live);
        else await this.writeLive(live);
      });
    }, this.deps.quietMs ?? DEFAULT_QUIET_MS);
  }

  private inBackground(live: LiveDocumentState, run: () => Promise<unknown>): void {
    void this.inOrder(live, run).catch((error: unknown) => console.error(`${live.kind.kind} ${live.id}: storing failed`, error));
  }

  /** Writes the live document, in the document's order, on behalf of who asked or of whoever made the last change. Never when
   * nothing changed. What was stored outside the session since wins. Answers whether it wrote. */
  private async writeLive(live: LiveDocumentState, asked?: AskedSave): Promise<boolean> {
    const actorId = asked?.actorId ?? live.lastActorId;
    if (!live.unsaved || !actorId) return false;
    const stored = await live.kind.load(live.id);
    if (stored.head !== live.head) {
      await this.resetTo(live, stored);
      return false;
    }
    live.head = await live.kind.save(live.id, live.document, actorId, asked?.details);
    this.clearStoring(live);
    live.unsaved = false;
    await this.deps.rooms.pushToRoom(roomOf(live), { event: "saved", data: { head: live.head } });
    return true;
  }
}
