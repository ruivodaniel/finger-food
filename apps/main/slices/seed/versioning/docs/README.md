# versioning — docs

The history of any entity the app versions: every change a new version, on branches, compared, merged, released. The
slice owns the capsule tables and the routes about history. It owns no entity: a product slice says which of its tables
are versioned, and its repositories go on writing plain queries.

Moved from the canvas-versioning spike (`_meta/spikes/canvas-versioning`, `slices/seed/versioning`), as it was there.
The design is slice-design's versioning-proof v37. The methods are the library `@libs/versioning`
(`shared/libs/versioning`).

```
the core             gatedDb: versionedGatedDb([meteorVersionedEntry])
   │                 each request's gate runs over a versioned db, with the session's user as the author
   ▼
its repository       gateDb.update("meteor", scope, id, patch)       a plain gated write
   ▼
@libs/versioning     the update becomes save(): a new row and a new version, in one transaction
```

## The tables

| Table | What it holds |
| --- | --- |
| `outer_capsule` | One per identity: its own `id`, the entity's type and `entity_id`. The API speaks the `entity_id`. |
| `branch` | `main` and the others, per identity. Archived: `valid_to` set. |
| `inner_capsule` | One per version: the row it points at, `seq` on its branch, origin (`continuation`, `branch`, `merge`), sources, author, title, slug, intent (what and why), `valid_from` / `valid_to`. |
| `version_delta` | What changed from the version it follows: `{ field, from, to }`, or what the entity's `delta` hook says. |
| `release` | A numbered version of main, with its title and description. |

An entity's own table keeps every row and holds nothing of its identity: an inner capsule points at the row, and the
outer capsule holds the `entity_id`. Every id is text, made by the app's `createId` (cuids), as everywhere else in the
app. The migration is `core/api/drizzle/0006_versioning.sql`.

Each table has its repository and its service, and `VersioningService` puts them together for a history. The versioned
entities' own tables are read and written only through the library, in `version.repository.ts`. Each model's inferred
schema is in its `.schemas.ts`; the request bodies take what is an entity's field from it.

Labels are computed when read: on main `<last release>.<versions since it>` (`0.<seq>` before any release), on another
branch `<branch>.<seq>`.

## How a product adopts it

1. Declare the entity once, in the slice's api: `defineVersionedEntity("meteor", { table: meteor, title, children?, delta? })`.
   Export it from `api/index.ts`.
2. Add it to the list the core hands the slice in `core/api/src/mounts.ts`: `mountVersioningApi({ versioned: [meteorVersionedEntry], ... })`,
   and say who may read and change its history, in `access`: the entity's owner answers, through a function on its own
   mount result (meteors: `meteors.services.meteor.canAccess`). An entity with no answer is nobody's to read. A `delta`
   on the entry leaves bookkeeping out of what changed (meteors drops `createdAt` and `updatedAt`); the library decides
   "nothing changed, no version" with the same comparison.
3. Mount the slice with `gatedDb: versionedGatedDb([meteorVersionedEntry])`, the core's helper in `mounts.ts`. That is
   the one way in. Each request's gate runs over a versioned db, with the bag's session user as the author: the gate's
   insert, update and delete become versions, and its reads and scope subqueries see each identity's current row. Its
   `ungated()`, for the reads no rule covers (a public door, a page), reads current rows and writes nothing. The slice's
   repository calls don't change, but every gated call must use the factory it was mounted with, not the request's
   `scopedAc.gateDb`, which uom builds over the raw db.
4. On the web, register a presenter in `core/web/src/config/versioning.config.ts`, and use `VersionedEntity` and the
   components from `@modules/versioning/web` where the entity is shown (meteors: `MeteorHistory` on its page).

The author is asked for only when something is written, so a versioned db that only reads needs nobody behind it.

What the versioned db refuses: `execute`, `query`, `$with`, `with`, `$count`, and an update or delete with no `where()`.
`returning()` takes every column or some of the table's own. A `sql` fragment that names the table itself still reads
every row.

## HTTP surface

Mounted at `/api/client/versioned`, behind uom's chain. Every route needs a signed-in user, read by the slice from the
session (`user` on the context); the author of a write is always that user. Then the entity's owner is asked, with the
request's `scopedAc` handed over unread: not readable is a 404 (nobody learns it exists), readable but not changeable
makes every write a 403. A meteor answers with the same Scopes its own routes use, and a locked meteor (collaboration's
locks) answers no to every write: no restore, release, merge, branch or archive until it is unlocked. A removed meteor's history is a
404 for everyone. Authors come with their names, from `authorNamesOf`, which the core answers with uom's profiles. `:entity` is a key of the
versioned list; anything else is a 404.

| Route | What it does |
| --- | --- |
| `GET /:entity/:entityId/history` | Every version on every branch, the branches with their heads, the releases. |
| `GET /:entity/:entityId/branches` | The branches with their heads. |
| `GET /:entity/:entityId?branch=&at=` | The head of a branch at a moment (now by default), and its row. |
| `GET /:entity/:entityId/versions/:versionId` | One version and its row, exactly. |
| `GET /:entity/:entityId/compare?from=&to=` | The stored delta when `to` follows `from`, otherwise computed from the rows. |
| `POST /:entity/:entityId/clone` | Any version onto any branch (restore, branch from here). 409 when the head moved or the branch is archived. |
| `POST /:entity/:entityId/merge` | The values chosen, from at least two sources. |
| `POST /:entity/:entityId/branch-hierarchy` | One branch on the entity and everything under it (its `children`), from main's heads. |
| `POST /:entity/:entityId/releases` | Numbers a version of main. 409 for a version at or before the last release. |
| `POST /:entity/:entityId/branches/:name/archive` | Archives a branch. 400 for main. |

A write sends the head it read as `expectedHead`; a head that moved since is a 409.

## Web surface

From `@modules/versioning/web`: `mountVersioningWeb`, `VersionedEntity` (reads and composes), and the components that
only draw: `History`, `VersionChanges`, `VersionBadge`, `Restore`, `VersionMerge`, `ValueDiff`, `Release`,
`BranchPicker`, `BranchHierarchy`, `ArchiveBranch`, with the `Presenter` and `VersionComparison` types. The types of what
the API answers come from `@modules/versioning/shared`.

## Mounting

```ts
// core/api/src/mounts.ts
export const versioning = mountVersioningApi({ db, versioned: [meteorVersionedEntry], access, authorNamesOf, createId, errors });
// core/web/src/config/versioning.config.ts
mountVersioningWeb({ http, presenters: { meteor: meteorPresenter } });
```

The slice builds the versioning library over its own capsule tables, and returns it as `versioning.versioning` for a
product slice that needs it. The web paths default to `/api/client`, like notifications'.

Meteors is the one versioned entity. Any other entity is a 404 on every route.

## Not here yet

- **A removed entity's history.** It's a 404 for everyone, since the owner's check reads live rows only. Keeping it
  readable needs the owner to know which company a removed meteor belonged to.
- The delta has no `strategyResults`, `semantic_summary` or `conceptual_change_depth` from v37; `connection` and
  `allowed_connection` aren't built.
- `merge` starts from the head's row and takes only the identity's own versions; v37's proof starts from the first
  source's row. A save or a merge on an archived branch is refused here; v37 refuses only a clone.
- The branch lock (`select … for update`) is tested only on PGlite, which runs one transaction at a time.

## Running the slice's tests

```bash
pnpm --filter @modules/versioning test:unit
pnpm --filter @libs/versioning test
```

The route tests version a `note` table that exists only in the test, on in-memory PGlite.
