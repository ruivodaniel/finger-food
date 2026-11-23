# collaboration — docs

A document edited live by several people: who is on it, one editor per item, their changes in one order, undo per tab,
and when what is live gets stored. And a document frozen by a lock until someone allowed unlocks it. The slice owns none
of the documents. A product slice plugs a kind of document in, and stores it itself when the slice says so. Its one
table is `document_lock`.

Moved from the canvas-versioning spike (`_meta/spikes/canvas-versioning`, `slices/seed/collaboration`). The design is
slice-design's transition-to-prowd v49 and versioning-proof v37. It knows nothing of versions or of a canvas. Locks are
new here: v37 has leases, not locks.

**Collaboration never touches a document's table.** It decides *when* to store; the product's kind decides *what* and
runs the write; versioning, if the product uses it, decides *how* (a new version).

```
a client     POST /collaboration/:kind/:id/changes
   ▼
the engine   in memory: asks the kind for write, checks the lock, leases and rules, applies, pushes to the room doc:<kind>:<id>
   │         a checkpoint: quiet for 10 s, the last tab leaves, someone asks, or 10 minutes of continuous editing
   ▼
the kind     kind.save(id, document, actorId, details?)    the product's repository writes
```

## A kind of document

What a product slice plugs in, with `collaboration.services.collaboration.registerKind(kind)` in `core/api/src/mounts.ts`
(meteors: `registerKind(meteors.live)`). The product describes it in its own words; it imports nothing of this slice.

| Step | What it answers |
| --- | --- |
| `access(scopedAc, id, action)` | Whether the asker may `"read"` (join, watch) or `"write"` (leases, changes, save): the owner's rules, with the request's access context handed over unread. |
| `load(id)` | The stored document and its head (any string that changes when it is stored again). |
| `applyChanges(document, changes)` | The document with changes applied. |
| `diff(current, next, newOpId)` | The changes from one to the other: a whole document written from outside the session. |
| `stillHolds(document, change)` | Whether a change still applies: what is at its path is its `before`. Used by undo. |
| `findRefusal(id, current, next)` | Why the result isn't allowed, or nothing. |
| `save(id, document, actorId, details?)` | Stores it, and answers the new head. |
| `titlesOf?(ids)` | Documents' titles, for the locks list. |
| `rules?` | The answers about its structure, when it has rules beyond one editor per item (`shared/rules.ts`). |

A change is `{ opId, path, before, after }`, by id, never by position. A lease is on a path's first two segments.

## Who is who, and who may

- A **client** is a browser tab: an id made once per page load in `core/web/src/config/collaboration.config.ts`, sent
  by the slice as `x-client`. Members, leases and undo are per client.
- Its **actor** is the session's user. A document's room is joined by the actor, once per tab, and the app's room manager
  keeps the actor in it until their last tab leaves. Each tab skips its own changes by `clientId`, which the events
  carry.
- When a user's last realtime stream closes, `dropActor` takes every tab of theirs off every document.
- Names and pictures come from the server: `actorOf` reads the user's profile (name, image) when they join or lock;
  members carry both, locks the name.
- The kind is asked on every call, not once at join: an unlock or a role change takes effect without a rejoin. Not
  readable: 404, so nobody learns the document exists. Read but not written: 403.

## Locks

A lock freezes a whole document until someone allowed unlocks it: one per document, stored in `document_lock` (kind,
document id, who, when), deleted on unlock.

- **Who may** is the app's access rules on the entity `document_lock`, a create to lock and a delete to unlock
  (`shared/configs/access-control`). For meteors: a company's members see its locks (`read_lock_company`), its managers
  and owners lock and unlock any of them (`create_lock_company`, `delete_lock_company`), and a system admin sees and
  unlocks every company's (`read_all_locks_system`, `delete_all_locks_system`). The locks are read and written through
  the gate only; the rules reach the document through a join, on the gate's db.
- **While locked**, joining and watching still work and answer the lock; every lease and change is refused, with the
  locker as `heldBy` and "keeping this locked". A whole document written from outside the session is a 409.
- **Locking a live document** wins over what isn't stored: its unstored changes are dropped, everyone on it gets the
  document as stored (`reset`) and the lock, and every lease drops. What a checkpoint already stored stays.
- **The product enforces the rest** of its own writes: meteors refuses edit, publish and delete (409) through the
  `isLocked` the core answers from `services.locks.getCurrentLock`, and versioning's access refuses history writes.
- A live document reads its own lock through the gate's `ungated()`: a lock freezes it for everyone, whoever asks.

## Watching

A page that shows a document without editing it can watch it: it hears the document's room (a `lock` event as it
happens) without joining its presence. Watching asks the kind for read, like a join; a disconnect drops it. Locks reach
the room whether or not anyone is editing.

## HTTP surface

