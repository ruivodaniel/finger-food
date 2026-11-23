// A document edited live in this tab: sends this tab's changes in ~50 ms batches and applies everyone else's as the room
// hands them over. The server orders the changes and stores what it decides: this tab never saves. While this tab edits a
// path it holds a lease on it, renewed every 5 s, so that nobody else edits it. What a document is, the caller says.
//
// Plain data in the service, not React state: the store shows what a component needs, this keeps what is on its way.
import { createUndoHistory } from "@libs/knowledge/undo";
import type { DocumentChange } from "../../../shared/types";
import { liveDocuments } from "../../store/live-documents.store";
import { collaborationService } from "./collaboration.service";

const SEND_AFTER_MS = 50;
const RETRY_AFTER_MS = 1000;
const RENEW_EVERY_MS = 5000;
const TOAST_MS = 3000;

/** What a kind of document is, for the web: how two versions differ, and how changes apply. */
export interface DocumentShape<TDocument> {
  diff: (current: TDocument, next: TDocument, newOpId: () => string) => DocumentChange[];
  apply: (document: TDocument, changes: DocumentChange[]) => TDocument;
}

/** Runs a membership call after the ones before it, so that a leave never overtakes the join after it. */
export type Enqueue = <R>(task: () => Promise<R>) => Promise<R>;

export type LiveSession<TDocument> = ReturnType<typeof createLiveSession<TDocument>>;

const newOpId = () => crypto.randomUUID();

