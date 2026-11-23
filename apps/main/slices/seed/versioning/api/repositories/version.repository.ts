/**
 * Version repository — the versioned entities' own tables, through the versioning library, for any entity in the versioned
 * list: a version and its row, comparing two rows, clones, merges, branching a hierarchy, archiving a branch, each write in
 * one transaction. The library reads and writes the capsule tables and the entity's table together, so this is its one
 * door. No logic, no throwing of its own: what the library refuses reaches the service.
 */
import { MAIN, type Author, type WriteOptions } from "@libs/versioning";
import type { Versioning } from "@libs/versioning";
import type { VersioningDb } from "../mount-types";

export class DrizzleVersionRepository {
  private readonly db: VersioningDb;
  private readonly versioning: Versioning;

  constructor(db: VersioningDb, versioning: Versioning) {
    this.db = db;
    this.versioning = versioning;
  }

  hasEntity(entity: string): boolean {
    return this.versioning.hasEntity(entity);
  }

  async findVersionWithRow(entity: string, versionId: string) {
    return this.versioning.getVersion(this.db, entity, versionId);
  }

  async compareVersions(entity: string, fromVersionId: string, toVersionId: string) {
    return this.versioning.compareVersions(this.db, entity, fromVersionId, toVersionId);
  }

  async clone(entity: string, entityId: string, fromVersionId: string, author: Author, options: WriteOptions) {
    return this.db.transaction((tx) => this.versioning.clone(tx, entity, entityId, fromVersionId, author, options));
  }

  /** The merge and the head it made, read in the same transaction. Nothing when there is no open branch to merge on. */
  async merge(entity: string, entityId: string, data: Record<string, unknown>, sourceVersionIds: string[], author: Author, options: WriteOptions) {
    return this.db.transaction(async (tx) => {
      const row = await this.versioning.merge(tx, entity, entityId, data, sourceVersionIds, author, options);
      return row && this.versioning.getHead(tx, entity, entityId, options.branch ?? MAIN);
    });
  }

  /** One branch on an entity and everything under it, in one transaction. */
  async branchHierarchy(entity: string, entityId: string, name: string, author: Author) {
    return this.db.transaction((tx) => this.versioning.branchHierarchy(tx, entity, entityId, name, author));
  }

  async archiveBranch(entityId: string, name: string): Promise<boolean> {
    return this.db.transaction((tx) => this.versioning.archiveBranch(tx, entityId, name));
  }
}
