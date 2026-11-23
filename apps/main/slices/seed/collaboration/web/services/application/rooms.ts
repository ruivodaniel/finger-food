// The documents open in this tab, and their rooms on the app's real-time connection. The one place the slice hears room
// events: each goes to the query cache (a lock) or to the store (who is on it, what they hold, the document itself).
//
// A document is open for editing (joined: this tab is a member) or for watching (its locks and who is on it, nothing
// held). Components open and close it through the hooks; however many do, the server hears one join or one watch, and
// the last close leaves. Opening and closing settle a tick later, so that a close followed at once by an open (React's
// StrictMode, a page handing over to another) leaves the room as it was.
import type { DocumentRoomEvent } from "../../../shared/types";
import { liveDocuments } from "../../store/live-documents.store";
import { collaborationService } from "./collaboration.service";
import { createLiveSession, type Enqueue, type LiveSession } from "./live-session";
import { locksService } from "./locks.service";
import { mountedApp, type CollaborationRealtime } from "./mount";

type Entered = "edit" | "watch" | null;

interface Room {
  kind: string;
  id: string;
  editors: number;
  watchers: number;
  /** What the server knows of this tab on the document now. */
  entered: Entered;
  /** Join, leave, watch and unwatch go out one after the other. */
  enqueue: Enqueue;
  off: () => void;
  session: LiveSession<unknown> | null;
  syncing: boolean;
  /** A presence event came since the last watch was asked for: newer than the watch's answer, which is then ignored. */
  presenceSeen: boolean;
}

const rooms = new Map<string, Room>();

export const keyOf = (kind: string, id: string) => `${kind}:${id}`;

function roomOf(kind: string, id: string): Room {
  const key = keyOf(kind, id);
  const existing = rooms.get(key);
  if (existing) return existing;
  let queue: Promise<unknown> = Promise.resolve();
  const enqueue: Enqueue = (task) => {
    const run = queue.then(task);
    queue = run.catch(() => undefined);
    return run;
  };
  // the room: subscribed before entering, so nothing after the answer is missed
  const off = mountedApp().realtime.subscribe(`doc:${key}`, (event) => onRoomEvent(key, event as unknown as DocumentRoomEvent));
  const room: Room = { kind, id, editors: 0, watchers: 0, entered: null, enqueue, off, session: null, syncing: false, presenceSeen: false };
  rooms.set(key, room);
  return room;
}

function onRoomEvent(key: string, { event, data }: DocumentRoomEvent) {
  const room = rooms.get(key);
  if (!room) return;
  if (event === "presence") {
    room.presenceSeen = true;
    liveDocuments.setMembers(key, data.members);
  }
  if (event === "leases") liveDocuments.setLeases(key, data.leases);
  if (event === "lock") {
    liveDocuments.setLock(key, data.lock);
    // every lock this page shows, the document's and a list's
    void locksService.refresh();
  }
  if (room.entered !== "edit" || !room.session) return;
  if (event === "changes") room.session.received(data.changes);
  if (event === "reset") room.session.reset(data.document);
}

function scheduleSync(room: Room) {
  if (room.syncing) return;
  room.syncing = true;
  setTimeout(() => {
    room.syncing = false;
    sync(room);
  }, 0);
}

/** Tells the server what this tab wants of the document now, if that changed. */
function sync(room: Room) {
  const wanted: Entered = room.editors > 0 ? "edit" : room.watchers > 0 ? "watch" : null;
  // entering waits for the stream: the server pushes the room's events on it
  if (wanted !== null && !mountedApp().realtime.connected) return;
  if (wanted === room.entered) {
    if (wanted === null) close(room);
    return;
  }
  const was = room.entered;
  room.entered = wanted;
  if (was === "edit") void room.session!.leave();
  if (was === "watch" && wanted === null) void room.enqueue(() => collaborationService.unwatch(room.kind, room.id)).catch(() => undefined);
  if (wanted === "edit") void room.session!.join();
  if (wanted === "watch") {
    // read what was missed before the watch: who is on it now (unless the room said so since), and its lock
    room.presenceSeen = false;
    void room
      .enqueue(() => collaborationService.watch(room.kind, room.id))
      .then(({ members }) => {
        if (room.entered === "watch" && !room.presenceSeen) liveDocuments.setMembers(keyOf(room.kind, room.id), members);
        return locksService.refreshState(room.kind, room.id);
      })
      .catch(() => undefined);
  }
  if (wanted === null) close(room);
}

function close(room: Room) {
  room.off();
  room.session?.dispose();
  rooms.delete(keyOf(room.kind, room.id));
  liveDocuments.drop(keyOf(room.kind, room.id));
}

/** The document's live session in this tab: one, whoever edits it. Entered only once opened for editing. */
export function sessionFor<TDocument>(kind: string, id: string): LiveSession<TDocument> {
  const room = roomOf(kind, id);
  room.session ??= createLiveSession<unknown>(keyOf(kind, id), kind, id, room.enqueue);
  return room.session as LiveSession<TDocument>;
}

/** Opens a document for editing in this tab: joined, and its changes applied as they arrive. */
export function openForEditing(kind: string, id: string, session: LiveSession<unknown>): void {
  const room = roomOf(kind, id);
  room.session ??= session;
  room.editors += 1;
  scheduleSync(room);
}

export function closeForEditing(kind: string, id: string): void {
  const room = rooms.get(keyOf(kind, id));
  if (!room) return;
  room.editors = Math.max(0, room.editors - 1);
  scheduleSync(room);
}

/** Opens a document for watching in this tab: its locks and who is on it, as they change. */
export function openForWatching(kind: string, id: string): void {
  const room = roomOf(kind, id);
  room.watchers += 1;
  scheduleSync(room);
}

export function closeForWatching(kind: string, id: string): void {
  const room = rooms.get(keyOf(kind, id));
  if (!room) return;
  room.watchers = Math.max(0, room.watchers - 1);
  scheduleSync(room);
}

/** At mount. Each connection is a new one for the server: it forgot this tab, so every open document is entered again, and
 * what a lock did meanwhile is read again. */
export function listenToConnection(realtime: CollaborationRealtime): void {
  realtime.onConnected(() => {
    for (const room of rooms.values()) {
      room.entered = null;
      sync(room);
    }
    void locksService.refresh();
  });
}
