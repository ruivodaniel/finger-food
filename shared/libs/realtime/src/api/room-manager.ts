import type { ConnectionManager } from "./connection-manager";
import type { PushOptions } from "../types";

type Push = (userId: string, options: PushOptions) => Promise<void>;

/**
 * Room manager — server-side membership for per-resource channels.
 *
 * A "room" is an opaque string the consumer owns (e.g. `note:<id>`). The
 * consumer authorizes a user once, then `join`s them; thereafter `pushToRoom`
 * delivers to every member with no per-message check. Membership is refcounted
 * per `(room, userId)` so multiple tabs / SPA re-mounts of the same resource
 * coexist — a `leave` from one only drops the user when the count hits zero.
 *
 * Delivery is delegated to the injected `push` (which fans out to all of a
 * user's streams, no-ops when offline, and swallows per-stream failures), so
 * this module never touches SSE streams directly.
 */
export interface RoomManager {
  /** Add a user to a room (refcounted). */
  join(room: string, userId: string): void;
  /** Drop one reference; removes the user at zero. No-op if absent. */
  leave(room: string, userId: string): void;
  /** Force-remove a user from a room regardless of refcount (e.g. on revoke). */
  removeUserFromRoom(room: string, userId: string): void;
  /** Drop a user from every room (called on disconnect). */
  removeUserFromAllRooms(userId: string): void;
  /** Deliver an event to every member of a room. Fire-and-forget friendly. */
  pushToRoom(
    room: string,
    options: { event: string; data: unknown },
  ): Promise<void>;
  /** Member user ids of a room (debug/introspection). */
  listUsersInRoom(room: string): string[];
}

export function createRoomManager(
  manager: ConnectionManager,
  push: Push,
): RoomManager {
  // room -> (userId -> refCount)
  const rooms = new Map<string, Map<string, number>>();
  // userId -> set of rooms (reverse index for O(rooms-per-user) disconnect)
  const userRooms = new Map<string, Set<string>>();

  function link(room: string, userId: string): void {
    let set = userRooms.get(userId);
    if (!set) {
      set = new Set();
      userRooms.set(userId, set);
    }
    set.add(room);
  }

  function unlink(room: string, userId: string): void {
    const set = userRooms.get(userId);
    if (!set) return;
    set.delete(room);
    if (set.size === 0) userRooms.delete(userId);
  }

  function drop(room: string, userId: string): void {
    const members = rooms.get(room);
    if (!members) return;
    members.delete(userId);
    if (members.size === 0) rooms.delete(room);
    unlink(room, userId);
  }

  const roomManager: RoomManager = {
    join(room, userId) {
      let members = rooms.get(room);
      if (!members) {
        members = new Map();
        rooms.set(room, members);
      }
      members.set(userId, (members.get(userId) ?? 0) + 1);
      link(room, userId);
    },

    leave(room, userId) {
      const members = rooms.get(room);
      const count = members?.get(userId);
      if (!members || count === undefined) return; // idempotent
      if (count <= 1) {
        drop(room, userId);
      } else {
        members.set(userId, count - 1);
      }
    },

    removeUserFromRoom(room, userId) {
      drop(room, userId);
    },

    removeUserFromAllRooms(userId) {
      const set = userRooms.get(userId);
      if (!set) return;
      for (const room of [...set]) {
        const members = rooms.get(room);
        members?.delete(userId);
        if (members && members.size === 0) rooms.delete(room);
      }
      userRooms.delete(userId);
    },

    async pushToRoom(room, options) {
      const members = rooms.get(room);
      if (!members || members.size === 0) return;
      await Promise.allSettled(
        [...members.keys()].map((userId) =>
          push(userId, {
            channel: room,
            event: options.event,
            data: options.data,
          }),
        ),
      );
    },

    listUsersInRoom(room) {
      return [...(rooms.get(room)?.keys() ?? [])];
    },
  };

  // Clear a user's room membership the moment their last stream closes.
  manager.onUserDisconnected((userId) =>
    roomManager.removeUserFromAllRooms(userId),
  );

  return roomManager;
}
