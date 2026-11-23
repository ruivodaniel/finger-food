/**
 * A versioned db for the entities given: of the same type as the app's db, so a repository writes plain queries on it,
 * and an update becomes a new version. The app builds a slice's gated db over one (versionedGatedDb in the core), and
 * the server writes on one itself, as a live document's checkpoints do. Without an author it only reads current rows.
 */
import { createVersionedDb, type Author, type Versioning, type VersionedEntry, type WriteOptions } from "@libs/versioning";
import type { VersioningDb } from "../mount-types";
import type { ModuleErrors } from "./module-errors";

export interface VersionedDbForOptions {
  entries: readonly VersionedEntry[];
  /** Who writes: asked for only when something is written. A db that only reads needs none. */
  author?: Author | (() => Author);
  writeOptions?: WriteOptions;
}

export type VersionedDbFor<TDb extends VersioningDb = VersioningDb> = (options: VersionedDbForOptions) => TDb;

export interface CreateVersionedDbForDeps<TDb extends VersioningDb> {
  db: TDb;
  versioning: Versioning;
  errors: ModuleErrors;
}

export function createVersionedDbFor<TDb extends VersioningDb>({ db, versioning, errors }: CreateVersionedDbForDeps<TDb>): VersionedDbFor<TDb> {
  return ({ entries, author, writeOptions }) => createVersionedDb(db, { versioning, entries, author, writeOptions, staleHeadError: (error) => errors.conflict(error.message) });
}