export function createLiveSession<TDocument>(key: string, kind: string, id: string, enqueue: Enqueue) {
  let shape: DocumentShape<TDocument> | null = null;
  // the document as this tab shows it: changes are diffed against it
  let shown: TDocument | null = null;
  // this tab's changes the server hasn't answered in the room yet: everyone else's are applied under them
  let unconfirmed: DocumentChange[] = [];
  let toSend: DocumentChange[] = [];
  let sending = false;
  let sendTimer: ReturnType<typeof setTimeout> | undefined;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  // the paths this tab is editing now, by their JSON: an edit can start twice (a drag on a node whose editor is open)
  const editing = new Map<string, number>();
  // this tab's own edits, to undo and to redo: gone when the document is closed
  const history = createUndoHistory(newOpId);
  // an undo or redo goes out one at a time
  let historyQueue: Promise<unknown> = Promise.resolve();

  const shapeOf = () => {
    if (!shape) throw new Error(`collaboration: ${key} has no shape`);
    return shape;
  };

  const show = (next: TDocument) => {
    shown = next;
    liveDocuments.showDocument(key, next);
  };

  /** Who an actor is, by name: a holder is always one of the members. */
  const nameOf = (actorId: string) => liveDocuments.read(key).members.find((member) => member.actorId === actorId)?.actorName ?? actorId;

  function showHeld(holder: string, why = "editing this") {
    liveDocuments.showHeld(key, `${holder} is ${why}`);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => liveDocuments.showHeld(key, null), TOAST_MS);
  }

  // renewed by the editor while it edits, never by a heartbeat: from the join until the document is closed
  let renew: ReturnType<typeof setInterval> | undefined;
  function startRenewing() {
    renew ??= setInterval(() => {
      if (editing.size === 0) return;
      void collaborationService.sendLease(kind, id, [...editing.keys()].map((pathKey) => JSON.parse(pathKey) as string[]), "renew").catch(() => undefined);
    }, RENEW_EVERY_MS);
  }

  function join(): Promise<void> {
    startRenewing();
    return enqueue(() => collaborationService.join<TDocument>(kind, id)).then((live) => {
      liveDocuments.setMembers(key, live.members);
      liveDocuments.setLeases(key, live.leases);
      liveDocuments.setLock(key, live.lock);
      // what this tab still has on its way goes on top of what the server has
      show(shapeOf().apply(live.document, unconfirmed));
      liveDocuments.setStatus(key, "live");
    }).catch((error: unknown) => {
      liveDocuments.setStatus(key, "failed", error instanceof Error ? error.message : "The document couldn't be opened.");
    });
  }

  function sendLater(afterMs: number) {
    if (sendTimer !== undefined) return;
    sendTimer = setTimeout(() => {
      sendTimer = undefined;
      void send();
    }, afterMs);
  }

  async function send(): Promise<void> {
    if (sending || toSend.length === 0) return;
    const batch = toSend;
    toSend = [];
    sending = true;
    liveDocuments.setStatus(key, "sending");
    try {
      const answer = await collaborationService.sendChanges(kind, id, batch);
      if (answer.heldBy) {
        // someone else holds it: back to the document as it is, and say who
        const refused = new Set(answer.refused);
        unconfirmed = unconfirmed.filter((change) => !refused.has(change.opId));
        history.forgetChanges(refused);
        showHeld(nameOf(answer.heldBy), answer.why ?? undefined);
        await join();
      } else if (answer.refused.length > 0) {
        // the server has none of them: read the document as it is, without them
        const refused = new Set(answer.refused);
        unconfirmed = unconfirmed.filter((change) => !refused.has(change.opId));
        history.forgetChanges(refused);
        await join();
        liveDocuments.setStatus(key, "refused", answer.why);
      } else if (toSend.length === 0) {
        liveDocuments.setStatus(key, "live");
      }
    } catch (error) {
      // the same opIds again: the server applies a retried change once
      toSend = [...batch, ...toSend];
      liveDocuments.setStatus(key, "reconnecting");
      // the server doesn't know this tab (it started again): join first
      if (error instanceof Error && "status" in error && error.status === 404) await join();
      sendLater(RETRY_AFTER_MS);
    } finally {
      sending = false;
    }
    if (toSend.length > 0) sendLater(SEND_AFTER_MS);
  }

  function change(next: TDocument) {
    if (shown === null) return;
    const changes = shapeOf().diff(shown, next, newOpId);
    show(next);
    if (changes.length === 0) return;
    unconfirmed = [...unconfirmed, ...changes];
    toSend = [...toSend, ...changes];
    sendLater(SEND_AFTER_MS);
    history.recordEdit(changes, editing.size > 0);
  }

  /** Shows an undo or redo at once and sends it. What the server refuses goes back to what the server has and leaves the
   * history. A path that changed since says nothing; someone holding it, or a rule, says who. */
  function sendInverse(inverse: DocumentChange[] | null) {
    if (!inverse || shown === null) return;
    unconfirmed = [...unconfirmed, ...inverse];
    show(shapeOf().apply(shown, inverse));
    historyQueue = historyQueue.then(async () => {
      // what is on its way goes first
      while (sending) await new Promise((resolve) => setTimeout(resolve, SEND_AFTER_MS));
      await send();
      const answer = await collaborationService.sendChangesIfUnchanged(kind, id, inverse).catch(() => null);
      const refused = new Set(answer ? answer.refused : inverse.map((change) => change.opId));
      if (refused.size === 0) return;
      unconfirmed = unconfirmed.filter((change) => !refused.has(change.opId));
      history.forgetChanges(refused);
      if (answer?.heldBy) showHeld(nameOf(answer.heldBy), answer.why ?? undefined);
      await join();
    });
  }

  function editStart(paths: string[][], operation?: string) {
    const started = paths.filter((path) => {
      const pathKey = JSON.stringify(path);
      const count = editing.get(pathKey) ?? 0;
      editing.set(pathKey, count + 1);
      return count === 0;
    });
    if (started.length === 0) return;
    void collaborationService.sendLease(kind, id, started, "acquire", operation).then((answer) => {
      if (answer.heldBy) showHeld(nameOf(answer.heldBy), answer.why);
    }).catch(() => undefined);
  }

  function editEnd(paths: string[][]) {
    const ended = paths.filter((path) => {
      const pathKey = JSON.stringify(path);
      const count = editing.get(pathKey) ?? 0;
      if (count > 1) editing.set(pathKey, count - 1);
      else editing.delete(pathKey);
      return count === 1;
    });
    if (editing.size === 0) history.endEdit();
    if (ended.length === 0) return;
    // what the edit changed goes first: the lease is given back after it
    setTimeout(() => {
      void send().then(() => collaborationService.sendLease(kind, id, ended, "release")).catch(() => undefined);
    }, SEND_AFTER_MS);
  }


  return {
    /** What the document is: the latest caller's word. */
    setShape(next: DocumentShape<TDocument>) {
      shape = next;
    },
    join,
    /** What is on its way goes first, then this tab leaves. */
    leave(): Promise<void> {
      clearTimeout(sendTimer);
      sendTimer = undefined;
      return enqueue(() => send().then(() => collaborationService.leave(kind, id))).then(() => undefined, () => undefined);
    },
    /** Changes the room handed over: this tab's own are confirmed, everyone else's go under what this tab has on its way. */
    received(changes: DocumentChange[]) {
      if (shown === null) return;
      const arrived = new Set(changes.map((confirmed) => confirmed.opId));
      const isOwn = unconfirmed.some((own) => arrived.has(own.opId));
      unconfirmed = unconfirmed.filter((own) => !arrived.has(own.opId));
      if (isOwn) return;
      const { apply } = shapeOf();
      show(apply(apply(shown, changes), unconfirmed));
    },
    /** What was stored outside the session is the document now: nothing here applies to it. */
    reset(document: TDocument) {
      unconfirmed = [];
      toSend = [];
      history.clear();
      show(document);
    },
    change,
    undo: () => sendInverse(history.takeUndo()),
    redo: () => sendInverse(history.takeRedo()),
    editStart,
    editEnd,
    showHeld,
    /** What is on its way goes first, so that the save holds it. The details are the kind's to read. */
    async save(details: object) {
      await send();
      return collaborationService.save(kind, id, details);
    },
    /** The document is closed in this tab: nothing runs for it any more. */
    dispose() {
      clearInterval(renew);
      renew = undefined;
      clearTimeout(sendTimer);
      clearTimeout(toastTimer);
    },
  };
}
