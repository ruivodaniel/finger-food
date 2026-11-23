/**
 * Mount types — what the app hands the slice, and what it gets back.
 */
import type { VersionableDb, VersionedEntry, Versioning } from "@libs/versioning";
import type { Hono } from "hono";
import type { VersionedDbFor } from "./shared/versioned-db";
import type { VersioningService } from "./services/versioning.service";
import type { ModuleErrors } from "./shared/module-errors";
import type { VersioningEnv } from "./types";

/** The app's drizzle client, whatever schema it was made with: what the slice reads with, and opens transactions on. */
export type VersioningDb = VersionableDb;

/** What an entity's history asks of its owner: reading it (history, versions, compare) or changing it (restore, branch,
 * merge, release, archive). */
export type AccessAction = "read" | "write";

/** The entity's owner answers whether the asker may: `scopedAc` is the request's access context, as the app's middleware
 * left it, handed over unread. */
export type EntityAccess = (scopedAc: unknown, entityId: string, action: AccessAction) => Promise<boolean>;

export interface MountVersioningApiOptions<TDb extends VersioningDb = VersioningDb> {
  db: TDb;
  /** Every entity the app versions, from the slices' public surfaces. */
  versioned: readonly VersionedEntry[];
  /** By entity: who may read or change its history. An entity with none is nobody's to read. */
  access: Readonly<Record<string, EntityAccess>>;
  /** The names of the users who authored versions, by id: History shows names, and this slice keeps only ids. An id the
   * app has no name for is left out. */
  authorNamesOf: (userIds: string[]) => Promise<Map<string, string>>;
  /** Ids for capsule rows and new version rows, made the way the app makes every id. */
  createId: () => string;
  errors: ModuleErrors;
  /** The clock versions are stamped with. Default: now. */
  now?: () => Date;
}

export interface MountVersioningApiResult<TDb extends VersioningDb = VersioningDb> {
  /** Mount under /versioned. */
  router: Hono<VersioningEnv>;
  /** A versioned db for some entities, of the app db's type: what the core builds a slice's gated db over
   * (versionedGatedDb), and what the server writes on itself. Without an author it only reads current rows. */
  versionedDbFor: VersionedDbFor<TDb>;
  /** The versioning library, bound to the app's versioned entities and to this slice's capsule tables. */
  versioning: Versioning;
  /** Server-side handles for non-HTTP callers. */
  services: { versioning: VersioningService };
}