Mounted at `/api/client/collaboration`, behind uom's chain. Every route needs a signed-in user, read by the slice from the
session (`user` on the context). The live routes need `x-client` (a 400 without it), the lock routes the request's
`scopedAc` (a 401 without it). A kind nobody plugged in is a 404.

| Route | What it does |
| --- | --- |
| `POST /:kind/:id/join` | Opens the document live for this tab (read): `{ document, head, revision, members, leases, lock }`. |
| `POST /:kind/:id/leave` | Closes it for this tab. The last one leaving stores it. |
| `POST /:kind/:id/watch` · `unwatch` | Hears the document's room without editing it (read). |
| `POST /:kind/:id/leases` | `{ paths, action, operation? }`: acquire, renew or release (write). A lease lasts 15 s without a renew. |
| `POST /:kind/:id/changes` | `{ changes, ifUnchanged? }` (write): refused whole, or one by one with `ifUnchanged` (undo). |
| `POST /:kind/:id/save` | Any JSON object, handed to the kind unread (write): stored now, if anything changed. |
| `GET /locks` | The page of locks the caller may see, each with `canUnlock`: `{ rows, total }`. |
| `GET /locks/:kind?ids=a,b` | The locks the caller may see among those documents (at most 100): a list's marks, in one query. |
| `GET /locks/:kind/:documentId` | The document's lock, and `canLock` and `canUnlock`. |
| `PUT /locks/:kind/:documentId` | Locks it: 201; 409 when it already is; 403 when the rules refuse. |
| `DELETE /locks/:kind/:documentId` | Unlocks it: 404 when there's no lock the caller sees; 403 when the rules refuse. |

The room hears `presence`, `changes`, `leases`, `saved`, `reset` (the head moved outside the session, or a lock came in)
and `lock`.

`canLock` comes from the engine's in-memory verdict (role and active company): the gate can't run a create's payload
probe without inserting. The lock itself runs it. `canUnlock` comes from the gate's delete probe.

## Web surface

From `@modules/collaboration/web`:

- `useCollaborativeDocument({ kind, id, diff, apply, rules? })`, `PresenceBar` ("Editing now", one avatar per person, you
  marked), `HeldBy` (who is editing an item, for its label) and `HeldToast`. Avatars are uom's `UserAvatar`. The hook joins once the
  realtime stream is on, sends changes in ~50 ms batches, takes, renews and releases leases around an edit, keeps this
  tab's undo (`@libs/knowledge/undo`), and says whether the document is locked (`lock`).
- `useDocumentLock(kind, id)` and `LockToggle`: a document's lock, Lock or Unlock when the server says the caller may.
  While on screen it watches the document, so a lock or unlock by anyone shows at once.
- `useDocumentLocks(kind, ids)`: a list's locks in one request, read again every 30 s and on focus.
- `getCollaborationRoutes({ locksPath })`: the locks page, gated, at `/locks`. It isn't in the sidebar.

`findConflict` comes from `@modules/collaboration/shared`, for a host that wants the same check the server runs.

## Mounting

```ts
// core/api/src/mounts.ts
export const collaboration = mountCollaborationApi({
  rooms, actorOf, errors, createId,
  engine: acEngine,
  gatedDb: versionedGatedDb([meteorVersionedEntry]),   // the lock rules' join reads each meteor's current version
});
realtimeConnections.onUserDisconnected((userId) => collaboration.services.collaboration.dropActor(userId));
collaboration.services.collaboration.registerKind(meteors.live);
// core/web/src/config/collaboration.config.ts — after the router exists
mountCollaborationWeb({ http, clientId: crypto.randomUUID(), navigate });
```

## Not here yet

- **Who unlocked.** Unlocking deletes the row, so there's no record of it. Keeping one means `unlocked_at` and
  `unlocked_by` on the row instead.
- **Owner-only unlock.** A role that may unlock only its own locks can't be one rule: a target with a join holds
  nothing else, so "`locked_by` is me and the document is my company's" doesn't fit.
- **The lock's kind isn't in the rules,** for the same reason: only a meteor lock names a meteor's id (ids are unique
  cuids), and the routes take only a registered kind.
- **No link to the locks page** in the app: it's reached by its URL.
- A one-off change on an item nobody holds needs no lease; connectors and other non-node items have no rules.
- A join with no stream behind it stays as a stuck member until someone leaves for it, and keeps the last-leave
  checkpoint from firing.
- Between checkpoints the live document is only in the API's memory: a restart loses up to 10 s, or up to 10 minutes of
  continuous editing. One API process holds the documents; several would each have their own.
- Undo takes no lease; one person in two tabs has two undo histories.
- Clearing a field the kind requires (a meteor's name) is refused, and the field jumps back without saying why.

## Running the slice's tests

```bash
pnpm --filter @modules/collaboration test:unit
```

They run on a fake kind in memory, with no canvas, versioning or database. The lock rules and routes run on the real
config, engine and gate on PGlite, in the core: `__test__/integration/access-control/document-lock*.test.ts`.
